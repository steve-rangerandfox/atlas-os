# Security and Trust Model

This bridge reduces accidental autonomy, but it is not a security sandbox. Use it only in an isolated development environment and only with repositories that both ChatGPT and Claude are permitted to process.

## Data flow

During a mission:

- ChatGPT receives the mission goal, task descriptions, Claude's structured report, Git status, check output, and any diff you ask the bridge to return.
- Claude Code can read and edit the checked-out repository subject to its local permissions and the bridge's deny rules.
- OpenAI Secure MCP Tunnel transports MCP requests between ChatGPT and the private Codespace.
- The bridge writes mission and job JSON locally.

The bridge does not upload the repository wholesale, but selected repository content can be included in Claude processing and selected diffs or output can be returned to ChatGPT.

## Enforced boundaries

The starter enforces these defaults:

- clean working tree before mission start;
- dedicated `orchestrator/*` branch;
- one active job per mission;
- bounded delegation count;
- Claude permission mode restricted to `acceptEdits` or `dontAsk`;
- Claude hooks disabled;
- Claude slash commands and skills disabled for the job;
- Claude MCP servers excluded for the job;
- explicit denial of commit, push, branch mutation, deployment, remote shell, common infrastructure tools, and destructive commands;
- explicit denial of common secret-file paths;
- no arbitrary shell command exposed through MCP;
- redaction of common token and credential patterns from returned output;
- automatic human gate when sensitive paths change, Git HEAD changes, the branch changes, or Claude reports a blocker;
- no automatic commit, push, pull request, deployment, rollback, reset, or deletion.

## Residual risks

### File controls are pattern based

Secret-file denial covers common names, not every possible secret location. A secret stored in an ordinary source file may still be read. Keep credentials outside the repository and use a least-privilege Codespace.

### Claude Code is a powerful local process

The bridge narrows Claude's tools and shell permissions, but a software defect, configuration interaction, or future CLI behavior change could weaken a guardrail. Do not run this against production hosts or a workstation with broad credentials.

### Repository instructions are input

Claude reads repository instructions such as `CLAUDE.md` and `AGENTS.md`. Treat an unfamiliar repository as untrusted. Project hooks are disabled for orchestrated jobs, but source code and instructions can still influence model behavior.

### Package scripts are executable code

`run_checks` only selects a named script, but the script body comes from the repository. A malicious or poorly named `test` or `build` script can have side effects. Review `package.json` before running checks in an unfamiliar project.

### Diff output may contain sensitive content

The bridge blocks common sensitive paths and redacts common secret formats, but redaction is not perfect. Review what the repository contains before allowing `get_diff` results to return to ChatGPT.

### Tunnel and account policy still matter

Protect the `CONTROL_PLANE_API_KEY` as a secret. Scope tunnel associations to the intended Platform organization and ChatGPT workspace. Remove the tunnel or revoke the key when it is no longer needed.

### Codespace persistence is not durability

Mission JSON survives ordinary process restarts, but an active worker stops when the Codespace stops. The system does not yet use a durable queue, distributed lock, or independent supervisor.

## Recommended operating environment

- A dedicated GitHub Codespace or disposable development VM.
- A repository-specific identity with no production credentials.
- Branch protection and required human review outside this bridge.
- Explicit organizational approval for both model providers.
- No Microsoft, client, legal, health, financial, export-controlled, or regulated data unless policy expressly authorizes this processing path.
- Routine review of Claude Code CLI changes and this bridge's permission settings.

## Incident response

When behavior is unexpected:

1. Stop `tunnel-client`.
2. Stop any Claude process you can identify.
3. Do not run cleanup commands through the agent.
4. Inspect `git status`, `git diff`, the current branch, and `git log` manually.
5. Review `.orchestrator/missions` and `.orchestrator/jobs`.
6. Rotate the tunnel runtime key when exposure is possible.
7. Preserve logs and state before making corrective changes.
