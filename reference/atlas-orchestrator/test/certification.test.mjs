import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { certificationToolHandlers } from "../src/lib/certification-tools.mjs";
import { projectToolHandlers } from "../src/lib/project-tools.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { createJob, loadJob, loadMission, updateMission } from "../src/lib/state.mjs";
import { recoverPendingJobs } from "../src/lib/supervisor.mjs";
import { callTool } from "../src/lib/tools.mjs";
import { nowIso } from "../src/lib/utils.mjs";

async function git(cwd, ...args) {
  return (await runProcess("git", args, { cwd, rejectOnNonZero: true })).stdout.trim();
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "atlas-certification-"));
  const repo = path.join(root, "repo");
  const bin = path.join(root, "bin");
  await mkdir(repo, { recursive: true });
  await mkdir(bin, { recursive: true });
  await git(repo, "init", "-b", "main");
  await git(repo, "config", "user.name", "Test User");
  await git(repo, "config", "user.email", "test@example.com");
  await writeFile(path.join(repo, "README.md"), "# Relay\n");
  await writeFile(path.join(repo, "handoff.md"), "# Handoff\n");
  await writeFile(path.join(repo, "package.json"), JSON.stringify({ name: "relay-fixture" }));
  await writeFile(path.join(repo, "package-lock.json"), JSON.stringify({ lockfileVersion: 3 }));
  await git(repo, "add", ".");
  await git(repo, "commit", "-m", "initial");

  const npm = path.join(bin, "npm");
  await writeFile(npm, "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then echo 10.9.9; else echo restored; fi\n");
  await chmod(npm, 0o755);
  const claude = path.join(bin, "claude");
  await writeFile(claude, "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then echo 2.1.0; else echo '{\"loggedIn\":true}'; fi\n");
  await chmod(claude, 0o755);
  return { root, repo, bin, claude, home: path.join(root, "state") };
}

function profile() {
  return {
    name: "relay-test",
    runtime: { node: process.version.replace(/^v/, ""), packageManager: "npm", packageManagerVersion: "10.9.9" },
    executor: "claude",
    network: [],
    cachePaths: [".orchestrator/cache/npm"],
    dependencyRestore: { required: true, ignoreLifecycleScripts: true },
    browser: { playwright: false, browserBinary: false },
    git: { clean: true, namedBranch: true },
    artifactDirectory: ".orchestrator/artifacts"
  };
}

test("project readiness profiles certify exact runtimes and enforce standing authorization", { timeout: 30_000 }, async () => {
  const fx = await fixture();
  const old = { home: process.env.ORCH_HOME, path: process.env.PATH, claude: process.env.ORCH_CLAUDE_BIN };
  process.env.ORCH_HOME = fx.home;
  process.env.PATH = `${fx.bin}:${old.path}`;
  process.env.ORCH_CLAUDE_BIN = fx.claude;
  try {
    const adopted = await projectToolHandlers.adopt_project({
      repo_path: fx.repo,
      name: "Relay",
      handoff_path: "handoff.md",
      active_mission: "Certification",
      current_role: "Engineering Director"
    });
    assert.deepEqual(Object.keys(adopted.project.readinessProfiles).sort(), ["relay-development", "relay-release", "relay-validation"]);
    assert.deepEqual(adopted.project.standingAuthorization, {
      runtime_setup: false,
      dependency_restore: false,
      network_policy_check: false,
      artifact_generation: false,
      worker_restart: false
    });

    await assert.rejects(
      certificationToolHandlers.set_readiness_profile({ project_id: adopted.project_id, profile: { ...profile(), name: "../escape" } }),
      /safe identifier/
    );
    await assert.rejects(
      certificationToolHandlers.set_readiness_profile({ project_id: adopted.project_id, profile: { ...profile(), network: ["https://localhost/"] } }),
      /public DNS hostname/
    );

    await certificationToolHandlers.set_readiness_profile({ project_id: adopted.project_id, profile: profile(), make_default: true });
    const report = await certificationToolHandlers.preflight({ project_id: adopted.project_id });
    assert.equal(report.certified, true, JSON.stringify(report, null, 2));
    assert.equal(report.checks.find((entry) => entry.id === "runtime.node").passed, true);

    await assert.rejects(
      certificationToolHandlers.run_environment_operation({ project_id: adopted.project_id, operation: "artifact_generation" }),
      (error) => error.code === "STANDING_AUTHORIZATION_REQUIRED"
    );
    await certificationToolHandlers.set_standing_authorization({ project_id: adopted.project_id, artifact_generation: true, dependency_restore: true });
    const artifact = await certificationToolHandlers.run_environment_operation({ project_id: adopted.project_id, operation: "artifact_generation" });
    assert.equal(artifact.path, ".orchestrator/artifacts/relay-test-certification.json");
    assert.equal(JSON.parse(await readFile(path.join(fx.repo, artifact.path), "utf8")).certified, true);
    const restored = await certificationToolHandlers.run_environment_operation({ project_id: adopted.project_id, operation: "dependency_restore" });
    assert.deepEqual(restored.command, ["npm", "ci", "--ignore-scripts"]);

    const cli = await runProcess(process.execPath, ["src/cli.mjs", "run", adopted.project_id], {
      cwd: path.resolve("."),
      env: { ORCH_HOME: fx.home, ORCH_CLAUDE_BIN: fx.claude, PATH: process.env.PATH },
      rejectOnNonZero: true
    });
    assert.equal(JSON.parse(cli.stdout).certified, true);

    await writeFile(path.join(fx.repo, "mission-change.txt"), "intentional uncommitted mission work\n");
    const dirtyProfile = { ...profile(), name: "relay-dirty", git: { clean: false, namedBranch: true } };
    await certificationToolHandlers.set_readiness_profile({ project_id: adopted.project_id, profile: dirtyProfile });
    const dirtyReport = await certificationToolHandlers.preflight({ project_id: adopted.project_id, profile: "relay-dirty" });
    assert.equal(dirtyReport.certified, true, JSON.stringify(dirtyReport, null, 2));
    assert.equal(dirtyReport.git.clean, false);
  } finally {
    old.home === undefined ? delete process.env.ORCH_HOME : process.env.ORCH_HOME = old.home;
    process.env.PATH = old.path;
    old.claude === undefined ? delete process.env.ORCH_CLAUDE_BIN : process.env.ORCH_CLAUDE_BIN = old.claude;
  }
});

test("recovery stops an interrupted executor for human review", { timeout: 30_000 }, async () => {
  const fx = await fixture();
  const oldHome = process.env.ORCH_HOME;
  process.env.ORCH_HOME = fx.home;
  try {
    const mission = await callTool("start_mission", { repo_path: fx.repo, goal: "Test interrupted recovery" });
    const job = {
      id: "job_interrupted",
      missionId: mission.mission_id,
      repoRoot: fx.repo,
      workDir: fx.repo,
      kind: "executor",
      taskId: null,
      checks: [],
      status: "running",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      startedAt: nowIso(),
      finishedAt: null,
      workerPid: 99999999,
      attempts: 1,
      result: null,
      error: null
    };
    await createJob(job);
    await updateMission(mission.mission_id, (current) => { current.lastJobId = job.id; return current; });
    const recovery = await recoverPendingJobs(fx.repo);
    assert.equal(recovery.outcomes[0].action, "needs_human");
    assert.equal((await loadJob(job.id)).status, "needs_human");
    assert.equal((await loadMission(mission.mission_id)).status, "waiting_for_human");
  } finally {
    oldHome === undefined ? delete process.env.ORCH_HOME : process.env.ORCH_HOME = oldHome;
  }
});

test("recovery restarts a queued bounded checks job", { timeout: 30_000 }, async () => {
  const fx = await fixture();
  const oldHome = process.env.ORCH_HOME;
  process.env.ORCH_HOME = fx.home;
  try {
    const mission = await callTool("start_mission", { repo_path: fx.repo, goal: "Test queued recovery" });
    const job = {
      id: "job_queued_checks",
      missionId: mission.mission_id,
      repoRoot: fx.repo,
      workDir: fx.repo,
      kind: "checks",
      taskId: null,
      checks: ["diff-check"],
      status: "queued",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      startedAt: null,
      finishedAt: null,
      workerPid: null,
      attempts: 0,
      result: null,
      error: null
    };
    await createJob(job);
    await updateMission(mission.mission_id, (current) => { current.lastJobId = job.id; return current; });
    const recovery = await recoverPendingJobs(fx.repo);
    assert.equal(recovery.outcomes[0].action, "restarted");
    let recovered;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      recovered = await loadJob(job.id);
      if (!["queued", "running"].includes(recovered.status)) break;
    }
    assert.equal(recovered.status, "succeeded", JSON.stringify(recovered, null, 2));
    assert.equal(recovered.attempts, 1);
  } finally {
    oldHome === undefined ? delete process.env.ORCH_HOME : process.env.ORCH_HOME = oldHome;
  }
});
