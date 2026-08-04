---
name: atlas-mission-linter
description: Check a mission draft against the Definition of Ready before it is promoted. Use whenever authoring or amending a mission, and before asking a human to promote a proposal.
---

# Mission linter

Most agentic failure is underspecified-mission failure. This is the cheapest quality gate in Atlas. Run it on any draft in `.atlas/proposals/`.

## Hard failures — the mission is not Ready

1. **No falsifiable premise.** "The system should be better" is not a premise. A premise is a belief an audit could disprove.
2. **A criterion with no observable.** If nothing can be observed to prove it, it cannot be accepted and must not ship. Rewrite or drop it.
3. **No non-goals.** A mission without stated exclusions will expand. At least one.
4. **`scope.allowWrite` missing, or so broad it is decorative.** `src/**` on a mission that touches one module is not a scope. Ask: could a reviewer tell from this whether a change belongs?
5. **Evidence plan does not cover every observable**, or names `producedBy: human` / `production_probe` without saying who and with what access. This is how missions end up "complete but unaccepted" — the evidence was never resourced.
6. **Acceptance depends on evidence the engineering work cannot produce.** Split it: an engineering mission that closes on engineering evidence, plus a linked `type: evidence` mission with its own lifecycle.
7. **No rollback stance** on a `guarded` mission.
8. **Mechanism smuggled into the outcome.** "Add a delivery ledger table" is a design decision wearing an outcome's clothes. Rewrite in terms of what becomes observably true.
9. **Class mismatch.** Touches schema, auth, migrations, external writes, money, or production but is not `guarded`.
10. **No interruption budget.** Without it you cannot tell whether Atlas is getting better or worse at leaving you alone.

## Warnings — proceed, but say so

- More than ~7 acceptance criteria: the mission is probably two missions.
- Implementation not completable in one worker session: it is a work-package tree; make the tree explicit in `dependsOn`.
- No `invariantsAtStake` on a guarded mission: either genuinely none, or the registry is incomplete.
- `expectedDirty` empty on a mission attaching to an existing branch with uncommitted work: certification will not attest the worktree state.

## Output

Per-rule pass/fail with the specific offending field, then a single verdict: `READY` or `NOT READY`. If not ready, list the smallest set of edits that would make it ready. Do not edit the mission to make your own lint pass — report and let the authoring role fix it.
