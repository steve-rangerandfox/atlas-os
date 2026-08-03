import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { getConfig } from "./config.mjs";
import { OrchestratorError } from "./errors.mjs";
import { nowIso, readJson, sleep, writeJsonAtomic } from "./utils.mjs";

function stateRoot(repoRoot) {
  return path.join(repoRoot, ".orchestrator");
}

function projectPath(repoRoot, projectId) {
  return path.join(stateRoot(repoRoot), "projects", `${projectId}.json`);
}

function missionPath(repoRoot, missionId) {
  return path.join(stateRoot(repoRoot), "missions", `${missionId}.json`);
}

function jobPath(repoRoot, jobId) {
  return path.join(stateRoot(repoRoot), "jobs", `${jobId}.json`);
}

function indexPath() {
  return path.join(getConfig().home, "index.json");
}

function normalizeIndex(value = {}) {
  return {
    version: 2,
    projects: value.projects || {},
    missions: value.missions || {},
    jobs: value.jobs || {}
  };
}

async function acquireLock(targetPath, timeoutMs = 8_000) {
  const lockPath = `${targetPath}.lock`;
  const started = Date.now();
  while (true) {
    try {
      await mkdir(lockPath, { recursive: false });
      return async () => {
        await rm(lockPath, { recursive: true, force: true });
      };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        const info = await stat(lockPath);
        if (Date.now() - info.mtimeMs > 60_000) {
          await rm(lockPath, { recursive: true, force: true });
          continue;
        }
      } catch {}
      if (Date.now() - started > timeoutMs) {
        throw new OrchestratorError("State is busy; retry the tool call", "STATE_LOCK_TIMEOUT");
      }
      await sleep(50 + Math.floor(Math.random() * 100));
    }
  }
}

async function updateJsonLocked(filePath, fallback, updater) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const release = await acquireLock(filePath);
  try {
    const current = await readJson(filePath, fallback);
    const next = await updater(current);
    await writeJsonAtomic(filePath, next);
    return next;
  } finally {
    await release();
  }
}

async function readIndex() {
  return normalizeIndex(await readJson(indexPath(), normalizeIndex()));
}

async function updateIndex(updater) {
  return await updateJsonLocked(indexPath(), normalizeIndex(), async (current) => {
    const next = await updater(normalizeIndex(current));
    return normalizeIndex(next);
  });
}

export async function registerProject(project) {
  await mkdir(path.dirname(projectPath(project.repoRoot, project.id)), { recursive: true });
  await writeJsonAtomic(projectPath(project.repoRoot, project.id), project);
  await updateIndex((index) => {
    index.projects[project.id] = {
      repoRoot: project.repoRoot,
      workDir: project.workDir,
      createdAt: project.createdAt,
      name: project.name
    };
    return index;
  });
  return project;
}

export async function locateProject(projectId) {
  const index = await readIndex();
  const record = index.projects[projectId];
  if (!record) throw new OrchestratorError(`Unknown project: ${projectId}`, "PROJECT_NOT_FOUND");
  return record;
}

export async function loadProject(projectId) {
  const { repoRoot } = await locateProject(projectId);
  const project = await readJson(projectPath(repoRoot, projectId), null);
  if (!project) throw new OrchestratorError(`Project state is missing: ${projectId}`, "PROJECT_NOT_FOUND");
  return project;
}

export async function updateProject(projectId, updater) {
  const { repoRoot } = await locateProject(projectId);
  return await updateJsonLocked(projectPath(repoRoot, projectId), null, async (project) => {
    if (!project) throw new OrchestratorError(`Project state is missing: ${projectId}`, "PROJECT_NOT_FOUND");
    const updated = await updater(project);
    updated.updatedAt = nowIso();
    return updated;
  });
}

export async function listProjects(repoPath = undefined) {
  const index = await readIndex();
  const entries = Object.entries(index.projects);
  const filtered = repoPath
    ? entries.filter(([, record]) => path.resolve(record.repoRoot) === path.resolve(repoPath) || path.resolve(record.workDir) === path.resolve(repoPath))
    : entries;
  const projects = [];
  for (const [id, record] of filtered) {
    try {
      const project = await readJson(projectPath(record.repoRoot, id), null);
      if (project) projects.push(project);
    } catch {}
  }
  return projects.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function findProjectByRepo(repoPath) {
  const projects = await listProjects(repoPath);
  return projects[0] || null;
}

export async function registerMission(mission) {
  await mkdir(path.dirname(missionPath(mission.repoRoot, mission.id)), { recursive: true });
  await writeJsonAtomic(missionPath(mission.repoRoot, mission.id), mission);
  await updateIndex((index) => {
    index.missions[mission.id] = {
      repoRoot: mission.repoRoot,
      workDir: mission.workDir,
      createdAt: mission.createdAt,
      goal: mission.goal,
      projectId: mission.projectId || null
    };
    return index;
  });
  return mission;
}

export async function locateMission(missionId) {
  const index = await readIndex();
  const record = index.missions[missionId];
  if (!record) throw new OrchestratorError(`Unknown mission: ${missionId}`, "MISSION_NOT_FOUND");
  return record;
}

export async function loadMission(missionId) {
  const { repoRoot } = await locateMission(missionId);
  const mission = await readJson(missionPath(repoRoot, missionId), null);
  if (!mission) throw new OrchestratorError(`Mission state is missing: ${missionId}`, "MISSION_NOT_FOUND");
  return mission;
}

export async function updateMission(missionId, updater) {
  const { repoRoot } = await locateMission(missionId);
  return await updateJsonLocked(missionPath(repoRoot, missionId), null, async (mission) => {
    if (!mission) throw new OrchestratorError(`Mission state is missing: ${missionId}`, "MISSION_NOT_FOUND");
    const updated = await updater(mission);
    updated.updatedAt = nowIso();
    return updated;
  });
}

export async function createJob(job) {
  await mkdir(path.dirname(jobPath(job.repoRoot, job.id)), { recursive: true });
  await writeJsonAtomic(jobPath(job.repoRoot, job.id), job);
  await updateIndex((index) => {
    index.jobs[job.id] = {
      repoRoot: job.repoRoot,
      missionId: job.missionId,
      createdAt: job.createdAt,
      kind: job.kind
    };
    return index;
  });
  return job;
}

export async function locateJob(jobId) {
  const index = await readIndex();
  const record = index.jobs[jobId];
  if (!record) throw new OrchestratorError(`Unknown job: ${jobId}`, "JOB_NOT_FOUND");
  return record;
}

export async function loadJob(jobId) {
  const { repoRoot } = await locateJob(jobId);
  const job = await readJson(jobPath(repoRoot, jobId), null);
  if (!job) throw new OrchestratorError(`Job state is missing: ${jobId}`, "JOB_NOT_FOUND");
  return job;
}

export async function updateJob(jobId, updater) {
  const { repoRoot } = await locateJob(jobId);
  return await updateJsonLocked(jobPath(repoRoot, jobId), null, async (job) => {
    if (!job) throw new OrchestratorError(`Job state is missing: ${jobId}`, "JOB_NOT_FOUND");
    const updated = await updater(job);
    updated.updatedAt = nowIso();
    return updated;
  });
}

export async function listMissions(repoPath = undefined) {
  const index = await readIndex();
  const entries = Object.entries(index.missions);
  const filtered = repoPath
    ? entries.filter(([, record]) => path.resolve(record.repoRoot) === path.resolve(repoPath) || path.resolve(record.workDir) === path.resolve(repoPath))
    : entries;
  const missions = [];
  for (const [id, record] of filtered) {
    try {
      const mission = await readJson(missionPath(record.repoRoot, id), null);
      if (mission) missions.push(mission);
    } catch {}
  }
  return missions.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function listJobs(repoPath = undefined) {
  const index = await readIndex();
  const entries = Object.entries(index.jobs);
  const filtered = repoPath
    ? entries.filter(([, record]) => path.resolve(record.repoRoot) === path.resolve(repoPath))
    : entries;
  const jobs = [];
  for (const [id, record] of filtered) {
    try {
      const job = await readJson(jobPath(record.repoRoot, id), null);
      if (job) jobs.push(job);
    } catch {}
  }
  return jobs.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function readRawStateFile(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}
