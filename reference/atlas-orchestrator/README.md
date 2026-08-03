# Atlas Orchestrator

A non-normative reference implementation for coordinating software-engineering projects and bounded missions across many repositories with human supervision.

Atlas Orchestrator keeps the controller, executor, repository evidence, durable project state, and human approval boundaries separate:

- **ChatGPT, Codex, Claude Code, or a future Atlas Control UI** can act as the controller and engineering director.
- **Atlas project state** preserves handoff identity, role routing, mission decisions, blockers, artifacts, and next actions without requiring a coding branch.
- **Claude Code or OpenAI Codex** performs one bounded implementation task at a time.
- **Git** provides branch, diff, HEAD, and base-to-head evidence.
- **The human** approves product decisions, sensitive access, publication, destructive actions, and final acceptance.

One orchestrator installation can serve Kit, Relay, Demo Pro, and other projects. A project may be adopted from an existing handoff before any execution branch exists. Coding missions remain bound to one repository, working directory, branch, and executor task at a time.

## Status

Version `0.4.0` is a local-first reference implementation. It adds durable project and handoff adoption to the existing guarded coding-mission loop. It is useful for isolated development environments and supervised experimentation. It is not a hardened security sandbox, a durable distributed workflow engine, or a production deployment service.

This package lives under `reference/` because the Atlas OS specification remains implementation-independent and authoritative within `spec/`.

## Use it now without the ChatGPT tunnel

Codex CLI and Claude Code can launch local stdio MCP servers directly. Atlas includes controller profiles for both, so the complete controller → Atlas → executor loop can run inside the Codespace while ChatGPT Secure MCP Tunnel provisioning is pending.

```bash
cd /workspaces/atlas-os/atlas-os/reference/atlas-orchestrator
bash scripts/install-controllers.sh all --force
bash scripts/atlas-controller codex
```

A Codex controller launches read-only and defaults to Claude Code as the implementation executor. A Claude controller launches in Plan mode and defaults to Codex. Same-provider recursion is rejected by default.

See [Controller Bootstrap](CONTROLLERS.md) for installation and launch. See [Project Adoption](PROJECT_ADOPTION.md) for complete handoff-driven operation.

ChatGPT custom MCP apps still require a remote MCP endpoint or Secure MCP Tunnel when the server is local or runs on a private development machine.

## Handoff-driven project adoption

An existing project does not need to be converted into a brand-new branch-based mission just to preserve its governance state.

The controller can:

1. read the governing handoff and verify current evidence;
2. call `adopt_project` to persist the handoff path, hash, role, active mission, lanes, blockers, and next action;
3. call `adopt_mission` to represent the already-approved mission in governance mode without changing Git;
4. record later user and Mission Control decisions through `record_project_event`;
5. update role, blockers, and routing through `update_project_state`;
6. attach an exact existing clean implementation branch with `attach_existing_branch` only when the required branch is available;
7. inspect its committed base-to-head patch with `get_branch_diff`;
8. begin executor work only after attachment.

A governance-mode mission cannot execute agents or checks. Atlas never creates a replacement branch when the handoff requires continuation of an existing branch.

## Supported executors

- `claude` — Claude Code CLI in non-interactive structured-output mode.
- `codex` — OpenAI Codex CLI through `codex exec` with ephemeral sessions, ignored user rules/config, workspace-write sandboxing, and network disabled for sandboxed commands.

Use `delegate_task` with `executor: "claude"` or `executor: "codex"`. Compatibility aliases `delegate_to_claude` and `delegate_to_codex` are also available.

## Control loops

### New coding mission

1. `doctor` checks Git and executor readiness.
2. `start_mission` requires a clean tree and creates an `orchestrator/*` branch.
3. The controller delegates one bounded task.
4. A detached worker runs the selected executor.
5. Named checks run without accepting arbitrary shell commands from MCP.
6. The controller inspects mission state and the actual Git diff.
7. Failed checks return a failed job so a bounded correction can be delegated.
8. Human gates stop product choices, sensitive changes, branch/HEAD mutation, blockers, and final acceptance.

### Existing handoff and branch

1. `adopt_project` records durable project state without changing Git.
2. `adopt_mission` records the approved mission in governance mode.
3. Project decisions and blockers are recorded independently of coding branches.
4. `attach_existing_branch` validates the exact checked-out clean branch and optional expected head/base.
5. `get_branch_diff` exposes the committed base-to-head patch plus working-tree state.
6. The normal bounded executor loop begins only after attachment.

The worker refuses to start when the mission is still in governance mode, when the mission branch is not checked out, or when Git HEAD moved after attachment.

## MCP tools

### Project and handoff state

| Tool | Purpose |
|---|---|
| `adopt_project` | Adopt or refresh a governing handoff without creating a branch |
| `get_project` | Inspect project state, Git state, and linked missions |
| `list_projects` | Find adopted projects |
| `update_project_state` | Update role, lanes, blockers, summary, and next action |
| `record_project_event` | Record a decision, evidence item, blocker, artifact, routing event, or note |
| `adopt_mission` | Represent an already-approved mission in governance mode |
| `attach_existing_branch` | Attach an exact existing clean branch without creating or switching it |
| `get_branch_diff` | Inspect committed base-to-head and working-tree differences |

### Coding missions

| Tool | Purpose |
|---|---|
| `doctor` | Check repository and executor readiness |
| `start_mission` | Create a new coding mission and dedicated branch |
| `delegate_task` | Run one bounded task with Claude Code or Codex |
| `delegate_to_claude` | Claude compatibility alias |
| `delegate_to_codex` | Codex compatibility alias |
| `wait_for_job` | Poll executor or verification work |
| `get_mission` | Inspect state, reports, checks, Git status, and gates |
| `get_diff` | Retrieve staged, unstaged, and safe untracked patches |
| `run_checks` | Run named checks only |
| `record_human_decision` | Record a mission-level human answer |
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

## Checks

The MCP interface accepts only these check names:

- `diff-check`
- `lint`
- `typecheck`
- `test`
- `build`

For package checks, the runner detects npm, pnpm, Yarn, or Bun and invokes an existing root script without a shell. Repository scripts are executable code, so review them before operating on an unfamiliar repository.

## State and recovery

Project, mission, and job state is stored under:

```text
<repo>/.orchestrator/
```

A lookup index is stored under:

```text
~/.atlas-orchestrator/index.json
```

The repository-local state directory is added to `.git/info/exclude`. If a controller or MCP connection disconnects, reconnect and use `list_projects`, `get_project`, or `list_missions`. If the machine stops during a job, inspect the repository and job state before re-delegating.

## Safety boundary

The orchestrator uses layered controls: bounded tools, request scanning, executor-specific settings, controller/executor collision prevention, governance-mode execution blocking, branch/HEAD invariants, sensitive-path detection, output redaction, named checks, and human gates. These controls reduce accidental autonomy; they do not guarantee containment against a malicious repository, a compromised executable, an unknown secret location, or a future CLI behavior change.

Use a disposable Codespace or development VM with least-privilege credentials. Read [SECURITY.md](SECURITY.md) before connecting valuable repositories.

## Further documentation

- [Project Adoption](PROJECT_ADOPTION.md)
- [Controller Bootstrap](CONTROLLERS.md)
- [Start Here](START_HERE.md)
- [ChatGPT Controller Instructions](AGENT_INSTRUCTIONS.md)
- [Executor Model](EXECUTORS.md)
- [Security and Trust Model](SECURITY.md)
- [Atlas Integration Boundary](ATLAS_INTEGRATION.md)
- [Architecture Notes](docs/ARCHITECTURE.md)
