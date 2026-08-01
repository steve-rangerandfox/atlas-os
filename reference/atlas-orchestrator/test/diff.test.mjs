import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getDiff } from "../src/lib/git.mjs";
import { runProcess } from "../src/lib/process.mjs";

async function git(cwd, ...args) {
  await runProcess("git", args, { cwd, rejectOnNonZero: true });
}

test("targeted diff reports a requested untracked file", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "atlas-diff-test-"));
  const repo = path.join(root, "repo");
  await mkdir(repo, { recursive: true });
  await git(repo, "init", "-b", "main");
  await git(repo, "config", "user.name", "Test User");
  await git(repo, "config", "user.email", "test@example.com");
  await writeFile(path.join(repo, "README.md"), "# Test\n");
  await git(repo, "add", "README.md");
  await git(repo, "commit", "-m", "initial");
  await writeFile(path.join(repo, "new-file.txt"), "new content\n");

  const diff = await getDiff(repo, "new-file.txt");
  assert.deepEqual(diff.untrackedFiles, ["new-file.txt"]);
});
