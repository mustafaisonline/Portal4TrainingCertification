# script — deploy/run.sh.template

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/run.sh.template` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-ecosystem-production-config-js.md; script-deploy-lib-server-promote-sh.md |

## Purpose
Template for the per-release start script: load the root-owned env file into the environment, then start the app.

## Description
- **Runs on:** server (rendered, not run in template form). `unpack_release()` in `server-promote.sh` substitutes `{{ENV_FILE}}` (`/etc/p4tc/production.env`) and `{{PORT}}` (PRODUCTION_PORT) and writes it as `run.sh` (mode 750) inside each release directory.
- **Behaviour:** `set -euo pipefail`; `set -a`; source the env file; `set +a`; `exec node_modules/.bin/next start -p <port>`. This is PM2's stand-in for a container `env_file`.
- **Inputs:** the env file (variable values stay on the server). **Outputs:** the running Next.js process (PM2 fork).
- **What it changes:** nothing itself. **Idempotent:** yes. **Destructive:** no.
- **Safety notes:** because the env file is sourced as shell, JSON values such as `LEGAL_DOCUMENT_VERSIONS` must be single-quoted (noted in the bootstrap template).

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
