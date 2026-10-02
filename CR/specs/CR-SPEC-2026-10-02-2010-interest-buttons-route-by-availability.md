# CR-SPEC-2026-10-02-2010 — Interest buttons route by availability

**CR:** [CR-2026-10-02-2010](../CR-2026-10-02-2010-interest-buttons-route-by-availability.md) · **Recommended model:** Sonnet 5.5 — multi-file but well-specified routing; no payment logic, no data model.

**Founder decisions:** Stripe is reached only when logged in (signed out → sign-in first); Q2 = A (several open dates → the schedule filtered to the training); Q4 = A (generic `/schedule` button → the Trainings list). Q1/Q3/Q5 as assumed in the CR.

| # | Task | Files | Notes |
|---|---|---|---|
| 1 | One shared decision | new `src/modules/commerce/interest-routing.ts` (`interestSignInHref`, pure `interestDestination`, `interestHrefForFormats`, `interestHrefForTraining`) | feature off or every format has an open date → `null` (caller keeps its fallback) |
| 2 | Reuse it in the format slots/hero | `src/modules/commerce/components/interest-slots.tsx` (imports `interestSignInHref`) | behaviour unchanged |
| 3 | `/schedule` buttons | `app/(public)/schedule/page.tsx`: single-training empty state → interest flow (fallback mailto); generic "Register interest" → `/programs`; per-group cards get `interestHref` | open dates keep "Register" → `/checkout/<id>` (sign-in, then Stripe) |
| 4 | Offering card | `src/shared/marketing/ProgrammeDates.tsx`: `interestHref` prop for "Register interest"; "Ask about the next date" keeps the mailto | label differs, out of scope |
| 5 | Checkout error card | `app/(public)/checkout/[offeringId]/page.tsx`: "Register interest" → `/programs` | generic, Q4 |
| 6 | Tests | `tests/unit/interest-routing.test.ts`; `tests/e2e/training-interest.spec.ts` (new); `tests/e2e/public.spec.ts` (generic button now `/programs`) | |

Out of scope: "Contact us" / "Enquire about this package" (`ProgrammePricing.tsx`), "Ask about the next date". Data model: none. Rollback: revert the commit. Deploy together with CR-0721 (`c514f7a`), which this extends.
