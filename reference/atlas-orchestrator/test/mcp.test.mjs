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
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })}\n`);
  const tools = await next();
  assert.ok(tools.result.tools.some((tool) => tool.name === "delegate_task"));
  assert.ok(tools.result.tools.some((tool) => tool.name === "delegate_to_claude"));
  assert.ok(tools.result.tools.some((tool) => tool.name === "delegate_to_codex"));
  assert.ok(tools.result.tools.some((tool) => tool.name === "finish_mission"));
});
