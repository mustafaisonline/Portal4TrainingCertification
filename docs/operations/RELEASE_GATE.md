# Release Gate — OQ-18 (J6)

> **Status: ADOPTED 2026-09-26 as written, Playwright blocking (Milestone 11 decision K11; ADR-046).** Implemented twice, identically: `deploy/04-release-gate.sh` on the operator's machine (every step below with a timeout; Playwright runs against the production build the gate has just made) and the `verify` job that `.github/workflows/release.yml` runs before it will build an image for a tag. `deploy/start.sh` refuses to deploy a tag the release workflow has not built, so the gate is structural, not procedural. The proposal text is kept below as the record.

## Proposal

**Before every production deploy, on the exact commit being deployed:**

| Step | Command | Must |
|---|---|---|
| 1 | `npx tsc --noEmit --incremental false` | 0 errors |
| 2 | `npx vitest run` | all pass (unit + integration on the test database) |
| 3 | `npx playwright test` | all pass (e2e + axe WCAG 2.2 AA) |
| 4 | `npx next build` | succeeds |
| 5 | `npm audit --omit=dev` | no critical/high, or each triaged in the PR |
| 6 | Migration present? | `npm run db:deploy` executed against production **before** the deploy, `npx prisma migrate status` clean (ADR-029) |
| 7 | Post-deploy smoke | `/api/health` 200 · `/` and `/verify` 200 with headers · sign-in works · admin dashboard renders |

Total wall time today: tsc ≈ 20 s, Vitest ≈ 40 s, Playwright ≈ 6–8 min, build ≈ 1 min. Cheap against the cost of a broken checkout or verification page.

## Why "every deploy", not "milestones only"

- The product's irreversible actions — a payment, a certificate URL, an email — happen in production; a regression there is not a bug ticket but a refund and a support case (Testing Arch §10).
- The suites are already deterministic against a dedicated database; nothing is flaky enough to argue for skipping.
- A gate that runs sometimes is a gate that is skipped under pressure. Making it unconditional removes the judgement call.

## Where it runs

Until CI exists (ADR-025 tooling is decided but no pipeline is provisioned), the operator runs the commands locally with `DATABASE_URL_TEST` set and records the result in the deploy note. When a pipeline exists, the same commands become the required check on the production branch; `main` stays protected.

## Exceptions

A hotfix that only changes copy or a runbook may skip Playwright **if** the diff touches no `.ts`/`.tsx` outside `docs/` — the operator states this in the deploy note. Nothing else is exempt.

## Decision

- [x] **Adopt as written** — founder, 2026-09-26 ("K1 = yes, all recommendations accepted"; K11 = adopt, blocking). Recorded as ADR-046 in `ARCHITECTURE_DECISION_REGISTER.md`.
- The hotfix exception above stands, but `deploy/04-release-gate.sh` has no flag for it: a docs-only hotfix that must skip Playwright is deployed by tagging it — the release workflow's `verify` job still runs the full suite in CI, which is where the exception is cheap.
