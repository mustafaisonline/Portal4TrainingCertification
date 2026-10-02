# CR-2026-10-02-2010 — Every "Register your interest" / "Register interest" button routes by availability

**Received:** 2026-10-02 20:10 MYT · **Status:** NOT STARTED — extends and replaces the open question in CR-2026-10-02-0721 · **Requested by:** founder

## 1. Request (verbatim)

> Where there is [Register your interest](mailto:sales@yourpartnertechnologies.com?subject=Interest%3A%20Learn%20Vibe%20Coding)  or Register Interest Buttons, when you click, if there is no available trainings with format available then it should take user to the output of this link, [Sign in to register your interest — USD 2, non-refundable](https://dataainexus.com/sign-in?return-to=%2Fprograms%2Flearn-vibe-coding%23formats) else it should take to the strip page for payment of the training.

*Source: Founder message of 2026-10-02 ("New more change …", seven bullets; the CR for them was requested: "Add a new CR for these requirements").*

## 2. Facts gathered (read-only; nothing changed yet)

- CR-2026-10-02-0721 (built & verified, **not deployed**, commit `c514f7a`) already sends the training page's hero button to the sign-in/interest flow when no format has an open date; it left the mailto in place when the feature is off, and asked whether `/schedule`'s buttons should follow. This CR answers that question: **all** such buttons follow the rule.
- Buttons found that still use the mailto `interestMailto(...)`: `/schedule` single-training empty state "Register interest" (`app/(public)/schedule/page.tsx:87`), the generic "Register interest" (`:103`, no training), per-group `enquiryHref` for the offering cards (`:109`), and `ProgrammePricing.tsx` (`enquiryHref` at 236/355/386, labelled "Contact us" and similar).
- Today a person pays for a training by: sign in → register for an **open scheduled offering** (Register on `/schedule?training=…`) → Stripe Checkout (hosted). There is no "pay now" link that skips sign-in and registration: Stripe needs a user, a registration and a seat hold first.
- "Format available" is read as: the format has an open (upcoming) scheduled offering (`formatIdsWithoutOpenDate`, `listUpcomingPublicOfferings`).

## 3. Open questions for the founder

1. "Available training with a format" = a format that has an **open scheduled date**? (assumed yes)
2. "the Stripe page for payment" — Stripe can only be reached after sign-in and a registration (seat hold). Confirm the intended path: *signed out → sign-in (returning) → the registration of that offering → Stripe Checkout*. If the training has **several** open dates/formats, where should the button go: the schedule filtered to the training (recommended) or the soonest date?
3. Which buttons are in scope: hero, `/schedule` (both), the offering cards, pricing-section buttons — or only the ones literally labelled "Register your interest" / "Register interest"? (assumed: those two labels; "Contact us" stays a contact link)
4. The generic `/schedule` "Register interest" (no training chosen): keep the mailto, or lead to the Trainings list? 
5. If the interest feature is switched off and no date is open: keep the mailto fallback? (assumed yes)

## 4. Plan (after the answers; one CR at a time, on the founder's "go")

One shared helper decides the destination for a training (open date → registration/Stripe path; no date and flow on → sign-in/interest; else mailto), used by every in-scope button; replaces the per-button hrefs. Supersedes the narrower logic of CR-0721 (deploy them together). Tests: unit for the helper; e2e signed-out and signed-in for each case; update `trainings.spec.ts` / `schedule` tests. No data model.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers §3 | **AWAITING founder** | — |
| 2 | Build the helper + wire the buttons | NOT STARTED | — |
| 3 | Verify in dev + tests | NOT STARTED | — |
| 4 | Deploy with CR-0721 | AWAITING founder's word | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:10 | CR created from the founder's list. Facts gathered read-only. CR-0721's schedule-page question is closed by this CR. |
| 2026-10-02 | run-cr 2026-10-02: kept OPEN — Q2 (the path to Stripe: Stripe is reachable only after sign-in and registration of an open date; confirm the intended path and, with several open dates, where the button goes) and Q4 (generic /schedule button) are unanswered. Re-run run-cr after answering. |
| 2026-10-02 | Founder answer to Q2 (part): reach Stripe only if the user is logged in (signed-out → sign-in first). Still open: with several open dates where the button goes; Q4 generic /schedule button. Both explained to the founder with recommendations. |
