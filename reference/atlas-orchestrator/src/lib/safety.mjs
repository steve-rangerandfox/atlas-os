import { OrchestratorError } from "./errors.mjs";

const BLOCKED_REQUESTS = [
  { pattern: /\bgit\s+(commit|push|reset|clean|checkout|switch|merge|rebase|tag)\b/i, reason: "Git publication or history mutation requires a human." },
  { pattern: /\b(gh\s+pr\s+create|gh\s+release|create\s+(a\s+)?pull request)\b/i, reason: "Pull requests and releases require a human." },
  { pattern: /\b(deploy|publish)\b|\b(create|cut|ship|trigger|run)\s+(a\s+)?release\b|\brelease\s+(the|this|it|to)\b/i, reason: "Deployments and publication require a human." },
  { pattern: /\b(terraform\s+apply|pulumi\s+up|kubectl\s+(apply|delete)|helm\s+(install|upgrade|uninstall))\b/i, reason: "Infrastructure mutation requires a human." },
  { pattern: /\b(drop\s+(database|table|schema)|truncate\s+table|delete\s+all\s+(rows|data))\b/i, reason: "Destructive database operations require a human." },
  { pattern: /\b(read|show|print|cat|copy|send|exfiltrate)\b.{0,80}\b(secret|token|password|credential|\.env|private key)\b/i, reason: "Secret access is not allowed." },
  { pattern: /\b(curl|wget|ssh|scp)\b/i, reason: "Open-ended network or remote-shell actions are not allowed." },
  { pattern: /\b(rm\s+-rf|sudo|dd\s+if=)\b/i, reason: "Destructive system commands are not allowed." }
];

export function scanTaskSafety(parts) {
  const text = (Array.isArray(parts) ? parts : [parts]).filter(Boolean).join("\n");
  const scannable = text
    .replace(/\b(do not|don\'t|never|must not|without)\s+(commit|push|deploy|publish|release|read|show|print|cat|copy|send|exfiltrate|use|run)\b[^.\n;]*/gi, "[explicit safety constraint]");
  const findings = BLOCKED_REQUESTS
    .filter(({ pattern }) => pattern.test(scannable))
    .map(({ reason }) => reason);
  return [...new Set(findings)];
}

export function assertTaskSafe(parts) {
  const findings = scanTaskSafety(parts);
  if (findings.length) {
    throw new OrchestratorError(
      "The task crosses an orchestrator safety boundary and needs a human decision.",
      "HUMAN_APPROVAL_REQUIRED",
      { findings }
    );
  }
}

export const HUMAN_GATE_TRIGGERS = [
  "product or UX choice with multiple reasonable answers",
  "missing secret, credential, or account access",
  "database or infrastructure mutation",
  "commit, push, pull request, deployment, release, or publication",
  "destructive or difficult-to-reverse action",
  "external communication or paid side effect",
  "final acceptance review"
];
