import { OrchestratorError } from "./errors.mjs";

const CONTROLLER_PROVIDERS = new Set(["claude", "codex"]);

export function getControllerProvider(env = process.env) {
  const value = String(env.ORCH_CONTROLLER_PROVIDER || "").trim().toLowerCase();
  return CONTROLLER_PROVIDERS.has(value) ? value : null;
}

export function getPreferredExecutorForController(provider = getControllerProvider()) {
  if (provider === "codex") return "claude";
  if (provider === "claude") return "codex";
  return "claude";
}

export function assertExecutorDoesNotMatchController(executor, env = process.env) {
  const controller = getControllerProvider(env);
  const allowSameProvider = String(env.ORCH_ALLOW_SAME_PROVIDER_EXECUTOR || "") === "1";
  if (!controller || controller !== executor || allowSameProvider) return;

  throw new OrchestratorError(
    `The active ${controller} controller cannot delegate back to ${executor} by default. Choose ${getPreferredExecutorForController(controller)} or explicitly set ORCH_ALLOW_SAME_PROVIDER_EXECUTOR=1.`,
    "CONTROLLER_EXECUTOR_COLLISION",
    {
      controller_provider: controller,
      requested_executor: executor,
      preferred_executor: getPreferredExecutorForController(controller)
    }
  );
}
