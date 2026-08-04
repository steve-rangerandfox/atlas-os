# DEPRECATED — superseded by `plugin/atlas` (Atlas 1.0)

**Status:** deprecated as of Atlas 1.0. Retained for history. Do not install, do not extend, do not use as a reference for new work.

## Why

This package re-implemented, as a bespoke MCP server, mechanisms that the agent platform now provides as enforced primitives — and the re-implementations carried defects the platform versions do not. The full audit is in the Atlas review documents; the load-bearing findings:

| Defect | Where | Superseded by |
|---|---|---|
| Every human gate was model-clearable. `record_human_decision`, `set_standing_authorization` and `set_readiness_profile` were MCP tools with no attestation, so the controller could clear its own gate and grant itself every authorization | `src/lib/tools.mjs:453`, `src/lib/certification-tools.mjs:49-99` | A GitHub merge approval under a human account, plus `plugin/atlas/scripts/atlas.mjs` — the authority CLI, deliberately off the agent tool surface |
| `run_checks` treated **skipped** as **passed**, so a repo with missing scripts reported verification green | `src/lib/checks.mjs:98` | Required status checks on a CI workflow where every ladder rung is mandatory |
| Executor could rewrite `package.json`, which Atlas then executed on the host with full inherited environment, before any gate was evaluated | `src/lib/checks.mjs:78`, `src/worker.mjs:80` | `PreToolUse` deny on manifests + lockfile/manifest hashing in CI |
| Secret-path denial did not apply to tracked sensitive files in a full `get_diff`; `sk_live_` and short passwords were not redacted | `src/lib/tools.mjs:411`, `src/lib/redact.mjs:4` | Built-in protected paths + `hooks/atlas-guard.mjs` denying secret paths for read and write |
| `.git/**` was not denied to the executor — a git-config/hooks path to host command execution, invisible to `git status` and every gate | `src/lib/claude.mjs:48-71` | Built-in protected paths, plus an explicit guard rule |
| `mission.baseCommit` doubled as "expected HEAD" and never advanced, so any commit permanently bricked the mission | `src/worker.mjs:66` | Separate `links.baseCommit` (immutable) and `links.expectedHead`, advanced via `atlas advance-head` |
| Readiness profiles pinned the Node version from `process.version`, so the runtime check could not fail | `src/lib/readiness.mjs:26` | `runtime.nodeSource` must name a project source (`engines`, `.nvmrc`); adoption refuses to default it |
| Preflight probed the Atlas host, not the executor sandbox — it could not detect the failure that motivated it | `src/lib/readiness.mjs:112,189` | A digest-pinned devcontainer used by both CI and local, so there is one environment to verify |
| Task safety was a regex over English intent, with trivial reproducible bypasses | `src/lib/safety.mjs:14-22` | Effect-side enforcement: `PreToolUse` hard deny on the command, not on the description of it |

## What was kept

The governance content, which was always the valuable part: role and authority separation, mission contracts, scope classification, the artifact model, and the operating philosophy — now in `plugin/atlas/` and `CONSTITUTION.md`.

## If you need something from here

It is in git history. Take the idea, not the implementation, and check it against `plugin/atlas/AUTHORITY_MODEL.md` before reintroducing it.
