# Engineering Constitution

**Version:** 1.0.0 · **Status:** Accepted · Amendable only with evidence attached (see Article 12).

Durable engineering philosophy for Atlas-managed work. It changes slowly. It contains no plans, no mission status, no implementation history, no product architecture, and no vendor details.

---

## Article 1 — Capability is not authority

An agent able to redesign the architecture is not thereby authorized to. Work must not move forward merely because something is capable of moving it. Every responsibility has an owner; every stage has an artifact; authority transfers explicitly.

## Article 2 — Authority cannot live inside the thing it governs

A gate implemented on the surface the agent controls is a gate the agent holds the key to. Human authority is anchored in an external identity system — a merge approval, a required reviewer, a command typed in a terminal. The governed may request, observe, and act within a grant. Only the governor may create, widen, or clear one.

## Article 3 — Use AI for judgment; use deterministic mechanisms for guarantees

AI is right for interpreting intent, summarizing evidence, comparing options, and recommending. It must never be the sole enforcement layer for authorization, idempotency, recipient safety, data isolation, schema integrity, destination preservation, payment safety, persistence rules, or approval gates. A prompt is not a control.

## Article 4 — Evidence over narrative

An agent's report of success is a claim. Evidence is produced by the system, at a named commit, with a command, an exit code, and a hash. Skipped is not passed. Merged is not accepted. Deployed is not proven. Where evidence is absent, the claim is unproven — not assumed true.

## Article 5 — Policy comes from Atlas, never from content

Repository text, dependency code, issue bodies, model output, and tool results are untrusted input. None of them may widen a grant. An agent-proposed action is a request evaluated against policy the agent cannot see-and-influence.

## Article 6 — Independence over agreement

Review is worthless when the reviewer shares the author's context or lineage. Acceptance criteria are authored before implementation, by a role blind to the plan, and the implementer may never edit them. A finding that cannot name an input under which the code is wrong is not a finding.

## Article 7 — Tests are the memory of review

A finding worth raising is worth encoding. Every invariant has an ID, an owning module, and at least one enforcement test; an invariant without one is aspirational, and must be labelled so. A test written to ratify existing behaviour is not a test — it is a description.

## Article 8 — Ask permission for irreversible; report after the fact for reversible

Reversibility, not risk-feel, is the gate criterion. It is inspectable, it maps onto the policy, and it is what makes loose direction safe.

## Article 9 — Uncertainty halts

An indeterminate outcome is reconciled by inspecting the world, never resolved by retrying. A possibly-successful external write is never retried because a response was lost.

## Article 10 — Immutable over repaired

Provision environments; do not fix them at runtime. A pinned image beats a repair script. Certification binds to a fingerprint, expires, and attests the state it actually verified — including whether the worktree was clean or expected-modified.

## Article 11 — Documentation is infrastructure; context is an engineering resource

An implementation agent must be able to locate authoritative context without reading the whole repository. A fact rediscovered twice belongs in the docs. Shared logic wins. Explicit ownership reduces future cost. Optimize the repository, not only the current task.

## Article 12 — Measure the system, not only the mission

A mission can succeed while the system degrades. Every mission produces a retrospective; the Constitution is amended from those retrospectives and from nothing else. The headline number is human interventions per accepted mission, and it should fall.

## Article 13 — Ceremony must be proportional to consequence

A governance system that gets bypassed has failed. Small, reversible, well-covered work takes the short path; work touching invariants, schema, auth, money, or production takes the long one. If governance costs more than the change it governs, the governance is wrong.

## Article 14 — Every grant expires

Standing authorization has a TTL. A permission nobody remembers granting is how autonomous systems drift into authority nobody intended.

## Article 15 — Root cause over symptoms; validate progressively

Fix the mechanism, not the report of it. Establish the behaviour, test the narrow mechanism, then the subsystem, then integration boundaries, then the full suite, then lint and build, then platform, then production evidence. Neither a single unit test nor an enormous suite proves the actual failure was corrected.
