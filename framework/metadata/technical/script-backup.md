# script — backup

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/backup.sh |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | Milestone 9 §2 item 6 and ADR-031 (named in the script); docs/operations/BACKUP_AND_RESTORE.md; scripts/restore-rehearsal.sh; no npm script entry |

## Purpose
Takes a logical backup of the portal PostgreSQL database: a compressed `pg_dump` with a SHA-256 checksum beside it. Stated in the script to be the interim control until the production host's automated backups and point-in-time recovery are on.

## Description
- **Arguments:** optional `[output-dir]` (default `backups`, created if missing).
- **Environment variables:** `DATABASE_URL` (required; exit 2 if unset, the script refuses to guess a database).
- **Requirements:** `pg_dump` on PATH (exit 2 otherwise); the script states pg_dump 16 is expected, matching `compose.yaml` and the Homebrew service.
- **Outputs:** `<dir>/<database>-<YYYYMMDDTHHMMSSZ>.dump` (custom format `-Fc`, `--no-owner --no-privileges`) and `<same>.dump.sha256`; prints the file, size and checksum location. The database name is taken from the URL path for the file name only; the connection string is never printed.
- **Database tables:** reads the whole database (all tables) through pg_dump; writes nothing to it.
- **External services:** none beyond the PostgreSQL server in `DATABASE_URL`.
- **Side effects:** creates files in the output directory (the default `backups/` is relative to the current directory).
- **Idempotent / destructive:** non-destructive; each run adds a new timestamped file and never overwrites or deletes earlier ones.
- **How to run:** `DATABASE_URL=postgresql://… scripts/backup.sh [output-dir]`, or locally `set -a; source .env.local; set +a; scripts/backup.sh`. No npm script and no Node needed. Verify later with `shasum -a 256 -c <file>.sha256`.
- **Safety notes:** dumps contain all personal data, so store them securely and keep them out of git (whether `backups/` is git-ignored is not determined from the script). Backups are not proven until restored, see `restore-rehearsal.sh`.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
