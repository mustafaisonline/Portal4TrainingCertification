# script — deploy/04-release-gate.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/04-release-gate.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030 |

## Purpose
RELEASE_GATE.md as code: the blocking quality gate run on HEAD before every production deploy.

## Description
- **Runs on:** laptop, in the repository root.
- **Pipeline position:** step 04, run by `start.sh` after discovery and the git source gate; it runs for real even under `--dry-run`.
- **Invocation:** `deploy/04-release-gate.sh [--dry-run]`. Any `--skip-*` or `--no-*` argument is rejected (`die`).
- **Inputs:** `node_modules` must exist; `DATABASE_URL_TEST` in the environment or `.env.local` (checked by name only, outside dry-run); timeouts GATE_TYPECHECK/VITEST/BUILD/PLAYWRIGHT/AUDIT_TIMEOUT_SEC from config.env.
- **Steps:** 1 `tsc --noEmit` (blocking); 2 `vitest run` (blocking); 3 `next build` (blocking); 4 `playwright test` against the production build with `PLAYWRIGHT_SERVER=start` on port 3101 (blocking); 5 `npm audit --omit=dev --audit-level=high` (advisory only).
- **Outputs:** `deploy/logs/04-release-gate.log`, `deploy/reports/04-release-gate-report.md`; exit 0/1.
- **What it changes:** writes a `.next` build in the working copy; runs tests against the test database. Warns if the tree is dirty (result then applies to the working copy).
- **Idempotent:** yes (re-runnable). **Destructive:** no (test DB only). **Safety:** no bypass flags; blocking steps stop on failure or timeout.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
