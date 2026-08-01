# Executor Model

Atlas Orchestrator supports interchangeable implementation executors.

## Supported executors

- `claude` — Claude Code CLI, using schema-constrained JSON output and explicit tool permissions.
- `codex` — OpenAI Codex CLI, using `codex exec`, `workspace-write` sandboxing, ephemeral sessions, and a schema-constrained final report.

Use the generic MCP tool `delegate_task` with `executor: "claude"` or `executor: "codex"`. Compatibility tools `delegate_to_claude` and `delegate_to_codex` are also available.

The orchestrator, not the executor, owns mission state, Git branch safety, diff inspection, verification checks, secret-path blocking, and human approval gates. Neither executor is authorized to commit, push, open a pull request, deploy, publish, or mutate infrastructure.

Configuration:

```bash
ORCH_CLAUDE_BIN=claude
ORCH_CLAUDE_MODEL=
ORCH_CODEX_BIN=codex
ORCH_CODEX_MODEL=
ORCH_CLAUDE_TIMEOUT_MINUTES=45
ORCH_CODEX_TIMEOUT_MINUTES=45
```
