import path from "node:path";
import { OrchestratorError } from "./errors.mjs";
import { resolveRepository } from "./git.mjs";
import {
  AUTHORIZATION_ACTIONS,
  defaultAuthorizationPolicy,
  prepareRuntime,
  restoreDependencies,
  runPreflight,
  validateReadinessProfile,
  writeCertificationArtifact
} from "./readiness.mjs";
import { redactObject } from "./redact.mjs";
import { recoverPendingJobs } from "./supervisor.mjs";
import { findProjectByRepo, listMissions, listProjects, loadProject, updateProject } from "./state.mjs";
import { ensureString, nowIso } from "./utils.mjs";

const STRING = { type: "string" };

function objectSchema(properties, required = []) {
  return { type: "object", additionalProperties: false, properties, required };
}

const PROFILE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "runtime"],
  properties: {
    name: STRING,
    runtime: {
      type: "object",
      additionalProperties: false,
      required: ["node"],
      properties: { node: STRING, packageManager: { type: "string", enum: ["npm", "pnpm", "yarn", "bun"] }, packageManagerVersion: { type: ["string", "null"] } }
    },
    executor: { type: "string", enum: ["claude", "codex"] },
    allowSameProviderExecutor: { type: "boolean" },
    network: { type: "array", items: STRING },
    cachePaths: { type: "array", items: STRING },
    dependencyRestore: { type: "object", additionalProperties: false, properties: { required: { type: "boolean" }, ignoreLifecycleScripts: { type: "boolean" } } },
    browser: { type: "object", additionalProperties: false, properties: { playwright: { type: "boolean" }, browserBinary: { type: "boolean" } } },
    git: { type: "object", additionalProperties: false, properties: { clean: { type: "boolean" }, namedBranch: { type: "boolean" } } },
    artifactDirectory: STRING,
    requireUpstream: { type: "boolean" },
    validForMinutes: { type: "integer", minimum: 1, maximum: 1440 }
  }
};

export const certificationToolDefinitions = [
  {
    name: "set_readiness_profile",
    title: "Set a project readiness profile",
    description: "Persist an exact, project-specific worker certification profile. Profiles declare runtimes, executor policy, HTTPS endpoints, caches, dependency restore, browser, Git, and artifact requirements; they cannot contain arbitrary commands.",
    inputSchema: objectSchema({ project_id: STRING, profile: PROFILE_SCHEMA, make_default: { type: "boolean" } }, ["project_id", "profile"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "set_standing_authorization",
    title: "Set bounded standing authorization",
    description: "Persist opt-in authorization for named local environment operations. This never authorizes secrets, production writes, arbitrary shell commands, commit, push, merge, pull requests, deployment, or publication.",
    inputSchema: objectSchema({
      project_id: STRING,
      runtime_setup: { type: "boolean" },
      dependency_restore: { type: "boolean" },
      network_policy_check: { type: "boolean" },
      artifact_generation: { type: "boolean" },
      worker_restart: { type: "boolean" }
    }, ["project_id"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "preflight",
    title: "Certify a project worker",
    description: "Run a project readiness profile and persist the resulting evidence for runtime versions, executor authentication, provider policy, HTTPS reachability, caches, deterministic restore capability, browsers, Git, and artifact writing.",
    inputSchema: objectSchema({ project_id: STRING, profile: STRING }, ["project_id"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "run_environment_operation",
    title: "Run a bounded environment operation",
    description: "Run one fixed native operation authorized in project state: pinned runtime/cache setup, lockfile dependency restore, allowlisted HTTPS checks, certification artifact generation, or safe pending-worker recovery. No command string is accepted.",
    inputSchema: objectSchema({ project_id: STRING, profile: STRING, operation: { type: "string", enum: AUTHORIZATION_ACTIONS } }, ["project_id", "operation"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
  },
  {
    name: "recover_pending_jobs",
    title: "Recover safe pending jobs",
    description: "Inspect durable queued/running jobs. Restart only queued work and verification jobs whose branch/HEAD invariants still hold; interrupted executor jobs stop for human inspection.",
    inputSchema: objectSchema({ project_id: STRING }, ["project_id"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "run_project",
    title: "Run the certified project flow",
    description: "Resolve one adopted project, safely recover pending jobs when authorized, run its selected readiness profile, persist certification, and return the active mission and exact next action.",
    inputSchema: objectSchema({ project: STRING, profile: STRING }, ["project"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  }
];

function selectProfile(project, requested) {
  const name = requested || project.defaultReadinessProfile;
  if (!name) throw new OrchestratorError("No readiness profile was selected for this project", "READINESS_PROFILE_REQUIRED");
  const profile = project.readinessProfiles?.[name];
  if (!profile) throw new OrchestratorError(`Unknown readiness profile: ${name}`, "READINESS_PROFILE_NOT_FOUND", { available: Object.keys(project.readinessProfiles || {}) });
  return validateReadinessProfile({ ...profile, name });
}

async function resolveProject(reference) {
  const value = ensureString(reference, "project", { max: 4_000 });
  try { return await loadProject(value); } catch (error) { if (error.code !== "PROJECT_NOT_FOUND") throw error; }
  const known = await listProjects();
  const byName = known.find((project) => project.name.toLowerCase() === value.toLowerCase());
  if (byName) return byName;
  let repo;
  try { repo = await resolveRepository(path.resolve(value)); } catch {}
  if (repo) {
    const byRepo = await findProjectByRepo(repo.repoRoot);
    if (byRepo) return byRepo;
  }
  throw new OrchestratorError(`Unknown adopted project: ${value}`, "PROJECT_NOT_FOUND");
}

async function persistCertification(project, report) {
  await updateProject(project.id, (current) => {
    current.certifications ||= {};
    current.certifications[report.profile] = report;
    current.lastCertification = report;
    return current;
  });
  return report;
}

async function setReadinessProfile(args) {
  const projectId = ensureString(args.project_id, "project_id", { max: 200 });
  const profile = validateReadinessProfile(args.profile);
  const project = await updateProject(projectId, (current) => {
    current.readinessProfiles ||= {};
    current.readinessProfiles[profile.name] = profile;
    if (args.make_default === true || !current.defaultReadinessProfile) current.defaultReadinessProfile = profile.name;
    return current;
  });
  return redactObject({ project_id: projectId, profile, default_profile: project.defaultReadinessProfile });
}

async function setStandingAuthorization(args) {
  const projectId = ensureString(args.project_id, "project_id", { max: 200 });
  const project = await updateProject(projectId, (current) => {
    current.standingAuthorization = { ...defaultAuthorizationPolicy(), ...(current.standingAuthorization || {}) };
    for (const action of AUTHORIZATION_ACTIONS) if (typeof args[action] === "boolean") current.standingAuthorization[action] = args[action];
    current.authorizationUpdatedAt = nowIso();
    return current;
  });
  return { project_id: projectId, standing_authorization: project.standingAuthorization, excluded: ["secrets", "production writes", "arbitrary commands", "commit", "push", "merge", "pull request", "deploy", "publish"] };
}

async function preflight(args) {
  const project = await loadProject(ensureString(args.project_id, "project_id", { max: 200 }));
  const profile = selectProfile(project, args.profile);
  return await persistCertification(project, await runPreflight({ project, profile }));
}

function assertAuthorized(project, operation) {
  if (!AUTHORIZATION_ACTIONS.includes(operation)) throw new TypeError(`Unsupported environment operation: ${operation}`);
  if (project.standingAuthorization?.[operation] !== true) {
    throw new OrchestratorError(`Standing authorization is not enabled for ${operation}`, "STANDING_AUTHORIZATION_REQUIRED", { projectId: project.id, operation });
  }
}

async function runEnvironmentOperation(args) {
  const project = await loadProject(ensureString(args.project_id, "project_id", { max: 200 }));
  const operation = ensureString(args.operation, "operation", { max: 100 });
  assertAuthorized(project, operation);
  if (operation === "worker_restart") return await recoverPendingJobs(project.repoRoot);
  const profile = selectProfile(project, args.profile);
  if (operation === "runtime_setup") return await prepareRuntime({ project, profile });
  if (operation === "dependency_restore") return await restoreDependencies({ project, profile });
  const report = await persistCertification(project, await runPreflight({ project, profile }));
  if (operation === "network_policy_check") return { operation, profile: profile.name, checks: report.checks.filter((entry) => entry.id.startsWith("network.")), completedAt: nowIso() };
  return await writeCertificationArtifact({ project, profile, report });
}

async function recoverJobs(args) {
  const project = await loadProject(ensureString(args.project_id, "project_id", { max: 200 }));
  assertAuthorized(project, "worker_restart");
  return await recoverPendingJobs(project.repoRoot);
}

export async function runProject(args) {
  const project = await resolveProject(args.project);
  let recovery = { skipped: true, reason: "worker_restart standing authorization is disabled" };
  if (project.standingAuthorization?.worker_restart === true) recovery = await recoverPendingJobs(project.repoRoot);
  const profile = selectProfile(project, args.profile);
  const certification = await persistCertification(project, await runPreflight({ project, profile }));
  const missions = await listMissions(project.repoRoot);
  const activeMission = missions.find((mission) => mission.id === project.activeMissionId) || null;
  return redactObject({
    project: { id: project.id, name: project.name, repoRoot: project.repoRoot },
    profile: profile.name,
    certified: certification.certified,
    certification,
    recovery,
    activeMission: activeMission ? { id: activeMission.id, mode: activeMission.mode || "coding", status: activeMission.status, branch: activeMission.branch, goal: activeMission.goal } : null,
    nextAction: certification.certified ? (project.nextAction || "Project worker is certified; continue the active mission.") : "Resolve failed required preflight checks before executor work."
  });
}

export const certificationToolHandlers = {
  set_readiness_profile: setReadinessProfile,
  set_standing_authorization: setStandingAuthorization,
  preflight,
  run_environment_operation: runEnvironmentOperation,
  recover_pending_jobs: recoverJobs,
  run_project: runProject
};
