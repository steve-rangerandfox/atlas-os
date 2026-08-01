import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getConfig } from "./config.mjs";
import { createJob, updateJob } from "./state.mjs";
import { nowIso, shortId } from "./utils.mjs";

const workerPath = fileURLToPath(new URL("../worker.mjs", import.meta.url));

export async function launchJob({ mission, kind, taskId = null, checks = [] }) {
  const job = {
    id: `job_${shortId(8)}`,
    missionId: mission.id,
    repoRoot: mission.repoRoot,
    workDir: mission.workDir,
    kind,
    taskId,
    checks,
    status: "queued",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    startedAt: null,
    finishedAt: null,
    workerPid: null,
    result: null,
    error: null
  };
  await createJob(job);

  const child = spawn(process.execPath, [workerPath, "--job", job.id], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, ORCH_HOME: getConfig().home }
  });
  child.unref();

  await updateJob(job.id, (current) => {
    current.workerPid = child.pid;
    return current;
  });

  return { ...job, workerPid: child.pid };
}
