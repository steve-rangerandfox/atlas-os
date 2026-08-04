---
description: Draft a new mission — Mission Control decides, Mission Author contracts, Acceptance Engineer writes the failing tests
---
Run the mission intake for: $ARGUMENTS

1. Delegate to `atlas-auditor` first if the premise depends on repository facts you have not verified in this session. If the audit returns a PREMISE CHALLENGE, stop and surface it before anything else.
2. Delegate to `atlas-mission-control` to decide priority, class, scope and the acceptance evidence required. If acceptance needs evidence the engineering work cannot produce, it must split the mission.
3. Delegate to `atlas-mission-author` to write the implementation-neutral contract into `.atlas/proposals/`.
4. Run the `atlas-mission-linter` skill and fix anything it flags.
5. Report the proposal path and the exact command for the human to promote it. Do not attempt promotion yourself — you cannot write `.atlas/missions/`, by design.

Only after promotion and activation: delegate to `atlas-acceptance-engineer`, and do not show it any plan.
