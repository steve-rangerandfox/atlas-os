# Atlas Orchestrator

A non-normative reference implementation for coordinating bounded software-engineering missions across many repositories with human supervision.

Atlas Orchestrator keeps the controller, executor, repository evidence, and human approval boundaries separate:

- **ChatGPT, Codex, Claude Code, or a future Atlas Control UI** can act as the controller and engineering director.
- **Claude Code or OpenAI Codex** performs one bounded implementation task at a time.
- **Git** provides branch, diff, and HEAD evidence.
- **The human** approves product decisions, sensitive access, publication, destructive actions, and final acceptance.

One orchestrator installation can serve Kit, Relay, Demo Pro, and other projects. Every mission is bound to one repository, working directory, branch, and base commit. The executor is selected per task.

## Status

Version `0.3.0` is a local-first reference implementation. It is useful for isolated development environments and supervised experimentation. It is not a hardened security sandbox, a durable distributed workflow engine, or a production deployment service.

This package lives under `reference/` because the Atlas OS specification remains implementation-independent and authoritative within `spec/`.

## Use it now without the ChatGPT tunnel

Codex CLI and Claude Code can launch local stdio MCP servers directly. Atlas includes controller profiles for both, so the complete controller → Atlas → executor loop can run inside the Codespace while ChatGPT Secure MCP Tunnel provisioning is pending.

```bash
cd /workspaces/atlas-os/atlas-os/reference/atlas-orchestrator
bash scripts/install-controllers.sh all
bash scripts/atlas-controller codex
```

A Codex controller launches read-only and defaults to Claude Code as the implementation executor. A Claude controller launches in Plan mode and defaults to Codex. Same-provider recursion is rejected by default.

See [Controller Bootstrap](CONTROLLERS.md) for installation, launch, safety, and first-mission instructions.

ChatGPT custom MCP apps still require a remote MCP endpoint or Secure MCP Tunnel when the server is local or runs on a private development machine.

## Supported executors

- `claude` — Claude Code CLI in non-interactive structured-output mode.
- `codex` — OpenAI Codex CLI through `codex exec` with ephemeral sessions, ignored user rules/config, workspace-write sandboxing, and network disabled for sandboxed commands.

Use `delegate_task` with `executor: "claude"` or `executor: "codex"`. Compatibility aliases `delegate_to_claude` and `delegate_to_codex` are also available.

## Control loop

1. `doctor` checks Git, executor availability/authentication, and tunnel-client availability.
2. `start_mission` requires a clean tree and creates an `orchestrator/*` branch.
3. The controller delegates one small task.
4. A detached worker runs the selected executor.
5. Named checks run without accepting arbitrary shell commands from MCP.
6. The controller inspects mission state and the actual Git diff.
7. Failed checks return a failed job so a bounded correction can be delegated.
8. Product choices, sensitive changes, branch/HEAD mutations, executor blockers, and final acceptance stop at a human gate.
9. `finish_mission` marks work ready for review; it does not commit, push, open a pull request, deploy, or publish.

The worker refuses to start when the mission branch is not checked out or when Git HEAD has moved since mission creation.

## MCP tools

| Tool | Purpose |
|---|---|
| `doctor` | Check repository and executor readiness |
| `start_mission` | Create mission state and a dedicated branch |
| `delegate_task` | Run one bounded task with Claude Code or Codex |
| `delegate_to_claude` | Claude compatibility alias |
| `delegate_to_codex` | Codex compatibility alias |
| `wait_for_job` | Poll executor or verification work |
| `get_mission` | Inspect state, reports, checks, Git status, and gates |
| `get_diff` | Retrieve staged, unstaged, and safe untracked patches |
| `run_checks` | Run named checks only |
| `record_human_decision` | Record a human answer and reopen a paused mission |
| `finish_mission` | Stop autonomous work for final review |
| `abort_mission` | Stop while preserving branch and changes |
| `list_missions` | Find known missions across repositories |

## Quick verification

```bash
cd reference/atlas-orchestrator
npm test
npm run smoke
```

No package installation is required. Node.js 20 or newer is required.

Run a readiness check against a project repository:

```bash
node src/cli.mjs doctor --repo /workspaces/YOUR_REPOSITORY
```

For ChatGPT, follow [START_HERE.md](START_HERE.md) to connect the stdio MCP server through Secure MCP Tunnel. For an immediate local controller, follow [CONTROLLERS.md](CONTROLLERS.md).

## Local CLI

```bash
node src/cli.mjs tools
node src/cli.mjs doctor --repo /workspaces/my-app
node src/cli.mjs start --repo /workspaces/my-app --goal "Add a recoverable draft flow"
node src/cli.mjs status mission_abc123
node src/cli.mjs diff mission_abc123
node src/cli.mjs wait job_abc123 --timeout 20
```

The normal control path is MCP; the CLI is useful for diagnosis.

## Checks

The MCP interface accepts only these check names:

- `diff-check`
- `lint`
- `typecheck`
- `test`
- `build`

For package checks, the runner detects npm, pnpm, Yarn, or Bun and invokes an existing root script without a shell. Repository scripts are executable code, so review them before operating on an unfamiliar repository.

## State and recovery

Mission and job state is stored under:

```text
<repo>/.orchestrator/
```

A lookup index is stored under:

```text
~/.atlas-orchestrator/index.json
```

The repository-local state directory is added to `.git/info/exclude`. If a controller or MCP connection disconnects, reconnect and use `list_missions`. If the machine stops during a job, inspect the repository and job state before re-delegating.

## Safety boundary

The orchestrator uses layered controls: bounded tools, request scanning, executor-specific settings, controller/executor collision prevention, branch/HEAD invariants, sensitive-path detection, output redaction, named checks, and human gates. These controls reduce accidental autonomy; they do not guarantee containment against a malicious repository, a compromised executable, an unknown secret location, or a future CLI behavior change.

Use a disposable Codespace or development VM with least-privilege credentials. Read [SECURITY.md](SECURITY.md) before connecting valuable repositories.

## Further documentation

- [Controller Bootstrap](CONTROLLERS.md)
- [Start Here](START_HERE.md)
- [ChatGPT Controller Instructions](AGENT_INSTRUCTIONS.md)
- [Executor Model](EXECUTORS.md)
- [Security and Trust Model](SECURITY.md)
- [Atlas Integration Boundary](ATLAS_INTEGRATION.md)
- [Architecture Notes](docs/ARCHITECTURE.md)
