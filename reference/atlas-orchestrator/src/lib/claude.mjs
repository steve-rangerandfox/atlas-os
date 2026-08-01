import { getConfig } from "./config.mjs";
import { OrchestratorError } from "./errors.mjs";
import { runProcess } from "./process.mjs";
import { redactObject, redactText } from "./redact.mjs";

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "status",
    "summary",
    "files_changed",
    "checks_run",
    "blockers",
    "risks",
    "recommended_next_step"
  ],
  properties: {
    status: { type: "string", enum: ["completed", "blocked", "needs_human"] },
    summary: { type: "string" },
    files_changed: { type: "array", items: { type: "string" } },
    checks_run: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "status", "notes"],
        properties: {
          name: { type: "string" },
          status: { type: "string", enum: ["passed", "failed", "skipped", "not_run"] },
          notes: { type: "string" }
        }
      }
    },
    blockers: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    recommended_next_step: { type: "string" }
  }
};

const SESSION_SETTINGS = {
  disableAllHooks: true,
  disableArtifact: true,
  autoMemoryEnabled: false,
  permissions: {
    allow: [
      "Read",
      "Glob",
      "Grep",
      "Edit",
      "Write",
      "Bash(pwd)",
      "Bash(ls *)",
      "Bash(rg *)",
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git show *)",
      "Bash(git branch --show-current)"
    ],
    deny: [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./**/.env)",
      "Read(./**/.env.*)",
      "Read(./secrets/**)",
      "Read(./credentials/**)",
      "Read(./**/*.pem)",
      "Read(./**/*.p12)",
      "Read(./**/*.pfx)",
      "Read(./**/*.key)",
      "Edit(./.env)",
      "Edit(./.env.*)",
      "Edit(./**/.env)",
      "Edit(./**/.env.*)",
      "Write(./.env)",
      "Write(./.env.*)",
      "Write(./**/.env)",
      "Write(./**/.env.*)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git reset *)",
      "Bash(git clean *)",
      "Bash(git checkout *)",
      "Bash(git switch *)",
      "Bash(git merge *)",
      "Bash(git rebase *)",
      "Bash(git tag *)",
      "Bash(gh *)",
      "Bash(vercel *)",
      "Bash(npx vercel *)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(ssh *)",
      "Bash(scp *)",
      "Bash(sudo *)",
      "Bash(rm -rf *)",
      "Bash(dd *)",
      "Bash(docker *)",
      "Bash(kubectl *)",
      "Bash(terraform *)",
      "Bash(pulumi *)",
      "Bash(psql *)"
    ]
  }
};

function formatList(items, emptyText = "None supplied") {
  return items?.length ? items.map((item, index) => `${index + 1}. ${item}`).join("\n") : emptyText;
}

export function buildClaudePrompt(mission, task) {
  const decisions = mission.decisions?.map((entry) => `${entry.question}: ${entry.decision}`) || [];
  return `You are the implementation agent inside a human-supervised coding workflow.

MISSION GOAL
${mission.goal}

BOUNDED TASK
Title: ${task.title}
Objective: ${task.objective}

ACCEPTANCE CRITERIA
${formatList(task.acceptanceCriteria)}

CONSTRAINTS
${formatList(task.constraints)}

RECORDED HUMAN DECISIONS
${formatList(decisions)}

WORKING RULES
- Work only on this bounded task. Do not broaden scope or perform unrelated refactors.
- Read repository instructions such as CLAUDE.md or AGENTS.md when available.
- You may inspect and edit files in the current repository.
- Do not commit, push, create a pull request, deploy, publish, release, or mutate infrastructure.
- Do not read or modify .env files, credentials, private keys, tokens, or secret stores.
- Do not contact external services or send communications.
- Do not make a product decision when multiple reasonable choices materially change behavior. Report needs_human instead.
- The controller will run verification commands after you finish. You may use only the read-only shell commands permitted by the session.
- Keep changes small, coherent, and reversible.
- Never include secrets in your report.

Finish by returning the required structured report. If blocked, explain exactly what a human must decide or provide.`;
}

function parseJsonOutput(stdout) {
  const trimmed = String(stdout || "").trim();
  if (!trimmed) throw new OrchestratorError("Claude Code returned no output", "CLAUDE_EMPTY_OUTPUT");
  try {
    return JSON.parse(trimmed);
  } catch {
    const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).reverse();
    for (const line of lines) {
      try {
        return JSON.parse(line);
      } catch {}
    }
    throw new OrchestratorError("Claude Code output was not valid JSON", "CLAUDE_INVALID_JSON", {
      output: redactText(trimmed.slice(-20_000))
    });
  }
}

export async function runClaudeTask({ mission, task }) {
  const config = getConfig();
  const args = [
    "-p",
    "--output-format", "json",
    "--json-schema", JSON.stringify(REPORT_SCHEMA),
    "--permission-mode", config.permissionMode,
    "--max-turns", String(config.maxTurns),
    "--max-budget-usd", String(config.maxBudgetUsd),
    "--no-session-persistence",
    "--disable-slash-commands",
    "--strict-mcp-config",
    "--tools", "Bash,Edit,Read,Write,Glob,Grep",
    "--settings", JSON.stringify(SESSION_SETTINGS)
  ];
  if (config.claudeModel) args.push("--model", config.claudeModel);

  const prompt = buildClaudePrompt(mission, task);
  const result = await runProcess(config.claudeBin, args, {
    cwd: mission.workDir,
    input: prompt,
    env: {
      CLAUDE_CODE_SKIP_PROMPT_HISTORY: "1",
      NO_COLOR: "1",
      FORCE_COLOR: "0"
    },
    timeoutMs: config.claudeTimeoutMs,
    maxOutputChars: config.maxOutputChars,
    rejectOnNonZero: false
  });

  const payload = parseJsonOutput(result.stdout);
  const report = payload.structured_output || payload.structuredOutput || payload.result || payload;
  const normalizedReport = typeof report === "string"
    ? {
        status: result.code === 0 ? "completed" : "blocked",
        summary: report,
        files_changed: [],
        checks_run: [],
        blockers: result.code === 0 ? [] : ["Claude Code exited unsuccessfully"],
        risks: [],
        recommended_next_step: result.code === 0 ? "Review the diff and run checks." : "Inspect the Claude error output."
      }
    : report;

  if (result.code !== 0 || result.timedOut) {
    throw new OrchestratorError(
      `Claude Code exited with code ${result.code}${result.timedOut ? " after timing out" : ""}`,
      result.timedOut ? "CLAUDE_TIMEOUT" : "CLAUDE_FAILED",
      {
        report: redactObject(normalizedReport),
        stderr: redactText(result.stderr),
        cliResult: redactObject({
          type: payload.type,
          subtype: payload.subtype,
          is_error: payload.is_error,
          session_id: payload.session_id,
          total_cost_usd: payload.total_cost_usd,
          duration_ms: payload.duration_ms
        })
      }
    );
  }

  return {
    report: redactObject(normalizedReport),
    stderr: redactText(result.stderr),
    metadata: redactObject({
      type: payload.type,
      subtype: payload.subtype,
      is_error: payload.is_error,
      session_id: payload.session_id,
      total_cost_usd: payload.total_cost_usd,
      duration_ms: payload.duration_ms,
      duration_api_ms: payload.duration_api_ms,
      num_turns: payload.num_turns
    })
  };
}
