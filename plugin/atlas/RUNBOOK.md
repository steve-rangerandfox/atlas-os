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
    { "type": "file_path_restriction",
      "parameters": { "restricted_file_paths": [".github/workflows/**", ".atlas/project.json", ".atlas/missions/**"] } }
  ]
}
JSON
```

`bypass_actors: []` is load-bearing. One app in that list and the whole model collapses.

Then, and this is the single most important token setting: **Settings → Actions → General → Workflow permissions → uncheck "Allow GitHub Actions to create and approve pull requests."** If you give an agent identity its own PAT or App token, grant `contents: write` only — never `pull_requests: write`, because the permission that opens a PR also approves one.

---

## 3. The release gate (public repos, free on Pro)

Settings → Environments → New environment → `production`:

- **Required reviewers:** yourself. Apps cannot be listed here at all — this is the only gate an agent identity structurally cannot appear in.
- **Prevent self-review:** on.
- Deployment branches: protected branches only.

Record it in `.atlas/project.json` → `gates.releaseGate: "github:environment:production"`.

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
- [ ] Ruleset active on the default branch, `bypass_actors` empty
- [ ] Actions cannot create or approve PRs
- [ ] Agent token has `contents: write` only
- [ ] `production` environment with required reviewers + prevent self-review (public repos)
- [ ] Dev image built and **digest**-pinned in devcontainer and `project.json`
- [ ] `atlas-validate` is a required status check
- [ ] Telemetry exporting
- [ ] `node scripts/atlas.mjs status` reports both gates configured
