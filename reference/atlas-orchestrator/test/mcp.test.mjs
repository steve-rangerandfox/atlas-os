import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import readline from "node:readline";

test("MCP server initializes and lists tools", async (t) => {
  const child = spawn(process.execPath, ["src/mcp-server.mjs"], { stdio: ["pipe", "pipe", "pipe"] });
  t.after(() => child.kill("SIGTERM"));
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  const queue = [];
  const waiters = [];
  lines.on("line", (line) => {
    const item = JSON.parse(line);
    const waiter = waiters.shift();
    if (waiter) waiter(item);
    else queue.push(item);
  });
  const next = () => new Promise((resolve) => {
    const item = queue.shift();
    if (item) resolve(item);
    else waiters.push(resolve);
  });

  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } })}\n`);
  const init = await next();
  assert.equal(init.result.serverInfo.name, "atlas-orchestrator");
  assert.equal(init.result.serverInfo.version, "0.4.0");
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })}\n`);
  const tools = await next();
  const names = new Set(tools.result.tools.map((tool) => tool.name));
  for (const required of [
    "adopt_project",
    "get_project",
    "record_project_event",
    "adopt_mission",
    "attach_existing_branch",
    "get_branch_diff",
    "delegate_task",
    "delegate_to_claude",
    "delegate_to_codex",
    "finish_mission"
  ]) {
    assert.ok(names.has(required), `missing ${required}`);
  }
  assert.ok(tools.result.tools.length >= 21);
});
