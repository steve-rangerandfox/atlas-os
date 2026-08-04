---
description: Show the Atlas state of this project — active mission, unproven criteria, gates, invariants
---
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/atlas.mjs" status` and report the output.

Then add what the CLI cannot compute: for each acceptance criterion not `green`, say precisely what is missing and who or what must produce it. If a gate reads `NOT CONFIGURED`, say clearly that Atlas is advisory until it exists.
