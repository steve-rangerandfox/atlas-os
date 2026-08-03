# Security and Trust Model

This bridge reduces accidental autonomy, but it is not a security sandbox. Use it only in an isolated development environment and only with repositories that every selected controller and executor is permitted to process.

## Data flow

During a mission:

- The controller receives the mission goal, task descriptions, executor structured reports, Git status, check output, and any diff returned by the bridge.
- The selected executor can read and edit the checked-out repository subject to its adapter settings and the bridge's controls.
- When ChatGPT is the controller, OpenAI Secure MCP Tunnel transports MCP requests between ChatGPT and the private Codespace.
- When Codex CLI or Claude Code is the controller, it launches the same MCP server locally over stdio.
- The bridge writes mission and job JSON locally.

The bridge does not upload the repository wholesale, but selected repository content can be included in model processing and selected diffs or output can be returned to the controller.

## Enforced boundaries

The starter enforces these defaults:

- clean working tree before mission start;
- dedicated `orchestrator/*` branch;
- one active job per mission;
- bounded delegation count;
- controller/executor same-provider recursion blocked by default;
- Claude executor permission mode restricted to `acceptEdits` or `dontAsk`;
- Claude executor hooks disabled;
- Claude executor slash commands and skills disabled for the job;
- Claude executor MCP servers excluded for the job;
- Codex executor uses ephemeral mode, ignores user config and rules, and disables sandbox network access;
- explicit denial of commit, push, branch mutation, deployment, remote shell, common infrastructure tools, and destructive commands;
- explicit denial of common secret-file paths;
- no arbitrary shell command exposed through MCP;
- redaction of common token and credential patterns from returned output;
- automatic human gate when sensitive paths change, Git HEAD changes, the branch changes, or an executor reports a blocker;
- no automatic commit, push, pull request, deployment, rollback, reset, or deletion.
- project standing authorization is limited to five enumerated local operations and accepts no command strings;
- network certification accepts only profile-declared HTTPS endpoints;
- interrupted executor jobs stop for human inspection instead of being replayed over possible partial edits.

## Controller profiles

The provided Codex controller launches with a read-only Codex sandbox, and the Claude controller launches in Plan mode. These settings reduce the chance that the controller edits a product repository directly.

MCP servers execute outside the controller's file sandbox. That is intentional: Atlas is the controlled write channel. The controller sandbox does not make a third-party or modified MCP server safe. Verify the configured command with `codex mcp get atlas-orchestrator --json` or `claude mcp get atlas-orchestrator` and connect only the Atlas server from this repository.

The controller profiles are instruction and configuration layers, not a hard process-isolation boundary. A user can deliberately change modes or configuration. Use least-privilege environments and retain human review.

## Residual risks

### File controls are pattern based

Secret-file denial covers common names, not every possible secret location. A secret stored in an ordinary source file may still be read. Keep credentials outside the repository and use a least-privilege Codespace.

### Executor CLIs are powerful local processes

The bridge narrows executor tools and permissions, but a software defect, configuration interaction, or future CLI behavior change could weaken a guardrail. Do not run this against production hosts or a workstation with broad credentials.

### Repository instructions are input

Executors may read repository instructions such as `CLAUDE.md` and `AGENTS.md`. Treat an unfamiliar repository as untrusted. Project hooks and executor-side MCP integrations are disabled where supported, but source code and instructions can still influence model behavior.

### Package scripts are executable code

`run_checks` only selects a named script, but the script body comes from the repository. A malicious or poorly named `test` or `build` script can have side effects. Review `package.json` before running checks in an unfamiliar project.

### Diff output may contain sensitive content

The bridge blocks common sensitive paths and redacts common secret formats, but redaction is not perfect. Review what the repository contains before allowing `get_diff` results to return to a controller.

### Tunnel and account policy still matter

When using ChatGPT, protect the `CONTROL_PLANE_API_KEY` as a secret. Scope tunnel associations to the intended Platform organization and ChatGPT workspace. Remove the tunnel or revoke the key when it is no longer needed.

### Local recovery is not distributed durability

Project, mission, and job JSON survives ordinary process restarts. The 0.5 supervisor can reconcile a stopped worker on the same filesystem, but a stopped Codespace still stops all processes. The system does not use a hosted durable queue, distributed lock, or multi-node lease.

## Recommended operating environment

- A dedicated GitHub Codespace or disposable development VM.
- A repository-specific identity with no production credentials.
- Branch protection and required human review outside this bridge.
- Explicit organizational approval for every selected model provider.
- No Microsoft, client, legal, health, financial, export-controlled, or regulated data unless policy expressly authorizes the processing path.
- Routine review of Claude Code, Codex CLI, and this bridge's permission settings.

## Incident response

When behavior is unexpected:

1. Stop the active controller session and `tunnel-client`, when present.
2. Stop any executor process you can identify.
3. Do not run cleanup commands through an agent.
4. Inspect `git status`, `git diff`, the current branch, and `git log` manually.
5. Review `.orchestrator/missions` and `.orchestrator/jobs`.
6. Rotate the tunnel runtime key or other exposed credentials when necessary.
7. Preserve logs and state before making corrective changes.
