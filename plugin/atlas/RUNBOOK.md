# Atlas runbook — the steps only you can do

An agent cannot configure GitHub, push a container image, or install a plugin. These five sections are yours. **Until §2 is done, Atlas is advisory.**

Substitute `OWNER/REPO` and paths for your project.

---

## 1. Install the plugin

```bash
# in Claude Code
/plugin marketplace add steve-rangerandfox/atlas-os
/plugin install atlas@atlas-os
```

Verify: `/agents` lists the seven `atlas-*` roles, and `/hooks` shows the `PreToolUse` entry.

Then prove the gate fires — do not skip this, an unverified control is not a control:

```bash
bash "$CLAUDE_PLUGIN_ROOT/hooks/atlas-guard.test.sh"    # expect: passed=46 failed=0
```

In a session, ask an agent to run `git push` and confirm it is denied with `ATLAS POLICY DENIED [forbidden-effect]`.

---

## 2. The merge gate — this is the one that matters

Public repo (`gh` CLI, or Settings → Rules → Rulesets):

```bash
gh api -X POST repos/OWNER/REPO/rulesets --input - <<'JSON'
{
  "name": "atlas-main",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "require_last_push_approval": true,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "required_review_thread_resolution": true
      } },
    { "type": "required_status_checks",
      "parameters": { "strict_required_status_checks_policy": true,
        "required_status_checks": [ { "context": "atlas-validate" } ] } },
  ]
}
JSON
```

**Not included, deliberately:** `file_path_restriction`. It is a *push* ruleset rule, and push rulesets are unavailable on user-owned repositories. Adding it to a branch ruleset is rejected. On a user-owned repo, path protection comes from CODEOWNERS plus required code-owner review.

`bypass_actors: []` is load-bearing. One app in that list and the whole model collapses.

Then: **Settings → Actions → General → Workflow permissions → uncheck "Allow GitHub Actions to create and approve pull requests."** That is about the workflow `GITHUB_TOKEN`, and it should never be able to open or approve a PR.

**Do not generalise that to the machine account.** An earlier version of this runbook said to grant an agent identity `contents: write` only and never `pull_requests: write`. That advice makes the loop impossible: without `pull_requests: write` the machine account cannot open a pull request at all, so agent work can never be proposed. See §2a.

---

## 2a. The machine account — without this, nothing merges

Two rules from §2 compound into a hard deadlock:

- `require_code_owner_review` plus a catch-all `CODEOWNERS` means **only your approval satisfies the gate**.
- `require_last_push_approval` means the most recent push must be approved **by someone other than whoever pushed it**.

If an agent commits with your credentials, the last pusher is you, the approval must come from someone else, and the only person who counts is you. **No single identity can satisfy both rules.**

1. Create a second GitHub account — e.g. `<owner>-atlas` — on its own email.
2. Settings → Collaborators → add with **Write**. Not Admin. **Do not add it to `CODEOWNERS`** — being a non-owner is the entire point.
3. As that account, create a **classic** PAT — not fine-grained:

   **This corrects an earlier version of this runbook, which prescribed a fine-grained token.**
   GitHub's own docs are explicit: *"For collaborator access to another user's repository, you
   must use a personal access token (classic)."* A fine-grained PAT cannot authenticate write
   operations against a personal repo you were added to as a collaborator — only against repos
   the token's own owner controls. This is a platform limit, not a config choice.

   | Scope | Value | Why |
   |---|---|---|
   | `repo` | checked | the only scope classic PATs offer below full account access; grants push + PR read/write on repos this account can reach |
   | `workflow` | **unchecked** | `.github/workflows/**` stays yours — this scope would let the token push changes to CI itself |
   | everything else | unchecked | no admin, no org, no packages, no deletion |

   There is no finer-grained classic equivalent of "PRs yes, workflows no" split — `repo` bundles
   push and PR write together. That coarseness is exactly why `require_code_owner_review` with a
   catch-all-free but still-guarded `CODEOWNERS`, `bypass_actors: []`, and this account **never**
   appearing in `CODEOWNERS` all have to hold simultaneously: the token's breadth is bounded by
   the repo's rules, not by the token's own scope list.

4. Never list this account as a `production` environment reviewer.

**Prove it.** As the machine account, open a one-line PR and confirm you can approve and merge it.

**One consequence.** With `dismiss_stale_reviews_on_push` and `require_last_push_approval` both on, an agent push after your approval discards it. Order: agent finishes → you review once → merge.

---
## 3. The release gate (public repos, free on Pro)

Settings → Environments → New environment → `production`:

- **Required reviewers:** yourself. Apps cannot be listed here at all — this is the only gate an agent identity structurally cannot appear in.
- **Prevent self-review:** on.
- Deployment branches: protected branches only.

Record it in `.atlas/project.json` → `gates.releaseGate` — **but record what is true, not what you configured.**

Environment protection rules only apply to workflow jobs that declare `environment:`. Check first:

```bash
grep -rn "environment:" .github/workflows/ || echo "NOTHING DECLARES IT — the environment is inert"
```

If nothing declares it and your host deploys the default branch automatically (Vercel's and Netlify's Git integrations both do), your merge gate *is* your release gate: record `gates.releaseGate: "github:ruleset:main"`. Writing `github:environment:production` in that case puts a control in the governance file that does not exist.

(On a private repo this is Enterprise Cloud only. The §2 ruleset is then your gate; it is sufficient.)

---

## 4. Build and pin the dev image

```bash
# one-time: let the workflow build it
git push origin HEAD           # triggers .github/workflows/atlas-devimage.yml
gh run watch

# read the digest it printed, then pin it
DIGEST=$(gh api repos/OWNER/REPO/packages/container/REPO-dev/versions --jq '.[0].name' 2>/dev/null)
# or copy from the workflow summary
```

Put the `ghcr.io/OWNER/REPO-dev@sha256:...` digest in **both** `.devcontainer/devcontainer.json` and `.atlas/project.json` → `runtime.image`. Tag-pinning is not hermetic; use the digest.

Verify a fresh Codespace runs the full ladder with zero manual steps. That is the test that retires the Node/npm/Playwright class of failure.

---

## 5. Telemetry and scheduled runs

Telemetry — this starts the metrics loop, and every mission you run without it is data destroyed:

```json
// .claude/settings.json
{ "env": { "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
           "OTEL_METRICS_EXPORTER": "otlp",
           "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4317" } }
```

A local collector is fine to start. You need the trend, not a dashboard.

Scheduled autonomous runs, once §2 is in place:

- Create a Routine (cron, or `pull_request` event) with the prompt: *"Read `.atlas/project.json` and the active mission. Continue it per the Atlas plugin. Stop at any gate."*
- Leave the default push restriction to `claude/*` branches on.
- Remember: a Routine has **no approval prompts by design** and acts as your GitHub identity. The ruleset from §2 is what makes that safe.

---

## Checklist

- [ ] Plugin installed; `atlas-guard.test.sh` passes; a deliberate `git push` is denied in-session
- [ ] `ATLAS_GUARD_FAIL_OPEN` is **unset** (or explicitly `0`) in `.claude/settings.json` — the guard fails CLOSED by default; setting this to `1` is a deliberate, logged opt-out, not something any setup step should do for you
- [ ] A deliberate `cat .env` and `echo x > .atlas/project.json` are BOTH denied in-session — the shell surface is the half that was unenforced
- [ ] Ruleset active on the default branch, `bypass_actors` empty
- [ ] Actions cannot create or approve PRs (the workflow `GITHUB_TOKEN`)
- [ ] Machine account exists, **Write** collaborator, **not** in `CODEOWNERS`
- [ ] Machine account PAT is **classic**, `repo` scope only, `workflow` unchecked — fine-grained PATs cannot get collaborator write access on a personal repo, full stop
- [ ] **Proved** it: a trivial PR opened by the machine account was approved and merged by the owner
- [ ] `production` environment with required reviewers + prevent self-review (public repos)
- [ ] Checked whether any workflow declares `environment:` — if none does, `gates.releaseGate` says so
- [ ] Dev image built and **digest**-pinned in devcontainer and `project.json`
- [ ] `atlas-validate` is a required status check
- [ ] Telemetry exporting
- [ ] `node scripts/atlas.mjs status` reports the gates that actually exist, not the ones you configured
