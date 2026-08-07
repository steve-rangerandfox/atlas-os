---
name: atlas-criterion-critic
description: Adversarially attack each acceptance criterion in a mission draft before promotion — try to build an implementation that satisfies the criterion while leaving the outcome false. Use after the mission linter passes and before asking a human to promote a proposal, and whenever amending a criterion.
---

# Criterion critic

The mission linter asks whether the contract has the right *shape*. This asks whether it has any
*teeth*. They fail differently and you need both: a mission can pass every Definition of Ready rule and
still be unfalsifiable, because "has an observable" and "has an observable that would actually catch a
wrong implementation" are not the same property.

Run this per criterion, not per mission. Criteria fail independently.

## The stance

You are trying to **refute** the criterion, not to appreciate it. Default to failing a lens when you are
uncertain. A criterion that survives an honest attack is worth more than four that were waved through,
and the cost of a false rejection is one revision round — the cost of a false acceptance is a mission
that reports green while the outcome is false, which is the failure mode Atlas exists to prevent.

Do not soften an attack because the criterion looks reasonable. Reasonable-looking criteria are the
dangerous ones; the obviously bad ones get caught by the linter.

## Lens 1 — falsifiability

**Construct the cheat.** Write the actual code — or name the actual configuration — that satisfies the
criterion literally while leaving the mission's outcome false. Not a description of a hypothetical
loophole. The code.

If you can build it, the lens fails.

This is the whole technique, and it is more demanding than it sounds. Examples of the shape:

- Criterion: *"the guard denies `mcp__Supabase__execute_sql`."*
  Cheat: add that one string to a deny list. Outcome — *no tool reaches an implementer without passing
  the guard* — remains false for every other MCP tool, and for the next server connected. **Fails.**
  The criterion names an instance; the outcome is about a class.
- Criterion: *"the test suite passes."*
  Cheat: delete the failing test. **Fails.** A criterion whose observable is under the implementer's
  control is not an observable, it is a request.
- Criterion: *"no client-side code mints a storage write capability."*
  Cheat: move the call into a file the pattern does not match. **Fails unless** the criterion pins the
  detection surface — which is why a good criterion often has to say how it is checked, not just what
  is true.

When a criterion fails this lens, the fix is almost always to **restate it over the class rather than
the instance**, or to **pin the observable to something the implementer cannot edit** — a test file
another role owns, an external system's response, a CI artifact.

## Lens 2 — observability

Can the stated observable actually be obtained — by whom, with what access, in this repository as it
exists today?

Fails when:

- The observable requires access nobody currently has (a production credential, a paid tier, a
  device that is not connected).
- The observable can only be produced by the implementer, with no independent check. Self-reported
  success is narrative, not evidence.
- The observable is not covered by `evidencePlan`, or is covered by an entry whose `producedBy` is
  `human` or `production_probe` with no named person and no named access. Unresourced evidence is
  precisely how a mission ends up complete-but-unaccepted.
- The observable exists but nothing in the validation ladder ever looks at it.

Cross-check every observable against `evidencePlan` explicitly. A criterion whose evidence is missing
from the plan fails this lens even if the observable itself is perfectly good.

## Lens 3 — scope

Read `scope.allowWrite` against this criterion, in both directions.

- **Too narrow:** satisfying the criterion would require writing outside the allowlist. The guard will
  deny the implementer mid-mission and the mission will stall. Fails.
- **Too wide:** the allowlist grants more than this criterion needs. Fails. Scope is an authority grant,
  and an unnecessary grant is a defect even when nothing exploits it. The test is whether a reviewer
  could tell from `allowWrite` alone whether a given change belongs to this mission.

Both directions matter. Reviewers habitually catch the first and wave through the second.

## Output

Per criterion: the three lenses, each `pass` or `fail` with the reasoning, and for `falsifiability` the
concrete cheat you constructed if you found one. Then a verdict — `survives` only if all three pass —
and, when it does not survive, the **smallest edit** that would fix it.

Do not rewrite the criterion yourself. Report the required edit and hand it back to the authoring role.
A critic that edits the thing it is judging is a rubber stamp with extra steps.

## Stopping rule

If a criterion fails the same lens twice across two revision rounds, stop and escalate to the human.
Two failed rounds means the disagreement is about what the mission is for, and that is not a drafting
problem.
