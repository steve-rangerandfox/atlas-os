import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runProcess } from "../src/lib/process.mjs";

test("controller installation persists required non-secret MCP environment", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "atlas-controller-install-"));
  const bin = path.join(root, "bin");
  const log = path.join(root, "calls.log");
  await mkdir(bin, { recursive: true });
  const fake = `#!/bin/sh
echo "$(basename "$0") $*" >> "$FAKE_LOG"
if [ "\${1:-}" = "mcp" ] && [ "\${2:-}" = "get" ]; then
  [ -f "$FAKE_ROOT/$(basename "$0")-added" ] && exit 0
  exit 1
fi
if [ "\${1:-}" = "mcp" ] && [ "\${2:-}" = "add" ]; then touch "$FAKE_ROOT/$(basename "$0")-added"; fi
exit 0
`;
  for (const name of ["codex", "claude"]) {
    await writeFile(path.join(bin, name), fake);
    await chmod(path.join(bin, name), 0o755);
  }
  await writeFile(path.join(bin, "node"), "#!/bin/sh\nexit 0\n");
  await writeFile(path.join(bin, "npm"), "#!/bin/sh\nexit 0\n");
  await chmod(path.join(bin, "node"), 0o755);
  await chmod(path.join(bin, "npm"), 0o755);
  const envFile = path.join(root, "orchestrator.env");
  await writeFile(envFile, "ORCH_HOME=/tmp/atlas-state\nORCH_MAX_TURNS=9\nAPI_KEY=must-not-persist\n");
  await runProcess("bash", ["scripts/install-controllers.sh", "all"], {
    cwd: path.resolve("."),
    env: { PATH: `${bin}:/bin:/usr/bin`, FAKE_LOG: log, FAKE_ROOT: root, ATLAS_ORCHESTRATOR_ENV_FILE: envFile },
    rejectOnNonZero: true
  });
  const calls = await readFile(log, "utf8");
  assert.match(calls, /ORCH_CONTROLLER_PROVIDER=codex/);
  assert.match(calls, /ORCH_CONTROLLER_PROVIDER=claude/);
  assert.match(calls, /ORCH_HOME=\/tmp\/atlas-state/);
  assert.match(calls, /ORCH_MAX_TURNS=9/);
  assert.doesNotMatch(calls, /must-not-persist|API_KEY/);
});
