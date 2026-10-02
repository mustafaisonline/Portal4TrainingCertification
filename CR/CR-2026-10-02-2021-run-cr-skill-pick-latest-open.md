# CR-2026-10-02-2021 — `run-cr` skill: execute the latest CR that is not yet deployed

**Received:** 2026-10-02 20:21 MYT · **Status:** BUILT · **Requested by:** founder

## 1. Request (verbatim)

> Then in CR fodler,  there is a readme.md file which has list of all the CRs. when we ask agent to execute latest CR then it should pick the latest one which is not deployed etc etc.

## 2. Facts gathered

- `CR/README.md` index status text is inconsistent (some rows carry none, some are stale), and the index order is not strictly by timestamp. Each CR file's own `**Status:**` header and tracker are the reliable source.

## 3. Decisions & assumptions

- "Latest" = highest timestamp in the filename. "Not deployed etc." interpreted as: skip DONE, DEPLOYED, VERIFIED-and-complete, DEFERRED/BLOCKED (reported, not executed). Executable = NOT STARTED or IN PROGRESS. A CR that is only BUILT is reported as awaiting verify/deploy, not re-executed. **Assumption awaiting confirmation.**
- The skill states which CR it picked before starting, then works through its tracker one step at a time.

## 4. Plan

Add `.claude/skills/run-cr/SKILL.md`; index row. No app code, data model or dependencies. Reverse by deleting the skill.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Skill created | **BUILT** | 2026-10-02 |
| 2 | Exercised in a fresh session | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:21 | CR created; skill built. |
