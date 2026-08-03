import { createJob } from "./state.mjs";
import { spawnWorker } from "./supervisor.mjs";
import { nowIso, shortId } from "./utils.mjs";

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
    workerLaunchedAt: null,
    heartbeatAt: null,
    attempts: 0,
    result: null,
    error: null
  };
  await createJob(job);

  const workerPid = await spawnWorker(job.id);
  return { ...job, workerPid, attempts: 1 };
}
