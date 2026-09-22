# Release Gate — proposal for OQ-18 (J6)

> **Status: PROPOSED 2026-09-23 — awaiting the founder's decision.** WBS 7.10 asks: must the test set pass before **every** production deploy, or only at milestones? This document proposes the answer and gives the exact commands so the decision can be ratified as a policy and folded into the Definition of Done.

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

## Decision requested

- [ ] Adopt as written · [ ] Adopt with changes: ______ · [ ] Milestones only (record the reasoning)

Once decided, record in `ARCHITECTURE_DECISION_REGISTER.md` against OQ-18 and add the table to `CLAUDE.md` "Definition of Done" as a referenced policy.
