import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getConfig } from "./config.mjs";
import { OrchestratorError } from "./errors.mjs";
import { runProcess } from "./process.mjs";
import { redactObject, redactText } from "./redact.mjs";
import { buildClaudePrompt } from "./claude.mjs";

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["status", "summary", "files_changed", "checks_run", "blockers", "risks", "recommended_next_step"],
  properties: {
    status: { type: "string", enum: ["completed", "blocked", "needs_human"] },
    summary: { type: "string" },
    files_changed: { type: "array", items: { type: "string" } },
    checks_run: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "status", "notes"], properties: { name: { type: "string" }, status: { type: "string", enum: ["passed", "failed", "skipped", "not_run"] }, notes: { type: "string" } } } },
    blockers: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    recommended_next_step: { type: "string" }
  }
};

export async function runCodexTask({ mission, task }) {
  const config = getConfig();
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "atlas-codex-"));
  const schemaPath = path.join(tempDir, "report-schema.json");
  const outputPath = path.join(tempDir, "last-message.json");
  await writeFile(schemaPath, JSON.stringify(REPORT_SCHEMA));
  const args = [
    "exec", "--ephemeral", "--json", "--color", "never",
    "--sandbox", "workspace-write",
    "--output-schema", schemaPath,
    "--output-last-message", outputPath,
    "-"
  ];
  if (config.codexModel) args.splice(1, 0, "--model", config.codexModel);
  try {
    const result = await runProcess(config.codexBin, args, {
      cwd: mission.workDir,
      input: buildClaudePrompt(mission, task),
      env: { NO_COLOR: "1", FORCE_COLOR: "0" },
      timeoutMs: config.codexTimeoutMs,
      maxOutputChars: config.maxOutputChars,
      rejectOnNonZero: false
    });
    let report;
    try {
      report = JSON.parse(await readFile(outputPath, "utf8"));
    } catch {
      throw new OrchestratorError("Codex did not produce a valid structured report", "CODEX_INVALID_REPORT", { stdout: redactText(result.stdout), stderr: redactText(result.stderr) });
    }
    if (result.code !== 0 || result.timedOut) {
      throw new OrchestratorError(`Codex exited with code ${result.code}${result.timedOut ? " after timing out" : ""}`, result.timedOut ? "CODEX_TIMEOUT" : "CODEX_FAILED", { report: redactObject(report), stderr: redactText(result.stderr) });
    }
    return { report: redactObject(report), stderr: redactText(result.stderr), metadata: { executor: "codex" } };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
