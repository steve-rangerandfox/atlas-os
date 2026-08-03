import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { projectToolHandlers } from "../src/lib/project-tools.mjs";
import { runProcess } from "../src/lib/process.mjs";

async function git(cwd, ...args) {
  return (await runProcess("git", args, { cwd, rejectOnNonZero: true })).stdout.trim();
}

test("project handoff and approved mission are adopted without creating a branch", { timeout: 30_000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "atlas-project-adoption-"));
  const repo = path.join(root, "repo");
  await mkdir(repo, { recursive: true });
  await git(repo, "init", "-b", "main");
  await git(repo, "config", "user.name", "Test User");
  await git(repo, "config", "user.email", "test@example.com");
  await writeFile(path.join(repo, "README.md"), "# Relay\n");
  await writeFile(path.join(repo, "Relay Atlas Controller Handoff.md"), "# Relay handoff\n\nActive mission: Boundary\n");
  await git(repo, "add", ".");
  await git(repo, "commit", "-m", "initial");
  const initialCommit = await git(repo, "rev-parse", "HEAD");

  const oldHome = process.env.ORCH_HOME;
  process.env.ORCH_HOME = path.join(root, "state");
  try {
    const adopted = await projectToolHandlers.adopt_project({
      repo_path: repo,
      name: "Relay",
      handoff_path: "Relay Atlas Controller Handoff.md",
      active_mission: "External Write Authorization Boundary",
      current_role: "Engineering Director",
      authorized_lanes: ["Work Package A evidence", "Work Package E correction"],
      blockers: ["Missing Work Package E branch"],
      next_action: "Recover the existing branch"
    });
    assert.equal(adopted.created, true);
    assert.match(adopted.project.handoff.sha256, /^[0-9a-f]{64}$/);
    assert.equal(await git(repo, "branch", "--show-current"), "main");

    const refreshed = await projectToolHandlers.adopt_project({
      repo_path: repo,
      name: "Relay",
      handoff_path: "Relay Atlas Controller Handoff.md",
      active_mission: "External Write Authorization Boundary",
      current_role: "Engineering Director"
    });
    assert.equal(refreshed.created, false);
    assert.equal(refreshed.project_id, adopted.project_id);

    await projectToolHandlers.record_project_event({
      project_id: adopted.project_id,
      type: "decision",
      title: "Supersede evidence target",
      summary: "Use the verified documentation-only descendant as the evidence target.",
      authority: "Explicit user authorization",
      references: [initialCommit]
    });

    const mission = await projectToolHandlers.adopt_mission({
      project_id: adopted.project_id,
      title: "External Write Authorization Boundary",
      goal: "External writes require explicit action and destination authority.",
      current_role: "Engineering Director",
      authorized_lanes: ["A", "E"]
    });
    assert.equal(mission.mode, "governance");
    assert.equal(mission.status, "governance");
    assert.equal(await git(repo, "branch", "--show-current"), "main");

    const project = await projectToolHandlers.get_project({ project_id: adopted.project_id });
    assert.equal(project.decisions.length, 1);
    assert.equal(project.missions[0].mode, "governance");

    await git(repo, "switch", "-c", "claude/wp-e-non-api-media-boundary");
    await writeFile(path.join(repo, "implementation.txt"), "existing branch work\n");
    await git(repo, "add", "implementation.txt");
    await git(repo, "commit", "-m", "existing branch work");
    const branchHead = await git(repo, "rev-parse", "HEAD");

    const attached = await projectToolHandlers.attach_existing_branch({
      mission_id: mission.mission_id,
      branch_name: "claude/wp-e-non-api-media-boundary",
      expected_head_commit: branchHead,
      original_base_commit: initialCommit
    });
    assert.equal(attached.mode, "coding");
    assert.equal(attached.head_commit, branchHead);
    assert.equal(attached.original_base_commit, initialCommit);

    const diff = await projectToolHandlers.get_branch_diff({ mission_id: mission.mission_id });
    assert.match(diff.committed, /existing branch work/);
    assert.match(diff.committedStat, /implementation\.txt/);
  } finally {
    if (oldHome === undefined) delete process.env.ORCH_HOME;
    else process.env.ORCH_HOME = oldHome;
  }
});
