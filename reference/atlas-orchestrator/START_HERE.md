# Start Here

This is the setup path for a GitHub Codespace with your target repository already checked out.

## 1. Put the bridge outside the target repository

Keep the controller separate from the code it will modify:

```bash
mkdir -p ~/tools
cd ~/tools
unzip /path/to/atlas-orchestrator.zip
cd atlas-orchestrator
```

When this folder is copied rather than unzipped, the only requirement is that its final path is stable. `tunnel-client` will store that absolute command.

## 2. Verify the starter

```bash
npm test
npm run smoke
```

No packages are installed and no network access is needed for these tests.

## 3. Verify Claude Code in the Codespace

```bash
claude --version
claude auth status
```

When authentication is missing:

```bash
claude auth login
```

Then run the bridge readiness check against the project:

```bash
node src/cli.mjs doctor --repo /workspaces/YOUR_REPOSITORY
```

`readyForMission` should be `true`. A dirty Git tree must be cleaned up by you before the first mission; the bridge will not stash or overwrite existing work.

## 4. Create an OpenAI Secure MCP Tunnel

In OpenAI Platform tunnel settings:

1. Create a tunnel and associate it with the Platform organization and ChatGPT workspace that will use it.
2. Copy the `tunnel_id`.
3. Create or obtain a runtime API key for `tunnel-client`.
4. Download the current `tunnel-client` binary from Platform tunnel settings or the official OpenAI release.

Do not put the runtime key in this repository, a prompt, a mission, or shell history. In the Codespace terminal, read it without echoing:

```bash
read -rsp "Tunnel runtime API key: " CONTROL_PLANE_API_KEY
echo
export CONTROL_PLANE_API_KEY
```

Initialize a stdio profile. Replace both placeholders with your actual values and use the bridge's absolute path:

```bash
tunnel-client init \
  --sample sample_mcp_stdio_local \
  --profile claude-orchestrator \
  --tunnel-id tunnel_REPLACE_ME \
  --mcp-command "node /home/codespace/tools/atlas-orchestrator/src/mcp-server.mjs"

tunnel-client doctor --profile claude-orchestrator --explain
tunnel-client run --profile claude-orchestrator
```

Keep that process running. A Codespace that is stopped or deleted cannot accept ChatGPT tool calls.

## 5. Add the private MCP connection to ChatGPT

In ChatGPT:

1. Open **Settings**.
2. Choose **Security and login**.
3. Enable **Developer mode**. Workspace policy may control whether this option is available.
4. Open **ChatGPT Plugins** and select the plus button.
5. Name the connection `Claude Code Orchestrator`.
6. Under **Connection**, choose **Tunnel**.
7. Select the tunnel or enter its `tunnel_id`.
8. Create the connection and confirm that the complete tool catalog is discovered.

For the app description, use:

> A private, human-supervised controller for delegating bounded coding tasks to Claude Code in a Git repository. It creates a mission branch, collects diffs and check results, and stops for human approval before publication or destructive actions.

## 6. Give ChatGPT the controller policy

Use the instructions in [`AGENT_INSTRUCTIONS.md`](AGENT_INSTRUCTIONS.md) as project or conversation instructions. A ready-to-paste version is also in [`examples/chatgpt-controller-instructions.md`](examples/chatgpt-controller-instructions.md).

## 7. Run the first mission

Start a new ChatGPT conversation with the MCP connection enabled and say:

> Use the Claude Code Orchestrator. Run `doctor` on `/workspaces/YOUR_REPOSITORY`. If it is ready, start a mission with the goal: "Add one small, reversible improvement to the empty state and update its tests." Break the mission into the smallest useful task, run one Claude job at a time, inspect the diff and checks after every job, and stop for me at any human gate or final review.

ChatGPT should:

1. call `doctor`;
2. call `start_mission`;
3. delegate one bounded task;
4. poll the job;
5. inspect mission state and the diff;
6. correct or verify;
7. ask you only when a human decision is required;
8. call `finish_mission` when the branch is ready for your review.

It should never ask you to copy Claude's response back into ChatGPT.

## 8. Review and publish manually

When the mission reaches `ready_for_human_review`, inspect the branch yourself:

```bash
cd /workspaces/YOUR_REPOSITORY
git status
git diff
git diff --check
```

You decide whether to revise, discard, commit, push, open a pull request, or deploy. Those actions are intentionally outside the bridge.

## Troubleshooting

### ChatGPT cannot see the tunnel

Check that:

- `tunnel-client run --profile claude-orchestrator` is still running;
- `tunnel-client doctor --profile claude-orchestrator --explain` is healthy;
- the tunnel is associated with the correct ChatGPT workspace;
- your account has tunnel use permission and ChatGPT developer-mode access.

### ChatGPT discovers no tools

Run:

```bash
cd ~/tools/atlas-orchestrator
npm run smoke
```

Then restart `tunnel-client`, refresh the MCP connection metadata in ChatGPT, and confirm that the configured `--mcp-command` points to this copy of `src/mcp-server.mjs`.

### Claude job fails immediately

Run:

```bash
claude doctor
claude auth status
node src/cli.mjs doctor --repo /workspaces/YOUR_REPOSITORY
```

Then inspect the mission from ChatGPT or the local CLI:

```bash
node src/cli.mjs status mission_REPLACE_ME
```

### The mission says the tree is dirty

The bridge refuses to stash, discard, or mix with existing work. Commit, move, or manually stash your work, then start a new mission.

### A job was running when the Codespace stopped

Restart the Codespace and tunnel, then call `run_project` or `recover_pending_jobs`. Atlas restarts only safe queued/check jobs. Interrupted executor work stops at a human gate so you can inspect the Git state before deciding whether to retry.
