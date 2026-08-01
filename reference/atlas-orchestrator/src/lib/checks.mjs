import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { diffCheck } from "./git.mjs";
import { runProcess } from "./process.mjs";
import { redactText } from "./redact.mjs";

const CHECK_NAMES = new Set(["diff-check", "lint", "typecheck", "test", "build"]);
const TYPECHECK_SCRIPTS = ["typecheck", "type-check", "check:types", "types"];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function packageInfo(workDir) {
  const packagePath = path.join(workDir, "package.json");
  if (!(await exists(packagePath))) return null;
  const pkg = JSON.parse(await readFile(packagePath, "utf8"));
  let manager = "npm";
  if (await exists(path.join(workDir, "pnpm-lock.yaml"))) manager = "pnpm";
  else if (await exists(path.join(workDir, "yarn.lock"))) manager = "yarn";
  else if (await exists(path.join(workDir, "bun.lockb")) || await exists(path.join(workDir, "bun.lock"))) manager = "bun";
  return { manager, scripts: pkg.scripts || {} };
}

function commandFor(manager, script) {
  if (manager === "yarn") return { command: "yarn", args: [script] };
  if (manager === "bun") return { command: "bun", args: ["run", script] };
  return { command: manager, args: ["run", script] };
}

export function normalizeChecks(value) {
  const checks = value?.length ? value : ["diff-check", "lint", "typecheck", "test"];
  const unique = [...new Set(checks)];
  for (const check of unique) {
    if (!CHECK_NAMES.has(check)) throw new TypeError(`Unsupported check: ${check}`);
  }
  if (!unique.includes("diff-check")) unique.unshift("diff-check");
  return unique;
}

export async function runChecks({ repoRoot, workDir, checks, timeoutMs, maxOutputChars }) {
  const selected = normalizeChecks(checks);
  const results = [];
  const pkg = await packageInfo(workDir);

  for (const check of selected) {
    if (check === "diff-check") {
      const result = await diffCheck(repoRoot);
      results.push({
        name: check,
        status: result.code === 0 ? "passed" : "failed",
        command: "git diff --check",
        code: result.code,
        stdout: redactText(result.stdout),
        stderr: redactText(result.stderr)
      });
      continue;
    }

    if (!pkg) {
      results.push({ name: check, status: "skipped", reason: `No package.json in ${workDir}` });
      continue;
    }

    let script = check;
    if (check === "typecheck") script = TYPECHECK_SCRIPTS.find((name) => pkg.scripts[name]);
    if (!script || !pkg.scripts[script]) {
      results.push({ name: check, status: "skipped", reason: `No matching package script` });
      continue;
    }

    const invocation = commandFor(pkg.manager, script);
    const result = await runProcess(invocation.command, invocation.args, {
      cwd: workDir,
      env: { CI: "1", NO_COLOR: "1", FORCE_COLOR: "0" },
      timeoutMs,
      maxOutputChars,
      rejectOnNonZero: false
    });
    results.push({
      name: check,
      script,
      status: result.code === 0 && !result.timedOut ? "passed" : "failed",
      command: [invocation.command, ...invocation.args].join(" "),
      code: result.code,
      timedOut: result.timedOut,
      stdout: redactText(result.stdout),
      stderr: redactText(result.stderr)
    });
  }

  return {
    passed: results.every((result) => result.status !== "failed"),
    results
  };
}
