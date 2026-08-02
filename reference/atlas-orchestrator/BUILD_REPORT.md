# Build Report

Build date: 2026-08-02
Version: 0.3.0

## Delivered

- Zero-dependency Node.js stdio MCP server with thirteen purpose-built tools.
- Multi-project mission state with clean-tree enforcement and dedicated mission branches.
- Interchangeable Claude Code and OpenAI Codex executors.
- Detached executor workers with structured reports and named verification checks.
- Branch and Git HEAD invariants before and after executor work.
- Persistent mission/job JSON with atomic writes and filesystem locks.
- Git status, diff, diff-stat, tracked patch, and safe untracked-file patch retrieval.
- Secret-path blocking, output redaction, request scanning, and human approval gates.
- Local Codex controller profile using a read-only controller sandbox.
- Local Claude Code controller profile using Plan mode.
- Controller/executor same-provider collision prevention with an explicit opt-in override.
- Controller installation, status, launch, and readiness scripts.
- ChatGPT Secure MCP Tunnel documentation and a tunnel-independent local controller path.
- GitHub Actions validation for tests, MCP smoke checks, JavaScript syntax, and shell syntax.

## Verification contract

The release is validated with:

```text
npm test
  11 tests expected

npm run smoke
  MCP initialization
  13 tools discovered

node --check src/mcp-server.mjs
node --check src/worker.mjs
node --check src/lib/tools.mjs
node --check src/lib/git.mjs
node --check src/lib/controller.mjs
bash -n scripts/install-local.sh
bash -n scripts/install-controllers.sh
bash -n scripts/atlas-controller
```

The automated tests use temporary Git repositories and fake Claude/Codex executables. They verify:

- dirty working trees are refused;
- mission branches are created;
- background Claude and Codex jobs complete;
- requested untracked-file diffs are returned;
- wrong-branch execution is refused;
- failed checks fail the job and task;
- mission state and human-review gates are updated;
- publication and destructive requests are blocked;
- secrets are redacted;
- same-provider controller recursion is blocked by default;
- no Git commit is created by the orchestrator.

## Live integration status

The target Codespace has authenticated Claude Code and Codex installations and the orchestrator `doctor` check reports `readyForMission: true` on the merged 0.2.0 baseline. Version 0.3.0 adds local controller bootstrap so the next live validation does not depend on completion of the ChatGPT Secure MCP Tunnel tenant association.

The first 0.3.0 live validation is intentionally small:

1. install the Codex and Claude controller MCP profiles;
2. launch one controller in its constrained mode;
3. run `doctor` against a disposable target repository;
4. start one mission;
5. delegate one reversible file change to the opposite executor;
6. inspect the actual diff and checks;
7. finish at the human review gate without committing or publishing.

## Known MVP limits

- A stopped Codespace stops active workers and local controller sessions.
- A job may remain recorded as `running` after a hard machine stop; inspect Git state before re-delegating.
- Controller modes and MCP configuration reduce accidental direct edits but are not a hardened isolation boundary.
- Secret detection and command blocking are pattern based.
- Package scripts are repository-controlled executable code.
- There is no hosted approval dashboard, durable queue, isolated worktree pool, GitHub App, or automated pull-request flow yet.
