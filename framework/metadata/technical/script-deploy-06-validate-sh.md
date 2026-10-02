# script — deploy/06-validate.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/06-validate.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030 |

## Purpose
Read-only post-deployment validation of production from outside and via SSH, with a PASS/FAIL verdict and a rollback recommendation.

## Description
- **Runs on:** laptop (curl plus SSH).
- **Pipeline position:** step 06, after deploy; run by `start.sh` or standalone after any promotion or rollback.
- **Invocation:** `deploy/06-validate.sh --env production [--tag vX] [--dry-run]`.
- **Inputs:** config.env (PRODUCTION_URL, REMOTE_MARKERS_ROOT, REMOTE_RELEASES_ROOT, PM2_APP_NAME, CURL_TIMEOUT_SEC); repo `prisma/migrations`; the server.
- **Checks:** server markers (`.deployed-tag/-commit/-at/-previous-tag`) exist and match `--tag`; `/api/health` is 200 with `"db":"up"` and migration equal to the repo's newest; `APP_ENV=test` not detected; `/`, `/verify`, `/programs` return 200; headers strict-transport-security, x-frame-options DENY, x-content-type-options nosniff, referrer-policy present and x-powered-by absent; unsigned POST to `/api/stripe/webhook` returns 400 (503 is only a warning); `pm2 describe` shows online; the `current` symlink matches the marker; disk, memory and releases size (warns at 85% disk); app log scan for "[config] refusing" lines newer than the last start.
- **Outputs:** log and `06-validate-report.md`; on failure, prints the rollback command (`07-rollback.sh --env production [--tag <previous>]`). Exit 0 or 1.
- **What it changes:** nothing on the server; local log/report only. **Idempotent:** yes. **Destructive:** no.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
