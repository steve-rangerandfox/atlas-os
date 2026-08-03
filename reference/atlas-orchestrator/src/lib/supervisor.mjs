import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getConfig } from "./config.mjs";
import { getGitSnapshot } from "./git.mjs";
import { listJobs, loadMission, updateJob, updateMission } from "./state.mjs";
import { nowIso } from "./utils.mjs";

const workerPath = fileURLToPath(new URL("../worker.mjs", import.meta.url));

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

export async function spawnWorker(jobId) {
  const child = spawn(process.execPath, [workerPath, "--job", jobId], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, ORCH_HOME: getConfig().home }
  });
  child.unref();
  await updateJob(jobId, (job) => {
    job.workerPid = child.pid;
    job.workerLaunchedAt = nowIso();
    job.attempts = (job.attempts || 0) + 1;
    return job;
  });
  return child.pid;
}

export async function recoverPendingJobs(repoPath = undefined) {
  const jobs = await listJobs(repoPath);
  const outcomes = [];
  for (const job of jobs.filter((entry) => ["queued", "running"].includes(entry.status))) {
    if (isProcessAlive(job.workerPid)) {
      outcomes.push({ jobId: job.id, action: "already_running", workerPid: job.workerPid });
      continue;
    }
    const mission = await loadMission(job.missionId);
    const git = await getGitSnapshot(mission.repoRoot);
    const invariantSafe = git.branch === mission.branch && git.commit === mission.baseCommit;
    const safeToRestart = invariantSafe && (job.status === "queued" || job.kind === "checks");
    if (safeToRestart && (job.attempts || 0) < 3) {
      const workerPid = await spawnWorker(job.id);
      outcomes.push({ jobId: job.id, action: "restarted", workerPid });
      continue;
    }
    const reason = invariantSafe
      ? "An interrupted executor may have partially edited the repository; human inspection is required before retrying."
      : "Git branch or HEAD no longer matches the mission attachment.";
    await updateJob(job.id, (current) => {
      current.status = "needs_human";
      current.finishedAt = nowIso();
      current.error = { error: "INTERRUPTED_JOB_REQUIRES_REVIEW", message: reason };
      return current;
    });
    await updateMission(job.missionId, (current) => {
      current.status = "waiting_for_human";
      current.pendingGate = { createdAt: nowIso(), reasons: [reason], question: "Inspect Git state and decide whether to retry the bounded task." };
      current.lastError = { error: "INTERRUPTED_JOB_REQUIRES_REVIEW", message: reason };
      return current;
    });
    outcomes.push({ jobId: job.id, action: "needs_human", reason });
  }
  return { inspected: jobs.length, pending: outcomes.length, outcomes, recoveredAt: nowIso() };
}
