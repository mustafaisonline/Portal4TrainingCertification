# procedure — Release gate

| Field | Value |
|---|---|
| Category | operational |
| Kind | procedure |
| Source of truth | `docs/operations/RELEASE_GATE.md` and `deploy/04-release-gate.sh` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | OQ-18 / J6 / K11; ADR-046; [procedure-governed-deploy.md](procedure-governed-deploy.md); `framework/metadata/technical/script-deploy-04-release-gate-sh.md`; [procedure-local-development-and-testing.md](procedure-local-development-and-testing.md) |

## Purpose
The gate that must pass on the exact commit before every production deploy.

## Description
**Adopted 2026-09-26 as written, Playwright blocking (K11, ADR-046).** The source banner mentions a `release.yml` `verify` job and says `start.sh` refuses a tag the release workflow has not built; that part is superseded by the laptop-build deploy of 2026-10-02 (see [runbook-deployment.md](runbook-deployment.md)). The gate now runs on the laptop as stage 3 of `deploy/start.sh`.

### Steps in `deploy/04-release-gate.sh` (laptop)
Preconditions: `npx` present, `node_modules` installed, `DATABASE_URL_TEST` set (in `.env.local` or the environment), port 3101 free; warns if the working tree is dirty. Then, each with a timeout from `deploy/config.env`:
1. `npx tsc --noEmit --incremental false` (blocking)
2. `npx vitest run` (blocking)
3. `npx next build` (blocking)
4. `npx playwright test` against the production build with `PLAYWRIGHT_SERVER=start` (blocking)
5. `npm audit --omit=dev --audit-level=high` (advisory; triage in the PR)

The script rejects any `--skip-*` or `--no-*` argument; there are no bypass flags. Its only option is `--dry-run`.

### Differences from the source document
The document's table also lists a migration-before-deploy check and a post-deploy smoke test; the script does not run these (migrations are handled on the server by the promote wrapper; post-deploy checks by [procedure-governed-deploy.md](procedure-governed-deploy.md) step 8, `06-validate.sh`). The document's hotfix exception (copy-only changes may skip Playwright) has no flag in the script; per the source, such a change is deployed by tagging it.

## Preconditions
Node 24 on PATH; local test database; free port 3101.

## Safety notes
Do not skip or weaken a blocking step. Running the gate needs the test database only, never production.

## Change history
- 2026-10-02 — created from the source document and the script.
