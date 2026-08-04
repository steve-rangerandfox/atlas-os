---
name: atlas-retrospective
description: Close out a mission by generating and interpreting its retrospective. Use after a mission is accepted, abandoned, or superseded — every time, without exception.
---

# Mission retrospective

Atlas can complete missions and still be getting worse. This is the only mechanism that would tell you.

## Generate

`node <plugin>/scripts/atlas.mjs retro <mission-id>` writes `.atlas/retrospectives/<id>.json` with what can be computed: outcome, correction cycles, human gates hit vs budget, criteria status, policy denials by rule, files touched.

## Interpret — this is the part a human or agent must actually do

Fill `rootCausesOfFriction` from the evidence, using these categories. Be specific; the category alone is useless.

- `spec` — the mission was underspecified. What was missing? That becomes a mission-linter rule.
- `policy` — a control denied legitimate work. Which rule, and was the denial correct? If correct, the mission scope was wrong. If incorrect, the rule needs narrowing — and that is a change only a human makes.
- `env` — the environment was not what the certification claimed. What drifted?
- `model` — the agent misunderstood something a better prompt or a role boundary would have caught.
- `human_latency` — Atlas was waiting on you. How long, and was the gate necessary?
- `novelty` — genuinely new problem. The only category that is not a defect.

## The numbers that matter

Track these across retrospectives, and look at the trend rather than any single mission:

| Metric | What a bad trend means |
|---|---|
| Human gates per accepted mission | The core thesis is failing. This is the headline number. |
| First-pass acceptance rate | Missions are underspecified, or review is rubber-stamping. |
| Correction cycles | The plan/mission boundary is leaking. |
| Review escape rate — defects found at acceptance that review missed | Review independence is compromised. |
| Governance overhead ratio — tokens and human minutes on governance ÷ on implementation | Atlas is becoming ceremony. If a 40-line fix costs six artifacts, define the Express lane. |
| Policy denials that were *correct* | Rising is good: the guard is catching real drift. |
| Invariants at `asserted-only` | The Constitution is becoming aspirational. |

## Standing rule

If `humanGatesHit > humanGatesExpected`, that is a **tracked defect of Atlas**, not of the mission. Record the root cause. This is the feedback loop that turns "I am still the message bus" from a feeling into a number you can drive down.
