# script — deploy/01-backup-serverscript.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/01-backup-serverscript.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-lib-server-promote-sh.md; script-deploy-systemd-p4tc-backup-service.md, script-deploy-systemd-p4tc-backup-timer.md |

## Purpose
Take a verified logical backup (`pg_dump -Fc`) of the production database on the server. Since managed PostgreSQL was dropped (2026-09-28) this is the sole recovery mechanism.

## Description
- **Runs on:** server (as deploy via the nightly timer or by hand; as root when called by `server-promote.sh`).
- **Pipeline position:** step 01 — the first gate of every promotion and of every DB restore (as a `pre-restore` safety snapshot); also nightly at 02:00 UTC via `p4tc-backup.timer`.
- **Invocation:** `01-backup-serverscript.sh --env production [--tag T] [--label L] [--dry-run]`. Any other argument aborts; only `production` is accepted.
- **Inputs:** `config.env` (REMOTE_BACKUP_ROOT, BACKUP_KEEP); `/etc/p4tc/production.env` (reads `DATABASE_URL`, never printed); env overrides P4TC_ETC / P4TC_OPT.
- **Outputs:** in `REMOTE_BACKUP_ROOT`: `p4tc-production-<UTC stamp>[-label].dump` (mode 600), `.sha256`, `.meta` (environment, taken_at, deployed tag/commit, newest migration, size, pg_dump version); log `/opt/p4tc/logs/01-backup.log`.
- **What it changes:** creates backup files; verifies the archive with `pg_restore --list`; prunes dumps beyond the newest BACKUP_KEEP (with sidecars) — this deletes old backups by design.
- **Safety checks:** refuses if free space is below about 2x DB size + 200 MB, if the env file or `DATABASE_URL` is missing, or if pg_dump is missing. The dump never leaves the server.
- **Idempotent:** each run adds a new timestamped dump. **Destructive:** only the retention prune. **`--dry-run`:** logs what it would do and exits 0.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
