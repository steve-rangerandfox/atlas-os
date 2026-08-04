# Atlas runbook — the steps only you can do

An agent cannot configure GitHub, push a container image, or install a plugin. These sections are yours.

**Order matters and is not negotiable.** Every step below was validated during Relay's adoption; the sequence exists because doing it in the obvious order deadlocks the repository. Read §0 first.

Substitute `OWNER/REPO` for your project.

---

## 0. Why the order is what it is

Two facts about GitHub drive everything:

1. **You cannot approve a pull request you authored.** With `bypass_actors: []` and one required approval, any PR under your own account is permanently unmergeable. That is the gate working — nobody approves their own work — but it means the *adoption* PR must merge **before** the ruleset exists, and all agent work afterwards must be authored by a different identity (§6).
2. **A required status check pointing at a job that cannot run blocks everything.** `atlas-validate` runs inside the certified image. Until that image exists and is pinned the check fails — and it fails on the very PR containing the workflow needed to build it.

So: **adopt → merge → build image → pin → confirm green → *then* gates.** Creating the ruleset early feels safer and is strictly worse.

---

## 1. Install the plugin

```bash
/plugin marketplace add OWNER/atlas-os
/plugin install atlas@atlas-os
```

Verify `/agents` lists the seven `atlas-*` roles and `/hooks` shows the `PreToolUse` entry. Then prove the gate fires — an unverified control is not a control:

```bash
bash "$CLAUDE_PLUGIN_ROOT/hooks/atlas-guard.test.sh"    # expect: passed=46 failed=0
```

In a session, ask an agent to run `git push` and confirm `ATLAS POLICY DENIED [forbidden-effect]`.

**Do not install the plugin into a repo you are still adopting.** Once `.atlas/project.json` exists the guard denies `git push` and writes to `.atlas/**` and `.devcontainer/**` — the adoption steps themselves. Adopt first, install second.

---

## 2. Authenticate with the right scopes

```bash
gh auth login --hostname github.com --git-protocol https --web --scopes "repo,workflow"
```

**`workflow` is not optional.** Adoption adds root-level `.github/workflows/` files and GitHub rejects any push containing workflow changes without it. `repo` covers rulesets, Actions settings and environments on user-owned repos. `admin:repo_hook` is *not* needed.

---

## 3. Adopt, merge, build, pin — in that order

1. `/atlas-adopt` in the target repo. Review the generated diff.
2. Push the branch, open a PR, **merge it yourself.** No ruleset exists yet, so you can. `atlas-validate` will be **red** on this PR because the image does not exist. Merge anyway.
3. The merge changes `.devcontainer/Dockerfile` and `package.json`, both in `atlas-devimage.yml`'s `on.push.paths`, so **the image build fires automatically.** Do not use `workflow_dispatch` — it requires the workflow to already be on the default branch.
4. Read the `sha256:` digest from that run, then verify it independently:
   ```bash
   curl -sI "https://ghcr.io/v2/OWNER/REPO-dev/manifests/sha256:<digest>" | grep -i docker-content-digest
   ```
   A 200 without credentials also proves the package is **public**, which decides whether fork-based agent access stays viable.
5. **Replace every occurrence of the placeholder — there are more than you expect.** In Relay: four occurrences across three files.
   - `.devcontainer/devcontainer.json` → `image`
   - `.atlas/project.json` → `runtime.image`
   - `.github/workflows/atlas-validate.yml` → `container.image` **and again inside the evidence-record heredoc**

   Assert none remain before committing:
   ```bash
   grep -rn "lock-PENDING" .devcontainer .atlas .github    # expect zero
   ```
   A missed `container.image` fails loudly. A missed one in the evidence record writes a record naming an image the job never used — a false record rather than a visible failure, which is worse in a system whose premise is evidence over narrative.
6. Push to `main` directly. It is the last time that is possible.
7. **Confirm `atlas-validate` is green on `main`.** Do not proceed to any gate until it is. A working image with no required check beats a ruleset deadlocking the repo.

---

## 4. Close the self-approval path

```bash
gh api -X PUT "repos/OWNER/REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
```

**The permission that lets an identity open a pull request also lets it approve one.** Prefer `contents: write` only for agent tokens, letting a `GITHUB_TOKEN` workflow open the PR. Where API-driven PR creation genuinely needs `pull_requests: write`, the CODEOWNERS catch-all in §5 is what makes it safe.

---

## 5. The merge gate

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
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash", "merge"]
      } },
    { "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [ { "context": "atlas-validate" } ]
      } }
  ]
}
JSON
```

Read it back rather than trusting the write:

```bash
gh api repos/OWNER/REPO/rulesets --jq '.[] | select(.name=="atlas-main") | .bypass_actors | length'
```

`bypass_actors: []` is load-bearing. One entry collapses the model — and never add *yourself*, because a Routine runs as your identity, so a bypass for you is a bypass for every scheduled agent run.

**Do not add a `file_path_restriction` rule.** It is a *push*-ruleset rule, and push rulesets are unavailable on user-owned repositories. `CODEOWNERS` covers `.github/**` instead, which is why adoption ships one.

**`CODEOWNERS` must begin with a catch-all.** It resolves last-match-wins, so `* @OWNER` goes on line 1, above the specific patterns. With `require_code_owner_review: true` this makes your approval the only one that can satisfy the gate — so a machine account holding `pull_requests: write` can open PRs while its approvals satisfy nothing.

**Do the same for `atlas-os` itself.** It holds the guard that decides what every adopted project may do, so an unreviewed commit there weakens the boundary everywhere at once. Add a `CODEOWNERS` entry for `plugin/atlas/hooks/**`. No status check — nothing to gate on yet.

---

## 6. The release gate and the agent identity

**Release gate** (public repos, free on Pro; Enterprise Cloud on private): Settings → Environments → New → `production`. Required reviewers: yourself. Prevent self-review: on. Deployment branches: protected only.

Reviewers here can only be **users or teams** — an app cannot be listed at all, which is what makes this gate un-forgeable. Never list a machine account: `prevent_self_review` constrains the deployer, not the reviewer, so a machine reviewer would forge the release gate outright.

**Agent identity.** Agent work must be authored by someone who is not you, or you can never approve it. Create a machine account (`OWNER-atlas`), 2FA on, added as a **Write** collaborator — not Admin, which could edit rulesets. Mint a fine-grained PAT *owned by that account*, scoped to only these repos:

| Permission | Setting |
|---|---|
| Metadata | Read |
| Contents | Read and write |
| Pull requests | Read and write |
| Actions | Read |
| Administration, Workflows, Environments, Secrets | **No access** |

`Workflows: No access` means GitHub rejects any push touching `.github/workflows/**` — the agent cannot edit the CI that verifies it.

Plan around two consequences. **Routines act as your GitHub identity**, so a Routine-authored PR is unmergeable by you; scheduled work must run under the machine token — the GitHub Action or a session configured with that PAT, not a Routine. And `require_last_push_approval` means pushing a fixup onto a machine-authored PR invalidates your own approval, so let the agent push fixups.

---

## 7. Telemetry

```json
// .claude/settings.json
{ "env": { "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
           "OTEL_METRICS_EXPORTER": "otlp",
           "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4317" } }
```

A local collector is fine. You need the trend, not a dashboard — specifically human interventions per accepted mission, the only real evidence any of this is working. Every mission run before this is data destroyed.

---

## Checklist

- [ ] Plugin installed; guard suite 46/46; a deliberate `git push` denied in-session
- [ ] `gh` authenticated with `repo,workflow`
- [ ] Adoption PR **merged** (before any ruleset)
- [ ] Dev image built; digest verified against the registry; **zero** placeholder occurrences remain
- [ ] `atlas-validate` **green on the default branch**
- [ ] Actions cannot create or approve PRs
- [ ] Ruleset active, `bypass_actors` read back as `0`
- [ ] `CODEOWNERS` starts with a catch-all
- [ ] `atlas-os` gated too
- [ ] `production` environment with required reviewers + prevent self-review
- [ ] Machine account created, Write collaborator, PAT with no Administration or Workflows
- [ ] Telemetry exporting
- [ ] `node scripts/atlas.mjs status` reports both gates configured
