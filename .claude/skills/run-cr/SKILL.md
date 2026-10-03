---
name: run-cr
description: Scan every open Change Request in CR/, plan which can run in parallel or in sequence, flag which run in this terminal and which need a new terminal on a different Claude model, then execute. Use when the founder says "run CR", "execute the open CRs" or "do the latest CR".
---

# Run open CRs

If the founder names one CR, run only that one (steps 4–8). Otherwise plan and run **all** open CRs:

## A. Scan and classify
1. Read `CR/README.md`, then open every CR file; the CR's own `**Status:**` header and `## 5. Tracker` win over the index. Order by filename timestamp.
2. Classify:
   - **Executable:** NOT STARTED or IN PROGRESS.
   - **Needs the founder first:** open question, missing screenshot/reproduction, BLOCKED, RED gate awaiting approval, DEFERRED.
   - **Awaiting verify/commit/deploy:** BUILT / BUILT & VERIFIED. Report; do not re-execute.
   - **Skip:** DONE, DEPLOYED. Legacy entries outside `CR/` are deployed; ignore.

## B. Plan execution
3. For each executable CR open its spec (`cr-spec` if missing; run `impact-analysis` first when the impacted-elements inventory is empty), list the files it will touch and its risk (data model, dependency, auth, payments = RED gate → not auto-run).
4. Build the order:
   - **Parallel group:** CRs with disjoint files, no data-model/dependency change, not RED, not depending on each other's output. Run as worktree-isolated subagents (`Agent` with `isolation: "worktree"`, `exec-developer`), merge one at a time, resolve conflicts, then test.
   - **Sequence:** CRs that share files or components, depend on each other (note CR cross-references), or whose overlap is unclear. **When unsure, sequence.**
   - Tests run **serially** (one `next dev` per project dir; Playwright port 3101), after the code changes of a group are merged.
5. The model of each CR is the last part of its file name (`…-sonnet.md`, `-opus`, `-haiku`, `-fable`); confirm with `model-recommend` if unsure. Compare with this session's model.
   - **This terminal:** recommended model equals this session's. 
   - **New terminal:** recommended model differs. Give the exact commands per group — from the repository folder: `claude --worktree --model <id>` (own git worktree on its own branch; `node_modules` is symlinked by settings; copy `.env.local` in if missing), then `run-cr CR-<name>`. Two terminals must never work in the same checkout; only one runs Playwright (port 3101) at a time. Buddy merges the worktree branch into `main` when the CR is VERIFIED. Do not execute these here unless the founder says "continue here".
6. **Show the plan before executing**, as one table: CR · task · model · where (this terminal / new terminal + command) · parallel group or sequence position · blocker or question for the founder. Highlight the "new terminal" rows. A parallel set run in new terminals must use separate worktrees/branches, never the same checkout at the same time.

## C. Execute (the this-terminal set)
7. Execute per `CLAUDE.md` and each spec. Keep each task's status in both the CR tracker and the spec's task table, and update the spec's **Resume here** whenever you stop, so another terminal can continue: pre-flight, smallest change, stop and ask at RED gates or ambiguity, never invent business rules. After each step update the CR tracker, status header, progress log (MYT) and its `CR/README.md` row. Validate with `test-verifier`; review significant changes with `governance-reviewer`.
8. Update `framework/milestones.md` / `framework/wbs.md` when a milestone or WBS task is achieved.
9. Commit one CR per commit (stage files by name). **Before any deploy:** `test-verifier` PASS and `governance-reviewer` PASS recorded in the CR log (mandatory), plus `security-review` when auth, sessions, payments, uploads, env/config or deploy scripts changed. Push and deploy only on the founder's word, or in Buddy Autonomous mode (subject to Buddy's stop conditions). Prefer one deploy at the end for the whole batch.
10. Finish with a summary table: CR → done / needs-founder / needs-new-terminal / blocked, and the questions waiting on the founder.
11. **Reminder rule.** A CR that cannot run now stays open: leave its status unchanged (never mark it done), add one dated progress-log line saying what it waits for, and list it in every run's summary. The next `run-cr` rescans it and runs it as soon as the blocker is gone. Re-running `run-cr` is the standing reminder of everything still pending.
