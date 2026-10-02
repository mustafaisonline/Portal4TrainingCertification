# CR-2026-10-02-2045 — Framework follow-ups: multi-task CRs, milestone move, metadata, push

**Received:** 2026-10-02 20:45 MYT · **Status:** BUILT — pushed · **Requested by:** founder

This CR deliberately groups several related tasks (the founder's new rule: a CR may hold multiple related tasks).

## 1. Request (verbatim)

> Repsone: Pelase note skill i.e., new-cr will first evalute the requirementr and will be able have multiple related tasks in one CR as well. ITs not compulsiry to have one task one CR.
>
> 1. Is keeping the CR filename style acceptable, or do you want the 30+ CR files renamed to `cr_<timestamp>.md`? Renaming means rewriting every reference to them.
> response: change as per your suggestions and reweite every refernce.
>
> 1. Should I move the milestone plans and reports into `framework/` too?
> Response: If this is hte right thing to do then yes do it.
>
> 1. Which should I do first: write the table and script metadata, or push the five local commits (the earlier ones plus this one)?
> Reposne, write the table and script metadat and can push evertyhgn together.

## 2. Facts gathered

- My suggestion in the question was to **keep** the CR filename style (binding in `CLAUDE.md`, 30+ files) → read as "keep it"; no rename, so no references to rewrite.
- 28 milestone plan/report/impact files in `docs/execution/`; no code or script references them (markdown only).

## 3. Decisions & assumptions

- **T1** `new-cr` evaluates the requirement first and groups related tasks into one CR when sensible; one task per CR is not compulsory.
- **T2** CR naming unchanged (founder accepted my suggestion).
- **T3** Milestone plans/reports **moved** to `framework/milestones/` (decided right: keeps `milestones.md` beside the records it indexes; `git mv`, links rewritten, reversible).
- **T4** Metadata written for every database table (from `prisma/schema.prisma`) and every script in `scripts/` and `deploy/`, docs only.
- **T5** Push everything to `origin/main` (founder's explicit word).

## 4. Plan

T1: edit `new-cr`, `buddy`, `CR/README.md`, `CLAUDE.md` wording. T3: `git mv docs/execution/MILESTONE_*` → `framework/milestones/`, rewrite links, link check. T4: `framework/metadata/technical/` files + index. T5: push after checks. No app code, data model, dependency or deployment change.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| T1 | Multi-task CR rule in skill/agent/docs | **BUILT** | 2026-10-02 |
| T3 | Milestone files moved, links fixed | **BUILT** | 2026-10-02 |
| T4 | Table and script metadata | **BUILT** | 2026-10-02 |
| T5 | Push | **DONE** (on push) | 2026-10-02 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:45 | CR created. |
| 2026-10-02 | T1 done. T3: 28 milestone files `git mv`'d to `framework/milestones/`, 24 files' links rewritten, link check across all .md = 0 broken. T4: 50 table files + enums generated from the schema; 11 `scripts/` and 23 `deploy/` script/config files plus `procedure-governed-deploy.md` written by subagents from the sources; indexes built; secret scan clean. Observations: `scripts/bulk-review-questions.ts` has no admin check; `p4tc-backup.service` header and `p4tc-reminders.service` (`docker.service` in After=) are stale; `VALIDATION_TIMEOUT_SEC` unused. None acted on. |
