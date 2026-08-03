# Controller Bootstrap

Atlas Orchestrator can be controlled immediately from Codex CLI or Claude Code inside the same Codespace. This removes the copy-and-paste relay while the ChatGPT Secure MCP Tunnel association is pending.

ChatGPT does not connect directly to a local stdio MCP server. ChatGPT web requires a remote MCP endpoint or Secure MCP Tunnel for private development environments. The controller bootstrap below therefore uses local MCP support in Codex CLI and Claude Code, both of which can launch Atlas directly as a stdio server.

## Architecture

```text
Codex controller (read-only)       Claude controller (Plan mode)
              \                     /
               \                   /
                Atlas Orchestrator MCP
                         |
              one bounded executor task
                 Claude Code or Codex
                         |
             target repository + Git evidence
```

The controller is intentionally different from the default executor:

- Codex controller → Claude Code executor
- Claude controller → Codex executor

The Atlas adapters reject same-provider delegation by default to avoid an accidental controller spawning another copy of itself. Set `ORCH_ALLOW_SAME_PROVIDER_EXECUTOR=1` only for a deliberate, reviewed experiment.

## Install both controller profiles

From the Atlas Orchestrator package:

```bash
cd /workspaces/atlas-os/atlas-os/reference/atlas-orchestrator
bash scripts/install-controllers.sh all
```

The installer:

- registers the local stdio server with `codex mcp add`;
- registers the same server with `claude mcp add --scope user`;
- tags each server process with its controller provider;
- persists `ORCH_HOME` plus allowlisted non-secret executor, model, and timeout settings from `orchestrator.env` or the current environment;
- runs the MCP smoke test;
- leaves an existing configuration unchanged unless `--force` is supplied.

To replace existing entries:

```bash
bash scripts/install-controllers.sh all --force
```

The installer never persists API keys, tokens, tunnel credentials, or arbitrary environment variables. Set `ATLAS_ORCHESTRATOR_ENV_FILE` only when a different non-secret configuration file is required.

## Check status

```bash
bash scripts/atlas-controller status
bash scripts/atlas-controller doctor /workspaces/TARGET_REPOSITORY
node src/cli.mjs run Relay --profile relay-development
```

## Launch a Codex controller

```bash
bash scripts/atlas-controller codex
```

Codex launches from `controllers/codex/`, loads its `AGENTS.md`, and starts with a read-only sandbox. It can reason, converse, and call Atlas MCP tools, but product changes must flow through Atlas. Its default implementation executor is Claude Code.

## Launch a Claude controller

```bash
bash scripts/atlas-controller claude
```

Claude launches from `controllers/claude/`, loads its `CLAUDE.md`, and starts in Plan mode. Its default implementation executor is Codex.

## First request

Tell the controller the exact repository path and the outcome. For example:

> Operate on `/workspaces/relay`. The outcome is: users can recover an interrupted draft without losing the last saved version. Use Atlas, start with doctor, run one bounded task at a time, and stop at human gates.

The controller should call:

1. `doctor`
2. `start_mission`
3. `delegate_task`
4. `wait_for_job`
5. `get_mission`
6. `get_diff`
7. `run_checks` when independent verification is needed
8. `finish_mission` when the branch is ready for human review

It must not commit, push, open a pull request, deploy, publish, access secrets, or perform destructive operations.

## One installation, many projects

The controller and MCP server may live in the Atlas Codespace while missions target any Git repository available on the same filesystem. Clone or mount product repositories into stable paths and provide the exact path when beginning a mission.

A later Atlas Control application will add a durable project registry and browser UI. The controller bootstrap is the immediate working interface and exercises the same Atlas tool contract that the future UI will use.

## References

- OpenAI Codex supports local stdio MCP entries through `codex mcp add <name> -- <command>`.
- Claude Code supports local stdio MCP entries through `claude mcp add --transport stdio <name> -- <command>`.
- ChatGPT custom MCP apps require a remote server or Secure MCP Tunnel when the server is local or on a private development machine.
