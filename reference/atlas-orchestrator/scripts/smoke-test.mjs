#!/usr/bin/env node
import { spawn } from "node:child_process";
import readline from "node:readline";

const child = spawn(process.execPath, ["src/mcp-server.mjs"], { stdio: ["pipe", "pipe", "inherit"] });
const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
const pending = new Map();
lines.on("line", (line) => {
  const message = JSON.parse(line);
  const waiter = pending.get(message.id);
  if (waiter) {
    pending.delete(message.id);
    waiter.resolve(message);
  }
});

function request(id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 5_000);
    pending.set(id, {
      resolve: (message) => {
        clearTimeout(timer);
        resolve(message);
      }
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });
}

try {
  const initialized = await request(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "1" } });
  if (initialized.result?.serverInfo?.name !== "chatgpt-claude-orchestrator") throw new Error("Unexpected initialize response");
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  const tools = await request(2, "tools/list");
  if (!Array.isArray(tools.result?.tools) || tools.result.tools.length < 8) throw new Error("Tool list is incomplete");
  console.log(`Smoke test passed: ${tools.result.tools.length} tools discovered.`);
} finally {
  child.kill("SIGTERM");
}
