# Build Report

Build date: 2026-08-03
Version: 0.5.0 — Certified Autonomous Worker

## Delivered

- Durable project-specific readiness profiles with seeded `relay-development`, `relay-validation`, and `relay-release` templates.
- Exact Node.js and optional package-manager version checks.
- Claude Code/Codex executable and authentication checks.
- Controller/executor same-provider policy certification.
- Profile-allowlisted HTTPS reachability, repository-local writable cache, lockfile restore capability, Playwright/browser, Git, upstream, and artifact-writing checks.
- Persisted certification evidence without changing existing project, mission, handoff, or branch identity.
- Fresh-certification enforcement for project-linked executor and verification jobs, bound to the exact mission branch and base commit.
- Deny-by-default standing authorization for five fixed local operations: runtime/cache setup, lockfile restore, network checks, artifact generation, and worker recovery.
- No arbitrary command input and no authorization path for secrets, production writes, publication, deployment, or external communication.
- Fixed immutable/frozen dependency restore commands with lifecycle scripts disabled by default.
- Durable worker launch metadata, heartbeat, attempt count, safe pending-job reconciliation, and an optional local supervisor loop.
- Automatic restart only for safe queued/check jobs with intact branch and HEAD invariants.
- Human gate for interrupted executor jobs or Git invariant changes.
- `atlas run <project>` equivalent through `node src/cli.mjs run <project> [--profile <name>]` and the `run_project` MCP tool.
- Controller installation that persists required allowlisted non-secret `ORCH_*` variables for both Codex and Claude registrations.
- Compatibility fix for canonicalizing macOS `/tmp` repository paths with `realpath`.
- Updated controller, executor, security, adoption, architecture, and operating documentation.

## Compatibility and migration

- The global index remains schema version 2.
- Existing repository-local project, mission, and job JSON remains readable.
- Re-adopting a 0.4 project preserves events, decisions, artifacts, mission links, branch attachment, and job history while initializing missing 0.5 project fields.
- Old jobs without launch metadata are treated as attempt zero and reconciled conservatively.
- Existing coding missions and governance-mode missions retain their previous state transitions.
- Controller sessions must be restarted after reinstalling the MCP entries so the 0.5 tool catalog and persisted environment are loaded.

## Verification contract

```text
npm test
  16 tests passing

npm run smoke
  MCP initialization
  27 tools discovered

node --check src/mcp-server.mjs
node --check src/worker.mjs
node --check src/supervisor.mjs
node --check src/lib/certification-tools.mjs
node --check src/lib/readiness.mjs
node --check src/lib/supervisor.mjs
node --check src/lib/tools.mjs
node --check src/lib/project-tools.mjs
node --check src/lib/state.mjs
node --check src/lib/git.mjs
node --check src/lib/controller.mjs
bash -n scripts/install-local.sh
bash -n scripts/install-controllers.sh
bash -n scripts/atlas-controller
```

The automated suite covers exact profile certification, default-denied authorization, authorized artifact and dependency operations, the one-command CLI, interrupted-executor recovery, persisted controller MCP environment, both executor adapters, mission branch/HEAD guards, failed checks, MCP discovery, handoff adoption, branch attachment, diff safety, redaction, and task request blocking.

## Remaining local-first limits

- Runtime setup validates the pinned runtime already provisioned by the worker image; it does not download or compile Node.js.
- Browser availability is certified, but browser installation remains an image/bootstrap responsibility.
- HTTPS probes prove current reachability only. Codex executor sandbox networking remains disabled; network certification does not grant open-ended executor access.
- Dependency restore runs repository-controlled package-manager behavior with scripts disabled by default. Package manager defects and lockfile contents remain outside Atlas's security boundary.
- Worker recovery depends on one filesystem and local process IDs. It is not a hosted queue, distributed lease, or multi-machine failover system.
- An interrupted executor is never auto-replayed because partial edits cannot be proven idempotent.
- Project events and certifications are local audit records, not cryptographically signed attestations.
- There is still no hosted approval dashboard, isolated worktree pool, automatic pull request, merge, deployment, or release flow.
