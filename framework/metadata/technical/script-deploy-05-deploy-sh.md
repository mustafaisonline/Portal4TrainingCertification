# script — deploy/05-deploy.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/05-deploy.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-lib-governance-sh.md; script-deploy-lib-server-promote-sh.md; script-deploy-lib-local-release-sh.md |

## Purpose
Ship the already-built, already-proven release to the server and trigger the governed promotion, then check health from outside.

## Description
- **Runs on:** laptop, ONLY under `start.sh` (refuses direct execution via `require_governed_orchestrator`).
- **Pipeline position:** step 05, after the release gate, local build+proof and credential issue; followed by `06-validate.sh`.
- **Invocation:** by `start.sh`: `05-deploy.sh --env production --tag vX [--dry-run] [--yes]`. `reject_prohibited_flags` blocks `--force`, `--skip-*`, `--allow-dirty`, `--no-backup` etc.
- **Inputs:** env `P4TC_ORCHESTRATOR_ACTIVE`, `P4TC_TOKEN_FILE`, `P4TC_DEPLOYMENT_ID`, `P4TC_RELEASE_STAGE` (set by start.sh); the manifest `deploy/reports/deployment-manifest.json`; the HMAC key file (real runs); config.env values (REMOTE_*, DEPLOY_WRAPPER, DEPLOY_PROMOTE_TIMEOUT_SEC).
- **Flow:** require tools; verify release stage contains `release/package.json` and `.next`; verify on server that the wrapper exists, staging dir is writable, env file is not writable by deploy, and at least 1500 MB free; confirm prompt; take the deployment lock; `rsync -az --delete` of `deploy/` to the server (excluding logs, reports, HMAC key, config.local.env); upload the governance bundle; rsync the release payload (with `--copy-dest` against `releases/current` when it exists); `remote_promote`; external `GET /api/health` expecting 200 and `"db":"up"`; finalize the manifest (success, failed or aborted).
- **Outputs:** log/report in `deploy/logs`, `deploy/reports`; manifest result field updated. Exit 0 or 1.
- **What it changes:** production server (framework copy, staging bundle, a new release, symlink, PM2 reload — via the root wrapper). Removes nothing locally (start.sh owns cleanup).
- **Idempotent:** a re-run is a new deployment id. **Destructive:** replaces the server's deploy/ copy (`--delete`). **Safety:** needs a valid signed token; no bypass.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
