import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runProcess } from "../src/lib/process.mjs";
import { callTool } from "../src/lib/tools.mjs";

async function git(cwd, ...args) {
  return (await runProcess("git", args, { cwd, rejectOnNonZero: true })).stdout.trim();
}

async function createRepo(root, scripts = {}) {
  const repo = path.join(root, "repo");
  await mkdir(repo, { recursive: true });
  await git(repo, "init", "-b", "main");
  await git(repo, "config", "user.name", "Test User");
  await git(repo, "config", "user.email", "test@example.com");
  await writeFile(path.join(repo, "README.md"), "# Test\n");
  await writeFile(path.join(repo, "package.json"), JSON.stringify({ scripts }, null, 2));
  await git(repo, "add", ".");
  await git(repo, "commit", "-m", "initial");
  return repo;
}

async function createFakeClaude(root) {
  const fake = path.join(root, "fake-claude.mjs");
  await writeFile(fake, `#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
const args = process.argv.slice(2);
if (args[0] === "--version") console.log("test");
else if (args[0] === "auth" && args[1] === "status") console.log(JSON.stringify({ loggedIn: true }));
else {
  await writeFile("generated.txt", "generated\\n");
  console.log(JSON.stringify({ structured_output: {
    status: "completed", summary: "done", files_changed: ["generated.txt"],
    checks_run: [], blockers: [], risks: [], recommended_next_step: "review"
  }}));
}
`);
  await chmod(fake, 0o755);
  return fake;
}

async function waitForJob(jobId) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const job = await callTool("wait_for_job", { job_id: jobId, timeout_seconds: 1 });
    if (!["queued", "running"].includes(job.status)) return job;
  }
  throw new Error("Job did not finish");
}

test("worker refuses to execute when the mission branch is not checked out", { timeout: 30_000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "atlas-branch-guard-"));
  const repo = await createRepo(root);
  const fakeClaude = await createFakeClaude(root);
  const old = { home: process.env.ORCH_HOME, claude: process.env.ORCH_CLAUDE_BIN };
  process.env.ORCH_HOME = path.join(root, "state");
  process.env.ORCH_CLAUDE_BIN = fakeClaude;
  try {
    const mission = await callTool("start_mission", { repo_path: repo, goal: "Guard branch" });
    await git(repo, "switch", "main");
    const delegated = await callTool("delegate_to_claude", {
      mission_id: mission.mission_id,
      title: "Do not run",
      objective: "Create generated.txt",
      acceptance_criteria: ["generated.txt exists"],
      checks: ["diff-check"]
    });
    const job = await waitForJob(delegated.job_id);
    assert.equal(job.status, "failed", JSON.stringify(job, null, 2));
    assert.equal(job.error.error, "MISSION_BRANCH_MISMATCH");
  } finally {
    old.home === undefined ? delete process.env.ORCH_HOME : process.env.ORCH_HOME = old.home;
    old.claude === undefined ? delete process.env.ORCH_CLAUDE_BIN : process.env.ORCH_CLAUDE_BIN = old.claude;
  }
});

test("failed verification marks the job and task failed without requiring a human gate", { timeout: 30_000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "atlas-check-guard-"));
  const repo = await createRepo(root, { test: "node -e \"process.exit(1)\"" });
  const fakeClaude = await createFakeClaude(root);
  const old = { home: process.env.ORCH_HOME, claude: process.env.ORCH_CLAUDE_BIN };
  process.env.ORCH_HOME = path.join(root, "state");
  process.env.ORCH_CLAUDE_BIN = fakeClaude;
  try {
    const mission = await callTool("start_mission", { repo_path: repo, goal: "Fail checks" });
    const delegated = await callTool("delegate_to_claude", {
      mission_id: mission.mission_id,
      title: "Create file",
      objective: "Create generated.txt",
      acceptance_criteria: ["generated.txt exists"],
      checks: ["test"]
    });
    const job = await waitForJob(delegated.job_id);
    assert.equal(job.status, "failed", JSON.stringify(job, null, 2));
    assert.equal(job.error.code, "CHECKS_FAILED");
    const status = await callTool("get_mission", { mission_id: mission.mission_id });
    assert.equal(status.status, "active");
    assert.equal(status.pendingGate, null);
    assert.equal(status.tasks[0].status, "failed");
    assert.equal(status.tasks[0].error.code, "CHECKS_FAILED");
  } finally {
    old.home === undefined ? delete process.env.ORCH_HOME : process.env.ORCH_HOME = old.home;
    old.claude === undefined ? delete process.env.ORCH_CLAUDE_BIN : process.env.ORCH_CLAUDE_BIN = old.claude;
  }
});
