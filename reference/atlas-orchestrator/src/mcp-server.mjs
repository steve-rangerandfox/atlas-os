#!/usr/bin/env node
import readline from "node:readline";
import { asErrorDetails } from "./lib/errors.mjs";
import { certificationToolDefinitions, certificationToolHandlers } from "./lib/certification-tools.mjs";
import { projectToolDefinitions, projectToolHandlers } from "./lib/project-tools.mjs";
import { redactObject } from "./lib/redact.mjs";
import { callTool, toolDefinitions } from "./lib/tools.mjs";

const SERVER_NAME = "atlas-orchestrator";
const SERVER_VERSION = "0.5.0";
const SUPPORTED_PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const allToolDefinitions = [...projectToolDefinitions, ...certificationToolDefinitions, ...toolDefinitions];
let initialized = false;

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  send({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message, data = undefined) {
  send({ jsonrpc: "2.0", id, error: { code, message, ...(data === undefined ? {} : { data }) } });
}

function selectProtocol(requested) {
  return SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0];
}

async function invokeTool(name, args) {
  const projectHandler = projectToolHandlers[name];
  if (projectHandler) return await projectHandler(args ?? {});
  const certificationHandler = certificationToolHandlers[name];
  if (certificationHandler) return await certificationHandler(args ?? {});
  return await callTool(name, args ?? {});
}

async function handleRequest(message) {
  const { id, method, params = {} } = message;
  try {
    if (method === "initialize") {
      initialized = true;
      result(id, {
        protocolVersion: selectProtocol(params.protocolVersion),
        capabilities: { tools: { listChanged: false }, logging: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        instructions: "Use this server as a human-supervised Atlas controller. Adopt project handoffs and approved missions without creating branches, record decisions and blockers durably, attach only an exact existing clean branch before executor work, inspect evidence and diffs, stop at human gates, and never ask it to commit, push, deploy, publish, access secrets, or perform destructive actions."
      });
      return;
    }

    if (!initialized && method !== "ping") {
      error(id, -32002, "Server is not initialized");
      return;
    }

    if (method === "ping") {
      result(id, {});
      return;
    }

    if (method === "tools/list") {
      result(id, { tools: allToolDefinitions });
      return;
    }

    if (method === "tools/call") {
      const name = params.name;
      if (typeof name !== "string") {
        error(id, -32602, "tools/call requires params.name");
        return;
      }
      try {
        const data = redactObject(await invokeTool(name, params.arguments || {}));
        const structuredContent = data && typeof data === "object" && !Array.isArray(data)
          ? data
          : { items: data };
        result(id, {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent,
          isError: false
        });
      } catch (toolError) {
        const details = redactObject(asErrorDetails(toolError));
        result(id, {
          content: [{ type: "text", text: JSON.stringify(details, null, 2) }],
          structuredContent: details,
          isError: true
        });
      }
      return;
    }

    if (method === "logging/setLevel") {
      result(id, {});
      return;
    }

    error(id, -32601, `Method not found: ${method}`);
  } catch (requestError) {
    error(id, -32603, "Internal error", redactObject(asErrorDetails(requestError)));
  }
}

async function handleMessage(line) {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    error(null, -32700, "Parse error");
    return;
  }
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    error(message?.id ?? null, -32600, "Invalid Request");
    return;
  }
  if (message.id === undefined) {
    if (message.method === "notifications/initialized") initialized = true;
    return;
  }
  await handleRequest(message);
}

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
let queue = Promise.resolve();
input.on("line", (line) => {
  if (!line.trim()) return;
  queue = queue.then(() => handleMessage(line)).catch((queueError) => {
    console.error(queueError);
  });
});
input.on("close", () => {
  queue.finally(() => process.exit(0));
});
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
