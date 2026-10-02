# script — restore-rehearsal

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/restore-rehearsal.sh |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | Milestone 9 §2 item 6 and ADR-031 (named in the script); scripts/backup.sh; docs/operations/BACKUP_AND_RESTORE.md; no npm script entry |

## Purpose
Proves a backup dump actually restores: restores it into a scratch database and checks migrations and per-table row counts. Stated principle (ADR-031): an unrehearsed backup is an assumption, not a control.

## Description
- **Arguments:** `<dump-file>` (required, must exist) and optional `--keep` (keep the scratch database).
- **Environment variables:** `DATABASE_URL` (required; also used for the source row counts). The scratch URL is derived by swapping the database name and keeping any query string.
- **Requirements:** `psql`, `pg_restore` and `npx` on PATH (exit 2 otherwise). Node on PATH is needed for `npx prisma`: `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`.
- **Steps:** (0) verifies `<dump>.sha256` if present (mismatch exits 1); (1) `CREATE DATABASE p4tc_restore_<UTC timestamp>` on the SAME server as `DATABASE_URL` and sets its timezone to UTC; (2) `pg_restore --no-owner --no-privileges --exit-on-error`; (3) `npx prisma migrate status` against the scratch database; (4) compares row counts of every public base table (except `_prisma_migrations`, list read from `information_schema`) between source and restored copy.
- **Outputs:** a per-table count table (ok/DIFF) and `RESTORE REHEARSAL: PASS` (exit 0) or `FAIL` (exit 1). The connection string is never printed.
- **Database tables:** reads every public table of the source (counts only); creates, fills and (by default) drops a scratch database. The source is not modified.
- **External services:** none beyond the PostgreSQL server.
- **Side effects:** a temporary database on the source server; dropped on exit unless `--keep` (drop manually with the `DROP DATABASE` command the script prints).
- **Idempotent / destructive:** re-runnable (each run uses a new timestamped scratch name). The only destructive action is dropping its own scratch database. Row counts on a busy source can drift from the dump time; the migration check is the hard gate, the count check a sanity check (per the script).
- **How to run:** `DATABASE_URL=postgresql://… scripts/restore-rehearsal.sh backups/<file>.dump [--keep]`.
- **Safety notes:** needs CREATE DATABASE rights; on a managed host without them, point `DATABASE_URL` at a local PostgreSQL (the dump is portable). Restored data contains personal data; use `--keep` only deliberately.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
