# script — deploy/00-discovery.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/00-discovery.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030 |

## Purpose
Read-only discovery of the laptop toolchain, deploy configuration, repository state and (when reachable) the server bootstrap state. Changes nothing.

## Description
- **Runs on:** laptop (reads the server over SSH).
- **Pipeline position:** step 00; run by `start.sh` first (as `run_child "00-discovery"`), or standalone.
- **Invocation:** `deploy/00-discovery.sh [--skip-remote] [--dry-run]` (also `--help`). Sources `lib/common.sh`.
- **Inputs:** `config.env` / `config.local.env` values (SERVER_HOST, SERVER_USER, DOMAIN, PRODUCTION_URL, GOVERNANCE_HMAC_KEY_FILE, DEPLOY_GIT_REMOTE, REMOTE_* paths, DEPLOY_WRAPPER); the local git repo; `prisma/migrations`.
- **Checks:** commands git/ssh/scp/rsync/curl/openssl/node/npm exist; Node 24 on PATH (warning only); config has no `<placeholders>` in SERVER_HOST/DOMAIN; HMAC key file present (warning if absent); branch, commit, dirty-file count; presence of `lib/local-release.sh` and `lib/proof-db.mjs`; newest migration in the repo. Remote (skipped with `--skip-remote` or placeholders): wrapper installed, node/pm2 versions, caddy active, pg_dump present, staging and backup directories writable by deploy, production env file readable but NOT writable by deploy, reminders timer enabled, deployed tag marker, free disk MB.
- **Outputs:** `deploy/logs/00-discovery.log`, `deploy/reports/00-discovery-report.md`; exit 0 on pass, 1 if any hard failure was recorded.
- **What it changes:** only its own log/report files on the laptop. Never reads env-file values.
- **Idempotent:** yes. **Destructive:** no. **Prerequisites:** none for local checks; key-based SSH for remote checks.
- **Safety notes:** under `--dry-run` an unreachable server is a warning and remote reads are listed, not performed.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
