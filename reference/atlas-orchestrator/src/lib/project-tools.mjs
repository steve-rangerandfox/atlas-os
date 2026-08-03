import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { OrchestratorError } from "./errors.mjs";
import {
  ensureOrchestratorIgnored,
  getChangedFiles,
  getDiff,
  getGitSnapshot,
  getRangeDiff,
  getRangeDiffStat,
  isAncestor,
  resolveRepository
} from "./git.mjs";
import { isSensitivePath, redactObject } from "./redact.mjs";
import {
  findProjectByRepo,
  listMissions,
  listProjects,
  loadMission,
  loadProject,
  registerMission,
  registerProject,
  updateMission,
  updateProject
} from "./state.mjs";
import {
  clampInteger,
  ensureString,
  ensureStringArray,
  nowIso,
  resolveInside,
  shortId
} from "./utils.mjs";
import { HUMAN_GATE_TRIGGERS } from "./safety.mjs";
import { defaultAuthorizationPolicy, relayReadinessProfiles } from "./readiness.mjs";

const STRING = { type: "string" };
const STRING_ARRAY = { type: "array", items: { type: "string" } };
const PROJECT_STATUS = ["active", "paused", "waiting_for_human", "archived"];
const EVENT_TYPES = ["decision", "evidence", "blocker", "artifact", "routing", "note"];

function objectSchema(properties, required = []) {
  return { type: "object", additionalProperties: false, properties, required };
}

export const projectToolDefinitions = [
  {
    name: "adopt_project",
    title: "Adopt an existing project handoff",
    description: "Create or refresh durable project-level Atlas state without creating or switching a Git branch. Records handoff identity, active mission, role routing, authorized lanes, blockers, and next action.",
    inputSchema: objectSchema({
      repo_path: { ...STRING, description: "Repository root or working directory." },
      name: { ...STRING, description: "Product or project name." },
      handoff_path: { ...STRING, description: "Repository-relative or absolute path to the governing handoff file. It must stay inside the repository." },
      status: { type: "string", enum: PROJECT_STATUS, description: "Project control-plane status. Defaults to active." },
      active_mission: { ...STRING, description: "The already-approved active product mission from the handoff." },
      current_role: { ...STRING, description: "Current Atlas role, such as Engineering Director." },
      authorized_lanes: { ...STRING_ARRAY, description: "Currently authorized work lanes." },
      inactive_work: { ...STRING_ARRAY, description: "Inactive, deferred, or prohibited work." },
      blockers: { ...STRING_ARRAY, description: "Current verified blockers or stop conditions." },
      summary: { ...STRING, description: "Compact adopted current-state summary." },
      next_action: { ...STRING, description: "Exact next authorized action." }
    }, ["repo_path", "name", "handoff_path", "active_mission", "current_role"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "get_project",
    title: "Inspect adopted project state",
    description: "Read durable Atlas project state, current Git state, and linked mission summaries.",
    inputSchema: objectSchema({ project_id: STRING }, ["project_id"]),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "list_projects",
    title: "List adopted Atlas projects",
    description: "List known adopted projects, optionally restricted to one repository path.",
    inputSchema: objectSchema({ repo_path: STRING }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "update_project_state",
    title: "Update project role and routing state",
    description: "Update durable project-level status, active mission, current role, lanes, blockers, summary, or next authorized action without changing Git state.",
    inputSchema: objectSchema({
      project_id: STRING,
      status: { type: "string", enum: PROJECT_STATUS },
      active_mission: STRING,
      current_role: STRING,
      authorized_lanes: STRING_ARRAY,
      inactive_work: STRING_ARRAY,
      blockers: STRING_ARRAY,
      summary: STRING,
      next_action: STRING
    }, ["project_id"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "record_project_event",
    title: "Record a project decision or evidence event",
    description: "Append an auditable project-level decision, evidence item, blocker, artifact, routing decision, or note. This does not authorize or execute the referenced action.",
    inputSchema: objectSchema({
      project_id: STRING,
      type: { type: "string", enum: EVENT_TYPES },
      title: STRING,
      summary: STRING,
      authority: { ...STRING, description: "Authority source, such as explicit user authorization or Mission Control." },
      references: { ...STRING_ARRAY, description: "Relevant SHAs, deployment IDs, artifact paths, or evidence identifiers." }
    }, ["project_id", "type", "title", "summary"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "adopt_mission",
    title: "Adopt an approved mission without creating a branch",
    description: "Create durable state for an already-approved mission from a handoff. The mission starts in governance mode and cannot run executors or checks until an existing branch is explicitly attached.",
    inputSchema: objectSchema({
      project_id: STRING,
      title: STRING,
      goal: STRING,
      current_role: STRING,
      authorized_lanes: STRING_ARRAY,
      constraints: STRING_ARRAY,
      max_delegations: { type: "integer", minimum: 1, maximum: 100 }
    }, ["project_id", "title", "goal", "current_role"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "attach_existing_branch",
    title: "Attach an existing branch to an adopted mission",
    description: "Enable executor work for an adopted mission only after a human or controller has checked out the exact clean existing branch. This tool never switches, creates, resets, commits, or pushes a branch.",
    inputSchema: objectSchema({
      mission_id: STRING,
      branch_name: STRING,
      expected_head_commit: { ...STRING, description: "Optional exact current branch head SHA." },
      original_base_commit: { ...STRING, description: "Optional original base SHA; it must be an ancestor of the current head." }
    }, ["mission_id", "branch_name"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "get_branch_diff",
    title: "Inspect an adopted branch from its original base",
    description: "Read the committed base-to-HEAD patch plus staged, unstaged, and untracked changes for an attached mission. Does not modify the repository.",
    inputSchema: objectSchema({
      mission_id: STRING,
      file_path: { ...STRING, description: "Optional repository-relative path." }
    }, ["mission_id"]),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

function optionalString(value, name, max = 20_000) {
  return value === undefined ? undefined : ensureString(value, name, { max });
}

function optionalStringArray(value, name, options = {}) {
  return value === undefined ? undefined : ensureStringArray(value, name, options);
}

function validateCommit(value, name) {
  const commit = ensureString(value, name, { max: 64 });
  if (!/^[0-9a-f]{7,64}$/i.test(commit)) throw new TypeError(`${name} must be a hexadecimal Git commit ID`);
  return commit;
}

function validateBranch(value) {
  const branch = ensureString(value, "branch_name", { max: 200 });
  if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.includes("..") || branch.startsWith("/") || branch.endsWith("/") || branch.endsWith(".lock")) {
    throw new TypeError("branch_name is invalid");
  }
  return branch;
}

async function inspectHandoff(repoRoot, candidate) {
  const absolute = resolveInside(repoRoot, ensureString(candidate, "handoff_path", { max: 4_000 }));
  const relative = path.relative(repoRoot, absolute).split(path.sep).join("/");
  if (isSensitivePath(relative)) throw new OrchestratorError("Sensitive files cannot be adopted as project handoffs", "SENSITIVE_PATH_BLOCKED");
  const info = await stat(absolute);
  if (!info.isFile()) throw new OrchestratorError("The handoff path is not a regular file", "INVALID_HANDOFF_FILE");
  if (info.size > 5_000_000) throw new OrchestratorError("The handoff file is too large", "HANDOFF_TOO_LARGE");
  const contents = await readFile(absolute);
  return {
    path: relative,
    bytes: info.size,
    sha256: createHash("sha256").update(contents).digest("hex"),
    modifiedAt: info.mtime.toISOString()
  };
}

async function adoptProject(args) {
  const repoPath = ensureString(args.repo_path, "repo_path", { max: 4_000 });
  const { repoRoot, workDir } = await resolveRepository(repoPath);
  await ensureOrchestratorIgnored(repoRoot);
  const handoff = await inspectHandoff(repoRoot, args.handoff_path);
  const now = nowIso();
  const state = {
    name: ensureString(args.name, "name", { max: 300 }),
    status: args.status || "active",
    activeMission: ensureString(args.active_mission, "active_mission", { max: 2_000 }),
    currentRole: ensureString(args.current_role, "current_role", { max: 500 }),
    authorizedLanes: ensureStringArray(args.authorized_lanes, "authorized_lanes", { maxItems: 50, itemMax: 2_000 }),
    inactiveWork: ensureStringArray(args.inactive_work, "inactive_work", { maxItems: 100, itemMax: 2_000 }),
    blockers: ensureStringArray(args.blockers, "blockers", { maxItems: 100, itemMax: 4_000 }),
    summary: optionalString(args.summary, "summary", 20_000) || "",
    nextAction: optionalString(args.next_action, "next_action", 10_000) || "",
    handoff
  };
  const existing = await findProjectByRepo(repoRoot);
  if (existing) {
    const project = await updateProject(existing.id, (current) => ({
      ...current,
      ...state,
      repoRoot,
      workDir,
      handoffAdoptedAt: now,
      events: current.events || [],
      decisions: current.decisions || [],
      artifacts: current.artifacts || [],
      readinessProfiles: current.readinessProfiles || (state.name.toLowerCase() === "relay" ? relayReadinessProfiles() : {}),
      defaultReadinessProfile: current.defaultReadinessProfile || (state.name.toLowerCase() === "relay" ? "relay-development" : null),
      standingAuthorization: { ...defaultAuthorizationPolicy(), ...(current.standingAuthorization || {}) }
    }));
    return redactObject({ project_id: project.id, created: false, project });
  }
  const project = {
    id: `project_${shortId(8)}`,
    repoRoot,
    workDir,
    ...state,
    activeMissionId: null,
    events: [],
    decisions: [],
    artifacts: [],
    readinessProfiles: state.name.toLowerCase() === "relay" ? relayReadinessProfiles() : {},
    defaultReadinessProfile: state.name.toLowerCase() === "relay" ? "relay-development" : null,
    standingAuthorization: defaultAuthorizationPolicy(),
    certifications: {},
    handoffAdoptedAt: now,
    createdAt: now,
    updatedAt: now
  };
  await registerProject(project);
  return redactObject({ project_id: project.id, created: true, project });
}

async function getProject(args) {
  const projectId = ensureString(args.project_id, "project_id", { max: 200 });
  const project = await loadProject(projectId);
  const [git, missions] = await Promise.all([
    getGitSnapshot(project.repoRoot),
    listMissions(project.repoRoot)
  ]);
  return redactObject({
    ...project,
    git,
    missions: missions
      .filter((mission) => !mission.projectId || mission.projectId === projectId)
      .map((mission) => ({
        id: mission.id,
        title: mission.title || mission.goal,
        goal: mission.goal,
        status: mission.status,
        mode: mission.mode || "coding",
        branch: mission.branch,
        currentRole: mission.currentRole || null,
        updatedAt: mission.updatedAt
      }))
  });
}

async function listKnownProjects(args) {
  const repoPath = args.repo_path ? ensureString(args.repo_path, "repo_path", { max: 4_000 }) : undefined;
  let resolvedPath;
  if (repoPath) resolvedPath = (await resolveRepository(repoPath)).repoRoot;
  const projects = await listProjects(resolvedPath);
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    status: project.status,
    repoRoot: project.repoRoot,
    activeMission: project.activeMission,
    activeMissionId: project.activeMissionId,
    currentRole: project.currentRole,
    blockers: project.blockers,
    nextAction: project.nextAction,
    updatedAt: project.updatedAt
  }));
}

async function updateProjectState(args) {
  const projectId = ensureString(args.project_id, "project_id", { max: 200 });
  const updates = {
    status: args.status,
    activeMission: optionalString(args.active_mission, "active_mission", 2_000),
    currentRole: optionalString(args.current_role, "current_role", 500),
    authorizedLanes: optionalStringArray(args.authorized_lanes, "authorized_lanes", { maxItems: 50, itemMax: 2_000 }),
    inactiveWork: optionalStringArray(args.inactive_work, "inactive_work", { maxItems: 100, itemMax: 2_000 }),
    blockers: optionalStringArray(args.blockers, "blockers", { maxItems: 100, itemMax: 4_000 }),
    summary: optionalString(args.summary, "summary", 20_000),
    nextAction: optionalString(args.next_action, "next_action", 10_000)
  };
  const project = await updateProject(projectId, (current) => {
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) current[key] = value;
    }
    return current;
  });
  return redactObject({ project_id: projectId, project });
}

async function recordProjectEvent(args) {
  const projectId = ensureString(args.project_id, "project_id", { max: 200 });
  const type = ensureString(args.type, "type", { max: 100 });
  if (!EVENT_TYPES.includes(type)) throw new TypeError(`Unsupported project event type: ${type}`);
  const event = {
    id: `event_${shortId(7)}`,
    type,
    title: ensureString(args.title, "title", { max: 500 }),
    summary: ensureString(args.summary, "summary", { max: 20_000 }),
    authority: args.authority ? ensureString(args.authority, "authority", { max: 2_000 }) : null,
    references: ensureStringArray(args.references, "references", { maxItems: 50, itemMax: 4_000 }),
    recordedAt: nowIso()
  };
  const project = await updateProject(projectId, (current) => {
    current.events ||= [];
    current.decisions ||= [];
    current.artifacts ||= [];
    current.blockers ||= [];
    current.events.push(event);
    if (type === "decision") current.decisions.push(event);
    if (type === "artifact") current.artifacts.push(event);
    if (type === "blocker" && !current.blockers.includes(event.summary)) current.blockers.push(event.summary);
    return current;
  });
  return redactObject({ project_id: projectId, event, status: project.status });
}

async function adoptMission(args) {
  const projectId = ensureString(args.project_id, "project_id", { max: 200 });
  const project = await loadProject(projectId);
  const title = ensureString(args.title, "title", { max: 500 });
  const goal = ensureString(args.goal, "goal", { max: 20_000 });
  const currentRole = ensureString(args.current_role, "current_role", { max: 500 });
  const authorizedLanes = ensureStringArray(args.authorized_lanes, "authorized_lanes", { maxItems: 50, itemMax: 2_000 });
  const constraints = ensureStringArray(args.constraints, "constraints", { maxItems: 100, itemMax: 4_000 });
  await ensureOrchestratorIgnored(project.repoRoot);
  const git = await getGitSnapshot(project.repoRoot);
  const existing = (await listMissions(project.repoRoot)).find((mission) =>
    mission.projectId === projectId &&
    (mission.title === title || mission.goal === goal) &&
    !["aborted", "ready_for_human_review"].includes(mission.status)
  );
  if (existing) {
    const mission = await updateMission(existing.id, (current) => {
      current.title = title;
      current.goal = goal;
      current.currentRole = currentRole;
      current.authorizedLanes = authorizedLanes;
      current.constraints = constraints;
      return current;
    });
    await updateProject(projectId, (current) => {
      current.activeMissionId = mission.id;
      current.activeMission = title;
      current.currentRole = currentRole;
      return current;
    });
    return redactObject({ mission_id: mission.id, created: false, mission });
  }
  const createdAt = nowIso();
  const mission = {
    id: `mission_${shortId(8)}`,
    projectId,
    title,
    goal,
    source: "adopted_handoff",
    mode: "governance",
    status: "governance",
    repoRoot: project.repoRoot,
    workDir: project.workDir,
    baseBranch: git.branch,
    baseCommit: git.commit,
    originalBaseCommit: null,
    branch: null,
    branchManaged: false,
    currentRole,
    authorizedLanes,
    constraints,
    maxDelegations: clampInteger(args.max_delegations, 1, 100, 20),
    createdAt,
    updatedAt: createdAt,
    tasks: [],
    decisions: [],
    pendingGate: null,
    lastJobId: null,
    lastResult: null,
    lastError: null,
    finalSummary: null,
    abortedReason: null,
    humanGateTriggers: HUMAN_GATE_TRIGGERS
  };
  await registerMission(mission);
  await updateProject(projectId, (current) => {
    current.activeMissionId = mission.id;
    current.activeMission = title;
    current.currentRole = currentRole;
    return current;
  });
  return redactObject({
    mission_id: mission.id,
    created: true,
    mode: mission.mode,
    status: mission.status,
    next_step: "Record governance decisions at project or mission scope. Attach the exact existing clean branch before executor work."
  });
}

async function attachExistingBranch(args) {
  const missionId = ensureString(args.mission_id, "mission_id", { max: 200 });
  const branchName = validateBranch(args.branch_name);
  const expectedHead = args.expected_head_commit === undefined ? undefined : validateCommit(args.expected_head_commit, "expected_head_commit");
  const originalBase = args.original_base_commit === undefined ? undefined : validateCommit(args.original_base_commit, "original_base_commit");
  const mission = await loadMission(missionId);
  if (mission.lastJobId) throw new OrchestratorError("Review the mission's existing job state before attaching a branch", "MISSION_HAS_JOB_HISTORY");
  const git = await getGitSnapshot(mission.repoRoot);
  if (!git.clean) throw new OrchestratorError("The existing branch must have a clean working tree before attachment", "DIRTY_WORKTREE", { status: git.status });
  if (git.branch !== branchName) {
    throw new OrchestratorError("The requested existing branch is not checked out", "MISSION_BRANCH_MISMATCH", {
      expectedBranch: branchName,
      actualBranch: git.branch
    });
  }
  if (expectedHead && git.commit !== expectedHead) {
    throw new OrchestratorError("The existing branch head does not match the required commit", "MISSION_HEAD_MISMATCH", {
      expectedCommit: expectedHead,
      actualCommit: git.commit
    });
  }
  if (originalBase && !(await isAncestor(mission.repoRoot, originalBase, git.commit))) {
    throw new OrchestratorError("The declared original base is not an ancestor of the existing branch head", "MISSION_BASE_MISMATCH", {
      originalBaseCommit: originalBase,
      headCommit: git.commit
    });
  }
  const updated = await updateMission(missionId, (current) => {
    current.mode = "coding";
    current.status = "active";
    current.branch = git.branch;
    current.branchManaged = false;
    current.baseBranch = current.baseBranch || git.branch;
    current.baseCommit = git.commit;
    current.originalBaseCommit = originalBase || current.originalBaseCommit || git.commit;
    current.attachedAt = nowIso();
    current.attachedHeadCommit = git.commit;
    return current;
  });
  if (updated.projectId) {
    await updateProject(updated.projectId, (current) => {
      current.activeMissionId = updated.id;
      current.currentRole = updated.currentRole || current.currentRole;
      current.events ||= [];
      current.events.push({
        id: `event_${shortId(7)}`,
        type: "routing",
        title: "Existing branch attached",
        summary: `Attached ${git.branch} at ${git.commit} to mission ${updated.id} without switching or creating a branch.`,
        authority: "Atlas branch-attachment validation",
        references: [git.branch, git.commit, ...(originalBase ? [originalBase] : [])],
        recordedAt: nowIso()
      });
      return current;
    });
  }
  return redactObject({
    mission_id: missionId,
    mode: updated.mode,
    status: updated.status,
    branch: updated.branch,
    head_commit: updated.baseCommit,
    original_base_commit: updated.originalBaseCommit,
    next_step: "Delegate one bounded task. The worker will require this exact branch and HEAD before starting."
  });
}

async function getBranchDiff(args) {
  const missionId = ensureString(args.mission_id, "mission_id", { max: 200 });
  const mission = await loadMission(missionId);
  if (!mission.originalBaseCommit) throw new OrchestratorError("This mission has no original base commit", "MISSION_BASE_NOT_RECORDED");
  const git = await getGitSnapshot(mission.repoRoot);
  let relativePath;
  if (args.file_path !== undefined) {
    const absolute = resolveInside(mission.repoRoot, ensureString(args.file_path, "file_path", { max: 4_000 }));
    relativePath = path.relative(mission.repoRoot, absolute).split(path.sep).join("/");
    if (isSensitivePath(relativePath)) throw new OrchestratorError("Diff access to sensitive files is blocked", "SENSITIVE_PATH_BLOCKED");
  }
  const [committed, committedStat, working, changedFiles] = await Promise.all([
    getRangeDiff(mission.repoRoot, mission.originalBaseCommit, "HEAD", relativePath, 120_000),
    getRangeDiffStat(mission.repoRoot, mission.originalBaseCommit, "HEAD"),
    getDiff(mission.repoRoot, relativePath, 80_000),
    getChangedFiles(mission.repoRoot)
  ]);
  return redactObject({
    mission_id: missionId,
    branch: git.branch,
    original_base_commit: mission.originalBaseCommit,
    head_commit: git.commit,
    file_path: relativePath || null,
    committed,
    committedStat,
    working,
    changedFiles
  });
}

export const projectToolHandlers = {
  adopt_project: adoptProject,
  get_project: getProject,
  list_projects: listKnownProjects,
  update_project_state: updateProjectState,
  record_project_event: recordProjectEvent,
  adopt_mission: adoptMission,
  attach_existing_branch: attachExistingBranch,
  get_branch_diff: getBranchDiff
};
