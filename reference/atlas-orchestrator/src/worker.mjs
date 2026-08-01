#!/usr/bin/env node
import { getConfig } from "./lib/config.mjs";
import { runChecks } from "./lib/checks.mjs";
import { runClaudeTask } from "./lib/claude.mjs";
import { runCodexTask } from "./lib/codex.mjs";
import { asErrorDetails } from "./lib/errors.mjs";
import { getChangedFiles, getDiffStat, getGitSnapshot } from "./lib/git.mjs";
import { isSensitivePath, redactObject } from "./lib/redact.mjs";
import { loadJob, loadMission, updateJob, updateMission } from "./lib/state.mjs";
import { nowIso } from "./lib/utils.mjs";

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function markTask(missionId, taskId, patch) {
  if (!taskId) return;
  await updateMission(missionId, (mission) => {
    const task = mission.tasks.find((entry) => entry.id === taskId);
    if (task) Object.assign(task, patch);
    return mission;
  });
}

async function main() {
  const jobId = argValue("--job");
  if (!jobId) throw new Error("Missing --job");
  const config = getConfig();
  const job = await loadJob(jobId);
  const mission = await loadMission(job.missionId);

  await updateJob(jobId, (current) => {
    current.status = "running";
    current.startedAt = nowIso();
    return current;
  });
  await markTask(mission.id, job.taskId, { status: "running", startedAt: nowIso() });

  const before = await getGitSnapshot(mission.repoRoot);
  let executorResult = null;
  let checkResult = null;

  try {
    if (job.kind === "executor") {
      const task = mission.tasks.find((entry) => entry.id === job.taskId);
      if (!task) throw new Error(`Task not found: ${job.taskId}`);
      executorResult = task.executor === "codex"
        ? await runCodexTask({ mission, task })
        : await runClaudeTask({ mission, task });
    }

    if (job.kind === "checks" || job.checks.length) {
      checkResult = await runChecks({
        repoRoot: mission.repoRoot,
        workDir: mission.workDir,
        checks: job.checks,
        timeoutMs: config.checkTimeoutMs,
        maxOutputChars: config.maxOutputChars
      });
    }

    const after = await getGitSnapshot(mission.repoRoot);
    const changedFiles = await getChangedFiles(mission.repoRoot);
    const sensitiveChanges = changedFiles.filter((entry) => isSensitivePath(entry.path));
    const branchChanged = after.branch !== mission.branch;
    const headChanged = after.commit !== before.commit;
    const report = executorResult?.report || null;
    const reportNeedsHuman = report && (report.status === "needs_human" || report.status === "blocked" || report.blockers?.length);

    const gateReasons = [];
    if (sensitiveChanges.length) gateReasons.push(`Sensitive files changed: ${sensitiveChanges.map((entry) => entry.path).join(", ")}`);
    if (branchChanged) gateReasons.push(`Current branch changed from ${mission.branch} to ${after.branch}`);
    if (headChanged) gateReasons.push("Git HEAD changed during the task; the orchestrator never authorizes commits.");
    if (reportNeedsHuman) gateReasons.push(...(report.blockers?.length ? report.blockers : [report.summary]));

    const result = redactObject({
      executor: executorResult,
      checks: checkResult,
      git: {
        before,
        after,
        changedFiles,
        diffStat: await getDiffStat(mission.repoRoot)
      },
      gateReasons
    });

    await updateJob(jobId, (current) => {
      current.status = gateReasons.length ? "needs_human" : "succeeded";
      current.finishedAt = nowIso();
      current.result = result;
      return current;
    });

    await updateMission(mission.id, (current) => {
      current.lastJobId = jobId;
      current.lastResult = result;
      current.status = gateReasons.length ? "waiting_for_human" : "active";
      current.pendingGate = gateReasons.length
        ? {
            createdAt: nowIso(),
            reasons: gateReasons,
            question: "Review the reported blocker or safety boundary and record a decision before continuing."
          }
        : null;
      if (job.taskId) {
        const task = current.tasks.find((entry) => entry.id === job.taskId);
        if (task) {
          task.status = gateReasons.length ? "needs_human" : "completed";
          task.finishedAt = nowIso();
          task.report = report;
          task.checks = checkResult;
          task.changedFiles = changedFiles;
        }
      }
      return current;
    });
  } catch (error) {
    const details = redactObject(asErrorDetails(error));
    await updateJob(jobId, (current) => {
      current.status = "failed";
      current.finishedAt = nowIso();
      current.error = details;
      return current;
    });
    await updateMission(mission.id, (current) => {
      current.lastJobId = jobId;
      current.lastError = details;
      current.status = "active";
      if (job.taskId) {
        const task = current.tasks.find((entry) => entry.id === job.taskId);
        if (task) {
          task.status = "failed";
          task.finishedAt = nowIso();
          task.error = details;
        }
      }
      return current;
    });
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
