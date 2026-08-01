# Atlas OS Integration Boundary

This package is a non-normative reference implementation of an Atlas-controlled engineering workflow. It does not redefine the Atlas OS Specification.

Atlas OS remains the canonical source for System, State, Change, Governance, Change Control, Assurance, Context and Projection, and Integration responsibilities. Product repositories remain authoritative for their own implementation reality.

Recommended repository arrangement:

- `atlas-os`: normative specification, ADRs, integration contracts, and non-normative reference documentation.
- this package: deployable MCP orchestration service.
- product repositories: local `CLAUDE.md` or `AGENTS.md`, validation commands, architecture, and mission changes.

One running orchestrator may register and operate across many product repositories. Each mission is bound to exactly one repository and one branch, while an executor is selected per task.
