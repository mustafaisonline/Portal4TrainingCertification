# script — deploy/lib/server-promote.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/lib/server-promote.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-01-backup-serverscript-sh.md; script-deploy-03-migration-sandbox-serverscript-sh.md; script-deploy-lib-governance-sh.md |

## Purpose
The server-side promotion and rollback engine, executed as root only through the `p4tc-deploy` wrapper.

## Description
- **Runs on:** server, as root, and only when `SUDO_USER` is `deploy`.
- **Invocation:** `promote --env production --tag T --governance-dir D` or `rollback --env production --tag T --governance-dir D [--restore-db FILE]` (governance dir must be under the staging path; the tag may contain only `A-Za-z0-9._-`).
- **Inputs:** `/etc/p4tc/production.env` (sourced, never printed), `/etc/p4tc/governance-hmac.key`, config.env values (PRODUCTION_PORT, RELEASES_KEEP, HEALTH_WAIT_TIMEOUT_SEC, PM2_APP_NAME, REMOTE_* paths, GOVERNANCE_TOKEN_TTL_SECONDS), the uploaded token, manifest and release payload.
- **Promote flow:** validate token (kind, env, tag, expiry, id matches bundle directory, issued by start.sh, HMAC) and manifest (id, tag, commit); flock; run 01-backup (gate; failure refuses promotion); `unpack_release` (rsync into `/opt/p4tc/releases/<tag>`, reuse previous `node_modules` by hardlink when `package-lock.json` is byte-identical else `npm ci`, render `run.sh` from `run.sh.template`, set root:deploy ownership with `.next/cache` writable by deploy); run 03-sandbox (gate); `prisma migrate deploy` on the real database; switch the `current` symlink and `pm2 startOrReload` the ecosystem file as the deploy user; wait for `/api/health` ok and db up; on success write markers (`.deployed-tag/-previous-tag/-commit/-at`, `history.log`), update manifest, prune releases beyond RELEASES_KEEP, remove the bundle; on failure switch back to the previous tag automatically (migrations stay applied, forward-only) and exit non-zero.
- **Rollback flow:** validate rollback token; require the target release on disk; with `--restore-db`: sha256 check, safety snapshot (01 with label `pre-restore`), stop app, `pg_restore --clean --if-exists`; switch to target, wait healthy, write markers, remove bundle.
- **What it changes:** production releases, symlink, PM2 process, markers, and (restore only) the live database. **Idempotent:** promote re-run is possible (migrate deploy is idempotent). **Destructive:** release pruning; DB restore on rollback.
- **Safety notes:** no bypass path; cannot be called directly by a non-sudo user; the app process always runs as deploy, never root.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
