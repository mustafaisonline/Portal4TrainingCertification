# script — deploy/03-migration-sandbox-serverscript.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/03-migration-sandbox-serverscript.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-lib-server-promote-sh.md |

## Purpose
Prove the release's pending Prisma migrations against a copy of the production database (restored from the newest dump) before they touch the real database; refuse unapproved destructive DDL.

## Description
- **Runs on:** server (called by `server-promote.sh` after `unpack_release`; can be run by hand as deploy to preview).
- **Pipeline position:** step 03, after backup (01) and unpack, before `prisma migrate deploy`.
- **Invocation:** `03-migration-sandbox-serverscript.sh --env production --tag T [--dry-run]`.
- **Inputs:** config.env (SANDBOX_DB_NAME, ADMIN_DB_NAME, REMOTE_BACKUP_ROOT, DESTRUCTIVE_MIGRATIONS_APPROVED); `/etc/p4tc/production.env` (`DATABASE_URL`); the unpacked release at `/opt/p4tc/releases/<tag>` (needs `node_modules/.bin`); newest dump.
- **Flow:** (0) read-only `prisma migrate status` against the REAL database — if up to date, the sandbox is skipped; (1) create sandbox DB if absent, `pg_restore --clean --if-exists` newest dump into it (an empty first-deploy dump is accepted; a populated sandbox without `_prisma_migrations` fails); (2) list pending migrations; (3) scan each pending `migration.sql` for DROP TABLE/COLUMN/INDEX/SCHEMA, ALTER TABLE DROP COLUMN/CONSTRAINT, TRUNCATE — fail unless the folder name is in DESTRUCTIVE_MIGRATIONS_APPROVED; (4) `prisma migrate deploy` on the sandbox; (5) confirm up to date.
- **Outputs:** log `/opt/p4tc/logs/03-migration-sandbox.log`; exit 0 pass, 1 fail.
- **What it changes:** only the sandbox database (rebuilt each run). The real database is only read. **Idempotent:** yes. **Destructive:** only to the sandbox copy.
- **Safety notes:** no skip flag; the destructive-DDL approval is recorded in git via config.env (ADR-029 RED gate).

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
