# Stripe LIVE — go-live checklist (Milestone 15, Requirement 7)

**Status:** the code, the read-only check and the tests are ready. **Nothing below has been done on the server** — every step marked *founder* needs your Stripe account and the server, and none of them may be done through chat or Git. Production was declared production on 2026-09-29 (no more UAT).

## What the application needs — and nothing else

| Variable | Where it lives | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | the server's env file only (`/etc/p4tc/production.env`) | `rk_live_…` restricted (recommended, permissions in `DEPLOYMENT_RUNBOOK.md` §2) or `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | the same file | `whsec_…` of the **live** endpoint (step 3) |
| ~~`STRIPE_PUBLISHABLE_KEY`~~ | **not used** | Checkout is Stripe-hosted; no browser code reads a publishable key. Do not add it. |

The server refuses to start in production unless both are present and well-formed, and warns loudly for a `*_test_` key. Neither value is ever logged, printed by `stripe:check`, or committed.

## Steps (founder)

1. **Rotate** any Stripe key that was ever pasted in chat (Stripe → Developers → API keys → Roll key). Only the new key goes to the server.
2. **Put the live secret key** in `/etc/p4tc/production.env` as `STRIPE_SECRET_KEY`. Reload the app (PM2 reload through the normal deploy wrapper).
3. **Create the live webhook endpoint** (Stripe → Developers → Webhooks → Add endpoint, *live mode*): URL `https://<your host>/api/stripe/webhook`; events — exactly these nine:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `charge.succeeded`, `charge.updated`, `charge.refunded`, `refund.created`, `refund.updated`.
   Copy **only the signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` in the same env file and reload.
4. **Run the read-only check on the server:**
   ```bash
   set -a; . /etc/p4tc/production.env; set +a
   npm run stripe:check
   ```
   It prints the key **mode** (must say LIVE), whether the account can take charges, and whether the endpoint for `APP_BASE_URL` is enabled and subscribed to all nine events. A restricted key often cannot read the account or endpoints — that is a `[WARN]` telling you to confirm the same thing in the Dashboard, not a failure. It cannot prove the signing secret matches: step 5 does.
5. **Send test webhook** from the Stripe endpoint page → expect **200**; the event appears in Admin → Orders' stored events as *ignored*.
6. **RM 2.00 smoke test** (`/support`, a real card): the order shows *Paid* under Orders & receipts and in Admin → Orders (kind "Support payment"). **Then refund it in the Stripe Dashboard** (Payments → the payment → Refund).
   - *Known behaviour:* a refund made in the Dashboard is recorded by the application as an **ignored** event; the app's order stays "Paid". The app's own refund flow only covers cancellations made inside the product. Treat the Dashboard as the record for this test payment. (An admin-initiated refund screen was scoped to a later milestone; it has not been built and this milestone did not add one.)
7. Only after steps 4–6 are clean, start selling.

## Rollback

Put the previous (or test-mode) values back in `/etc/p4tc/production.env` and reload. No database change is involved.

## Verification matrix (spec §8) — what proves each row

| Row | Proved by |
|---|---|
| Checkout creates an order | `tests/integration/commerce.test.ts` — "checkout — server-priced by profile country" |
| Successful payment → order paid, payment row, registration | `commerce.test.ts` — "signed checkout.session.completed → order paid, payment, registration, audit, email" |
| Failed payment | `commerce.test.ts` — "checkout.session.async_payment_failed → order failed…" (added 2026-09-29) |
| Expired / abandoned checkout | `commerce.test.ts` — "checkout.session.expired → order expired" and "an expired hold releases the seat" |
| Cancelled checkout (no confirmation) | the `cancel_url` is asserted in `commerce.test.ts`; the return page says "nothing was charged" (`tests/e2e/commerce.spec.ts`); the order stays pending until Stripe sends expired |
| Webhook signature failure → 400 | `tests/integration/stripe-webhook-route.test.ts` (route level: missing header, wrong secret, altered body → 400, nothing stored; no secret configured → honest 500) |
| Duplicate webhook is a no-op | `stripe-webhook-route.test.ts` (replay → `duplicate: true`, one stored row) and `commerce.test.ts` (replay of a paid event changes nothing) |
| Enrolment created once | `commerce.test.ts` — replay leaves one registration; "the same person cannot hold two seats" |
| Certificate eligibility unaffected by payment events | a certificate is issued only by an administrator recording completion of a confirmed registration (`issuance.service.ts` never reads a payment event); the certificate suites are unchanged and green |
| Refund path | `commerce.test.ts` — "cancellation — refund tier enforced" and "when Stripe refuses the refund…" |
| **Real live payment, real refund** | **only you can do this — step 6.** No test here touched live Stripe. |
