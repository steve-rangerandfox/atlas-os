import test from "node:test";
import assert from "node:assert/strict";
import {
  assertExecutorDoesNotMatchController,
  getControllerProvider,
  getPreferredExecutorForController
} from "../src/lib/controller.mjs";

test("controller provider is normalized and chooses the other executor", () => {
  assert.equal(getControllerProvider({ ORCH_CONTROLLER_PROVIDER: "CoDeX" }), "codex");
  assert.equal(getControllerProvider({ ORCH_CONTROLLER_PROVIDER: "unknown" }), null);
  assert.equal(getPreferredExecutorForController("codex"), "claude");
  assert.equal(getPreferredExecutorForController("claude"), "codex");
  assert.equal(getPreferredExecutorForController(null), "claude");
});

test("same-provider controller recursion is blocked by default", () => {
  assert.throws(
    () => assertExecutorDoesNotMatchController("codex", { ORCH_CONTROLLER_PROVIDER: "codex" }),
    (error) => error.code === "CONTROLLER_EXECUTOR_COLLISION" && error.details.preferred_executor === "claude"
  );

  assert.doesNotThrow(() => assertExecutorDoesNotMatchController("claude", {
    ORCH_CONTROLLER_PROVIDER: "codex"
  }));

  assert.doesNotThrow(() => assertExecutorDoesNotMatchController("codex", {
    ORCH_CONTROLLER_PROVIDER: "codex",
    ORCH_ALLOW_SAME_PROVIDER_EXECUTOR: "1"
  }));
});
