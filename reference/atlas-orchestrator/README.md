# Atlas Orchestrator

A private, human-supervised MCP bridge that lets a ChatGPT conversation coordinate Claude Code inside a Git repository.

The point is simple: **ChatGPT is the controller, Claude Code is the implementer, Git is the evidence trail, and you step in only at explicit gates.** No more copying prompts and results between two chat windows.

## What this starter does

- Runs as a private stdio MCP server beside your repository, usually in a GitHub Codespace.
- Lets ChatGPT check readiness, create a mission branch, delegate bounded tasks to Claude Code, wait for jobs, inspect Git state and diffs, run named checks, and pause for human decisions.
- Stores durable mission and job state under `.orchestrator/` in the target repository and a small lookup index under `~/.atlas-orchestrator/`.
- Launches Claude Code non-interactively with structured JSON output.
- Requires a clean Git working tree before every mission.
- Creates a dedicated `orchestrator/*` branch.
- Never commits, pushes, opens a pull request, deploys, publishes, or deletes work.
- Uses no npm dependencies. Node.js is the only JavaScript runtime requirement.

## Architecture

```text
You
  |
  v
ChatGPT / GPT controller
  |
  | MCP tool calls through Secure MCP Tunnel
  v
Private orchestrator server in your Codespace
  |-- mission state
  |-- Git inspection and branch guardrails
  |-- safe verification runner
  `-- Claude Code subprocess
          |
          `-- reads/edits the checked-out repository
```

The ChatGPT conversation remains the reasoning and planning layer. This bridge deliberately does not run a second OpenAI API agent; doing so would duplicate the controller and create another state-sync problem.

## The control loop

1. `doctor` verifies Git, Claude Code, authentication, and tunnel-client.
2. `start_mission` requires a clean tree and creates a new branch.
3. ChatGPT converts the mission into one small, observable task.
4. `delegate_to_claude` starts a background Claude Code job.
5. `wait_for_job` returns the result when ready or the current running state.
6. ChatGPT calls `get_mission` and `get_diff`, evaluates evidence, and either delegates a correction or proceeds.
7. `run_checks` invokes only safe named checks: `diff-check`, `lint`, `typecheck`, `test`, and `build`.
8. Any product choice, secret requirement, destructive action, publication step, or final acceptance pauses for you.
9. `finish_mission` marks the branch ready for human review. It still does not commit or publish anything.

## MCP tools

| Tool | Purpose |
|---|---|
| `doctor` | Readiness check for the repository, Claude Code, auth, and tunnel-client |
| `start_mission` | Create mission state and a dedicated branch |
| `delegate_to_claude` | Run one bounded implementation task in the background |
| `wait_for_job` | Poll a Claude or verification job |
| `get_mission` | Inspect state, reports, checks, Git status, and gates |
| `get_diff` | Read the current staged and unstaged patch |
| `run_checks` | Run named package checks plus `git diff --check` |
| `record_human_decision` | Save your answer and reopen a paused mission |
| `finish_mission` | Stop autonomous work and request final review |
| `abort_mission` | Stop while preserving the branch and local changes |
| `list_missions` | Find known missions |

## Start here

Follow [START_HERE.md](START_HERE.md). The core local verification is:

```bash
cd ~/tools/atlas-orchestrator
npm test
node src/cli.mjs doctor --repo /workspaces/YOUR_REPOSITORY
```

There is no `npm install` step.

## Local CLI

The CLI calls the same handlers exposed through MCP:

```bash
node src/cli.mjs tools
node src/cli.mjs doctor --repo /workspaces/my-app
node src/cli.mjs start --repo /workspaces/my-app --goal "Add a recoverable draft flow"
node src/cli.mjs status mission_abc123
node src/cli.mjs diff mission_abc123
node src/cli.mjs wait job_abc123 --timeout 20
```

Use the CLI for diagnosis. The normal workflow is through ChatGPT.

## Configuration

All settings are optional environment variables. See [`orchestrator.env.example`](orchestrator.env.example).

Important defaults:

- Permission mode: `acceptEdits`
- Maximum Claude turns per delegation: `12`
- Maximum Claude budget per delegation: `$3.00`
- Claude timeout: `45` minutes
- Verification timeout per check: `15` minutes
- Mission delegation cap: `20`

Only `acceptEdits` and `dontAsk` are accepted as Claude permission modes. A request to use `bypassPermissions` is ignored and falls back to `acceptEdits`.

## Repository checks

The verification runner never accepts an arbitrary shell command from ChatGPT. It detects the package manager from the lockfile and invokes an existing root `package.json` script by name:

- `lint`
- one of `typecheck`, `type-check`, `check:types`, or `types`
- `test`
- `build`

It always supports `git diff --check`. A repository script is still code and may have side effects; review scripts before allowing the bridge to run in an unfamiliar repository.

## State and recovery

Mission state lives here:

```text
<repo>/.orchestrator/missions/*.json
<repo>/.orchestrator/jobs/*.json
```

The bridge adds `.orchestrator/` to the repository's local `.git/info/exclude`, so state is not committed. The lookup index lives under:

```text
~/.atlas-orchestrator/index.json
```

If the MCP connection or ChatGPT conversation disconnects, background jobs and JSON state remain in the Codespace. Reconnect, call `list_missions`, then `get_mission` or `wait_for_job`.

If the Codespace itself stops, active processes stop. The saved state and repository changes remain, but a running job may need to be diagnosed or re-delegated after the Codespace restarts.

## Safety model

Read [SECURITY.md](SECURITY.md) before using this with valuable or restricted code. This is a guarded controller, not a perfect sandbox.

In particular, do not point it at a repository containing Microsoft, client, legal, or regulated material unless the applicable policy explicitly permits both ChatGPT and Claude to process that material.

## Development

```bash
npm test
npm run smoke
node --check src/mcp-server.mjs
```

The test suite covers MCP initialization, tool discovery, branch creation, detached worker execution, Claude result ingestion through a fake CLI, verification checks, non-publication, safety filtering, and redaction.

## Roadmap after the local MVP works

A production second phase can add:

- a durable hosted workflow for retries, pause/resume, and long-running approvals;
- a GitHub App and isolated ephemeral worktrees or sandboxes;
- a small approval and audit dashboard;
- organization policy, identity, and repository allowlists;
- pull-request creation as a separately authorized human action.

Do not build that control plane before validating that this bounded local loop produces the behavior you want.
