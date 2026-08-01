import { spawn } from "node:child_process";
import { OrchestratorError } from "./errors.mjs";
import { truncate } from "./utils.mjs";

export async function runProcess(command, args = [], options = {}) {
  const {
    cwd,
    env = {},
    input,
    timeoutMs = 60_000,
    maxOutputChars = 120_000,
    rejectOnNonZero = false
  } = options;

  return await new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let finished = false;
    let timedOut = false;

    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"],
      shell: false
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2_000).unref();
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > maxOutputChars * 2) stdout = stdout.slice(-maxOutputChars);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stderr.length > maxOutputChars * 2) stderr = stderr.slice(-maxOutputChars);
    });

    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(new OrchestratorError(`Could not run ${command}: ${error.message}`, "PROCESS_START_FAILED"));
    });

    child.on("close", (code, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      const result = {
        command,
        args,
        code: code ?? -1,
        signal,
        timedOut,
        stdout: truncate(stdout, maxOutputChars),
        stderr: truncate(stderr, maxOutputChars)
      };
      if (rejectOnNonZero && (result.code !== 0 || timedOut)) {
        reject(new OrchestratorError(
          `${command} exited with code ${result.code}${timedOut ? " after timing out" : ""}`,
          timedOut ? "PROCESS_TIMEOUT" : "PROCESS_FAILED",
          result
        ));
        return;
      }
      resolve(result);
    });

    if (input !== undefined) child.stdin.end(String(input));
    else child.stdin.end();
  });
}
