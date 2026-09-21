# Milestone 4 — "Registration & Payment" · Completion Report

> **Status: IMPLEMENTED · TESTED — including one real Stripe test-mode payment and refund end to end** · 2026-09-21 (evening)
> **Executed on:** the founder's explicit direction (*"implement stripe details and add pricing/refund rules, legal documents as Malaysia law"*) and the four decisions in [`MILESTONE_4_EXECUTION_PLAN.md`](MILESTONE_4_EXECUTION_PLAN.md) §3, plus "cards only for now" given during execution.
> **Branch:** `feat/production-foundation` · not pushed.

---

## 1. Requested task

Stripe payments for programme registration, the founder's pricing and refund rules enforced and published, and Malaysian-law legal documents — with the account shell (delivered just before) showing real registrations and receipts.

## 2. Understanding / scope

Plan §2 in full, plus the minimal admin offerings screen without which no date could exist. Out of scope as listed there (invoices, promo codes, waitlists, admin-initiated refunds UI, tax computation, staging).

## 3. Changes made

### 3.1 Schema (Rule 1) — migration `20260921115635_registration_and_payment`
`orders` · `payments` · `refunds` · `registrations` · `stripe_events` + six enums, exactly as plan §5. Forward-only.

### 3.2 Dependency (Rule 5) — `stripe` 22.6.2 (MIT), pinned. Stripe CLI 1.51.0 installed on the founder's Mac via Homebrew as a **developer tool** (webhook forwarding), not a project dependency.

### 3.3 Code
| Area | Files |
|---|---|
| Commerce | `src/modules/commerce/{pricing,refund-policy,stripe,capacity,payments,emails,messages,checkout.service,webhook.service,registrations.service,checkout.actions,registration.actions,errors}.ts` · `app/api/stripe/webhook/route.ts` · `app/(public)/checkout/[offeringId]/*` · `app/account/programmes/*` · `app/account/orders/page.tsx` · `/schedule` "Register" |
| Admin | `src/modules/catalogue/offerings/{repository,constants,dates,admin.actions}.ts` · `app/admin/offerings/{page,new,[id],OfferingForm}.tsx` · admin landing card |
| Legal | `src/content/legal/{types,terms,privacy,refund-policy}.ts` · `src/shared/legal/LegalDocumentView.tsx` · `/terms`, `/privacy`, `/refund-policy` |
| Tooling | `scripts/{alias-loader,register-alias}.mjs` (the `admin:grant` CLI was broken under plain Node — fixed) |
| Tests | unit: refund tiers, pricing, legal content, client-import fence; integration: `commerce.test.ts`, `offerings.admin.test.ts`; e2e: `commerce.spec.ts`, `admin-offerings.spec.ts` |

### 3.4 How the commitments were met
| Commitment | Implementation |
|---|---|
| No registration without a verified event | `registrations` rows are written only inside the `checkout.session.completed` transaction; the success page shows "confirming with Stripe" until then |
| Every event stored first; replay-safe | `stripe_events` PK = Stripe event id; duplicate → no-op; order row locked and re-checked |
| Server-priced by profile country | `regionForCountry(users.country)` → `programme_prices`; the form posts only `offeringId` + `consent` |
| Refund tiers = one pure function | `refundPercentFor()` used by the checkout copy, the registrations page and the cancel service; quoted in the policy |
| Capacity | `SELECT … FOR UPDATE` on the offering; confirmed + unexpired pending < capacity; 30-minute hold |
| Cards only (founder, during execution) | `payment_method_types: ["card"]` — one line to lift when FPX/GrabPay are enabled in the Dashboard |
| Nothing simulated | With no key the checkout says "Online payments are not configured"; no order is created |

## 4. What was not changed
The mockup; `main`; nothing pushed. Live keys never seen or stored. `LEGAL_DOCUMENT_VERSIONS` remains the publish switch — the legal pages show **DRAFT** and registration is open locally only because `.env.local` carries a dev value.

## 5. Testing
| Layer | Result |
|---|---|
| `tsc` · `next build` | clean (build had caught a client component importing the DB layer — fixed and fenced by a unit test) |
| Vitest | **131 / 131** — commerce integration on real PostgreSQL through the real webhook code with Stripe's official test-signature helper: pricing MY/PK/other, consent + audit, no-key error, capacity hold and expiry release, signed event → paid + payment + registration, replay = duplicate, tampered signature rejected, expiry event, refund tiers 20/10/3 days incl. gateway failure, transfer once/twice, ownership; offerings create/update/validation/audit |
| Playwright | **27 / 27** (one worker — shared DB and per-IP sign-up limit), incl. admin creates an offering that appears on `/schedule` and disappears when cancelled; checkout price/tiers/consent/no-key; axe on every new screen |
| **Real test-mode payment** (browser, `localhost:3100`, Stripe CLI forwarding) | Offering created through the admin screen → participant (profile country Malaysia) checkout showed **RM 4,999** with the region explanation → Stripe hosted page ("Sandbox", MYR 4,999.00, card only) paid with `4242 4242 4242 4242` → redirected → `checkout.session.completed` processed once → **order paid, payment succeeded (pi_3UI6WL…), registration confirmed**, audit `order.created → payment.succeeded → registration.confirmed`, confirmation email queued; Stripe reports the session `complete/paid`, `livemode=false` |
| **Real refund** | "Cancel registration" → confirm → **100 % refund, RM 4,999**, refund created at Stripe (test mode) and recorded; registration `cancelled` |

## 6. Criteria (plan §7)
1 ✅ · 2 ✅ (e2e) · 3 ✅ (integration + real: MYR for Malaysia) · 4 ✅ (integration) · 5 ✅ (integration + real) · 6 ✅ (real) · 7 ✅ (integration + real 100 %) · 8 ✅ (integration) · 9 ✅ (drafts rendered; consents rows written at checkout) · 10 ✅ · 11 ✅.

## 7. Documentation updated
Plan (status) · this report · `README.md` · `.env.example` (Stripe names, key-retrieval steps).

## 8. Risks, observations and deviations
1. **Stripe account name is "Your Partner Technologies Sdn. Bhd."** (shown on the hosted page). The legal drafts say "Your Partner Technologies" — align before publishing.
2. **Receipt URL** arrives on `charge.succeeded/updated`; the first local forward filtered those events out, so the test payment's receipt link is empty. The forwarder now passes all events; production endpoint must subscribe to `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded/failed`, `charge.succeeded`, `charge.updated`, `charge.refunded`, `refund.created`, `refund.updated`.
3. **Transfer is in-place** (`registrations.order_id` is unique, so a chained new row would need a schema change) — recorded; `transferred` status unused.
4. **Country is free text** on the profile; matching is normalised but an ISO dropdown is the right fix (recommended next).
5. **The test key was pasted into chat** — rotate it in the Dashboard when convenient; live keys must only ever enter the production secret store.
6. Dashboard "Latest order" line still says "No orders yet" (minor follow-up).
7. Refund policy's `refund` consent is recorded under the Terms version until `LEGAL_DOCUMENT_VERSIONS` carries a `refund` key.
8. **Timestamp skew defect — found and fixed during this verification.** Stripe's event was created at 12:40:34 UTC; our `received_at` read 04:40:37 — every timestamp the application wrote was **8 hours early**, because the Prisma pg adapter sends zone-less timestamps and PostgreSQL interprets them in its session timezone (`Asia/Kuala_Lumpur` on the founder's Homebrew instance). Comparisons made entirely through Prisma were self-consistent (which is why nothing had failed), but anything mixing DB-side `now()` or external timestamps — session expiry, order holds, refund-tier day counts near a boundary, audit chronology — would have been wrong. **Fix:** `ALTER DATABASE p4tc_dev/p4tc_test SET timezone TO 'UTC'` (persistent), compose init does the same, `.env.example` documents it, and `tests/integration/timestamps.test.ts` fails on any database where the session timezone is not UTC or a written timestamp drifts from the database clock. **Production must set the database timezone to UTC.** Rows written earlier today in the dev database keep their skewed values (dev data only).

## 9. Human decisions required
| # | Item |
|---|---|
| 1 | Legal drafts: have a Malaysian-qualified lawyer review; fill the `[placeholders]` (SSM no., address, contacts, SST status, under-18 rule); then set `LEGAL_DOCUMENT_VERSIONS` to publish and open registration |
| 2 | FPX / GrabPay: enable in Stripe Dashboard → Settings → Payment methods (no bank API needed — the account is already a Malaysian entity with charges enabled); then remove the cards-only line |
| 3 | Production webhook endpoint + live keys when hosting exists (M9) |
| 4 | Whether to replace free-text country with a dropdown before launch |

**Completion status:** Implemented · **Tested** (automated + one real test-mode payment and refund) · Blocked: nothing · Requires human validation: the four items above.
