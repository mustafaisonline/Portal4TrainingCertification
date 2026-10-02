# script — deploy/lib/local-release.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/lib/local-release.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-lib-proof-db-mjs.md; script-deploy-start-sh.md |

## Purpose
Build, prove and package the release for a tag on the laptop from the tagged commit alone (replaces the GitHub Actions release workflow as the release source).

## Description
- **Runs on:** laptop (sourced by start.sh; function `build_and_prove_local_release TAG`).
- **Inputs:** the tag; Node major equal to NODE_MAJOR; commands node, npm, git, tar, curl, rsync, lsof; `DATABASE_URL_TEST` (env or `.env.local`, read in a subshell and never printed) for a role allowed to CREATE DATABASE; optional `PROOF_PORT` (default 3102, must be free); GATE_BUILD_TIMEOUT_SEC.
- **Flow:** (1) `git archive <tag>` into a temp dir (tracked files only); create a throwaway database `p4tc_release_proof_<pid>` via `proof-db.mjs`; (2) `npm ci`, `npm run db:generate`, `npm run build` with a throwaway build-time auth secret; (3) prove: `prisma migrate deploy` on the throwaway database and `migrate status` up to date; start `next start` in production mode with CI-only throwaway environment values on the proof port and check `/api/health` ok with db up and the newest migration, an unsigned Stripe webhook POST returning 400, and `X-Frame-Options: DENY`; (4) package `.next` (without cache), `public`, package.json/lock, next.config.ts, prisma.config.ts, `prisma/`, `src/`, `scripts/` into `<stage>/release`, guarding against symlinks into the temp dir.
- **Outputs:** exports `P4TC_RELEASE_STAGE`; log lines in the calling script's log. `local_release_cleanup` (idempotent, run on exit) kills the proof server, drops the throwaway DB and deletes the stage directory.
- **What it changes:** temp directories, a temporary local database and a local process only; nothing on the server. It runs for real even under `--dry-run`.
- **Idempotent:** yes. **Destructive:** only to its own temp artefacts. **Safety:** failures call `_proof_fail`, which cleans up first, then `die`.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
