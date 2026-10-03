# CR-2026-10-03-1115 — `advisor` agent: what to do next, and which agents/skills are missing

**Received:** 2026-10-03 11:15 MYT · **Status:** BUILT — not yet exercised · **Requested by:** founder
**Recommended model:** Sonnet 5.5 — agent/skill authoring. Executed on Fable 5.1 (this session, higher tier).

Spec: [`CR-SPEC-2026-10-03-1115-advisor-agent-sonnet.md`](specs/CR-SPEC-2026-10-03-1115-advisor-agent-sonnet.md)

## 1. Request (verbatim)

> Here we run a new requiermet, I wuld like to add one more agent
>
> - I also need an advisor agent which should tell us what to do next based on the best practice and based on what agents and skills we have. If we are should of relevant agents and skills then it should advice human to make those.

## 2. Facts gathered

- No advisor exists (`.claude/agents`, `.claude/skills` checked). The roster lives in `framework/agents-and-skills.md` and Buddy's table; the known solution gaps exist only in a chat answer (2026-10-03) — nowhere persistent.
- Impact: new files only; Buddy roster, catalogue and `initiate.md` gain a line. No application code.

## 3. Decisions & assumptions

- `advisor` is **read-only and advisory**: it recommends, never builds. When a needed agent or skill is missing it tells the human (through Buddy) to create it, naming the agent/skill, its purpose and the skill to build it with (`skill-creator`).
- Two skills: `next-steps` (what to do next for a goal or for the project, per best practice and the framework order, mapped to existing agents/skills) and `capability-gap` (roster coverage check; maintains the gap register).
- A persistent register, `framework/capability-gaps.md`, seeded with the nine gaps named on 2026-10-03, so advice survives sessions (Service Restart Test for the solution itself).
- Buddy consults the advisor at the start of every new goal and whenever a CR completes or stalls. **Assumption.**

## 4. Plan

See the spec.

## 5. Tracker

| # | Task | Status | Updated |
|---|---|---|---|
| T1 | `advisor` agent | BUILT | 2026-10-03 |
| T2 | `next-steps`, `capability-gap` skills | BUILT | 2026-10-03 |
| T3 | `framework/capability-gaps.md` register, seeded | BUILT | 2026-10-03 |
| T4 | Buddy roster/order, catalogue, `initiate.md` | BUILT | 2026-10-03 |
| T5 | First real run (next requirement) | OPEN | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 11:15 | CR created; T1–T4 built. |
