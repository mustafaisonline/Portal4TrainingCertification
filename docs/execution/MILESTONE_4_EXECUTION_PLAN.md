# Milestone 4 — "Registration & Payment" · Execution Plan

> **Status:** ▶ **EXECUTING 2026-09-21** on the founder's explicit direction of the same evening: *"implement stripe details and add pricing/refund rules, legal documents as Malaysia law"*, with four decisions taken in conversation (§3). Scope acceptance is therefore founder-directed; remaining defaults are listed in §10.
> **Roadmap row:** `WIREFRAME_TO_PRODUCTION_PLAN.md` §7 M4. **Depends on:** M1–M3 ✅, account shell ✅.

---

## 1. Objective

> A signed-in participant can register for a **real scheduled offering**, pay through **Stripe Checkout**, and see the confirmed registration and receipt in their account — where a registration exists **only after a verified, idempotent payment event**; capacity is respected; the founder's refund rule is both published and enforced; and an administrator can create the offerings that make any of this possible.

## 2. Scope

| # | Item | Source |
|---|---|---|
| 1 | Schema (§5): `orders`, `payments`, `refunds`, `registrations`, `stripe_events` | Roadmap M4; ADR-014 |
| 2 | **Minimal admin offerings screen** (`/admin/offerings`: list, create, edit status/capacity) — without it no date can exist to register for; M8 grows it | Necessary supporting work |
| 3 | Checkout: server-priced from the profile country (§3 D3), consent to Terms/Privacy/Refund recorded, Stripe Checkout Session (hosted page; payment methods as enabled in the Stripe Dashboard — card, FPX, GrabPay …), 30-minute expiry, capacity hold while pending | F2–F5; ADR-014 |
| 4 | Webhook `/api/stripe/webhook`: signature verified, **every event stored first** (`stripe_events`), processed idempotently; `checkout.session.completed` → order paid + payment + **registration confirmed** in one transaction; `checkout.session.expired` → order expired; `charge.refunded` / `refund.updated` → refund status | Tier 1 #3/#4; ACCOUNT reqs §6 |
| 5 | Participant: `/account/programmes` real registrations; `/account/orders` real orders + Stripe receipt link; confirmation page reads **server truth**, never the redirect alone | F2; C4 |
| 6 | **Refund rule enforced** (§3 D2): participant cancellation computes the tier from days-before-start, creates the Stripe refund, records it; **one free transfer** to another open offering of the same programme | Founder decision |
| 7 | Legal drafts (Terms, Privacy — PDPA 2010, Refund & cancellation) rendered at `/terms`, `/privacy`, `/refund-policy` with a **DRAFT — for legal review** notice; `LEGAL_DOCUMENT_VERSIONS` stays the publish switch | Founder decision D4 |
| 8 | Emails through the outbox: order confirmation / receipt, cancellation, transfer (log transport until ADR-015) | ADR-015 spirit |

**Out of scope:** invoices / corporate purchase orders (A5), promo codes, waitlists, seat allocation beyond a simple count, partial payments, refunds initiated by admin UI (M8 — the service exists), Academy-initiated cancellation UI (M8), tax computation (SST placeholder in copy), a country dropdown on the profile (recommended follow-up, §10).

## 3. Decisions taken by the founder (2026-09-21, in conversation)

| # | Decision |
|---|---|
| D1 | **Stripe, test-mode keys supplied by the founder** in `.env.local`; hosted Checkout; payment methods per the Stripe Dashboard (card + FPX + GrabPay recommended) |
| D2 | **Refund rule:** cancel ≥ 14 days before start → 100 %; 7–13 days → 50 %; < 7 days or after start → 0 %. **One free transfer** to a later date, always (before start). Academy cancels/reschedules → participant chooses full refund or transfer |
| D3 | **Price by profile country:** Pakistan → PKR scholarship price; Malaysia → MYR; everyone else → USD. The participant cannot choose a cheaper region |
| D4 | Legal documents drafted for **Your Partner Technologies** with `[placeholders]`, marked DRAFT for a Malaysian-qualified lawyer's review |

## 4. RED-gate actions

| # | Action | Gate |
|---|---|---|
| 4.1 | Install `stripe` **22.6.2** (MIT) — pinned | New dependency (payment SDK) — founder-directed |
| 4.2 | Migration `registration_and_payment` — §5 | Rule 1 |
| 4.3 | Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (test mode locally) | Config / secrets (ADR-030) |
| 4.4 | **Payment logic** — the checkout, webhook and refund services | RED — founder-directed |

## 5. Proposed schema — every table, every column (Rule 1)

| Table | Purpose | Columns |
|---|---|---|
| `orders` | One purchase attempt for one offering by one person. **Our** record is authoritative for entitlement | `id uuid PK` · `user_id → users` · `offering_id → scheduled_offerings` · `programme_id → programmes` · `status order_status` (enum: pending · paid · expired · failed · cancelled · refunded · partially_refunded) · `region price_region` · `currency char(3)` · `amount_minor bigint` · `stripe_checkout_session_id text? unique` · `stripe_payment_intent_id text?` · `expires_at timestamptz` · `paid_at?` · `created_at` · `updated_at` |
| `payments` | A settled payment as Stripe reported it | `id uuid PK` · `order_id → orders` (unique) · `provider text` ("stripe") · `provider_payment_intent_id text unique` · `provider_charge_id text?` · `amount_minor bigint` · `currency char(3)` · `receipt_url text?` · `status payment_status` (enum: succeeded · refunded · partially_refunded) · `created_at` |
| `refunds` | Each refund issued (participant cancellation now; admin later) | `id uuid PK` · `payment_id → payments` · `provider_refund_id text? unique` · `amount_minor bigint` · `percent int` · `reason refund_reason` (enum: participant_cancellation · academy_cancellation · manual) · `status refund_status` (enum: pending · succeeded · failed) · `requested_by_user_id uuid?` · `created_at` · `updated_at` |
| `registrations` | A person's place in an offering (ADR-043). Created **only** by the paid-webhook transaction | `id uuid PK` · `user_id → users` · `offering_id → scheduled_offerings` · `order_id → orders` (unique) · `status registration_status` (enum: confirmed · cancelled · transferred) · `transfer_used boolean default false` · `transferred_to_registration_id uuid?` · `cancelled_at?` · `cancellation_refund_percent int?` · `created_at` · `updated_at` · index `(offering_id, status)` |
| `stripe_events` | Every webhook event, stored before processing — idempotency and audit | `id text PK` (Stripe's `evt_…`) · `type text` · `status stripe_event_status` (enum: received · processed · ignored · failed) · `payload jsonb` · `error text?` · `received_at` · `processed_at?` |

**Capacity:** `scheduled_offerings.capacity` (exists). The checkout service locks the offering row (`SELECT … FOR UPDATE`) and counts confirmed registrations + unexpired pending orders before creating a new pending order. No schema change.

**Consent at purchase:** `consents` rows (exists) with keys `terms`, `privacy`, `refund` and the published versions.

## 6. Design commitments

1. **No registration without a verified success event.** The success redirect only shows "processing" until the webhook has written the registration.
2. **Every webhook is stored before it is acted on**; a replayed event is a no-op (`stripe_events` PK + order-status check inside the transaction).
3. **Prices are read from `programme_prices` for the region derived from `users.country`**; the client never sends an amount or currency.
4. **Refund tiers are one pure function** (`refundPercentFor(startsOn, now)`) used by the UI (to show what a cancellation returns) and by the service (to issue it) — and quoted in the published policy.
5. **Stripe secret only server-side**; webhook signature verified with `STRIPE_WEBHOOK_SECRET`; the endpoint rejects unsigned/invalid requests with 400.
6. **Nothing simulated.** Without keys, checkout returns a clear "payments are not configured" error; nothing pretends to succeed.
7. **Audit** rows for `offering.created/updated`, `order.created`, `payment.succeeded`, `registration.confirmed/cancelled/transferred`, `refund.created`.

## 7. Verification criteria

| # | Criterion |
|---|---|
| 1 | Migration clean; tables match §5 |
| 2 | Admin creates an offering; a participant cannot |
| 3 | Checkout prices by profile country (MY → MYR, PK → PKR, other → USD); a tampered amount/currency is ignored (server-priced) |
| 4 | Pending order holds a seat; capacity reached → refused; expiry releases it |
| 5 | Signed `checkout.session.completed` → order paid, payment, **registration confirmed**, audit, email row; **replayed event changes nothing**; **bad signature → 400 and nothing stored as processed** |
| 6 | Confirmation page shows "processing" before the webhook and the registration after |
| 7 | Refund tiers: 20 days → 100 %, 10 days → 50 %, 3 days → 0 %; cancellation creates the Stripe refund and records it |
| 8 | One transfer allowed; a second is refused |
| 9 | Legal pages render the drafts with the DRAFT notice; consent at checkout is recorded |
| 10 | Unit + integration (real PostgreSQL, Stripe SDK **not** called in tests except through its official signature helper for constructing test events) + e2e with the Stripe API mocked at the network boundary only where a real key is absent; **with the founder's test keys, one real test-mode payment end to end** |
| 11 | tsc · Vitest · Playwright · build green; M1–M3 unchanged |

## 8. Retires from the mockup

`lib/demoRegistrations.ts`, `components/account/CheckoutFlow.tsx` (`pay()`), `ConfirmationView.tsx`, `BlockedConsent`, `data/demoParticipant.ts` (remaining parts), `RegisterInterestButton`/`RegisterButton` routing.

## 9. Deliverables

Migration · `src/modules/commerce/{pricing,checkout,webhook,refunds,registrations}` · `app/api/stripe/webhook/route.ts` · `app/(public)/checkout/[offeringId]` · `app/account/{programmes,orders}` on real data · `app/admin/offerings` · legal drafts + renderer · tests · completion report.

## 10. Defaults still open for the founder

| # | Default | Alternative |
|---|---|---|
| 1 | Country matched from free-text profile field (normalised) | Replace with an ISO country dropdown on the profile (recommended soon) |
| 2 | Checkout session expiry 30 minutes | Any 30 min–24 h |
| 3 | Payment methods = whatever is enabled in the Stripe Dashboard | Restrict in code |
| 4 | Refund issued automatically on participant cancellation | Admin approval step (M8) |
