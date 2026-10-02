# script — deploy/start.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/start.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-lib-local-release-sh.md; script-deploy-lib-governance-sh.md |

## Purpose
The single entry point of the governed deployment pipeline: audit, dry-run or real deploy of a tag to production.

## Description
- **Runs on:** laptop.
- **Invocation:** `deploy/start.sh --audit --env production [--tag vX]` (read-only GO/NO-GO); `--dry-run --env production --tag vX` (whole pipeline, no changes); `--env production --tag vX` (governed deploy, prompts); `--auto-approve` suppresses prompts; `--no-gate` is accepted only together with `--dry-run`. `--help` prints usage.
- **Rejected:** `--allow-dirty`, `--force`, `--force-deploy`, `--skip-git-validation`, `--skip-gate`, `--skip-backup`, `--skip-sandbox`, `--skip-tests`, unknown flags, and bypass environment variables (via `reject_governance_bypass_env`). Only `production` is accepted as environment.
- **Pipeline (a `--tag` is mandatory for a deploy):** 00-discovery; git source gate (clean tree, tag exists and is at HEAD; in dry-run a dirty tree is a warning); 04-release-gate (runs for real even in dry-run); `build_and_prove_local_release` (from `lib/local-release.sh`, also real in dry-run); issue signed token and manifest; confirmation prompt; 05-deploy; 06-validate; write summary; afterwards offers to `git push` the branch and tag to DEPLOY_GIT_REMOTE (never pushes automatically; skipped when already pushed or non-interactive).
- **Outputs:** `deploy/reports/deployment-summary.md` (per-step PASS/FAIL table and outcome), each child's report; exit 0 on success, 2 on abort or failure. On validation failure it recommends `07-rollback.sh`.
- **Cleanup:** an EXIT trap removes the proof build, throwaway database and proof server.
- **What it changes:** triggers everything above; production is changed only by 05-deploy. **Idempotent:** each run is a new deployment id. **Destructive:** no by itself; it replaces the live release by design.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
