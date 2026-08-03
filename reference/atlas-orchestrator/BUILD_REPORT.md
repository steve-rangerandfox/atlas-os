# Build Report

Build date: 2026-08-03
Version: 0.4.0

## Delivered

- Zero-dependency Node.js stdio MCP server with twenty-one purpose-built tools.
- Durable project-level state independent of coding branches.
- Repository-local handoff identity using path, byte count, modification time, and SHA-256.
- Idempotent project adoption by repository.
- Auditable project decisions, evidence, blockers, artifacts, routing events, and notes.
- Adoption of already-approved missions in non-executable governance mode.
- Exact existing-branch attachment without creating, switching, resetting, committing, or pushing Git state.
- Original-base ancestry validation and committed base-to-head diff retrieval.
- Worker refusal when an adopted mission has not attached an execution branch.
- Multi-project coding-mission state with clean-tree enforcement and dedicated branches for brand-new missions.
- Interchangeable Claude Code and OpenAI Codex executors.
- Detached executor workers with structured reports and named verification checks.
- Branch and Git HEAD invariants before and after executor work.
- Persistent project/mission/job JSON with atomic writes and filesystem locks.
- Secret-path blocking, output redaction, request scanning, and human approval gates.
- Local Codex controller profile using a read-only controller sandbox.
- Local Claude Code controller profile using Plan mode.
- Controller instructions that distinguish read-only inspection from Atlas-only modification.
- Controller/executor same-provider collision prevention with an explicit opt-in override.
- GitHub Actions validation for tests, MCP smoke checks, JavaScript syntax, and shell syntax.

## Verification contract

The release is validated with:

```text
npm test

npm run smoke
  MCP initialization
  21 tools discovered

node --check src/mcp-server.mjs
node --check src/worker.mjs
node --check src/lib/tools.mjs
node --check src/lib/project-tools.mjs
node --check src/lib/state.mjs
node --check src/lib/git.mjs
node --check src/lib/controller.mjs
bash -n scripts/install-local.sh
bash -n scripts/install-controllers.sh
bash -n scripts/atlas-controller
```

The automated tests use temporary Git repositories and fake Claude/Codex executables. In addition to the 0.3 coding loop, they verify:

- a governing handoff can be adopted without changing the current branch;
- repeated adoption refreshes one project record rather than creating duplicates;
- project-level decisions persist before an execution branch exists;
- an approved mission can be represented in governance mode;
- governance mode cannot execute workers or checks;
- an exact existing branch can be attached only when clean and already checked out;
- an expected branch head is enforced;
- an original base must be an ancestor of the attached head;
- committed base-to-head evidence can be inspected without publication.

## Live integration status

The Relay controller exercise proved that Atlas 0.3 could audit a handoff and route roles safely, but exposed a state-model gap: project adoption and Mission Control decisions existed only in the controller conversation because the only persistent primitive was a branch-creating coding mission.

Version 0.4 closes that gap. The next live validation is:

1. restart the local controller against 0.4;
2. adopt the Relay handoff with `adopt_project`;
3. adopt the approved External Write Authorization Boundary mission with `adopt_mission`;
4. record the superseding Work Package A target decision with `record_project_event`;
5. verify the project can resume after a controller restart;
6. keep Work Package E in governance mode until its exact existing branch or review artifact is recovered.

## Known MVP limits

- A stopped Codespace stops active workers and local controller sessions.
- A job may remain recorded as `running` after a hard machine stop; inspect Git state before re-delegating.
- Project events are an append-only local audit aid, not a cryptographically signed governance ledger.
- Controller modes and MCP configuration reduce accidental direct edits but are not a hardened isolation boundary.
- Secret detection and command blocking are pattern based.
- Package scripts are repository-controlled executable code.
- Existing-branch attachment requires that another approved local procedure has already checked out the branch.
- Atlas does not recover an unavailable local branch or fabricate a replacement implementation.
- There is no hosted approval dashboard, durable queue, isolated worktree pool, GitHub App, or automated pull-request flow yet.
