#!/usr/bin/env node
/**
 * Atlas policy guard — PreToolUse hook.
 *
 * This is the enforcement layer. It runs below the model: a non-zero exit
 * blocks the tool call and the model cannot override it. Nothing in this file
 * may be influenced by repository content other than the declared project and
 * mission config under .atlas/ (see CONSTITUTION.md, "Policy comes from Atlas").
 *
 * Contract:
 *   stdin  = JSON payload from Claude Code (tool_name, tool_input, ...)
 *   exit 0 = allow
 *   exit 2 = DENY (stderr is returned to the model as the reason)
 *   exit 1 = guard error; treated as non-blocking by design (fail-open on
 *            guard bugs, fail-closed on policy) — see FAIL_OPEN below.
 *
 * Every decision is appended to .atlas/evidence/policy-decisions.jsonl.
 */

import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

// A guard crash must not brick the session. Policy denials are still hard.
// Set ATLAS_GUARD_FAIL_CLOSED=1 once you trust the guard in your environment.
const FAIL_OPEN = process.env.ATLAS_GUARD_FAIL_CLOSED !== "1";

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const ATLAS_DIR = path.join(ROOT, ".atlas");

/* ------------------------------------------------------------------ utils */

function readJson(file, fallback = null) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

/** Minimal glob → RegExp. Supports **, *, ?, and {a,b} alternation. */
function globToRegExp(glob) {
  let out = "^";
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // ** matches across separators; **/ also matches zero directories
        if (glob[i + 2] === "/") {
          out += "(?:.*/)?";
          i += 2;
        } else {
          out += ".*";
          i += 1;
        }
      } else {
        out += "[^/]*";
      }
    } else if (c === "?") out += "[^/]";
    else if (c === "{") {
      const close = glob.indexOf("}", i);
      if (close === -1) out += "\\{";
      else {
        out += `(?:${glob
          .slice(i + 1, close)
          .split(",")
          .map((p) => p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
          .join("|")})`;
        i = close;
      }
    } else out += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`${out}$`);
}

function matchesAny(relPath, globs) {
  return (globs || []).some((g) => globToRegExp(g).test(relPath));
}

/** Repo-relative, POSIX-separated, no leading "./". Null if outside the repo. */
function relativize(target) {
  if (!target || typeof target !== "string") return null;
  const abs = path.resolve(ROOT, target);
  const rel = path.relative(ROOT, abs);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join("/");
}

function decide(verdict, rule, detail, context) {
  try {
    mkdirSync(path.join(ATLAS_DIR, "evidence"), { recursive: true });
    appendFileSync(
      path.join(ATLAS_DIR, "evidence", "policy-decisions.jsonl"),
      `${JSON.stringify({
        at: new Date().toISOString(),
        verdict,
        rule,
        detail,
        ...context,
      })}\n`,
    );
  } catch {
    /* evidence is best-effort; never block on logging failure */
  }
  if (verdict === "deny") {
    process.stderr.write(
      `ATLAS POLICY DENIED [${rule}]\n${detail}\n\n` +
        `This is a deterministic policy control, not a suggestion. Do not retry, ` +
        `do not work around it, and do not edit .atlas/ config to widen your own scope.\n` +
        `If this action is genuinely required by the mission, stop and report it as a ` +
        `blocker so a human can amend the mission or the policy.\n`,
    );
    process.exit(2);
  }
  process.exit(0);
}

/* ------------------------------------------------------------------ config */

const project = readJson(path.join(ATLAS_DIR, "project.json"), null);

// Not an adopted Atlas project → this guard has no opinion.
if (!project) process.exit(0);

const policy = project.policy || {};
const activeMissionId = project.activeMission || null;
const mission = activeMissionId
  ? readJson(path.join(ATLAS_DIR, "missions", `${activeMissionId}.json`), null)
  : null;

const DEFAULT_PROTECTED = [
  "package.json",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  ".npmrc",
  ".nvmrc",
  ".git/**",
  ".github/workflows/**",
  ".github/CODEOWNERS",
  "CODEOWNERS",
  ".atlas/**",
  ".claude/settings.json",
  ".claude/settings.local.json",
  ".mcp.json",
  ".devcontainer/**",
  "vercel.json",
  "Dockerfile",
  "**/*.config.{js,mjs,cjs,ts}",
  "migrations/**",
  "supabase/**",
];

const DEFAULT_SECRETS = [
  "**/.env",
  "**/.env.*",
  "**/secrets/**",
  "**/credentials/**",
  "**/*.pem",
  "**/*.key",
  "**/*.p12",
  "**/*.pfx",
  "**/*.p8",
  "**/id_rsa*",
  "**/id_ed25519*",
  "**/service-account*.json",
  "**/.pypirc",
];

// Effects that must never be reachable from an agent, in any mission.
// Publication, history mutation, infrastructure and destructive commands.
const FORBIDDEN_COMMANDS = [
  { re: /\bgit\s+push\b/, why: "Publication requires a human. Push is the release boundary." },
  { re: /\bgit\s+(commit\s+--amend|rebase|reset\s+--hard|filter-branch|filter-repo)\b/, why: "History mutation requires a human." },
  { re: /\bgit\s+(tag|switch|checkout)\s+.*(-d|-D|--delete)\b/, why: "Ref deletion requires a human." },
  { re: /\bgh\s+(pr\s+(merge|review)|release|workflow\s+run|api\b.*-X\s*(POST|PUT|PATCH|DELETE))/, why: "Merging, approving, releasing and write-API calls are human authority." },
  { re: /\bnpm\s+(publish|version)\b|\byarn\s+publish\b|\bpnpm\s+publish\b/, why: "Package publication requires a human." },
  { re: /\b(vercel|netlify|fly|railway)\s+(deploy|--prod)\b|\bvercel\s+--prod\b/, why: "Deployment requires a human." },
  { re: /\bsupabase\s+(db\s+push|migration\s+up|link)\b/, why: "Applying migrations requires a human." },
  { re: /\b(terraform\s+(apply|destroy)|pulumi\s+up|kubectl\s+(apply|delete)|helm\s+(install|upgrade|uninstall))\b/, why: "Infrastructure mutation requires a human." },
  { re: /\bgit\s+clean\s+-[a-z]*[xX]/, why: "git clean -x destroys untracked state including Atlas evidence." },
  { re: /\brm\s+-rf\s+(\/|~|\$HOME)/, why: "Destructive filesystem command." },
  { re: /\bcurl\b[^|;]*\|\s*(ba)?sh\b|\bwget\b[^|;]*\|\s*(ba)?sh\b/, why: "Piping network content into a shell is never permitted." },
  { re: /\bchmod\s+(777|-R\s+777)\b/, why: "Blanket permission changes are not permitted." },
];

const protectedPaths = policy.protectedPaths || DEFAULT_PROTECTED;
const secretPaths = policy.secretPaths || DEFAULT_SECRETS;
const acceptancePaths = policy.acceptanceTestPaths || ["tests/acceptance/**"];
const enforceScope = policy.enforceMissionScope !== false;

// Surfaces an agent may write regardless of mission scope. Deliberately narrow:
// drafts and append-only evidence, never live policy or mission state.
const alwaysWritable = [
  ".atlas/proposals/**",
  ".atlas/evidence/**",
  ".atlas/retrospectives/**",
  ".atlas/reports/**",
];

/* -------------------------------------------------------------------- main */

function main() {
let payload = {};
try {
  const raw = readFileSync(0, "utf8");
  payload = raw ? JSON.parse(raw) : {};
} catch {
  if (FAIL_OPEN) process.exit(0);
  process.stderr.write("ATLAS POLICY: guard could not read its input.\n");
  process.exit(2);
}

const toolName = payload.tool_name || payload.toolName || "";
const input = payload.tool_input || payload.toolInput || {};
// Role attribution is best-effort: Claude Code does not guarantee an agent
// identifier in the hook payload. Unknown is treated as the LEAST privileged
// role, so a missing field can never grant access.
const role =
  payload.agent_name ||
  payload.agentName ||
  payload.subagent_type ||
  process.env.ATLAS_ROLE ||
  "unknown";

const context = { tool: toolName, role, mission: activeMissionId };

const WRITE_TOOLS = new Set(["Edit", "Write", "NotebookEdit", "MultiEdit"]);
const READ_TOOLS = new Set(["Read", "Grep", "Glob"]);

try {
  /* ---- 1. Shell effects: publication, history, infra, destruction ------- */
  if (toolName === "Bash" || toolName === "BashOutput") {
    const cmd = String(input.command || "");
    for (const { re, why } of FORBIDDEN_COMMANDS) {
      if (re.test(cmd)) {
        return decide("deny", "forbidden-effect", `${why}\nCommand: ${cmd.slice(0, 400)}`, context);
      }
    }
    return decide("allow", "bash-ok", cmd.slice(0, 200), context);
  }

  /* ---- 2. File targets -------------------------------------------------- */
  const rawTarget = input.file_path || input.path || input.notebook_path || input.filePath;
  if (!rawTarget) return decide("allow", "no-path-target", toolName, context);

  const rel = relativize(rawTarget);
  if (rel === null) {
    return decide("deny", "outside-repository", `Path resolves outside the repository: ${rawTarget}`, context);
  }

  // 2a. Secrets — denied for read AND write, regardless of mission scope.
  if (matchesAny(rel, secretPaths)) {
    return decide("deny", "secret-path", `${rel} is a credential-bearing path. Atlas never reads or writes secrets.`, context);
  }

  if (!WRITE_TOOLS.has(toolName)) {
    return decide("allow", READ_TOOLS.has(toolName) ? "read-ok" : "non-write-ok", rel, context);
  }

  // 2b. Acceptance tests are writable only by the Acceptance Engineer.
  //     This is the rule that stops an implementer editing the test until it passes.
  if (matchesAny(rel, acceptancePaths)) {
    if (role !== "atlas-acceptance-engineer") {
      return decide(
        "deny",
        "acceptance-tests-immutable",
        `${rel} is an acceptance test. Only atlas-acceptance-engineer may write these.\n` +
          `If the criterion itself is wrong, that is a mission amendment for Mission Control — not a test edit.`,
        context,
      );
    }
    // Acceptance paths are implicitly in scope for their owner, so the mission
    // does not have to re-declare them (and an implementer cannot reach them).
    return decide("allow", "acceptance-author-ok", rel, context);
  }

  // 2b-ii. Agent-writable Atlas surfaces.
  //
  // Agents may DRAFT into .atlas/proposals/ and append evidence, but they may
  // never write .atlas/project.json or .atlas/missions/. A mission declares its
  // own scope.allowWrite, so an agent able to author a live mission could widen
  // its own authority — the escalation this carve-out exists to prevent.
  // Promotion from proposal to live mission is a human CLI step:
  //   node <plugin>/scripts/atlas-promote.mjs <proposal-id>
  if (matchesAny(rel, alwaysWritable)) {
    return decide("allow", "atlas-draft-surface", rel, context);
  }

  // 2c. Protected infrastructure paths require explicit mission scope.
  const declared = (mission && mission.scope && mission.scope.allowWrite) || [];
  if (matchesAny(rel, protectedPaths) && !matchesAny(rel, declared)) {
    return decide(
      "deny",
      "protected-path",
      `${rel} is protected infrastructure (manifest, lockfile, CI, migration, devcontainer or Atlas config).\n` +
        (activeMissionId
          ? `The active mission "${activeMissionId}" does not declare it in scope.allowWrite.`
          : `No active mission declares it.`) +
        `\nChanging this file changes what Atlas itself enforces or executes, so it needs a human.`,
      context,
    );
  }

  // 2d. Mission file scope. Only enforced when a mission is active and declares one.
  if (enforceScope && mission && declared.length > 0 && !matchesAny(rel, declared)) {
    return decide(
      "deny",
      "outside-mission-scope",
      `${rel} is outside the declared file scope of mission "${activeMissionId}".\n` +
        `Declared: ${declared.join(", ")}\n` +
        `Narrow missions are the point. Report this as a blocker rather than widening scope yourself.`,
      context,
    );
  }

  return decide("allow", "write-ok", rel, context);
} catch (error) {
  if (FAIL_OPEN) {
    try {
      process.stderr.write(`ATLAS POLICY: guard error (allowing): ${error.message}\n`);
    } catch {}
    process.exit(0);
  }
  process.stderr.write(`ATLAS POLICY: guard error (denying): ${error.message}\n`);
  process.exit(2);
}
}

main();
