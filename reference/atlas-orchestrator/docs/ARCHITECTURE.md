# Architecture Notes

## Why the MCP bridge is the first implementation

The user's existing problem is not a lack of another model loop. It is the manual transport layer between ChatGPT and Claude Code. Making ChatGPT call a private MCP tool removes that transport step while preserving the conversation as the place where goals, tradeoffs, and human decisions already live.

A separate OpenAI API controller would introduce a second ChatGPT state, another credential, another user interface, and a synchronization problem between the API agent and the user's actual conversation. The MCP bridge avoids those costs.

## Components

### MCP server

`src/mcp-server.mjs` implements the stdio MCP transport directly over newline-delimited JSON-RPC. It supports initialization, ping, tool discovery, tool calls, and tool-level structured errors.

### Tool layer

`src/lib/tools.mjs` is the policy boundary. It validates inputs, requires clean Git state, creates mission branches, limits concurrency, blocks unsafe requests, and exposes only purpose-built operations.

### State layer

`src/lib/state.mjs` stores atomic JSON records and uses small filesystem locks to reduce server/worker races. A global index maps mission and job IDs back to repositories.

### Worker

`src/worker.mjs` runs detached from the MCP request. This prevents a long Claude task from tying up one tunnel request. It records lifecycle state, runs Claude or checks, compares Git state before and after, and raises a human gate when invariants break.

### Claude adapter

`src/lib/claude.mjs` invokes the local `claude` binary with:

- print mode;
- JSON output plus a required JSON schema;
- a turn and budget cap;
- no session persistence;
- disabled hooks, slash commands, skills, and MCP integrations;
- an explicit built-in tool set;
- allow and deny rules;
- a bounded task prompt.

### Verification runner

`src/lib/checks.mjs` detects npm, pnpm, Yarn, or Bun and invokes only known script names without a shell. It always supports `git diff --check`.

## State machine

Mission states:

```text
active
  | delegate / checks
  v
active ------------------------+
  | job reports blocker        |
  v                            |
waiting_for_human              |
  | record_human_decision      |
  +----------------------------+
  |
  | finish_mission
  v
ready_for_human_review

active -- abort_mission --> aborted
```

Job states:

```text
queued -> running -> succeeded
                  -> needs_human
                  -> failed
```

## Concurrency model

One background job is allowed per mission. The MCP server remains responsive while a worker runs. JSON writes are atomic and guarded by short filesystem locks. This is adequate for one Codespace and one controller, not a multi-node production service.

## Upgrade path

After validating the local loop, move execution to an isolated worktree or ephemeral sandbox and move orchestration state into a durable workflow engine. Preserve the same tool contract so ChatGPT behavior does not need to change.
