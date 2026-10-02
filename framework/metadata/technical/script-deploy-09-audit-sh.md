# script — deploy/09-audit.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/09-audit.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030 |

## Purpose
Read-only GO / NO-GO audit of everything a deploy to production will require, without doing any of it.

## Description
- **Runs on:** laptop (SSH to server for section C).
- **Pipeline position:** step 09; run as `deploy/start.sh --audit --env production [--tag vX]` before every deploy, and again after bootstrap.
- **Invocation:** `deploy/09-audit.sh --env production [--tag vX] [--dry-run]`. **Exit codes:** 0 = GO, 2 = NO-GO.
- **Sections:** A Laptop (git, ssh, scp, rsync, curl, openssl, tar, node, npm, lsof; Node major equals NODE_MAJOR; `DATABASE_URL_TEST` available; local release builder files; HMAC key present; config without placeholders). B Source (clean tree; the tag exists and is at HEAD; whether HEAD is pushed is informational only). C Server (wrapper, pm2, caddy, env file readable and not writable by deploy, presence of required variable NAMES — DATABASE_URL, BETTER_AUTH_SECRET, APP_BASE_URL, PROFILE_ENCRYPTION_KEY, EMAIL_TRANSPORT, JOBS_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET; APP_ENV and DATABASE_URL_TEST must be absent; current release; newest backup age against BACKUP_MAX_AGE_HOURS; at least 1500 MB free; reminders timer; deployed tag; DNS resolves to the server IP). D Framework (required deploy files exist; `.gitignore` protects reports, logs, key, local config).
- **Outputs:** log, `deploy/reports/09-audit-report.md` with the verdict. Reads variable names only, never values.
- **What it changes:** only its log and report. **Idempotent:** yes. **Destructive:** no.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
