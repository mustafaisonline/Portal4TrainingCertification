# CR-2026-10-03-2252 — Training card, schedule and training-page buttons (Register · Payment · Register Interest Only · Show Current Schedule)

**Received:** 2026-10-03 22:50 MYT · **Status:** BUILT & VERIFIED — deploy after review · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> * Something wrong in the data flow to make the payment. User reach on the page: https://dataainexus.com/programs
>    * User see all the trainings
>    * There are two buttons on each training card I.e.,
>       * View Details
>       * See dates and Register, change this to Register. Who user click it, the control takes user to this page: https://dataainexus.com/schedule
>          * On schedule page, its should only show those training cards have schedules for those that training from which user has come from.
>          * What trainings are there on this page, this training is already has confirmed date, please rename current button from 'Register Interest Only' to 'Payment'
>          * When user click Payment, it should take user to the Strip payment account.
> * On training page e.g., https://dataainexus.com/programs/learn-vibe-coding
>    * section: CHOOSE YOUR PACE
>       * In this section there are cards to show like which kind of format trainer has for this training.
>       * There is link 'Register your interest — free for you', convert it into Button 'Register Interest Only'
>       * Add another button 'Show Current Schedule', when user click this, control take user to the schedule page.

## 2. Facts gathered (read-only investigation, 2026-10-03)

- Card buttons today (`CourseCard.tsx:352-358`): "View Details →" → `/programs/<slug>`; "See dates and register" → `/schedule?training=<slug>`. **The schedule already filters by training** (`?training=`), so the card change is a label rename.
- On `/schedule` each date card shows: an **open** date → "Register" → `/checkout/<offeringId>` (a review page with consent, coupon, price and refund tiers) → button "Pay … with Stripe" → Stripe Checkout; a **planned/full** date → "Register interest" (the USD 2 interest path, free only for Pakistan-profile accounts); a started date → "Ask about the next date". The label "Register Interest Only" does not exist in the code today.
- Training page "Register your interest — free for you": it is a `<summary>` text link; "free for you" shows only for Pakistan-profile accounts, everyone else sees "USD 2.00 (non-refundable)". For Pakistan the interest is saved with **no email**; others get the "interest registered" email after Stripe confirms payment.
- Renaming buttons and adding the "Show Current Schedule" link are labels/navigation only — **no payment logic changes**.

## 3. Decisions needed from the founder (with the assistant's recommendation)

1. **"Payment" button:** relabel the open-date "Register" to **Payment** but still pass through the existing checkout review page (consent to the policies, coupon, region price) before Stripe. Recommendation: **keep the review page** — it holds the legal consent and the price check; going straight to Stripe would change the payment flow (a protected change needing your explicit approval). Do you agree?
2. **Planned/full dates:** keep the button "Register interest" there (it is the interest path, not a payment)? Recommendation: yes, and label it "Register Interest Only" to match your wording.
3. **"free for you":** the training page says it only to Pakistan-profile accounts. Keep the label dynamic ("Register Interest Only — free" / "— USD 2")? Recommendation: yes, shown under the button.
4. **Missing email (found while testing):** the free Pakistan interest path sends no confirmation email. Add one? Recommendation: yes (a small change, same template).

## 4. Impacted elements

`src/shared/marketing/CourseCard.tsx`, `ProgrammeDates.tsx` (`OfferingDateCard`), `ProgrammePricing.tsx`, `InterestForm.tsx`/`interest-slots.tsx`, `/schedule`. Tests to update: `trainings.spec.ts`, `account.spec.ts:183`, `commerce.spec.ts:119-121`, `admin-trainings.spec.ts:233,238`, `training-interest.spec.ts`, `public.spec.ts:97-101`. No schema, payment-logic or dependency change (unless decision 1 is answered "skip the review page").

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers §3 | OPEN | 2026-10-03 |
| 2 | Build (after the answers) | NOT STARTED | — |
| 3 | Verify (tests, reviews) | NOT STARTED | — |
| 4 | Deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 22:50 | CR created from the founder's message; existing code inspected read-only; nothing built. |
| 2026-10-03 23:05 | Founder answered the §3 decisions: "I agree with all your recommendation with my few responses." Decisions 7-9 as recommended (Payment keeps the checkout review page, then Stripe; planned/full dates keep the interest button labelled "Register Interest Only"). **Decision 9 extended by the founder:** "Please send email for free test as well. This will give me an idea how many are just doing free tests" — the free (fee-waived) interest path will send the same confirmation email, so the Email log and Users Interest show how many people register free. |
| 2026-10-03 23:55 | **BUILT & VERIFIED.** /programs card "See dates and register" → **Register** (still to `/schedule?training=<slug>`, which already shows only that training); an open date's button "Register" → **Payment** (still via the checkout review page, then Stripe — no payment-logic change); planned/full date → **Register Interest Only**; the interest control on a training page is now a button **Register Interest Only** with the fee under it ("USD 2, non-refundable" / "Free for you"), the signed-out version is the same button ("Sign in first · …"); every format card also has **Show Current Schedule** → `/schedule?training=<slug>`. **Free (fee-waived) interest now sends the confirmation email** (`commerce.interest-registered-free`, one per interest row via an idempotency key; bell notice too). Tests updated/added: integration (email + idempotency), e2e (labels, Show Current Schedule, email row). Full suite green; two unrelated e2e clicks flaked once under load and passed on re-run. **Rollback:** revert the commit. |
