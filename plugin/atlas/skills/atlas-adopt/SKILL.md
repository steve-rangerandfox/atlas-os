---
name: atlas-adopt
description: Adopt any repository into Atlas governance. Use when setting up Atlas on a new project, or re-running adoption after a toolchain change. Detects the real toolchain from the repo, generates .atlas config, a digest-pinned devcontainer, the validation workflow, CODEOWNERS, and the acceptance-test scaffold.
---

# Adopting a repository into Atlas

Atlas is project-agnostic. Everything project-specific lives in the target repo under `.atlas/`, generated from what the repository actually declares — never from what happens to be installed on the machine you are running on. That distinction is the whole point of this skill: a runtime pin read from `process.version` is not a pin, it is a snapshot of an unverified environment.

## Step 1 — Detect, never assume

Read these and record where each fact came from:

| Fact | Source, in priority order |
|---|---|
| Node version | `.nvmrc` → `.tool-versions` → `package.json:engines.node` → **stop and ask** |
| Package manager | lockfile present (`package-lock.json`→npm, `pnpm-lock.yaml`→pnpm, `yarn.lock`→yarn, `bun.lock*`→bun) → `packageManager` field |
| Browser tier | resolved `@playwright/test` / `puppeteer` version **from the lockfile, not the range** |
| Validation ladder | `package.json` scripts. Look for an existing aggregate script (`release:check`, `ci`, `verify`) — prefer the project's own canonical signal over inventing one |
| Test conventions | read two existing test files: runner, assertion style, bootstrap pattern, whether there is a shared fixture |
| Existing CI | `.github/workflows/*` — extend, do not replace |
| Existing agent guidance | `CLAUDE.md`, `AGENTS.md`, `.claude/` — **append, never clobber.** Quote the current heading list before editing |
| Repo visibility + remote | `git remote get-url origin`; ask the human for visibility if unsure |

If a required fact has no source in the repository, stop and ask. Do not default it.

## Step 2 — Generate

From `templates/`, write into the target repo, filling every `{{TOKEN}}`:

- `.atlas/project.json` — validate against `schemas/project.schema.json`. `runtime.nodeSource` must name where the pin came from.
- `.atlas/missions/`, `.atlas/proposals/`, `.atlas/evidence/`, `.atlas/reports/`, `.atlas/retrospectives/` (with `.gitkeep`).
- `.devcontainer/Dockerfile` + `devcontainer.json` — base on the official Playwright image matching the **resolved** browser version, so browsers and their OS libraries come baked. Pin by digest once built.
- `.github/workflows/atlas-devimage.yml` — build and push the dev image to GHCR when the lockfile or Dockerfile changes; emit the digest.
- `.github/workflows/atlas-validate.yml` — run the ladder in the pinned container. **Every rung is required; a skipped rung fails the job.**
- `.github/CODEOWNERS` — the human owns `.atlas/**`, `tests/acceptance/**`, `.github/**`, and manifests.
- `tests/acceptance/` + README, matching the project's detected test conventions.
- `.claude/settings.json` — deny rules, `defaultMode: plan`, telemetry on.
- `AGENTS.md` — review guidelines for a second-opinion reviewer.
- Append an `## Atlas` section to `CLAUDE.md` pointing at `.atlas/`.

Wire the acceptance tier into the project's own scripts: add a `test:acceptance` script, and add it to the aggregate signal **only** once its invariant tests are green — a red mission contract must not break the default branch.

## Step 3 — Seed the invariant registry

Grep for guarantees the code already enforces structurally (manifest validators, authorization assertions, contract tests). Each becomes an invariant with `status: enforced` and a test path. Each guarantee you can find only in prose becomes `asserted-only`. Do not invent invariants; record what exists.

## Step 4 — Hand back the human steps

You cannot configure GitHub rulesets, push a container image, or install a plugin. Print `RUNBOOK.md` §1–§5 with the project's real values substituted, and stop. Say plainly which steps remain and that Atlas is not enforcing anything until the merge gate exists.

Call out **§2a, the machine account**, explicitly and separately. `require_code_owner_review` and `require_last_push_approval` together mean no single identity can ever merge agent work — a project that completes every other step and skips this one has a merge gate that blocks the workflow it was built to enable, and it fails silently the first time an agent opens a pull request.

## Do not

- Write `.atlas/project.json` values you could not source from the repo.
- Add the acceptance tier to the release gate while it is red.
- Replace an existing CI workflow.
- Clobber `CLAUDE.md` or `AGENTS.md`.
- Claim adoption is complete before the merge gate is configured. Without it, every other control is advisory.
