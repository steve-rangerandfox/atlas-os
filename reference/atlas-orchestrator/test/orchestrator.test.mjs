import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runProcess } from "../src/lib/process.mjs";
import { callTool } from "../src/lib/tools.mjs";

async function git(cwd, ...args) {
  const result = await runProcess("git", args, { cwd, rejectOnNonZero: true });
  return result.stdout.trim();
}

test("mission creates a branch and completes a background Claude delegation", { timeout: 30_000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "orchestrator-test-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "state");
  await mkdir(repo, { recursive: true });
  await git(repo, "init", "-b", "main");
  await git(repo, "config", "user.name", "Test User");
  await git(repo, "config", "user.email", "test@example.com");
  await writeFile(path.join(repo, "README.md"), "# Test repository\n");
  await writeFile(path.join(repo, "package.json"), JSON.stringify({
    scripts: {
      lint: "node -e \"process.exit(0)\"",
      typecheck: "node -e \"process.exit(0)\"",
      test: "node -e \"process.exit(0)\""
    }
  }, null, 2));
  await git(repo, "add", ".");
  await git(repo, "commit", "-m", "initial");

  const fakeClaude = path.join(root, "fake-claude.mjs");
  await writeFile(fakeClaude, `#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
const args = process.argv.slice(2);
if (args[0] === "--version") {
  console.log("2.1.999-test");
} else if (args[0] === "auth" && args[1] === "status") {
  console.log(JSON.stringify({ loggedIn: true, authMethod: "test" }));
} else {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  await writeFile("generated.txt", "created by fake Claude\\n");
  console.log(JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: false,
    session_id: "test-session",
    total_cost_usd: 0,
    structured_output: {
      status: "completed",
      summary: "Created generated.txt",
      files_changed: ["generated.txt"],
      checks_run: [],
      blockers: [],
      risks: [],
      recommended_next_step: "Review the diff"
    }
  }));
}
`);
  await chmod(fakeClaude, 0o755);

  const oldHome = process.env.ORCH_HOME;
  const oldClaude = process.env.ORCH_CLAUDE_BIN;
  process.env.ORCH_HOME = home;
  process.env.ORCH_CLAUDE_BIN = fakeClaude;
  try {
    await writeFile(path.join(repo, "dirty.tmp"), "uncommitted\n");
    await assert.rejects(
      callTool("start_mission", { repo_path: repo, goal: "Should refuse dirty tree" }),
      (error) => error.code === "DIRTY_WORKTREE"
    );
    await unlink(path.join(repo, "dirty.tmp"));

    const started = await callTool("start_mission", {
      repo_path: repo,
      goal: "Create one generated file",
      max_delegations: 3
    });
    assert.match(started.branch, /^orchestrator\//);
    assert.equal(await git(repo, "branch", "--show-current"), started.branch);

    const delegated = await callTool("delegate_to_claude", {
      mission_id: started.mission_id,
      title: "Add generated file",
      objective: "Create generated.txt with a short test message.",
      acceptance_criteria: ["generated.txt exists", "verification checks pass"],
      constraints: ["Do not modify README.md"],
      checks: ["diff-check", "lint", "typecheck", "test"]
    });

    let job;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      job = await callTool("wait_for_job", { job_id: delegated.job_id, timeout_seconds: 1 });
      if (!["queued", "running"].includes(job.status)) break;
    }
    assert.equal(job.status, "succeeded", JSON.stringify(job, null, 2));
    assert.equal(await readFile(path.join(repo, "generated.txt"), "utf8"), "created by fake Claude\n");

    const diff = await callTool("get_diff", { mission_id: started.mission_id });
    assert.match(diff.untrackedPatches[0].patch, /created by fake Claude/);

    const mission = await callTool("get_mission", { mission_id: started.mission_id });
    assert.equal(mission.status, "active");
    assert.equal(mission.tasks[0].status, "completed");
    assert.equal(mission.lastJob.result.checks.passed, true);

    const finished = await callTool("finish_mission", {
      mission_id: started.mission_id,
      summary: "The bounded change is ready for review."
    });
    assert.equal(finished.status, "ready_for_human_review");
    assert.equal(await git(repo, "rev-list", "--count", "HEAD"), "1", "orchestrator must not commit");
  } finally {
    if (oldHome === undefined) delete process.env.ORCH_HOME;
    else process.env.ORCH_HOME = oldHome;
    if (oldClaude === undefined) delete process.env.ORCH_CLAUDE_BIN;
    else process.env.ORCH_CLAUDE_BIN = oldClaude;
  }
});
