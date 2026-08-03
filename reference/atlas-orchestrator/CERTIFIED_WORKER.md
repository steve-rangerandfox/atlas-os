# Certified Autonomous Worker

Atlas 0.5 makes environment readiness durable and project-specific. Certification is evidence, not permission: a passing preflight proves that the selected local worker currently satisfies a profile, while standing authorization controls which bounded preparation operations Atlas may perform.

## Readiness profiles

Profiles are stored on the adopted project record under `readinessProfiles`. Relay adoption seeds three editable templates:

- `relay-development`: exact runtimes, executor authentication and provider policy, registry reachability, cache, lockfile, Git, and artifact checks;
- `relay-validation`: development requirements plus Playwright and a browser runtime;
- `relay-release`: validation requirements plus a configured Git upstream.

The seeded Node version is the version running Atlas at adoption time. The npm version is an explicit template pin and should be changed to the repository's authoritative version before certification. Use `set_readiness_profile` to persist the exact project contract and optionally make it the default.

A preflight verifies:

1. exact Node.js and package-manager versions;
2. the selected executor executable and authentication;
3. controller/executor same-provider policy;
4. worker HTTPS reachability only to profile-declared endpoints;
5. writable repository-local cache directories;
6. a supported lockfile and deterministic restore command availability;
7. Playwright package and browser executable availability when required;
8. clean/named Git state and an upstream for release profiles;
9. ability to write certification artifacts.

The report is stored under `project.certifications[profile]` and `project.lastCertification`. For an adopted project, executor and verification jobs require a passing, unexpired certification tied to the mission's exact branch and base commit. Profiles default to a 60-minute validity window and may set `validForMinutes` from 1 to 1,440. Existing 0.4 project and mission JSON remains readable; missing 0.5 fields are initialized when a project is re-adopted or configured.

## Standing authorization

All operations default to denied. `set_standing_authorization` can opt a project into:

- `runtime_setup`: create declared repository-local caches and verify the pinned Node runtime;
- `dependency_restore`: run the detected manager's immutable/frozen lockfile restore with lifecycle scripts disabled by default;
- `network_policy_check`: re-run only profile-declared HTTPS probes;
- `artifact_generation`: write the current certification JSON under the declared repository-local artifact directory;
- `worker_restart`: recover safe durable pending jobs.

No tool accepts a command string. Standing authorization can never permit secret access, production mutation, external communications, arbitrary shell execution, Git publication, pull requests, deployment, or release.

## Recovery and supervision

Jobs record a worker PID, launch time, heartbeat, and attempt count. Recovery inspects durable queued/running jobs and current Git invariants:

- a live worker is left alone;
- a queued job may restart when branch and HEAD still match;
- a verification job may restart because named checks are bounded and repeatable;
- an interrupted executor job moves to `needs_human`, because partial repository edits make automatic replay unsafe;
- any branch or HEAD mismatch moves the mission to a human gate.

Run one reconciliation pass with:

```bash
node src/supervisor.mjs --once
```

For a local long-running supervisor:

```bash
npm run supervisor -- --interval-seconds 10
```

This is process supervision for one local machine, not a durable distributed queue. A disposable Codespace or VM remains the recommended environment.

## One-command entry point

```bash
node src/cli.mjs run <project-id|exact-name|repo-path> [--profile <name>]
```

The command resolves the adopted project, performs authorized recovery, certifies the selected profile, persists evidence, and reports the active mission and exact next action. Preparation operations remain explicit; a failed preflight does not silently install software or relax policy.

## Native operation limits

Pinned runtime setup validates the runtime already provisioned by the worker image and creates declared caches. Atlas 0.5 deliberately does not download Node.js, browsers, or package managers. Dependency restore is lockfile-based and uses fixed argument arrays. Browser installation remains an image/bootstrap responsibility. These limits keep the local-first implementation auditable and avoid turning MCP into a general-purpose shell.
