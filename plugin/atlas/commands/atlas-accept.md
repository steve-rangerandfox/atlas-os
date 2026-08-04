---
description: Prepare an acceptance decision packet for the human (does not accept — that is a human CLI action)
---
Prepare the acceptance packet for the active mission.

Report, in this order and nothing else:
1. **Outcome claimed** — the mission's stated outcome, verbatim.
2. **Per criterion** — id, criterion, the acceptance test, and its status *as observed by a validation run at the current HEAD*. Never report a status you did not observe.
3. **Evidence** — commands run, exit codes, the HEAD they ran at, and log paths.
4. **What is unproven** — every criterion not green, and what would prove it.
5. **Remaining gate** — merge, release, or evidence, and who holds it.
6. **Recommendation** — with 2–4 discrete options and a default.

Then print the human command: `node "${CLAUDE_PLUGIN_ROOT}/scripts/atlas.mjs" accept <id> --note "..."`.

You cannot accept. Acceptance is a human decision recorded outside your tool surface, and the CLI will refuse if any criterion is not green.
