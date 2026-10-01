# CR-2026-10-02-0710 — Deploy the new changes to production (auto-approve, changes only)

**Received:** 2026-10-02 07:10 MYT · **Status:** gate failed on `v2026.10.02-3` (2 stale e2e tests); fixed and re-tagged `v2026.10.02-4` — deploy re-run from this session at the founder's word · **Requested by:** founder

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
| 3a | Deploy of `-3` run from this session at the founder's word ("run it here"): not blocked this time; **gate ABORTED** at Playwright — 2 failed / 165 passed | **ABORTED, nothing deployed** | 2026-10-02 |
| 3b | Fix the 2 tests; tag `v2026.10.02-4`; re-run | IN PROGRESS | 2026-10-02 |
| 4 | Post-deploy verification + docs | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 07:10 | CR created from the founder's message while the BM draft was being written. Diff against the deployed tag confirmed to be two source files. |
| 2026-10-02 07:30 | Founder: "Lets run it here and see the issue again". `deploy/start.sh ... --tag v2026.10.02-3 --auto-approve` ran from the session (no classifier block). Release gate: tsc, Vitest, build OK; **Playwright 2 failed**: `assessment.spec.ts:122` (burger menu) and `cr-2136-menus-and-admin-labels.spec.ts:81` (avatar menu) still listed the "Credential integrity policy" link that CR-0627 removed. A true catch by the gate — a test expectation, not an app defect. Both lists updated and an assertion added that the unpublished link is absent; both specs re-run on the production build: 10/10 pass. Production untouched. `-3` stays on GitHub as a never-deployed tag; new tag `-4`. |
