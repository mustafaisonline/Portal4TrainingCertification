# procedure — Backup and restore

| Field | Value |
|---|---|
| Category | operational |
| Kind | procedure |
| Source of truth | `docs/operations/BACKUP_AND_RESTORE.md`, `scripts/backup.sh`, `scripts/restore-rehearsal.sh`, `deploy/01-backup-serverscript.sh` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | ADR-031; ADR-046 (K3 reversed 2026-09-28); [procedure-governed-deploy.md](procedure-governed-deploy.md); `framework/metadata/technical/script-deploy-01-backup-serverscript-sh.md`; [runbook-monitoring-and-incidents.md](runbook-monitoring-and-incidents.md) |

## Purpose
Protect the one stateful service (PostgreSQL), prove that a dump restores, and describe what to do in an actual restore.

## Description
**What is protected:** the whole PostgreSQL database (users, profiles with the encrypted ID-number column, orders, payments, certificates, audit log and so on). There is no object storage. A restore cannot undo an email already sent or a shared certificate verification URL.

**Banner caveat in the source (2026-09-28):** the document's assumption of managed-host point-in-time recovery no longer applies. PostgreSQL is self-hosted on the Droplet, so the nightly dump is the sole recovery mechanism and RPO is bounded by how recently it ran. The document has not been fully rewritten for `deploy/`; `deploy/README.md` section 5 is the operative rollback and restore procedure.

**Targets (placeholders, founder decision J7):** RPO 24 h, RTO 4 h, retention 30 daily and 12 monthly are assumptions in the document. The RTO figure is still to be recorded (per the operations README).

### Production backups — `deploy/01-backup-serverscript.sh` (runs on the server)
Runs before every promotion and restore (called by the promote wrapper), nightly via the systemd backup timer (02:00 UTC per [procedure-governed-deploy.md](procedure-governed-deploy.md)), or by hand as the deploy user. Arguments `--env production`, optional `--tag`, `--label`, `--dry-run`. It reads DATABASE_URL from the server env file (never printed), checks free disk (about 2x database size plus 200 MB), writes `p4tc-production-<UTC>.dump` (`pg_dump -Fc`) with a `.sha256` and `.meta` sidecar (deployed tag and commit, newest migration, size), verifies the archive with `pg_restore --list`, and prunes to the newest `BACKUP_KEEP`. Dumps stay on the server; the framework never copies them to a laptop. A backup failure refuses the promotion.

### Local or ad hoc dump — `scripts/backup.sh`
`DATABASE_URL=... scripts/backup.sh [output-dir]` writes `<db>-<UTC>.dump` plus `.sha256` into `backups/` (gitignored) using `pg_dump` custom format. Requires `pg_dump` 16; refuses to run without DATABASE_URL; never prints the URL. The script calls itself the interim control until host backups exist.

### Restore rehearsal — `scripts/restore-rehearsal.sh`
`DATABASE_URL=... scripts/restore-rehearsal.sh <dump> [--keep]`: verify checksum; create scratch database `p4tc_restore_<UTC>` on the same server (set to UTC); `pg_restore --exit-on-error`; `prisma migrate status` on the copy; compare row counts of every business table with the source; print PASS or FAIL; drop the scratch database unless `--keep`. Migration status is the hard gate, counts the sanity check (drift is expected on a busy source). Rehearsal record in the source: 2026-09-23 on the dev database, PASS (33/33 tables); a production rehearsal is required before the first cohort (WBS 7.6) and was not recorded as done in the source.

### Actual restore (summary of source section 4)
Decide first: a restore rewinds every table, including reconciled payments. Put the site in a safe state, restore into a new database, check migrate status and UTC timezone, repoint DATABASE_URL, confirm health, then reconcile: replay Stripe events newer than the restore point (handler is idempotent), review queued outbound emails, review certificates issued in the window. Write an incident record. The source's wording is written for managed hosts; for the Droplet use the governed route: `deploy/07-rollback.sh --env production --restore-db <dump>` (safety snapshot first, app stopped, rows after the dump lost, founder confirms; see [procedure-governed-deploy.md](procedure-governed-deploy.md)).

## Preconditions
PostgreSQL 16 client tools; DATABASE_URL set for the script used; for production, SSH access as deploy and an env file on the server.

## Safety notes
A dump contains personal data: encrypted at rest, access-controlled, deleted on schedule. Restore is a RED-gate destructive action needing founder confirmation. Do not paste connection strings into chat or documents.

## Change history
- 2026-10-02 — created from the source document, the two scripts and the server backup script.
