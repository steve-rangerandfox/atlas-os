# Atlas

Governance for autonomous engineering. Loose direction in; reviewed, evidenced work out.

Atlas is not an orchestrator. The platform already provides the runtime — hooks that deny below the model, worktree isolation, background agents, pinned sandboxes, telemetry. Atlas provides the part no vendor ships: **who owns which decision, what "done" means, and what evidence counts.**

## Install

```
/plugin marketplace add steve-rangerandfox/atlas-os
/plugin install atlas@atlas-os
```

Then `/atlas-adopt` in any repository, and work through `RUNBOOK.md`.

## The seven roles

| Role | Owns | Cannot |
|---|---|---|
| `atlas-auditor` | Current reality, labelled VERIFIED / EVIDENCE / ASSUMPTION / HYPOTHESIS | Set priority or fix anything |
| `atlas-mission-control` | Priority, class, scope, exclusions, acceptance | Choose files or design mechanisms |
| `atlas-mission-author` | The implementation-neutral contract | Decide implementation |
| `atlas-acceptance-engineer` | Executable acceptance criteria, written **before** implementation | See the plan |
| `atlas-engineering-director` | Architecture, plan, integration readiness | Accept the outcome or release |
| `atlas-implementer` | One bounded task in a declared scope | Widen scope, touch acceptance tests, publish |
| `atlas-reviewer` | Independent falsification | See the implementer's narrative |

## Flow

```
/atlas-mission "..."   → audit → mission-control → mission-author → linter → proposal
   ↓  human: atlas promote && atlas activate
acceptance-engineer (blind) → red tests
   ↓
engineering-director → plan → implementer → validation → director review
   ↓  guarded missions: atlas-reviewer (different model, blind)
/atlas-accept → decision packet
   ↓  human: merge approval, then atlas accept
atlas retro   ← the loop that tells you whether any of this is working
```

## Files it writes into a project

```
.atlas/project.json       policy, gates, runtime pin, invariant registry   (human-owned)
.atlas/missions/*.json    live mission contracts                            (human-promoted)
.atlas/proposals/*.json   agent drafts awaiting promotion
.atlas/evidence/          policy-decisions.jsonl, authority-log.jsonl       (append-only)
.atlas/reports/           audits, plans, reviews
.atlas/retrospectives/    the metrics loop
tests/acceptance/         acceptance-engineer only, guard-enforced
```

## Read next

- `AUTHORITY_MODEL.md` — where enforcement lives, and the honest gaps
- `RUNBOOK.md` — the five human-only setup steps
- `../../CONSTITUTION.md` — the fifteen articles
