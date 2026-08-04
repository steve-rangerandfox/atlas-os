---
description: Adopt this repository into Atlas governance (detects toolchain, generates config, devcontainer, CI, gates)
---
Use the `atlas-adopt` skill to bring this repository under Atlas governance.

Detect every project fact from the repository itself and record its source. Do not default anything you cannot source — stop and ask instead. Append to existing `CLAUDE.md` / `AGENTS.md` rather than replacing them, and extend existing CI rather than replacing it.

Finish by printing the remaining human-only steps with this project's real values substituted, and state plainly that Atlas enforces nothing until the merge gate is configured.
