import { appendFile, lstat, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { OrchestratorError } from "./errors.mjs";
import { runProcess } from "./process.mjs";

async function git(cwd, args, options = {}) {
  return await runProcess("git", args, {
    cwd,
    timeoutMs: options.timeoutMs ?? 60_000,
    maxOutputChars: options.maxOutputChars ?? 120_000,
    rejectOnNonZero: options.rejectOnNonZero ?? true
  });
}

export async function resolveRepository(inputPath) {
  const workDir = path.resolve(inputPath || process.cwd());
  const rootResult = await git(workDir, ["rev-parse", "--show-toplevel"]);
  const repoRoot = path.resolve(rootResult.stdout.trim());
  if (workDir !== repoRoot && !workDir.startsWith(`${repoRoot}${path.sep}`)) {
    throw new OrchestratorError("Working directory is outside the Git repository", "INVALID_REPOSITORY");
  }
  return { repoRoot, workDir };
}

export async function getGitSnapshot(repoRoot) {
  const [branch, commit, status] = await Promise.all([
    git(repoRoot, ["branch", "--show-current"], { rejectOnNonZero: false }),
    git(repoRoot, ["rev-parse", "HEAD"]),
    git(repoRoot, ["status", "--porcelain=v1", "--untracked-files=normal"])
  ]);
  return {
    branch: branch.stdout.trim() || "(detached HEAD)",
    commit: commit.stdout.trim(),
    clean: status.stdout.trim().length === 0,
    status: status.stdout.trim()
  };
}

export async function ensureOrchestratorIgnored(repoRoot) {
  const result = await git(repoRoot, ["rev-parse", "--git-path", "info/exclude"]);
  const rawPath = result.stdout.trim();
  const excludePath = path.isAbsolute(rawPath) ? rawPath : path.resolve(repoRoot, rawPath);
  await mkdir(path.dirname(excludePath), { recursive: true });
  let contents = "";
  try {
    contents = await readFile(excludePath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const lines = contents.split(/\r?\n/).map((line) => line.trim());
  if (!lines.includes(".orchestrator/")) {
    const prefix = contents.length && !contents.endsWith("\n") ? "\n" : "";
    await appendFile(excludePath, `${prefix}# ChatGPT-Claude orchestrator state\n.orchestrator/\n`);
  }
}

export async function createBranch(repoRoot, branchName) {
  const result = await git(repoRoot, ["switch", "-c", branchName], { rejectOnNonZero: false });
  if (result.code === 0) return;
  const fallback = await git(repoRoot, ["checkout", "-b", branchName], { rejectOnNonZero: false });
  if (fallback.code !== 0) {
    throw new OrchestratorError("Could not create the mission branch", "BRANCH_CREATE_FAILED", {
      switchError: result.stderr,
      checkoutError: fallback.stderr
    });
  }
}

export async function getChangedFiles(repoRoot) {
  const result = await git(repoRoot, ["status", "--porcelain=v1", "--untracked-files=normal"]);
  return result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => ({ status: line.slice(0, 2), path: line.slice(3).trim() }));
}

export async function getDiff(repoRoot, filePath = undefined, maxOutputChars = 80_000) {
  const args = ["diff", "--no-ext-diff", "--no-color"];
  if (filePath) args.push("--", filePath);
  const unstaged = await git(repoRoot, args, { rejectOnNonZero: false, maxOutputChars });
  const stagedArgs = ["diff", "--cached", "--no-ext-diff", "--no-color"];
  if (filePath) stagedArgs.push("--", filePath);
  const staged = await git(repoRoot, stagedArgs, { rejectOnNonZero: false, maxOutputChars });
  const untracked = filePath
    ? ""
    : (await getChangedFiles(repoRoot)).filter((entry) => entry.status === "??").map((entry) => entry.path).join("\n");
  return {
    unstaged: unstaged.stdout,
    staged: staged.stdout,
    untrackedFiles: untracked ? untracked.split("\n") : []
  };
}

export async function getDiffStat(repoRoot) {
  const result = await git(repoRoot, ["diff", "--stat", "--no-color"], { rejectOnNonZero: false });
  return result.stdout.trim();
}

export async function diffCheck(repoRoot) {
  return await git(repoRoot, ["diff", "--check"], { rejectOnNonZero: false });
}

export async function getUntrackedPatch(repoRoot, relativePath, maxOutputChars = 40_000) {
  const root = path.resolve(repoRoot);
  const absolute = path.resolve(root, relativePath);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    throw new OrchestratorError("Untracked path escapes the repository", "INVALID_PATH");
  }
  let info;
  try {
    info = await lstat(absolute);
  } catch (error) {
    return { path: relativePath, skipped: true, reason: `Could not inspect file: ${error.message}` };
  }
  if (!info.isFile()) {
    return { path: relativePath, skipped: true, reason: info.isSymbolicLink() ? "Symbolic links are not expanded" : "Not a regular file" };
  }
  if (info.size > 1_000_000) {
    return { path: relativePath, skipped: true, reason: `File is too large to return (${info.size} bytes)` };
  }
  const result = await git(repoRoot, ["diff", "--no-index", "--no-color", "--", "/dev/null", relativePath], {
    rejectOnNonZero: false,
    maxOutputChars
  });
  return { path: relativePath, skipped: false, patch: result.stdout, stderr: result.stderr };
}
