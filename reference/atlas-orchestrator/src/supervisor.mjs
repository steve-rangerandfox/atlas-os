#!/usr/bin/env node
import { recoverPendingJobs } from "./lib/supervisor.mjs";

const once = process.argv.includes("--once");
const intervalIndex = process.argv.indexOf("--interval-seconds");
const requested = intervalIndex >= 0 ? Number(process.argv[intervalIndex + 1]) : 10;
const intervalMs = Math.max(2, Math.min(300, Number.isFinite(requested) ? requested : 10)) * 1_000;

async function inspect() {
  const report = await recoverPendingJobs();
  if (once || report.outcomes.length) process.stdout.write(`${JSON.stringify(report)}\n`);
}

await inspect();
if (!once) {
  const timer = setInterval(() => inspect().catch((error) => console.error(error)), intervalMs);
  process.on("SIGTERM", () => { clearInterval(timer); process.exit(0); });
  process.on("SIGINT", () => { clearInterval(timer); process.exit(0); });
}
