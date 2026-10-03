# CR-2026-10-03-1149 — Production restore rehearsal (parked)

**Received:** 2026-10-03 11:49 MYT · **Status:** PARKED — founder: "we will look into later" · **Requested by:** founder
**Recommended model:** Sonnet 5.5 — operational procedure on the server; no code.

## 1. Request (verbatim)

> Pelase partk these two i.e., your email-provider choice (CR-2015), and the production restore rehearsal
>
> As seperate CR we will look into later.

## 2. Facts gathered

- Since 2026-09-28 the nightly `pg_dump` on the Droplet is the **sole** recovery mechanism (managed PostgreSQL / point-in-time recovery dropped). No production dump has ever been restored anywhere.
- 2026-10-03 (CR-2026-10-03-1122): the rehearsal was run **locally against the dev database** — PASS (migrations present, every table's row count matched). That proves the scripts, not the production dumps.
- `scripts/restore-rehearsal.sh` restores a dump into a scratch database on the same server and drops it afterwards — non-destructive. `deploy/07-rollback.sh --restore-db` replaces the live database — destructive; the guard hook asks before it.
- Open question the rehearsal would answer: whether anything outside the database (uploaded photos, the server env file) needs its own backup for a complete restore.

## 3. Decisions & assumptions

- Parked by the founder. Resume when the founder says so; `resume-work` and `run-cr` list it every session until then.
- When resumed, **Level 1 first** (non-destructive, on the Droplet, ~10 minutes, needs the founder's go-ahead because it touches the production server). Level 2 (the destructive drill) only if the founder wants it, on a quiet day, after a fresh backup, with the founder present.

## 4. Plan (when resumed)

1. SSH to the Droplet as the deploy user; locate the latest nightly dump and its checksum. 2. Run `scripts/restore-rehearsal.sh <dump>` with `DATABASE_URL` pointing at the server's PostgreSQL (scratch database created and dropped there). 3. Record PASS/FAIL, row counts and duration here and in `framework/metadata/operational/procedure-backup-and-restore.md`. 4. Check what else a full restore needs (uploads, env) and record it. 5. Update `framework/capability-gaps.md` G8.

## 5. Tracker

| # | Task | Status | Updated |
|---|---|---|---|
| T1 | Level 1 rehearsal on the Droplet | PARKED | 2026-10-03 |
| T2 | Record results; completeness check (uploads, env) | PARKED | 2026-10-03 |
| T3 | Level 2 destructive drill (optional, founder present) | PARKED | 2026-10-03 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 11:49 | CR created and parked on the founder's instruction. |
