# Project and Handoff Adoption

Atlas Orchestrator 0.4 separates **project governance state** from **coding-branch execution state**.

This is required for established products whose handoffs already define:

- an approved active mission;
- role routing;
- authorized and inactive lanes;
- decisions and authority boundaries;
- evidence requirements;
- blockers and stop conditions;
- an existing implementation branch that may live outside the current clone.

A controller must not invent a replacement mission or branch merely because Atlas has no previous JSON state.

## State model

```text
Adopted Project
├── governing handoff path + SHA-256
├── active mission title
├── current Atlas role
├── authorized lanes
├── inactive work
├── blockers
├── decisions, evidence, artifacts, and routing events
└── exact next authorized action

Adopted Mission — governance mode
├── approved title and goal
├── project relationship
├── current role and lanes
├── no execution branch
└── executor/check calls blocked

Attached Mission — coding mode
├── exact existing checked-out branch
├── exact attached HEAD
├── original base commit
├── committed base-to-head evidence
└── bounded executor loop enabled
```

## Adopt a project

The controller reads the complete handoff and performs the authorized verification audit first. It then calls:

```json
{
  "name": "adopt_project",
  "arguments": {
    "repo_path": "/workspaces/relay",
    "name": "Relay",
    "handoff_path": "Relay Atlas Controller Handoff.md",
    "status": "waiting_for_human",
    "active_mission": "External Write Authorization Boundary",
    "current_role": "Engineering Director correction and evidence orchestration",
    "authorized_lanes": [
      "Work Package A production-denial evidence",
      "Work Package E isolated pre-integration correction"
    ],
    "inactive_work": [
      "Work Packages B, C, D, and F",
      "Queue Content Preview Thumbnails"
    ],
    "blockers": [
      "Work Package A environment preconditions incomplete",
      "Existing Work Package E branch and review patch unavailable"
    ],
    "summary": "Verified current state and adopted role routing from the governing handoff.",
    "next_action": "Resolve the next explicit Mission Control decision or required artifact."
  }
}
```

`adopt_project` is idempotent by repository. Re-running it refreshes the existing record rather than creating duplicate project state.

The handoff file must:

- be a regular file;
- remain inside the repository;
- not match a blocked sensitive path;
- be no larger than 5 MB.

Atlas stores its repository-relative path, byte count, modification time, and SHA-256. It does not copy the handoff contents into the global index.

## Record project decisions and evidence

Use `record_project_event` for project or Mission Control scope, especially before a coding branch exists.

Supported event types:

- `decision`
- `evidence`
- `blocker`
- `artifact`
- `routing`
- `note`

Example:

```json
{
  "name": "record_project_event",
  "arguments": {
    "project_id": "project_REPLACE_ME",
    "type": "decision",
    "title": "Supersede Work Package A evidence target",
    "summary": "Use the verified documentation-only descendant and matching READY production deployment as the new evidence target.",
    "authority": "Explicit user authorization and Mission Control",
    "references": [
      "d08d8a2abd1d55f8f8c597e73c74602659738d22",
      "dpl_HaPyGFb4ajRqm5FLsfLx5XzrFfia"
    ]
  }
}
```

Use `update_project_state` after a routing change so current blockers and next action remain compact and authoritative. Events preserve history; state fields preserve the current view.

## Adopt an already-approved mission

Use `adopt_mission`, not `start_mission`, when the mission already exists in the handoff:

```json
{
  "name": "adopt_mission",
  "arguments": {
    "project_id": "project_REPLACE_ME",
    "title": "External Write Authorization Boundary",
    "goal": "Relay performs an external write only when the caller has verified, action-specific account, organization, integration, and destination authority.",
    "current_role": "Engineering Director correction and evidence orchestration",
    "authorized_lanes": [
      "Work Package A evidence",
      "Work Package E correction"
    ],
    "constraints": [
      "No merge, deployment, migration, production mutation, or external write",
      "Do not activate inactive work packages"
    ]
  }
}
```

The resulting mission has:

```text
mode: governance
status: governance
branch: null
```

Governance decisions can be recorded, but executor work and checks are blocked until a branch is attached.

## Attach an existing branch

Atlas never switches or creates a branch in this workflow.

A human or approved local procedure first checks out the exact required branch. The working tree must be clean. Then call:

```json
{
  "name": "attach_existing_branch",
  "arguments": {
    "mission_id": "mission_REPLACE_ME",
    "branch_name": "claude/wp-e-non-api-media-boundary",
    "expected_head_commit": "5dafc66",
    "original_base_commit": "30d8a225594d11ceb4996b664c569b8be45c4e4f"
  }
}
```

Atlas verifies:

- the branch is already checked out;
- the tree is clean;
- the head matches when supplied;
- the original base is an ancestor of the head when supplied;
- the mission has no job history that must be resolved first.

After attachment:

```text
mode: coding
status: active
baseCommit: exact attached HEAD
originalBaseCommit: declared original base
branchManaged: false
```

The worker requires the exact branch and attached HEAD before every job. An executor may edit the working tree but may not commit or move HEAD.

## Review an attached branch

Use `get_branch_diff` to retrieve:

- the committed patch from `originalBaseCommit..HEAD`;
- the committed diff stat;
- staged and unstaged changes;
- safe untracked-file state;
- current branch and head evidence.

This supports Engineering Director review of an existing local implementation before any additional correction task is delegated.

## Missing branch behavior

When a handoff requires an existing branch and that branch is unavailable:

- preserve the mission in governance mode;
- record the branch or patch as a blocker;
- do not call `start_mission` as a replacement;
- do not recreate implementation from the handoff;
- request the exact artifact, branch clone, or a new explicit Mission Control decision.

## Restart after upgrading

Codex and Claude Code cache the MCP tool catalog for a controller session. After updating Atlas Orchestrator:

1. exit the active controller;
2. pull the new Atlas version;
3. rerun `bash scripts/install-controllers.sh all --force`;
4. launch a fresh controller session;
5. confirm the new project-adoption tools appear.
