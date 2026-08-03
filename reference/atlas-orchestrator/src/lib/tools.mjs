import path from "node:path";
import { getConfig } from "./config.mjs";
import { normalizeChecks } from "./checks.mjs";
import { OrchestratorError } from "./errors.mjs";
import {
  createBranch,
  ensureOrchestratorIgnored,
  getChangedFiles,
  getDiff,
  getDiffStat,
  getGitSnapshot,
  getUntrackedPatch,
  resolveRepository
} from "./git.mjs";
import { launchJob } from "./jobs.mjs";
import { runProcess } from "./process.mjs";
import { isSensitivePath, redactObject } from "./redact.mjs";
import { assertTaskSafe, HUMAN_GATE_TRIGGERS } from "./safety.mjs";
import {
  listMissions,
  loadJob,
  loadMission,
  loadProject,
  registerMission,
  updateMission
} from "./state.mjs";
import {
  clampInteger,
  ensureString,
  ensureStringArray,
  nowIso,
  resolveInside,
  shortId,
  sleep,
  slugify,
  truncate
} from "./utils.mjs";

const STRING = { type: "string" };
const STRING_ARRAY = { type: "array", items: { type: "string" } };
const CHECK_ARRAY = {
  type: "array",
  items: { type: "string", enum: ["diff-check", "lint", "typecheck", "test", "build"] }
};

function objectSchema(properties, required = []) {
  return { type: "object", additionalProperties: false, properties, required };
}

export const toolDefinitions = [
  {
    name: "doctor",
    title: "Check orchestrator readiness",
    description: "Read-only readiness check for Git, configured executors (Claude Code and Codex), and local tunnel-client availability. Run this before starting a mission.",
    inputSchema: objectSchema({ repo_path: { ...STRING, description: "Repository root or a working directory inside it." } }, ["repo_path"]),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "start_mission",
    title: "Start a coding mission",
    description: "Create durable mission state and a new orchestrator/* Git branch. Requires a clean working tree. Does not edit project files, commit, push, or deploy.",
    inputSchema: objectSchema({
      repo_path: { ...STRING, description: "Repository root or desired working directory inside it." },
      goal: { ...STRING, description: "The outcome the overall mission should achieve." },
      branch_name: { ...STRING, description: "Optional branch name. Defaults to orchestrator/<goal>-<id>." },
      max_delegations: { type: "integer", minimum: 1, maximum: 100, description: "Safety cap for Claude tasks in this mission. Default 20." }
    }, ["repo_path", "goal"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "delegate_task",
    title: "Delegate a bounded task",
    description: "Launch a background executor job for one bounded implementation task using Claude Code or Codex. Claude may edit repository files but cannot commit, push, deploy, access secrets, or run open-ended network commands. Returns a job_id; use wait_for_job or get_mission next.",
    inputSchema: objectSchema({
      mission_id: STRING,
      executor: { type: "string", enum: ["claude", "codex"], description: "Executor to use. Defaults to claude." },
      title: { ...STRING, description: "Short task name." },
      objective: { ...STRING, description: "Exactly what Claude should implement in this delegation." },
      acceptance_criteria: { ...STRING_ARRAY, description: "Observable conditions for completion." },
      constraints: { ...STRING_ARRAY, description: "Scope boundaries and implementation constraints." },
      checks: { ...CHECK_ARRAY, description: "Safe named checks to run after Claude finishes. Defaults to diff-check, lint, typecheck, and test." }
    }, ["mission_id", "title", "objective", "acceptance_criteria"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "delegate_to_claude",
    title: "Delegate to Claude Code",
    description: "Compatibility alias for delegate_task with executor fixed to Claude Code. Claude may edit repository files but cannot commit, push, deploy, access secrets, or run open-ended network commands. Returns a job_id; use wait_for_job or get_mission next.",
    inputSchema: objectSchema({
      mission_id: STRING,
      title: { ...STRING, description: "Short task name." },
      objective: { ...STRING, description: "Exactly what Claude should implement in this delegation." },
      acceptance_criteria: { ...STRING_ARRAY, description: "Observable conditions for completion." },
      constraints: { ...STRING_ARRAY, description: "Scope boundaries and implementation constraints." },
      checks: { ...CHECK_ARRAY, description: "Safe named checks to run after Claude finishes. Defaults to diff-check, lint, typecheck, and test." }
    }, ["mission_id", "title", "objective", "acceptance_criteria"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "delegate_to_codex",
    title: "Delegate to Codex",
    description: "Compatibility alias for delegate_task with executor fixed to Codex. Claude may edit repository files but cannot commit, push, deploy, access secrets, or run open-ended network commands. Returns a job_id; use wait_for_job or get_mission next.",
    inputSchema: objectSchema({
      mission_id: STRING,
      title: { ...STRING, description: "Short task name." },
      objective: { ...STRING, description: "Exactly what Claude should implement in this delegation." },
      acceptance_criteria: { ...STRING_ARRAY, description: "Observable conditions for completion." },
      constraints: { ...STRING_ARRAY, description: "Scope boundaries and implementation constraints." },
      checks: { ...CHECK_ARRAY, description: "Safe named checks to run after Claude finishes. Defaults to diff-check, lint, typecheck, and test." }
    }, ["mission_id", "title", "objective", "acceptance_criteria"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "wait_for_job",
    title: "Wait briefly for an orchestrator job",
    description: "Poll a Claude or verification job for up to 50 seconds and return its latest state. Safe to call repeatedly.",
    inputSchema: objectSchema({
      job_id: STRING,
      timeout_seconds: { type: "integer", minimum: 0, maximum: 50, description: "How long to poll before returning. Default 20." }
    }, ["job_id"]),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "get_mission",
    title: "Inspect mission state",
    description: "Read mission status, task reports, verification results, Git status, changed files, and pending human gates.",
    inputSchema: objectSchema({ mission_id: STRING }, ["mission_id"]),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "get_diff",
    title: "Inspect the current Git diff",
    description: "Read the current staged and unstaged patch for a mission, optionally limited to one non-sensitive repository file. Does not modify files.",
    inputSchema: objectSchema({
      mission_id: STRING,
      file_path: { ...STRING, description: "Optional repository-relative path." }
    }, ["mission_id"]),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "run_checks",
    title: "Run safe repository checks",
    description: "Launch a background verification job using only named package scripts and git diff --check. Never executes an arbitrary command. Returns a job_id.",
    inputSchema: objectSchema({ mission_id: STRING, checks: CHECK_ARRAY }, ["mission_id"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "record_human_decision",
    title: "Record a human decision",
    description: "Record the user's answer to a product, safety, or access question and reopen the mission for another bounded delegation. This does not itself perform the requested action.",
    inputSchema: objectSchema({ mission_id: STRING, question: STRING, decision: STRING }, ["mission_id", "question", "decision"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "finish_mission",
    title: "Mark a mission ready for final review",
    description: "Stop autonomous work and mark the current branch and diff ready for human acceptance. Does not commit, push, open a pull request, or deploy.",
    inputSchema: objectSchema({ mission_id: STRING, summary: STRING }, ["mission_id", "summary"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "abort_mission",
    title: "Abort a mission without deleting work",
    description: "Mark the mission aborted while preserving the branch and all local changes for human inspection.",
    inputSchema: objectSchema({ mission_id: STRING, reason: STRING }, ["mission_id", "reason"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "list_missions",
    title: "List orchestrator missions",
    description: "List known missions, optionally restricted to a repository path.",
    inputSchema: objectSchema({ repo_path: STRING }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

function compact(value, maxString = 20_000) {
  if (typeof value === "string") return truncate(value, maxString);
  if (Array.isArray(value)) return value.map((item) => compact(item, maxString));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, compact(child, maxString)]));
  }
  return value;
}

async function commandStatus(command, args) {
  try {
    const result = await runProcess(command, args, { timeoutMs: 15_000, maxOutputChars: 20_000, rejectOnNonZero: false });
    return { available: true, ok: result.code === 0, code: result.code, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
  } catch (error) {
    return { available: false, ok: false, error: error.message };
  }
}

async function doctor(args) {
  const repoPath = ensureString(args.repo_path, "repo_path", { max: 4_000 });
  const { repoRoot, workDir } = await resolveRepository(repoPath);
  const git = await getGitSnapshot(repoRoot);
  const config = getConfig();
  const [version, auth, codexVersion, codexAuth, tunnel] = await Promise.all([
    commandStatus(config.claudeBin, ["--version"]),
    commandStatus(config.claudeBin, ["auth", "status"]),
    commandStatus(config.codexBin, ["--version"]),
    commandStatus(config.codexBin, ["login", "status"]),
    commandStatus("tunnel-client", ["--version"])
  ]);
  let authSummary = auth;
  if (auth.stdout) {
    try {
      const parsed = JSON.parse(auth.stdout);
      authSummary = {
        available: auth.available,
        ok: auth.ok,
        loggedIn: parsed.loggedIn ?? parsed.logged_in ?? parsed.authenticated ?? auth.ok,
        authMethod: parsed.authMethod ?? parsed.auth_method ?? parsed.subscriptionType ?? undefined
      };
    } catch {
      authSummary = { available: auth.available, ok: auth.ok, message: truncate(auth.stdout || auth.stderr, 2_000) };
    }
  }
  const warnings = [];
  if (!git.clean) warnings.push("The Git working tree is not clean; start_mission will refuse to create a branch.");
  if (!version.available || !version.ok) warnings.push("Claude Code is not installed or not runnable.");
  if (!auth.ok) warnings.push("Claude Code is not authenticated. Run: claude auth login");
  if (!codexVersion.available || !codexVersion.ok) warnings.push("Codex CLI is not installed or not runnable.");
  if (codexVersion.ok && !codexAuth.ok) warnings.push("Codex CLI is not authenticated. Run: codex login");
  if (!tunnel.available || !tunnel.ok) warnings.push("tunnel-client is not installed yet; it is required only when connecting this private MCP server to ChatGPT.");
  return redactObject({
    readyForMission: git.clean && ((version.ok && auth.ok) || (codexVersion.ok && codexAuth.ok)),
    readyForChatGPTConnection: tunnel.ok,
    repoRoot,
    workDir,
    git,
    node: process.version,
    executors: { claude: { version, auth: authSummary }, codex: { version: codexVersion, auth: codexAuth } },
    tunnelClient: tunnel,
    warnings
  });
}

function validateBranchName(branchName) {
  if (!/^[A-Za-z0-9._/-]+$/.test(branchName) || branchName.includes("..") || branchName.startsWith("/") || branchName.endsWith("/") || branchName.endsWith(".lock")) {
    throw new OrchestratorError("Invalid Git branch name", "INVALID_BRANCH_NAME");
  }
  return branchName;
}

async function startMission(args) {
  const goal = ensureString(args.goal, "goal", { max: 10_000 });
  const repoPath = ensureString(args.repo_path, "repo_path", { max: 4_000 });
  const { repoRoot, workDir } = await resolveRepository(repoPath);
  await ensureOrchestratorIgnored(repoRoot);
  const before = await getGitSnapshot(repoRoot);
  if (!before.clean) {
    throw new OrchestratorError("A clean working tree is required before starting a mission", "DIRTY_WORKTREE", { status: before.status });
  }
  if (before.branch === "(detached HEAD)") {
    throw new OrchestratorError("Start the mission from a named Git branch, not detached HEAD", "DETACHED_HEAD");
  }
  const id = `mission_${shortId(8)}`;
  const branch = validateBranchName(args.branch_name
    ? ensureString(args.branch_name, "branch_name", { max: 200 })
    : `orchestrator/${slugify(goal)}-${id.slice(-6)}`);
  await createBranch(repoRoot, branch);
  const createdAt = nowIso();
  const mission = {
    id,
    status: "active",
    goal,
    repoRoot,
    workDir,
    baseBranch: before.branch,
    baseCommit: before.commit,
    branch,
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
  return {
    mission_id: id,
    status: mission.status,
    goal,
    branch,
    base_branch: before.branch,
    base_commit: before.commit,
    work_directory: workDir,
    next_step: "Delegate one small, testable task with delegate_task and choose claude or codex."
  };
}

async function ensureNoRunningJob(mission) {
  if (!mission.lastJobId) return;
  try {
    const job = await loadJob(mission.lastJobId);
    if (job.status === "queued" || job.status === "running") {
      throw new OrchestratorError(`Job ${job.id} is still ${job.status}`, "JOB_ALREADY_RUNNING", { job_id: job.id });
    }
  } catch (error) {
    if (error.code === "JOB_NOT_FOUND") return;
    throw error;
  }
}

async function ensureMissionCertified(mission) {
  if (!mission.projectId) return;
  const project = await loadProject(mission.projectId);
  const profile = project.defaultReadinessProfile;
  if (!profile) return;
  const certification = project.certifications?.[profile];
  const ageMs = certification?.checkedAt ? Date.now() - Date.parse(certification.checkedAt) : Number.POSITIVE_INFINITY;
  const maxAgeMs = (certification?.validForMinutes || 60) * 60_000;
  if (!certification?.certified || certification.profile !== profile) {
    throw new OrchestratorError(`Project readiness profile ${profile} is not certified`, "PROJECT_CERTIFICATION_REQUIRED", { projectId: project.id, profile });
  }
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > maxAgeMs) {
    throw new OrchestratorError(`Project readiness certification ${profile} is stale`, "PROJECT_CERTIFICATION_STALE", { projectId: project.id, profile, checkedAt: certification.checkedAt });
  }
  if (certification.git?.commit !== mission.baseCommit || certification.git?.branch !== mission.branch || certification.git?.clean !== true) {
    throw new OrchestratorError("Project readiness certification does not match the mission branch and base commit", "PROJECT_CERTIFICATION_MISMATCH", {
      certifiedGit: certification.git,
      missionGit: { branch: mission.branch, commit: mission.baseCommit }
    });
  }
}

async function delegateTask(args, forcedExecutor = undefined) {
  const missionId = ensureString(args.mission_id, "mission_id", { max: 200 });
  const mission = await loadMission(missionId);
  const executor = forcedExecutor || args.executor || "claude";
  if (!["claude", "codex"].includes(executor)) throw new OrchestratorError(`Unsupported executor: ${executor}`, "EXECUTOR_NOT_SUPPORTED");
  if (mission.status !== "active") {
    throw new OrchestratorError(`Mission is ${mission.status}; resolve its gate or start a new mission before delegating`, "MISSION_NOT_ACTIVE", { pendingGate: mission.pendingGate });
  }
  await ensureMissionCertified(mission);
  await ensureNoRunningJob(mission);
  if (mission.tasks.length >= mission.maxDelegations) {
    throw new OrchestratorError("Mission delegation cap reached; a human must review before continuing", "DELEGATION_LIMIT_REACHED");
  }
  const title = ensureString(args.title, "title", { max: 300 });
  const objective = ensureString(args.objective, "objective", { max: 12_000 });
  const acceptanceCriteria = ensureStringArray(args.acceptance_criteria, "acceptance_criteria", { required: true, maxItems: 30, itemMax: 2_000 });
  const constraints = ensureStringArray(args.constraints, "constraints", { maxItems: 30, itemMax: 2_000 });
  assertTaskSafe([title, objective, ...acceptanceCriteria, ...constraints]);
  const checks = normalizeChecks(args.checks);
  const taskId = `task_${shortId(7)}`;
  const task = {
    id: taskId,
    number: mission.tasks.length + 1,
    executor,
    title,
    objective,
    acceptanceCriteria,
    constraints,
    checksRequested: checks,
    status: "queued",
    createdAt: nowIso(),
    startedAt: null,
    finishedAt: null,
    jobId: null,
    report: null,
    checks: null,
    changedFiles: [],
    error: null
  };
  const updatedMission = await updateMission(missionId, (current) => {
    current.tasks.push(task);
    current.lastError = null;
    return current;
  });
  const job = await launchJob({ mission: updatedMission, kind: "executor", taskId, checks });
  await updateMission(missionId, (current) => {
    const entry = current.tasks.find((item) => item.id === taskId);
    if (entry) entry.jobId = job.id;
    current.lastJobId = job.id;
    return current;
  });
  return {
    mission_id: missionId,
    task_id: taskId,
    executor,
    job_id: job.id,
    status: job.status,
    next_step: "Call wait_for_job with this job_id, then inspect get_mission and get_diff."
  };
}

async function waitForJob(args) {
  const jobId = ensureString(args.job_id, "job_id", { max: 200 });
  const timeoutSeconds = clampInteger(args.timeout_seconds, 0, 50, 20);
  const deadline = Date.now() + timeoutSeconds * 1_000;
  let job = await loadJob(jobId);
  while ((job.status === "queued" || job.status === "running") && Date.now() < deadline) {
    await sleep(500);
    job = await loadJob(jobId);
  }
  return compact(redactObject(job));
}

async function getMission(args) {
  const missionId = ensureString(args.mission_id, "mission_id", { max: 200 });
  const mission = await loadMission(missionId);
  const [git, changedFiles, diffStat] = await Promise.all([
    getGitSnapshot(mission.repoRoot),
    getChangedFiles(mission.repoRoot),
    getDiffStat(mission.repoRoot)
  ]);
  const lastJob = mission.lastJobId ? await loadJob(mission.lastJobId).catch(() => null) : null;
  return compact(redactObject({
    ...mission,
    git,
    changedFiles,
    diffStat,
    lastJob
  }));
}

async function getMissionDiff(args) {
  const missionId = ensureString(args.mission_id, "mission_id", { max: 200 });
  const mission = await loadMission(missionId);
  let relativePath;
  if (args.file_path !== undefined) {
    const requested = ensureString(args.file_path, "file_path", { max: 4_000 });
    const absolute = resolveInside(mission.repoRoot, requested);
    relativePath = path.relative(mission.repoRoot, absolute).split(path.sep).join("/");
    if (isSensitivePath(relativePath)) {
      throw new OrchestratorError("Diff access to sensitive files is blocked", "SENSITIVE_PATH_BLOCKED");
    }
  }
  const diff = await getDiff(mission.repoRoot, relativePath, 80_000);
  const candidates = relativePath
    ? (diff.untrackedFiles.includes(relativePath) ? [relativePath] : [])
    : diff.untrackedFiles.slice(0, 20);
  const untrackedPatches = [];
  let remaining = 80_000;
  for (const candidate of candidates) {
    if (isSensitivePath(candidate)) {
      untrackedPatches.push({ path: candidate, skipped: true, reason: "Sensitive path blocked" });
      continue;
    }
    if (remaining <= 0) {
      untrackedPatches.push({ path: candidate, skipped: true, reason: "Diff output limit reached" });
      continue;
    }
    const patch = await getUntrackedPatch(mission.repoRoot, candidate, Math.min(40_000, remaining));
    untrackedPatches.push(patch);
    remaining -= patch.patch?.length || 0;
  }
  return redactObject({ mission_id: missionId, file_path: relativePath || null, ...diff, untrackedPatches });
}

async function runMissionChecks(args) {
  const missionId = ensureString(args.mission_id, "mission_id", { max: 200 });
  const mission = await loadMission(missionId);
  if (["aborted", "ready_for_human_review"].includes(mission.status)) {
    throw new OrchestratorError(`Mission is ${mission.status}`, "MISSION_NOT_ACTIVE");
  }
  if ((mission.mode || "coding") !== "coding") {
    throw new OrchestratorError("Attach the exact existing branch before running checks", "MISSION_EXECUTION_NOT_ATTACHED");
  }
  await ensureMissionCertified(mission);
  await ensureNoRunningJob(mission);
  const checks = normalizeChecks(args.checks);
  const job = await launchJob({ mission, kind: "checks", checks });
  await updateMission(missionId, (current) => {
    current.lastJobId = job.id;
    return current;
  });
  return { mission_id: missionId, job_id: job.id, checks, status: job.status, next_step: "Call wait_for_job." };
}

async function recordHumanDecision(args) {
  const missionId = ensureString(args.mission_id, "mission_id", { max: 200 });
  const question = ensureString(args.question, "question", { max: 5_000 });
  const decision = ensureString(args.decision, "decision", { max: 10_000 });
  const mission = await updateMission(missionId, (current) => {
    current.decisions.push({ question, decision, recordedAt: nowIso() });
    current.pendingGate = null;
    if (current.status === "waiting_for_human") current.status = "active";
    return current;
  });
  return { mission_id: missionId, status: mission.status, recorded: { question, decision }, next_step: "Delegate a new bounded task that applies this decision." };
}

async function finishMission(args) {
  const missionId = ensureString(args.mission_id, "mission_id", { max: 200 });
  const summary = ensureString(args.summary, "summary", { max: 12_000 });
  const existing = await loadMission(missionId);
  await ensureNoRunningJob(existing);
  const mission = await updateMission(missionId, (current) => {
    current.status = "ready_for_human_review";
    current.finalSummary = summary;
    current.pendingGate = {
      createdAt: nowIso(),
      reasons: ["Final acceptance review is required before commit, push, pull request, or deployment."],
      question: "Review the branch, diff, and verification results. Decide whether to accept, revise, or discard the work."
    };
    return current;
  });
  return { mission_id: missionId, status: mission.status, branch: mission.branch, summary, next_step: "A human reviews the diff and decides what to commit or publish." };
}

async function abortMission(args) {
  const missionId = ensureString(args.mission_id, "mission_id", { max: 200 });
  const reason = ensureString(args.reason, "reason", { max: 5_000 });
  const existing = await loadMission(missionId);
  await ensureNoRunningJob(existing);
  const mission = await updateMission(missionId, (current) => {
    current.status = "aborted";
    current.abortedReason = reason;
    current.pendingGate = null;
    return current;
  });
  return { mission_id: missionId, status: mission.status, reason, branch_preserved: mission.branch, changes_preserved: true };
}

async function listKnownMissions(args) {
  const repoPath = args.repo_path ? ensureString(args.repo_path, "repo_path", { max: 4_000 }) : undefined;
  let resolvedPath;
  if (repoPath) {
    const resolved = await resolveRepository(repoPath);
    resolvedPath = resolved.repoRoot;
  }
  const missions = await listMissions(resolvedPath);
  return missions.map((mission) => ({
    id: mission.id,
    status: mission.status,
    goal: mission.goal,
    branch: mission.branch,
    repoRoot: mission.repoRoot,
    workDir: mission.workDir,
    taskCount: mission.tasks.length,
    pendingGate: mission.pendingGate,
    updatedAt: mission.updatedAt
  }));
}

const handlers = {
  doctor,
  start_mission: startMission,
  delegate_task: delegateTask,
  delegate_to_claude: (args) => delegateTask(args, "claude"),
  delegate_to_codex: (args) => delegateTask(args, "codex"),
  wait_for_job: waitForJob,
  get_mission: getMission,
  get_diff: getMissionDiff,
  run_checks: runMissionChecks,
  record_human_decision: recordHumanDecision,
  finish_mission: finishMission,
  abort_mission: abortMission,
  list_missions: listKnownMissions
};

export async function callTool(name, args = {}) {
  const handler = handlers[name];
  if (!handler) throw new OrchestratorError(`Unknown tool: ${name}`, "TOOL_NOT_FOUND");
  return await handler(args ?? {});
}
