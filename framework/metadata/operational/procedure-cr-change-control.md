# procedure — CR change control

| Field | Value |
|---|---|
| Category | operational |
| Kind | procedure |
| Source of truth | `CLAUDE.md` ("Change requisitions"), `CR/README.md`, `framework/initiate.md` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | CLAUDE.md; `CR/README.md`; `framework/initiate.md`; CR-2026-10-02-2030 (autonomous mode) |

## Purpose
Make every founder requirement, fix or decision a traceable, resumable record before any code or configuration changes.

## Description
- **Rule (binding):** each new requirement becomes one file `CR/CR-YYYY-MM-DD-HHMM-short-title.md`, timestamp in Malaysia time, created before any change. A row is added to the index in `CR/README.md`. Work is one CR at a time.
- **Contents of a CR:** request verbatim; facts gathered with sources; decisions and assumptions; plan (files, data or schema impact, tests, docs; a schema change is a RED gate); tracker with statuses NOT STARTED, IN PROGRESS, BUILT, VERIFIED, DEPLOYED; dated progress log, updated after every step.
- **Resuming:** read `docs/execution/PROJECT_STATUS.md`, then the `CR/README.md` index, then open every CR not DONE or DEPLOYED and continue from its tracker. A DEFERRED CR (for example the email provider) is raised with the founder at the start of the next session.
- **Working agreement (CR/README.md):** one tracker step at a time on the founder's go (a CR may hold several related tasks); commit, push and deploy only on the founder's word, except in `buddy` Autonomous mode where the founder granted them (CR-2026-10-02-2030); report honestly what was and was not tested.
- **Framework flow (`framework/initiate.md`):** the founder talks to Buddy; each chat starts with the `resume-work` skill; a new requirement goes to a new CR (`new-cr` skill), then a spec (`cr-spec`, in `CR/specs/CR-SPEC-*.md`), then execution (`run-cr`). Guardrails are in `framework/guardrails.md`.
- Git safety from CLAUDE.md applies when committing: stage only relevant files, no bulk adds, intended remote only.

## Preconditions
None beyond reading the three sources.

## Safety notes
Do not change code or configuration before the CR file exists. Do not invent business rules; record assumptions in the CR for confirmation.

## Change history
- 2026-10-02 — created from CLAUDE.md, `CR/README.md` and `framework/initiate.md`.
