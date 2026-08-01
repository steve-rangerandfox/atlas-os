import test from "node:test";
import assert from "node:assert/strict";
import { assertTaskSafe, scanTaskSafety } from "../src/lib/safety.mjs";
import { isSensitivePath, redactText } from "../src/lib/redact.mjs";

test("safe implementation tasks pass", () => {
  assert.doesNotThrow(() => assertTaskSafe([
    "Add a loading state",
    "Update the existing component and its tests",
    "Do not change the public API",
    "Do not deploy or commit anything",
    "Update the release notes text only"
  ]));
});

test("publication, secret access, and destructive requests are blocked", () => {
  const findings = scanTaskSafety([
    "Commit and push this work, deploy it, then print the .env token",
    "Use rm -rf if anything gets in the way"
  ]);
  assert.ok(findings.length >= 3);
  assert.throws(() => assertTaskSafe("git push origin main"), /human decision/i);
});

test("secret-looking values and paths are redacted", () => {
  assert.equal(isSensitivePath(".env.local"), true);
  assert.equal(isSensitivePath("config/service-account.json"), true);
  assert.equal(isSensitivePath("src/app.ts"), false);
  assert.doesNotMatch(redactText("api_key=supersecretvalue123"), /supersecretvalue123/);
});
