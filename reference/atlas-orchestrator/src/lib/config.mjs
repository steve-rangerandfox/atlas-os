import os from "node:os";
import path from "node:path";
import { clampInteger } from "./utils.mjs";

export function getConfig() {
  const requestedPermissionMode = process.env.ORCH_PERMISSION_MODE || "acceptEdits";
  const permissionMode = ["acceptEdits", "dontAsk"].includes(requestedPermissionMode)
    ? requestedPermissionMode
    : "acceptEdits";
  return {
    home: path.resolve(process.env.ORCH_HOME || path.join(os.homedir(), ".atlas-orchestrator")),
    claudeBin: process.env.ORCH_CLAUDE_BIN || "claude",
    claudeModel: process.env.ORCH_CLAUDE_MODEL || "",
    codexBin: process.env.ORCH_CODEX_BIN || "codex",
    codexModel: process.env.ORCH_CODEX_MODEL || "",
    permissionMode,
    maxTurns: clampInteger(process.env.ORCH_MAX_TURNS, 1, 50, 12),
    maxBudgetUsd: Number.isFinite(Number(process.env.ORCH_MAX_BUDGET_USD))
      ? Math.max(0.10, Number(process.env.ORCH_MAX_BUDGET_USD))
      : 3,
    claudeTimeoutMs: clampInteger(process.env.ORCH_CLAUDE_TIMEOUT_MINUTES, 1, 180, 45) * 60_000,
    codexTimeoutMs: clampInteger(process.env.ORCH_CODEX_TIMEOUT_MINUTES, 1, 180, 45) * 60_000,
    checkTimeoutMs: clampInteger(process.env.ORCH_CHECK_TIMEOUT_MINUTES, 1, 60, 15) * 60_000,
    maxOutputChars: clampInteger(process.env.ORCH_MAX_OUTPUT_CHARS, 10_000, 1_000_000, 120_000)
  };
}
