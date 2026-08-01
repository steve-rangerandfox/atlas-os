import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runProcess } from "../src/lib/process.mjs";
import { callTool } from "../src/lib/tools.mjs";

async function git(cwd, ...args) {
  return (await runProcess("git", args, { cwd, rejectOnNonZero: true })).stdout.trim();
}

test("mission completes a background Codex delegation", { timeout: 30_000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "atlas-codex-test-"));
  const repo = path.join(root, "repo");
  await mkdir(repo, { recursive: true });
  await git(repo, "init", "-b", "main");
  await git(repo, "config", "user.name", "Test User");
  await git(repo, "config", "user.email", "test@example.com");
  await writeFile(path.join(repo, "README.md"), "# Test\n");
  await git(repo, "add", "."); await git(repo, "commit", "-m", "initial");
  const fake = path.join(root, "fake-codex.mjs");
  await writeFile(fake, `#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
const a=process.argv.slice(2);
if(a[0]==="--version") console.log("codex-cli 1.0-test");
else if(a[0]==="login"&&a[1]==="status") console.log("Logged in");
else { const o=a[a.indexOf("--output-last-message")+1]; await writeFile("codex.txt","created by fake Codex\\n"); await writeFile(o, JSON.stringify({status:"completed",summary:"Created codex.txt",files_changed:["codex.txt"],checks_run:[],blockers:[],risks:[],recommended_next_step:"Review diff"})); console.log(JSON.stringify({type:"turn.completed"})); }
`);
  await chmod(fake, 0o755);
  const old = { home: process.env.ORCH_HOME, codex: process.env.ORCH_CODEX_BIN };
  process.env.ORCH_HOME = path.join(root, "state"); process.env.ORCH_CODEX_BIN = fake;
  try {
    const mission = await callTool("start_mission", { repo_path: repo, goal: "Codex test" });
    const delegated = await callTool("delegate_to_codex", { mission_id: mission.mission_id, title: "Add file", objective: "Create codex.txt", acceptance_criteria: ["codex.txt exists"], checks: ["diff-check"] });
    let job;
    for(let i=0;i<40;i++){ job=await callTool("wait_for_job",{job_id:delegated.job_id,timeout_seconds:1}); if(!["queued","running"].includes(job.status)) break; }
    assert.equal(job.status,"succeeded",JSON.stringify(job,null,2));
    assert.equal(await readFile(path.join(repo,"codex.txt"),"utf8"),"created by fake Codex\n");
    const status=await callTool("get_mission",{mission_id:mission.mission_id});
    assert.equal(status.tasks[0].executor,"codex");
  } finally {
    old.home === undefined ? delete process.env.ORCH_HOME : process.env.ORCH_HOME=old.home;
    old.codex === undefined ? delete process.env.ORCH_CODEX_BIN : process.env.ORCH_CODEX_BIN=old.codex;
  }
});
