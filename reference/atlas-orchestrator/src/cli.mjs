#!/usr/bin/env node
import { asErrorDetails } from "./lib/errors.mjs";
import { callTool, toolDefinitions } from "./lib/tools.mjs";

function usage() {
  console.log(`Atlas Orchestrator

Usage:
  node src/cli.mjs tools
  node src/cli.mjs doctor --repo <path>
  node src/cli.mjs start --repo <path> --goal <text> [--branch <name>]
  node src/cli.mjs status <mission_id>
  node src/cli.mjs diff <mission_id> [--file <relative-path>]
  node src/cli.mjs wait <job_id> [--timeout <seconds>]
  node src/cli.mjs checks <mission_id> [--checks diff-check,lint,typecheck,test,build]
  node src/cli.mjs list [--repo <path>]
  node src/cli.mjs abort <mission_id> --reason <text>
  node src/cli.mjs call <tool_name> '<json arguments>'

The MCP server itself is: node src/mcp-server.mjs`);
}

function option(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function requiredOption(name) {
  const value = option(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function main() {
  const command = process.argv[2];
  if (!command || command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }
  let data;
  switch (command) {
    case "tools":
      data = toolDefinitions;
      break;
    case "doctor":
      data = await callTool("doctor", { repo_path: requiredOption("--repo") });
      break;
    case "start":
      data = await callTool("start_mission", {
        repo_path: requiredOption("--repo"),
        goal: requiredOption("--goal"),
        branch_name: option("--branch"),
        max_delegations: option("--max-delegations")
      });
      break;
    case "status":
      data = await callTool("get_mission", { mission_id: process.argv[3] });
      break;
    case "diff":
      data = await callTool("get_diff", { mission_id: process.argv[3], file_path: option("--file") });
      break;
    case "wait":
      data = await callTool("wait_for_job", { job_id: process.argv[3], timeout_seconds: option("--timeout") });
      break;
    case "checks":
      data = await callTool("run_checks", {
        mission_id: process.argv[3],
        checks: option("--checks")?.split(",").map((item) => item.trim()).filter(Boolean)
      });
      break;
    case "list":
      data = await callTool("list_missions", { repo_path: option("--repo") });
      break;
    case "abort":
      data = await callTool("abort_mission", { mission_id: process.argv[3], reason: requiredOption("--reason") });
      break;
    case "call":
      data = await callTool(process.argv[3], process.argv[4] ? JSON.parse(process.argv[4]) : {});
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify(asErrorDetails(error), null, 2));
  process.exitCode = 1;
});
