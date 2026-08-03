import { access, mkdir, open, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { getConfig } from "./config.mjs";
import { getControllerProvider } from "./controller.mjs";
import { OrchestratorError } from "./errors.mjs";
import { getGitSnapshot } from "./git.mjs";
import { runProcess } from "./process.mjs";
import { redactObject } from "./redact.mjs";
import { clampInteger, ensureString, nowIso, resolveInside, truncate } from "./utils.mjs";

const PROFILE_NAMES = new Set(["relay-development", "relay-validation", "relay-release"]);
const PACKAGE_MANAGERS = new Set(["npm", "pnpm", "yarn", "bun"]);

export const AUTHORIZATION_ACTIONS = [
  "runtime_setup",
  "dependency_restore",
  "network_policy_check",
  "artifact_generation",
  "worker_restart"
];

export function defaultAuthorizationPolicy() {
  return Object.fromEntries(AUTHORIZATION_ACTIONS.map((action) => [action, false]));
}

export function relayReadinessProfiles(nodeVersion = process.version.replace(/^v/, "")) {
  const base = {
    runtime: { node: nodeVersion, packageManager: "npm", packageManagerVersion: "10.8.2" },
    executor: "claude",
    allowSameProviderExecutor: false,
    network: ["https://registry.npmjs.org/"],
    cachePaths: [".orchestrator/cache/npm"],
    dependencyRestore: { required: true, ignoreLifecycleScripts: true },
    browser: { playwright: false, browserBinary: false },
    git: { clean: false, namedBranch: true },
    artifactDirectory: ".orchestrator/artifacts",
    validForMinutes: 60
  };
  return {
    "relay-development": { ...structuredClone(base), name: "relay-development" },
    "relay-validation": {
      ...structuredClone(base),
      name: "relay-validation",
      browser: { playwright: true, browserBinary: true }
    },
    "relay-release": {
      ...structuredClone(base),
      name: "relay-release",
      browser: { playwright: true, browserBinary: true },
      requireUpstream: true
    }
  };
}

function check(id, required, passed, summary, details = undefined) {
  return { id, required, passed, summary, ...(details === undefined ? {} : { details }) };
}

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

async function commandStatus(command, args, cwd) {
  try {
    const result = await runProcess(command, args, { cwd, timeoutMs: 15_000, maxOutputChars: 20_000, rejectOnNonZero: false });
    return { available: true, ok: result.code === 0, code: result.code, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
  } catch (error) {
    return { available: false, ok: false, error: error.message };
  }
}

function versionFrom(output) {
  return String(output || "").match(/v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/)?.[1] || String(output || "").trim();
}

async function detectPackageManager(workDir, preferred) {
  const candidates = [
    ["pnpm", "pnpm-lock.yaml"],
    ["yarn", "yarn.lock"],
    ["bun", "bun.lock"],
    ["bun", "bun.lockb"],
    ["npm", "package-lock.json"],
    ["npm", "npm-shrinkwrap.json"]
  ];
  for (const [manager, lockfile] of candidates) {
    if (manager === preferred && await exists(path.join(workDir, lockfile))) return { manager, lockfile };
  }
  for (const [manager, lockfile] of candidates) {
    if (await exists(path.join(workDir, lockfile))) return { manager, lockfile };
  }
  return { manager: preferred || "npm", lockfile: null };
}

async function writableProbe(directory) {
  try {
    await mkdir(directory, { recursive: true });
    const file = path.join(directory, `.atlas-write-probe-${process.pid}`);
    const handle = await open(file, "wx", 0o600);
    await handle.close();
    await rm(file, { force: true });
    return { passed: true };
  } catch (error) {
    return { passed: false, error: error.message };
  }
}

async function networkProbe(urlText) {
  let target;
  try { target = new URL(urlText); } catch { return { passed: false, error: "Invalid URL" }; }
  if (target.protocol !== "https:") return { passed: false, error: "Only HTTPS endpoints are allowed" };
  const source = `import https from "node:https";const r=https.request(${JSON.stringify(target.href)},{method:"HEAD",headers:{"user-agent":"atlas-readiness/0.5"}},x=>{x.resume();process.exit(x.statusCode>=200&&x.statusCode<500?0:2)});r.setTimeout(8000,()=>r.destroy(new Error("timeout")));r.on("error",e=>{console.error(e.message);process.exit(1)});r.end();`;
  const result = await runProcess(process.execPath, ["--input-type=module", "--eval", source], {
    timeoutMs: 10_000,
    maxOutputChars: 4_000,
    rejectOnNonZero: false
  });
  return { passed: result.code === 0, code: result.code, error: truncate(result.stderr, 1_000) || undefined };
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) throw new TypeError("profile must be an object");
  const name = ensureString(profile.name, "profile.name", { max: 100 });
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name.includes("..")) throw new TypeError("profile.name must be a safe identifier");
  const manager = profile.runtime?.packageManager || "npm";
  if (!PACKAGE_MANAGERS.has(manager)) throw new TypeError(`Unsupported package manager: ${manager}`);
  const executor = profile.executor || "claude";
  if (!["claude", "codex"].includes(executor)) throw new TypeError(`Unsupported executor: ${executor}`);
  const network = Array.isArray(profile.network) ? profile.network : [];
  for (const endpoint of network) {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:") throw new TypeError("Readiness network endpoints must use HTTPS");
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new TypeError("Readiness endpoints cannot contain credentials, query parameters, or fragments");
    if (parsed.hostname === "localhost" || parsed.hostname.endsWith(".local") || /^\[?[0-9a-f:.]+\]?$/i.test(parsed.hostname)) {
      throw new TypeError("Readiness endpoints must use a public DNS hostname");
    }
  }
  return {
    name,
    runtime: {
      node: ensureString(profile.runtime?.node, "profile.runtime.node", { max: 100 }),
      packageManager: manager,
      packageManagerVersion: profile.runtime?.packageManagerVersion || null
    },
    executor,
    allowSameProviderExecutor: profile.allowSameProviderExecutor === true,
    network,
    cachePaths: Array.isArray(profile.cachePaths) ? profile.cachePaths : [`.orchestrator/cache/${manager}`],
    dependencyRestore: {
      required: profile.dependencyRestore?.required !== false,
      ignoreLifecycleScripts: profile.dependencyRestore?.ignoreLifecycleScripts !== false
    },
    browser: {
      playwright: profile.browser?.playwright === true,
      browserBinary: profile.browser?.browserBinary === true
    },
    git: {
      clean: profile.git?.clean !== false,
      namedBranch: profile.git?.namedBranch !== false
    },
    artifactDirectory: profile.artifactDirectory || ".orchestrator/artifacts",
    requireUpstream: profile.requireUpstream === true,
    validForMinutes: clampInteger(profile.validForMinutes, 1, 1_440, 60)
  };
}

export function validateReadinessProfile(profile) {
  return normalizeProfile(profile);
}

export function isBuiltInReadinessProfile(name) {
  return PROFILE_NAMES.has(name);
}

async function executorEvidence(executor, workDir) {
  const config = getConfig();
  const command = executor === "codex" ? config.codexBin : config.claudeBin;
  const authArgs = executor === "codex" ? ["login", "status"] : ["auth", "status"];
  const [version, auth] = await Promise.all([
    commandStatus(command, ["--version"], workDir),
    commandStatus(command, authArgs, workDir)
  ]);
  return { executor, version, auth };
}

export async function runPreflight({ project, profile }) {
  const normalized = normalizeProfile(profile);
  const checks = [];
  const git = await getGitSnapshot(project.repoRoot);
  const nodeActual = process.version.replace(/^v/, "");
  checks.push(check("runtime.node", true, nodeActual === normalized.runtime.node, `Node.js ${nodeActual}; required ${normalized.runtime.node}`));

  const detected = await detectPackageManager(project.workDir, normalized.runtime.packageManager);
  const managerStatus = await commandStatus(detected.manager, ["--version"], project.workDir);
  const managerActual = versionFrom(managerStatus.stdout);
  const managerMatches = managerStatus.ok && detected.manager === normalized.runtime.packageManager &&
    (!normalized.runtime.packageManagerVersion || managerActual === normalized.runtime.packageManagerVersion);
  checks.push(check("runtime.package_manager", true, managerMatches,
    `${detected.manager} ${managerActual || "unavailable"}; required ${normalized.runtime.packageManager}${normalized.runtime.packageManagerVersion ? ` ${normalized.runtime.packageManagerVersion}` : ""}`,
    { lockfile: detected.lockfile }));

  const executor = await executorEvidence(normalized.executor, project.workDir);
  checks.push(check("executor.auth", true, executor.version.ok && executor.auth.ok,
    `${normalized.executor} executable and authentication`, executor));

  const controller = getControllerProvider();
  const providerAllowed = !controller || controller !== normalized.executor || normalized.allowSameProviderExecutor || process.env.ORCH_ALLOW_SAME_PROVIDER_EXECUTOR === "1";
  checks.push(check("executor.provider_policy", true, providerAllowed,
    controller ? `Controller ${controller}; executor ${normalized.executor}` : `No controller provider declared; executor ${normalized.executor}`));

  for (const endpoint of normalized.network) {
    const result = await networkProbe(endpoint);
    checks.push(check(`network.${new URL(endpoint).hostname}`, true, result.passed, `Worker HTTPS reachability to ${endpoint}`, result));
  }

  for (const candidate of normalized.cachePaths) {
    const directory = resolveInside(project.repoRoot, candidate);
    const result = await writableProbe(directory);
    checks.push(check(`cache.${candidate}`, true, result.passed, `Writable cache ${candidate}`, result));
  }

  checks.push(check("dependencies.lockfile", normalized.dependencyRestore.required,
    !normalized.dependencyRestore.required || Boolean(detected.lockfile),
    detected.lockfile ? `Lockfile ${detected.lockfile} supports deterministic restore` : "No supported lockfile found"));

  const playwrightPackage = path.join(project.workDir, "node_modules", "@playwright", "test", "package.json");
  const playwrightCli = path.join(project.workDir, "node_modules", ".bin", "playwright");
  const hasPlaywright = await exists(playwrightPackage) || await exists(playwrightCli);
  checks.push(check("browser.playwright", normalized.browser.playwright, !normalized.browser.playwright || hasPlaywright,
    hasPlaywright ? "Playwright package is available" : "Playwright package is not restored"));
  let browserAvailable = !normalized.browser.browserBinary;
  let browserDetails = null;
  if (normalized.browser.browserBinary && hasPlaywright) {
    const source = "let api; try { api = require('@playwright/test'); } catch { api = require('playwright'); } const fs = require('node:fs'); const p = api.chromium.executablePath(); console.log(p); process.exit(fs.existsSync(p) ? 0 : 2);";
    const result = await commandStatus(process.execPath, ["--eval", source], project.workDir);
    browserAvailable = result.ok;
    browserDetails = { ...result, executablePath: result.stdout || undefined };
  }
  checks.push(check("browser.binary", normalized.browser.browserBinary, browserAvailable,
    browserAvailable ? "Required browser runtime is available" : "Required browser runtime is not certified", browserDetails));

  checks.push(check("git.clean", normalized.git.clean, !normalized.git.clean || git.clean,
    git.clean ? "Git working tree is clean" : "Git working tree has changes", { status: git.status }));
  checks.push(check("git.named_branch", normalized.git.namedBranch, !normalized.git.namedBranch || git.branch !== "(detached HEAD)", `Git branch ${git.branch}`));
  if (normalized.requireUpstream) {
    const upstream = await commandStatus("git", ["rev-parse", "--abbrev-ref", "@{upstream}"], project.repoRoot);
    checks.push(check("git.upstream", true, upstream.ok, upstream.ok ? `Upstream ${upstream.stdout}` : "No upstream branch configured"));
  }

  const artifactDirectory = resolveInside(project.repoRoot, normalized.artifactDirectory);
  const artifactProbe = await writableProbe(artifactDirectory);
  checks.push(check("artifacts.writable", true, artifactProbe.passed, `Writable artifact directory ${normalized.artifactDirectory}`, artifactProbe));

  const requiredChecks = checks.filter((entry) => entry.required);
  return redactObject({
    schemaVersion: 1,
    projectId: project.id,
    profile: normalized.name,
    certified: requiredChecks.every((entry) => entry.passed),
    checkedAt: nowIso(),
    validForMinutes: normalized.validForMinutes,
    git: { branch: git.branch, commit: git.commit, clean: git.clean },
    checks,
    summary: { required: requiredChecks.length, passed: requiredChecks.filter((entry) => entry.passed).length, failed: requiredChecks.filter((entry) => !entry.passed).length }
  });
}

export async function restoreDependencies({ project, profile }) {
  const normalized = normalizeProfile(profile);
  const detected = await detectPackageManager(project.workDir, normalized.runtime.packageManager);
  if (!detected.lockfile) throw new OrchestratorError("Dependency restore requires a supported lockfile", "LOCKFILE_REQUIRED");
  if (detected.manager !== normalized.runtime.packageManager) {
    throw new OrchestratorError(`Profile requires ${normalized.runtime.packageManager}, but ${detected.lockfile} selects ${detected.manager}`, "PACKAGE_MANAGER_MISMATCH");
  }
  const invocations = {
    npm: ["ci"],
    pnpm: ["install", "--frozen-lockfile"],
    yarn: ["install", "--immutable"],
    bun: ["install", "--frozen-lockfile"]
  };
  const args = [...invocations[detected.manager]];
  if (normalized.dependencyRestore.ignoreLifecycleScripts) args.push("--ignore-scripts");
  const result = await runProcess(detected.manager, args, {
    cwd: project.workDir,
    env: { CI: "1", NO_COLOR: "1", FORCE_COLOR: "0" },
    timeoutMs: 20 * 60_000,
    maxOutputChars: getConfig().maxOutputChars,
    rejectOnNonZero: false
  });
  if (result.code !== 0 || result.timedOut) throw new OrchestratorError("Deterministic dependency restore failed", "DEPENDENCY_RESTORE_FAILED", result);
  return redactObject({ operation: "dependency_restore", manager: detected.manager, lockfile: detected.lockfile, command: [detected.manager, ...args], completedAt: nowIso() });
}

export async function prepareRuntime({ project, profile }) {
  const normalized = normalizeProfile(profile);
  const created = [];
  for (const candidate of normalized.cachePaths) {
    const directory = resolveInside(project.repoRoot, candidate);
    await mkdir(directory, { recursive: true });
    created.push(path.relative(project.repoRoot, directory));
  }
  const actual = process.version.replace(/^v/, "");
  if (actual !== normalized.runtime.node) {
    throw new OrchestratorError(`Pinned Node.js ${normalized.runtime.node} is required; current runtime is ${actual}`, "RUNTIME_VERSION_MISMATCH", { createdCaches: created });
  }
  const manager = await detectPackageManager(project.workDir, normalized.runtime.packageManager);
  const managerStatus = await commandStatus(manager.manager, ["--version"], project.workDir);
  const managerActual = versionFrom(managerStatus.stdout);
  if (!managerStatus.ok || manager.manager !== normalized.runtime.packageManager ||
      (normalized.runtime.packageManagerVersion && managerActual !== normalized.runtime.packageManagerVersion)) {
    throw new OrchestratorError("Pinned package-manager runtime is not available", "RUNTIME_VERSION_MISMATCH", {
      required: { name: normalized.runtime.packageManager, version: normalized.runtime.packageManagerVersion },
      actual: { name: manager.manager, version: managerActual || null }
    });
  }
  return { operation: "runtime_setup", node: actual, packageManager: { name: manager.manager, version: managerActual }, cachePaths: created, completedAt: nowIso() };
}

export async function writeCertificationArtifact({ project, profile, report }) {
  const normalized = normalizeProfile(profile);
  const directory = resolveInside(project.repoRoot, normalized.artifactDirectory);
  await mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `${normalized.name}-certification.json`);
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  const info = await stat(filePath);
  return { operation: "artifact_generation", path: path.relative(project.repoRoot, filePath), bytes: info.size, completedAt: nowIso() };
}

export async function loadRepositoryProfiles(repoRoot) {
  const candidate = path.join(repoRoot, ".atlas", "readiness-profiles.json");
  if (!(await exists(candidate))) return {};
  const parsed = JSON.parse(await readFile(candidate, "utf8"));
  const profiles = parsed.profiles || parsed;
  return Object.fromEntries(Object.entries(profiles).map(([name, value]) => [name, normalizeProfile({ ...value, name })]));
}
