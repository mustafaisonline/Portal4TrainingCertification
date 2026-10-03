# CR-2026-10-03-1048 — CR/spec convention (model in the name), impact analysis, Buddy routing, ask-with-recommendation

**Received:** 2026-10-03 10:48 MYT · **Status:** BUILT — awaiting founder review · **Requested by:** founder
**Recommended model:** Sonnet 5.5 — skill/agent/documentation authoring; this session is Sonnet 5.5, so executed here.

Spec: [`CR-SPEC-2026-10-03-1048-cr-model-naming-impact-analysis-roster-sonnet.md`](specs/CR-SPEC-2026-10-03-1048-cr-model-naming-impact-analysis-roster-sonnet.md)

## 1. Request (verbatim)

> * Please note, the connection between a CR and CR-Spec files
>    * CR
>       * At the moment, we have a concept that bundle up all those task which can be run with one model into one cr file and the ones which need different models, ask human to open a new terminal, select proposed model and execute the CR
>       * Its means, we have one bundle of requirements which we divided into multiple CR. Please add model name right into the end of these CR names so when human see it, human will know which to run in different terminal with which model
>       * These files will have status of each task, which are open, which arena progress, which are closed etc.
>    * CR-Spec
>       * Each file in this folder is one to one file for CR file. These files will contain each and every element in the portal which will be impacted by the tasks in the CR files.
>       * Aim of these files is to contain all information about the changes required. So if we have start new terminal, we can refer to this file to start where left.
>       * These files will have status of each task, which are open, which arena progress, which are closed etc.
> * I want to add new agent and skill
>    * Check if we already have, if not, we need skills and an agent for impact analysis i.e., whenever we have a new requirement, it will go a thorough impact analysis of the whole workplace and see where change are required and those will be recorded in cr-specs files.
> * Buddy agent will have all the agents and skills names so when a new chat comes in, it will evaluate  which agents it enable to check the goal and agents will evaluate which skills are required to deliver the goal.
>
> • ⁃ If any action by agent have multiple actions, then it should ask human with its own recommendations.

## 2. Facts gathered

- Existing: `new-cr` already groups tasks into one CR; `model-recommend` already names a model per CR/task; `cr-spec` writes a spec per CR but without a status column or an impacted-element inventory; there was **no impact-analysis agent or skill** (checked `.claude/agents`, `.claude/skills`).
- Open CRs today: only CR-2015 (email, blocked). All other CRs are DEPLOYED/DONE.
- CR naming is binding in `CLAUDE.md` (line 56) and `CR/README.md`.

## 3. Decisions & assumptions (awaiting founder confirmation)

- **Naming:** `CR-YYYY-MM-DD-HHMM-short-title-<model>.md`, model slug = `haiku` | `sonnet` | `opus` | `fable`. A requirement bundle is split into **one CR per recommended model**; each CR runs in a terminal on that model. The spec file mirrors the name: `CR/specs/CR-SPEC-YYYY-MM-DD-HHMM-short-title-<model>.md` (strict 1:1).
- **Applies from now on and to open CRs.** CR-2015 (open) is renamed `…-sonnet`. Finished CRs (DONE/DEPLOYED) keep their names — renaming history would break dozens of traceability references for no resume benefit. **Assumption.**
- Task and status vocabulary in CR and spec: OPEN → IN PROGRESS → BUILT → VERIFIED → DEPLOYED / CLOSED (BLOCKED when waiting).
- New agent `br-impact-analyst` and skills `impact-analysis`, `impact-record`; run for every new requirement before specs are written. Findings go in the spec's "Impacted elements" inventory.
- Buddy carries the full agent and skill roster and the routing rule; each agent file lists the skills it uses.
- **Rule for every agent:** when an action has several possible choices, return the options with a recommendation to Buddy, who asks the human (subagents cannot ask directly).

## 4. Plan

Edit `new-cr`, `cr-spec`, `run-cr`; add `br-impact-analyst`, `impact-analysis`, `impact-record`; edit all agent files (skills + multiple-options rule), `buddy.md`, `framework/initiate.md`, `framework/agents-and-skills.md`, `CLAUDE.md` (CR naming sentence), `CR/README.md` (naming, template, status vocabulary); rename CR-2015. No app code, data model or dependency.

## 5. Tracker

| # | Task | Status | Updated |
|---|---|---|---|
| T1 | CR naming with model suffix; CR split by model; status vocabulary (skills, CR/README, CLAUDE.md) | BUILT | 2026-10-03 |
| T2 | CR-spec convention: 1:1, status per task, impacted-element inventory, resume section | BUILT | 2026-10-03 |
| T3 | Impact-analysis agent and skills | BUILT | 2026-10-03 |
| T4 | Buddy roster and routing; skills listed in every agent | BUILT | 2026-10-03 |
| T5 | Multiple-options rule in every chat and every agent | BUILT | 2026-10-03 |
| T6 | Rename open CR-2015 with model suffix | BUILT | 2026-10-03 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 10:48 | CR created; all tasks built (this CR and its spec are the first to follow the new convention). Not yet exercised in a fresh session. |
