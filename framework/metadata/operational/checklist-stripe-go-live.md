# checklist — Stripe live go-live

| Field | Value |
|---|---|
| Category | operational |
| Kind | checklist |
| Source of truth | `docs/operations/STRIPE_GO_LIVE_CHECKLIST.md` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | CR-2026-10-02-0610; CR-2026-10-02-0625; Milestone 15; [runbook-deployment.md](runbook-deployment.md); [runbook-monitoring-and-incidents.md](runbook-monitoring-and-incidents.md) |

## Purpose
The founder's ordered steps to switch Stripe to live and the evidence that each payment behaviour is tested.

## Description
**Status per the document:** code, the read-only check and tests are ready; nothing in the checklist is recorded as done on the server by the document itself. Production was declared production on 2026-09-29. **Per CR-2026-10-02-0610:** tracker step 1 "Stripe live-key check" is DONE (already live). **Per CR-2026-10-02-0610:** step 6, the RM 2.00 live smoke payment, is awaiting the founder; refund removed (CR-2026-10-02-0625: it stays as a real Support payment). Whether the payment has since been made is not determined from the source.

**Needs only:** STRIPE_SECRET_KEY (restricted `rk_live_` recommended, or `sk_live_`) and STRIPE_WEBHOOK_SECRET in the server env file. STRIPE_PUBLISHABLE_KEY is not used (hosted Checkout).

### Steps (founder)
1. Roll any Stripe key ever pasted in chat. 2. Put the live secret key in `/etc/p4tc/production.env` and reload the app. 3. Create the live webhook endpoint at `/api/stripe/webhook` with exactly nine events (checkout session completed, async succeeded, expired, async failed; charge succeeded, updated, refunded; refund created, updated), copy only its signing secret into STRIPE_WEBHOOK_SECRET, reload. 4. On the server run the read-only `npm run stripe:check` (shows mode, charge capability, endpoint and event subscription; restricted keys may give a warning not a failure). 5. Send a test webhook from Stripe, expect 200. 6. RM 2.00 real-card smoke test at `/support`; the order should show Paid. 7. Only then start selling.

**Rollback:** restore previous or test values in the env file and reload; no database change.

**Verification matrix:** the document maps each behaviour (checkout creates order, paid flow, failed, expired, cancelled, signature failure 400, duplicate is a no-op, enrolment once, certificate unaffected by payment, refund path) to named tests in `tests/integration/commerce.test.ts`, `stripe-webhook-route.test.ts` and `tests/e2e/commerce.spec.ts`. Only the founder's live payment proves live Stripe.

## Preconditions
Stripe account in live mode, server access, `APP_BASE_URL` set.

## Safety notes
Keys never go through chat or Git. Payments logic is a RED gate. Do not add a publishable key.

## Change history
- 2026-10-02 — created from the source document and CR-2026-10-02-0610.
