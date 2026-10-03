---
name: new-cr
description: Evaluate a new requirement and create its Change Requisitions in CR/ — one CR per recommended Claude model, with the model name at the end of the file name — plus the index rows. Use at the start of any new requirement, before changing code or configuration.
---

# New Change Requisition

CLAUDE.md makes a CR mandatory before any code or config change.

## 1. Evaluate and analyse first
1. Read the requirement; check it against `framework/brd.md`, the decision records and the open CRs.
2. Run the `impact-analysis` skill (agent `br-impact-analyst`) so the whole workspace is scanned for what the requirement touches. Its findings feed the spec.
3. Split the work into **tasks**, then **group tasks by the Claude model each needs** (`model-recommend`: haiku / sonnet / opus / fable). **One CR per model.** Related tasks that can run on the same model share one CR, one tracker row each. A task that is a RED gate stands in its own CR so it can wait for approval without blocking the rest. State the grouping and why.
4. If grouping or any step has several sensible choices, return the options with your recommendation to Buddy, who asks the human.

## 2. Create each CR
5. Time: `TZ=Asia/Kuala_Lumpur date '+%Y-%m-%d-%H%M'` (use a later minute for each further CR of the same bundle so names stay unique).
6. File name: `CR/CR-<YYYY-MM-DD-HHMM>-<short-kebab-title>-<model>.md`, where `<model>` is `haiku`, `sonnet`, `opus` or `fable`. The model is the last part of the name so the human sees at a glance which terminal and model to use.
7. Contents (structure of `CR/CR-2026-10-03-1048-…-sonnet.md`):
   - Header: `# CR-<stamp> — <title>`, Received (MYT), Status, Requested by, **Recommended model: <full name> — <reason>**, link to the spec.
   - `## 1. Request (verbatim)` — the founder's exact words, never paraphrased.
   - `## 2. Facts gathered` · `## 3. Decisions & assumptions` · `## 4. Plan` (data-model change = RED gate: stop and ask).
   - `## 5. Tracker` — table `# | Task | Status | Updated`; one row per task; statuses OPEN → IN PROGRESS → BUILT → VERIFIED → DEPLOYED, plus CLOSED and BLOCKED.
   - `## 6. Progress log` — dated lines, newest last.
8. Add a row at the top of `CR/README.md` (newest first) with the model in the title. Name the WBS task and milestone (`framework/wbs.md`, `framework/milestones.md`) or write "unplanned change request".
9. Create the CR's specification with the `cr-spec` skill (one spec per CR, same name) before any code.
10. Tell the founder which CRs exist and, for each, which terminal/model runs it (the ones matching the current session run here; the rest: new terminal, `claude --model <id>`, then `run-cr`). Commit, push and deploy only on the founder's word or in Buddy Autonomous mode.

Argument, if given, is the request text or title. Finished CRs keep their historical names; the model suffix applies to new and open CRs.
