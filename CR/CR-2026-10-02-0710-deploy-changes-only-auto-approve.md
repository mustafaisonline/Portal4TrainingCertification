# CR-2026-10-02-0710 — Deploy the new changes to production (auto-approve, changes only)

**Received:** 2026-10-02 07:10 MYT · **Status:** BUILT & tagged `v2026.10.02-3` — **deploy awaits the founder's command** (the assistant's harness refuses production deploys) · **Requested by:** founder

## 1. Request (verbatim)

> Once changes are done in development, pelase deply to production. with auto approved option. and make sure, we only deploy the change, not the whole thihng.

## 2. Facts gathered

- Changes since the deployed tag `v2026.10.02-2` (`git diff v2026.10.02-2 -- app src prisma package*.json next.config.ts public`): **only** `src/shared/chrome/site-nav.ts` (footer/menu/sitemap no longer list the unpublished credential-integrity policy — CR-0627) and the new, **unreferenced** `src/content/legal/privacy-ms.ts` (Bahasa Malaysia DRAFT — CR-0628; a unit test fails if anything imports it). No Prisma schema/migration change, no dependency change, no new env variable, no seed.
- The framework always promotes a complete, immutable release (a partial promote would break rollback, the `current` symlink switch and the sandbox), but it uploads **only the files that differ** from the deployed release (`05-deploy.sh`: "delta upload against the deployed release", seen in the last two deploys) and runs no seed or data step. So "deploy only the change" is what happens: a small upload, the same database, no data touched.
- The assistant's harness has refused every production deploy command from this session; the founder runs it.

## 3. Decisions

- Tag `v2026.10.02-3` on the commit that carries these changes; deploy with `--auto-approve` (founder's word). `--auto-approve` skips the confirmation prompts only; the gate (tsc, Vitest, build, Playwright), the laptop build-and-proof, backup, migration sandbox, health check and auto-rollback all still run.
- Nothing is pushed to GitHub until the founder says (with `--auto-approve` the tool only prints the push command).

## 4. Plan

1. Build, test, commit, tag (done by the assistant). 2. Founder: `deploy/start.sh --env production --tag v2026.10.02-3 --auto-approve`. 3. Assistant verifies the live footer/sitemap and health, then updates the CRs and `PROJECT_STATUS.md`.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Changes built; tsc clean; Vitest 722/722 | **DONE** | 2026-10-02 |
| 2 | Commit + tag `v2026.10.02-3` | **DONE** | 2026-10-02 |
| 3 | Founder runs the deploy | **AWAITING founder** | — |
| 4 | Post-deploy verification + docs | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 07:10 | CR created from the founder's message while the BM draft was being written. Diff against the deployed tag confirmed to be two source files. |
