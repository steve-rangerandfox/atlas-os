#!/usr/bin/env node
/**
 * Atlas human authority CLI.
 *
 * This file is the OTHER side of the boundary from hooks/atlas-guard.mjs.
 * The guard constrains agents. This CLI is how a human grants, promotes, and
 * accepts. It is deliberately NOT reachable from any agent tool surface:
 * an agent that could run these commands would hold the authority it is
 * supposed to be governed by.
 *
 *   node scripts/atlas.mjs status
 *   node scripts/atlas.mjs promote <proposal-id>   # proposal -> live mission
 *   node scripts/atlas.mjs activate <mission-id>
 *   node scripts/atlas.mjs accept <mission-id> --note "..."
 *   node scripts/atlas.mjs reject <mission-id> --note "..."
 *   node scripts/atlas.mjs advance-head <mission-id>   # re-baseline expectedHead
 *   node scripts/atlas.mjs retro <mission-id>
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, appendFileSync, renameSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const A = (...p) => path.join(ROOT, ".atlas", ...p);
const rj = (f, d = null) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch { return d; } };
const wj = (f, v) => { mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, `${JSON.stringify(v, null, 2)}\n`); };
const git = (...a) => { try { return execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim(); } catch { return ""; } };

function event(kind, detail) {
  mkdirSync(A("evidence"), { recursive: true });
  appendFileSync(A("evidence", "authority-log.jsonl"),
    `${JSON.stringify({ at: new Date().toISOString(), kind, source: "human_cli", actor: process.env.USER || "unknown", ...detail })}\n`);
}

const project = rj(A("project.json"));
if (!project) { console.error("Not an adopted Atlas project: .atlas/project.json is missing.\nRun the /atlas-adopt skill first."); process.exit(1); }

const [cmd, arg, ...rest] = process.argv.slice(2);
const noteIdx = rest.indexOf("--note");
const note = noteIdx >= 0 ? rest[noteIdx + 1] : undefined;

const missionPath = (id) => A("missions", `${id}.json`);
const loadMission = (id) => {
  const m = rj(missionPath(id));
  if (!m) { console.error(`No live mission "${id}". Live missions: ${listIds("missions").join(", ") || "(none)"}`); process.exit(1); }
  return m;
};
function listIds(dir) {
  try { return readdirSync(A(dir)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")); } catch { return []; }
}

switch (cmd) {
  case "status": {
    const active = project.activeMission;
    const branch = git("branch", "--show-current") || "(detached)";
    const head = git("rev-parse", "HEAD").slice(0, 12);
    const dirty = git("status", "--porcelain=v1", "--untracked-files=all");
    console.log(`project      ${project.name}  [${project.repository?.visibility || "?"}]`);
    console.log(`remote       ${project.repository?.remote || "?"}`);
    console.log(`branch       ${branch} @ ${head}${dirty ? `  (${dirty.split("\n").length} uncommitted)` : "  (clean)"}`);
    console.log(`node pin     ${project.runtime?.node || "unpinned"} (from ${project.runtime?.nodeSource || "?"})`);
    console.log(`dev image    ${project.runtime?.image || "not pinned"}`);
    console.log(`merge gate   ${project.gates?.mergeGate || "NOT CONFIGURED"}`);
    console.log(`release gate ${project.gates?.releaseGate || "NOT CONFIGURED"}`);
    console.log(`\nactive mission  ${active || "(none)"}`);
    if (active) {
      const m = rj(missionPath(active), {});
      console.log(`  class ${m.class}  state ${m.state}  type ${m.type || "engineering"}`);
      const ac = m.acceptanceCriteria || [];
      const by = ac.reduce((o, c) => ((o[c.status || "unwritten"] = (o[c.status || "unwritten"] || 0) + 1), o), {});
      console.log(`  criteria: ${ac.length} total — ${Object.entries(by).map(([k, v]) => `${v} ${k}`).join(", ") || "none"}`);
      const unproven = ac.filter((c) => c.status !== "green");
      if (unproven.length) console.log(`  NOT YET PROVEN:\n${unproven.map((c) => `    - [${c.id}] ${c.criterion}`).join("\n")}`);
      if (m.blockedBy?.length) console.log(`  blocked by: ${m.blockedBy.join(", ")}`);
    }
    const props = listIds("proposals");
    if (props.length) console.log(`\nproposals awaiting promotion: ${props.join(", ")}`);
    const inv = project.invariants || [];
    const weak = inv.filter((i) => i.status !== "enforced");
    if (weak.length) console.log(`\ninvariants not enforced by a test: ${weak.map((i) => i.id).join(", ")}`);
    break;
  }

  case "promote": {
    if (!arg) { console.error("usage: atlas promote <proposal-id>"); process.exit(1); }
    const src = A("proposals", `${arg}.json`);
    const proposal = rj(src);
    if (!proposal) { console.error(`No proposal "${arg}". Available: ${listIds("proposals").join(", ") || "(none)"}`); process.exit(1); }
    // Human review checklist, printed rather than assumed.
    const missing = ["premise", "outcome", "acceptanceCriteria", "nonGoals", "scope", "evidencePlan", "rollback"]
      .filter((k) => !proposal[k] || (Array.isArray(proposal[k]) && proposal[k].length === 0));
    if (missing.length) { console.error(`Proposal is not Ready. Missing: ${missing.join(", ")}\nSend it back to Mission Control.`); process.exit(1); }
    const noObservable = (proposal.acceptanceCriteria || []).filter((c) => !c.observable);
    if (noObservable.length) { console.error(`These criteria have no observable and cannot be proven: ${noObservable.map((c) => c.id).join(", ")}`); process.exit(1); }
    console.log(`Promoting "${arg}":`);
    console.log(`  scope.allowWrite = ${proposal.scope.allowWrite.join(", ")}`);
    console.log(`  This is the file allowlist agents will be able to write. Confirm it is as narrow as it should be.`);
    proposal.state = "ready";
    wj(missionPath(arg), proposal);
    renameSync(src, A("proposals", `${arg}.promoted.json`));
    event("mission_promoted", { mission: arg, scope: proposal.scope.allowWrite, note });
    console.log(`\nPromoted to .atlas/missions/${arg}.json (state: ready)\nNext: atlas activate ${arg}`);
    break;
  }

  case "activate": {
    const m = loadMission(arg);
    m.state = "active";
    m.links = { ...(m.links || {}), branch: git("branch", "--show-current"), baseCommit: git("rev-parse", "HEAD"), expectedHead: git("rev-parse", "HEAD") };
    wj(missionPath(arg), m);
    wj(A("project.json"), { ...project, activeMission: arg });
    event("mission_activated", { mission: arg, baseCommit: m.links.baseCommit, note });
    console.log(`Activated ${arg} on ${m.links.branch} @ ${m.links.baseCommit.slice(0, 12)}`);
    break;
  }

  case "advance-head": {
    const m = loadMission(arg);
    const head = git("rev-parse", "HEAD");
    const prev = m.links?.expectedHead;
    m.links = { ...(m.links || {}), expectedHead: head };
    wj(missionPath(arg), m);
    event("head_advanced", { mission: arg, from: prev, to: head, note });
    console.log(`expectedHead ${String(prev).slice(0, 12)} -> ${head.slice(0, 12)}  (baseCommit unchanged: ${String(m.links.baseCommit).slice(0, 12)})`);
    break;
  }

  case "accept":
  case "reject": {
    const m = loadMission(arg);
    const ac = m.acceptanceCriteria || [];
    const unproven = ac.filter((c) => c.status !== "green");
    if (cmd === "accept" && unproven.length) {
      console.error(`Refusing to accept ${arg}: ${unproven.length} of ${ac.length} criteria are not green.`);
      unproven.forEach((c) => console.error(`  [${c.id}] ${c.status || "unwritten"} — ${c.criterion}`));
      console.error(`\nAcceptance means the outcome is observably true. "Probably" is not acceptance.`);
      console.error(`Override deliberately with --force if you have out-of-band evidence, and say what it is in --note.`);
      if (!rest.includes("--force")) process.exit(1);
    }
    m.state = cmd === "accept" ? "accepted" : "correcting";
    wj(missionPath(arg), m);
    if (cmd === "accept") wj(A("project.json"), { ...project, activeMission: null });
    event(cmd === "accept" ? "mission_accepted" : "mission_rejected", {
      mission: arg, criteria: ac.map((c) => ({ id: c.id, status: c.status })),
      forced: rest.includes("--force"), note,
    });
    console.log(`${arg} -> ${m.state}`);
    if (cmd === "accept") console.log(`Now run: atlas retro ${arg}`);
    break;
  }

  case "retro": {
    const m = loadMission(arg);
    const log = existsSync(A("evidence", "policy-decisions.jsonl"))
      ? readFileSync(A("evidence", "policy-decisions.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
      : [];
    const denials = log.filter((d) => d.verdict === "deny" && d.mission === arg);
    const gates = existsSync(A("evidence", "authority-log.jsonl"))
      ? readFileSync(A("evidence", "authority-log.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.mission === arg)
      : [];
    const retro = {
      missionId: arg, class: m.class, outcome: m.state,
      firstPassAccepted: gates.filter((g) => g.kind === "mission_rejected").length === 0,
      correctionCycles: gates.filter((g) => g.kind === "mission_rejected").length,
      humanGatesHit: gates.filter((g) => ["mission_promoted", "mission_activated", "mission_accepted", "mission_rejected"].includes(g.kind)).length,
      humanGatesExpected: m.interruptionBudget ?? null,
      criteria: (m.acceptanceCriteria || []).map((c) => ({ id: c.id, status: c.status, test: c.acceptanceTest })),
      policyDenials: denials.reduce((o, d) => ((o[d.rule] = (o[d.rule] || 0) + 1), o), {}),
      filesTouched: git("diff", "--name-only", `${m.links?.baseCommit || "HEAD~1"}..HEAD`).split("\n").filter(Boolean),
      generatedAt: new Date().toISOString(),
      rootCausesOfFriction: [],
      notes: note || "",
    };
    wj(A("retrospectives", `${arg}.json`), retro);
    console.log(`Wrote .atlas/retrospectives/${arg}.json`);
    console.log(`gates hit ${retro.humanGatesHit} vs budget ${retro.humanGatesExpected ?? "unset"}; corrections ${retro.correctionCycles}`);
    if (Object.keys(retro.policyDenials).length) console.log(`policy denials: ${JSON.stringify(retro.policyDenials)}`);
    console.log(`\nFill in rootCausesOfFriction by hand — that field is the whole point.`);
    break;
  }

  default:
    console.log(readFileSync(new URL(import.meta.url), "utf8").split("*/")[0].split("/**")[1].replace(/^\s*\*ent?/gm, "").replace(/^\s*\* ?/gm, ""));
    process.exit(cmd ? 1 : 0);
}
