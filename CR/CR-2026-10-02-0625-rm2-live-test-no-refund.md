# CR-2026-10-02-0625 — RM 2.00 live payment test is not refunded

**Received:** 2026-10-02 06:25 MYT · **Status:** BUILT (doc) — payment itself awaits the founder · **Requested by:** founder

## 1. Request (verbatim)

> Response: Please note, there is no refund for this RM2

## 2. Facts gathered

- `docs/operations/STRIPE_GO_LIVE_CHECKLIST.md` step 6 said to pay RM 2.00 at `/support` with a real card and then refund it in the Stripe Dashboard.
- `src/content/legal/refund-policy.ts` already says the Support payment grants no service in return and is one-off.
- Production runs a LIVE restricted Stripe key; `stripe:check` (2026-10-02) found no blocking problem; 0 Checkout sessions so far.

## 3. Decisions & assumptions

- Founder decision: the RM 2.00 is **not refunded** — it stays as a real Support payment.
- Consequence recorded: the order stays *Paid* under Orders & receipts and in Admin → Orders (kind "Support payment"); do not expect a refund event.

## 4. Plan

Edit step 6 of the checklist (and its "Known behaviour" note) to say no refund. No code, no data model.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Checklist step 6 updated | **DONE** | 2026-10-02 |
| 2 | Founder pays RM 2.00 at `/support` with a real card; confirm Paid under Orders & Admin → Orders | **AWAITING founder** | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 06:25 | CR created. Checklist step 6 changed: no refund. |
