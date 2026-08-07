---
description: Draft a new mission — Mission Control decides, Mission Author contracts, the critic attacks it, Acceptance Engineer writes the failing tests
---
Run the mission intake for: $ARGUMENTS

1. Delegate to `atlas-auditor` first if the premise depends on repository facts you have not verified in this session. If the audit returns a PREMISE CHALLENGE, stop and surface it before anything else. A mission whose premise an audit disproves goes to `invalidated_by_audit`, not forward.
2. Delegate to `atlas-mission-control` to decide priority, class, scope and the acceptance evidence required. If acceptance needs evidence the engineering work cannot produce, it must split the mission.
3. Delegate to `atlas-mission-author` to write the implementation-neutral contract into `.atlas/proposals/`.
4. Run the `atlas-mission-linter` skill and fix anything it flags. This checks the contract's shape.
5. Run the `atlas-criterion-critic` skill on each acceptance criterion. This checks whether the contract has teeth — the linter and the critic fail differently and a draft needs both. Delegate one critic per criterion so the attacks stay independent; a single reviewer holding four criteria in mind grades them relative to each other instead of against the outcome.
   - Hand every non-surviving criterion back to `atlas-mission-author` with the required edit. Do not let the critic rewrite what it is judging.
   - Re-run the critic on the revised criteria. If a criterion fails the same lens twice, stop and escalate: two failed rounds means the disagreement is about what the mission is for, which is not a drafting problem.
6. Report the proposal path, the linter verdict, the per-criterion critique outcome, and the exact command for the human to promote it. Do not attempt promotion yourself — you cannot write `.atlas/missions/`, by design, because a mission declares its own `scope.allowWrite` and a role able to author one could widen its own authority.

Only after promotion and activation: delegate to `atlas-acceptance-engineer`, and do not show it any plan.
