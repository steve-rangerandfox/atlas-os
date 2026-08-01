# Build Report

Build date: 2026-08-01
Version: 0.1.0

## Delivered

- Zero-dependency Node.js stdio MCP server.
- Eleven purpose-built orchestrator tools.
- Clean-tree enforcement and dedicated mission branches.
- Detached Claude Code worker with structured output.
- Permission, tool, hook, secret-path, Git, deployment, and destructive-action guardrails.
- Named verification runner with npm, pnpm, Yarn, and Bun detection.
- Persistent mission/job JSON with atomic writes and filesystem locks.
- Git status, diff, diff-stat, tracked patch, and safe untracked-file patch retrieval.
- Human decision recording, final review, and non-destructive abort flows.
- Codespace and Secure MCP Tunnel setup documentation.
- Controller instructions and starter prompts.

## Verification performed

The following commands passed in the build environment:

```text
npm test
  5 tests passed, 0 failed

npm run smoke
  MCP initialization passed
  11 tools discovered

node --check src/mcp-server.mjs
node --check src/worker.mjs
node --check src/lib/tools.mjs
node --check src/lib/git.mjs
bash -n scripts/install-local.sh
```

The automated end-to-end test uses a fake Claude executable and a temporary Git repository. It verifies:

- dirty working trees are refused;
- a mission branch is created;
- a background worker receives a bounded task;
- a file is changed;
- diff output includes the new file;
- lint, typecheck, test, and diff checks pass;
- mission state is updated;
- no Git commit is created;
- final status requires human review.

## Live integration still required

The build environment did not contain the user's Claude Code installation, Claude authentication, OpenAI tunnel credentials, ChatGPT workspace permissions, or `tunnel-client`. Therefore this package has not been exercised against a real Claude session or a live ChatGPT Secure MCP Tunnel.

The first live validation is intentionally small:

1. run `npm test` in the Codespace;
2. run `claude auth status`;
3. run the local `doctor` command against the target repository;
4. connect the stdio server through Secure MCP Tunnel;
5. run a mission that changes one disposable test file;
6. confirm the diff, checks, and human gate before using it on valuable work.

## Known MVP limits

- A stopped Codespace stops active workers and the tunnel.
- A job may remain recorded as `running` after a hard machine stop; inspect Git state before re-delegating.
- This is a guarded controller, not a hardened OS sandbox.
- Secret detection and command blocking are pattern based.
- Package scripts are repository-controlled executable code.
- There is no hosted approval dashboard, durable queue, GitHub App, or automated pull-request flow yet.
