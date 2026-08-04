# Acceptance tests

Owned by `atlas-acceptance-engineer`. The policy guard denies writes here from every other role, and CODEOWNERS requires the owner's review.

## Why this directory is different

These tests are derived from the **mission contract**, before implementation, by a role that has not seen the plan. That independence is the point. An implementer who can edit the test can make any implementation pass, which is the most common way agentic engineering produces confident wrong answers.

If a criterion turns out to be wrong, that is a **mission amendment** for Mission Control — not a test edit.

## Two kinds of file, kept separate

- `*.invariant.test.js` — properties the system **already holds**. Green forever. A regression here is a build break.
- `*.contract.test.js` — the contract a mission **must establish**. Red until that mission lands. Each file names its mission id at the top.

Contract tests are wired to `npm run test:acceptance` and are deliberately **not** part of the default release signal until they go green — a red mission contract must not block the default branch.

## Conventions

Match the repository's existing test style exactly. Read two neighbouring test files before writing. Assert on observable behaviour and public contracts, never on internals you have guessed at.
