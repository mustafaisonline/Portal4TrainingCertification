# config — deploy/config.env

| Field | Value |
|---|---|
| Category | technical |
| Kind | config |
| Source of truth | `deploy/config.env` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030 |

## Purpose
Names, addresses and tunables for the deployment framework. By rule it holds no secrets (ADR-030); per-machine overrides go in the gitignored `deploy/config.local.env` using the same names, sourced afterwards.

## Description
- **Used by:** every laptop script via `lib/common.sh`, and the server scripts (01, 03, 10, server-promote) which source it from the synced `/opt/p4tc/deploy/`.
- **Variable names and purposes:**
  - Identity: `FRAMEWORK_VERSION` (label shown in reports).
  - Server: `SERVER_HOST` (Droplet address), `SERVER_USER` (`deploy`), `SSH_OPTS` (non-interactive SSH options).
  - Domain: `DOMAIN` (apex), `PRODUCTION_URL` (derived `https://` + DOMAIN).
  - Release: `RELEASES_KEEP` (releases kept for instant rollback), `NODE_MAJOR` (required Node major), `PM2_APP_NAME`.
  - Git: `DEPLOY_GIT_REMOTE`, `DEPLOY_GIT_REMOTE_BRANCH` (used only for the post-deploy push question and informational checks).
  - Server paths: `REMOTE_ETC`, `REMOTE_OPT`, `REMOTE_DEPLOY_DIR`, `REMOTE_BACKUP_ROOT`, `REMOTE_STAGING_INCOMING`, `REMOTE_RELEASES_ROOT`, `REMOTE_MARKERS_ROOT`, `DEPLOY_WRAPPER`.
  - Environment: `PRODUCTION_PORT`, `SANDBOX_DB_NAME`, `ADMIN_DB_NAME`.
  - Destructive migrations: `DESTRUCTIVE_MIGRATIONS_APPROVED` (space-separated migration folder names the founder approved; empty by default; the RED-gate approval record, ADR-029).
  - Backups: `BACKUP_KEEP` (newest dumps kept), `BACKUP_MAX_AGE_HOURS` (audit warning threshold).
  - Governance: `GOVERNANCE_HMAC_KEY_FILE` (path to the local copy of the server's HMAC key; the key itself is not in this file), `GOVERNANCE_TOKEN_TTL_SECONDS` (token lifetime).
  - Timeouts (seconds): `CURL_TIMEOUT_SEC`, `SSH_CONNECT_TIMEOUT_SEC`, `GATE_TYPECHECK_TIMEOUT_SEC`, `GATE_VITEST_TIMEOUT_SEC`, `GATE_BUILD_TIMEOUT_SEC`, `GATE_PLAYWRIGHT_TIMEOUT_SEC`, `GATE_AUDIT_TIMEOUT_SEC`, `DEPLOY_PROMOTE_TIMEOUT_SEC`, `HEALTH_WAIT_TIMEOUT_SEC`, `VALIDATION_TIMEOUT_SEC` (the last is not seen used in the scripts read; not determined from the file).
- **Idempotent/destructive:** not executable; shell variable assignments only. Changing it is a committed configuration change; scripts refuse to run while `SERVER_HOST` or `DOMAIN` still contain `<placeholders>`.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
