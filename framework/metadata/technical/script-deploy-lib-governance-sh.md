# script — deploy/lib/governance.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/lib/governance.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-lib-server-promote-sh.md; script-deploy-05-deploy-sh.md; script-deploy-07-rollback-sh.md |

## Purpose
The controls that make a deploy a governed act: bypass rejection, deployment id, HMAC-signed expiring token, manifest, bundle upload and the single privileged server call.

## Description
- **Runs on:** laptop (sourced by start.sh, 05-deploy.sh, 07-rollback.sh).
- **Inputs:** config.env (GOVERNANCE_TOKEN_TTL_SECONDS, GOVERNANCE_HMAC_KEY_FILE, REMOTE_STAGING_INCOMING, DEPLOY_WRAPPER, DEPLOY_PROMOTE_TIMEOUT_SEC, FRAMEWORK_VERSION); the HMAC key file `deploy/.governance-hmac.key` (a copy of the server's key; its contents are never printed or logged).
- **Functions:** `reject_governance_bypass_env` (dies if any of BREAK_GLASS, FORCE_DEPLOY, SKIP_GIT_VALIDATION, ALLOW_DIRTY, SKIP_GATE, SKIP_RELEASE_GATE, P4TC_BYPASS_GOVERNANCE, P4TC_SKIP_ORCHESTRATOR, GOVERNANCE_BYPASS, DEPLOY_BYPASS is set); `reject_prohibited_flags`; `generate_deployment_id`; `require_governance_hmac_key`; `governance_hmac` (openssl HMAC-SHA256); `issue_deployment_credentials` (token payload `promote|id|issued|env|tag|commit|expires`, written to `deploy/logs/.token-<id>.json` mode 600, exports orchestrator variables, writes the manifest); `require_governed_orchestrator`; `write_deployment_manifest` / `finalize_deployment_manifest`; `upload_governance_bundle` (scp manifest and token to `/opt/p4tc/staging/<id>/`); `remote_promote` (runs `sudo -n p4tc-deploy promote ...` with timeout); `issue_rollback_credentials` (payload `rollback|id|issued|env|tag|backup|expires`); `upload_rollback_bundle`.
- **Outputs:** `deploy/reports/deployment-manifest.json`, token files under `deploy/logs/`.
- **What it changes:** local token/manifest files; creates the remote bundle directory (mode 700) and uploads to it. **Idempotent:** each call issues a new id. **Destructive:** no.
- **Safety notes:** the payload field order is a contract with `server-promote.sh` (change both or neither); the server re-validates the HMAC with its own key.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
