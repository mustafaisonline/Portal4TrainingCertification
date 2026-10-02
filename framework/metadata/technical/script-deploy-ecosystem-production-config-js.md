# config — deploy/ecosystem.production.config.js

| Field | Value |
|---|---|
| Category | technical |
| Kind | config |
| Source of truth | `deploy/ecosystem.production.config.js` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-run-sh-template.md |

## Purpose
The PM2 application definition for the single provisioned environment (production).

## Description
- **Runs on:** server; applied by `pm2 startOrReload` in `server-promote.sh` (`switch_to`), as the deploy user.
- **Settings:** app name `p4tc-production`; `cwd` `/opt/p4tc/releases/current` (a symlink repointed on each promote, so the file is never edited per release); `script` `./run.sh` with `interpreter: none`; fork mode, one instance; autorestart on, max 10 restarts, 2000 ms restart delay, 20000 ms kill timeout; env `NODE_ENV=production` and `NEXT_TELEMETRY_DISABLED=1`; logs `/opt/p4tc/logs/pm2-production-out.log` and `pm2-production-error.log` (merged, timestamped).
- **Secrets:** none; application variables come from the env file via `run.sh`.
- **Change effect:** edits take effect at the next promote or rollback after the file is synced by 05-deploy (the sync uses `--delete`).
- **Idempotent:** `startOrReload` starts the app if absent or reloads it. **Destructive:** no.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
