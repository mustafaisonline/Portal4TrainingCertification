# Milestone 6 — "Certificate of Completion & verification" · Completion Report

> **Status: IMPLEMENTED · TESTED** · 2026-09-22
> **Executed on:** the founder's approval of every recommendation E1–E14 in [`MILESTONE_6_EXECUTION_PLAN.md`](MILESTONE_6_EXECUTION_PLAN.md) §3 (chat, 2026-09-22), which also approved the §4 schema under Rule 1.
> **Branch:** `feat/production-foundation` · commits `5c05236` (schema, rules, issuance, renewal), `dd44e32` (screens, legal drafts), `2100f32` (tests) · not pushed.

## 1. Requested
A Certificate of Completion issued when a participant completes the programme, with a unique non-guessable ID and its own public verification address; active for 12 months and renewable for USD 10; a public page to search by name or ID; the holder can view, print and share it; the review requirement tied to the specific certificate being downloaded (M5b decision).

## 2. Delivered
| Area | What |
|---|---|
| Schema (Rule 1, exactly plan §4) | `certificates` (snapshots of holder name, programme, format; `expires_on`; listing; revocation; no status column), `certificate_fee_settings` (insert-only, seeded USD 10.00 effective from epoch), `certificate_renewals` (insert-only, written only by the paid webhook), `orders.kind` + `orders.certificate_id`. Migration `20260922150846_certificates` applied to dev and test |
| Rules (`src/modules/certificates/rules.ts`, `dates.ts`) | Ported from the wireframe's tested logic: MYT calendar dates, month-end clamping, inclusive expiry, 30-day window, on-time vs lapsed renewal arithmetic, ID normalisation, accent-insensitive word-prefix search. Status is **computed on read** (R-L1); revoked wins |
| Issuance (E2) | `/admin/offerings/[id]/participants` roster; "Record completion" per confirmed registration once the offering has ended and a legal name exists; the certificate is created in the same transaction (registration row locked), ID generated with `crypto.randomInt` over the 31-symbol alphabet and retried on unique violation; a second click returns the same certificate; audit `certificate.issued`; "your certificate is ready" email queued to the outbox |
| Public verification | `/verify`: ID → exact lookup (listed or not); name → listed, non-revoked holders only, every word a word-prefix, ≥ 3 characters, cap 10 with a narrowing note, neutral "no result"; rate limit 10 searches per client per minute in the database. `/verify/[id]`: dynamic, `noindex`, uncached, real 404, verification layout limited to the public field set (R-V2), status in words and glyph, MYT note, not-the-earned-credential sentence |
| Holder page (`/account/certificate`) | Status card, certificate ID, copy verification link, **reviews gate**: the printable document and print button render only when `reviewRequirementForRegistration()` is not `required`; otherwise a "Share your review to view and download your certificate" card and no document markup (E9). Renewal with the exact fee shown, or the reason in words; renewal history; opt-in listing toggle with consent row and audit (E3); server-truth `?order=` banner; dashboard status line |
| Renewal (E4–E7) | `startRenewalCheckout` creates an order of kind `certificate_renewal` (amount and currency from the fee in force, never from the browser) and hands to Stripe Checkout; the webhook applies the extension **once** in the same transaction as the payment row, recording previous and new expiry and the fee-setting version; replayed events change nothing; renewal orders take no seat |
| Admin | `/admin/certificates` list with search (ID, name, email), status filter, pagination; detail with revoke (reason, confirm), name correction (same ID), listing state read-only, renewal history; `/admin/certificates/fee` current fee, history, new effective-dated fee (E8, E4); dashboard card |
| Legal DRAFTS | Privacy §6 rewritten for opt-in name listing and what verification shows (R-X2); refund policy: renewal fee non-refundable once applied (E7). Terms §11 already covers the certificate. All still DRAFT pending the lawyer |
| Audit | `certificate.issued · renewed · listing_changed · revoked · name_corrected`, `certificate_fee.changed`, plus `order.created` / `payment.succeeded` for renewals |

## 3. Testing
| Layer | Result |
|---|---|
| `tsc` · `next build` | clean |
| Vitest | **263 / 263** (206 earlier + 57 new): rules incl. 31 Jan/29 Feb arithmetic, 31/30/0/−1 day boundaries, MYT boundary at 15:59Z/16:01Z, revoked wins; ID format and alphabet; integration on the real test database: refusals (not ended, cancelled, no legal name, date out of range), idempotent issuance, collision retry and give-up without a stray row, listing consent + audit, name search privacy (unlisted and revoked invisible, prefix/case/accent/word order, cap), public view keys exactly R-V2, revoke, name correction, admin list, fee effective-dating; renewal: refused > 30 days, allowed at 30 and when expired, pending blocks a second, webhook extends once from old expiry / from today when lapsed, replay no-op, two paid orders → two extensions, pending renewal holds no seat |
| Playwright | **45 / 45** (34 earlier + 11 new) incl. axe WCAG 2.2 AA on `/verify`, `/verify/[id]`, `/account/certificate` (gated and unlocked), roster, list, detail and fee screens; participant refused on admin paths |
| Browser | `/verify`, `/admin/certificates/fee`, `/account/certificate` rendered at `localhost:3100` |

## 4. Security and privacy
Ownership on every holder read and write, admin role on every administrative action; a non-owner never learns a certificate exists (not-found, not forbidden). Public output is a fixed field set; emails never leave the admin list. Name search is opt-in only and rate-limited; ID lookup is exact after normalisation. Amounts are server-set; the extension happens only in the signature-verified, idempotent webhook. Audit rows carry status transitions, never the holder's other personal data.

## 5. Observations
1. `formatMoney` prints "USD 10"; the fee screen uses a two-decimal formatter locally. Consider adopting two decimals for USD across the portal.
2. `next dev` sends `no-cache, must-revalidate` for dynamic pages; production sends `no-store`. The e2e asserts on the absence of shared caching rather than the literal header.
3. The listing toggle needs an explicit Save click; the dashboard says "Certificate: Revoked" without a date. Both worth a founder glance.
4. Terms §11 does not yet state the 12-month validity, renewal fee or "not the earned credential" wording — flagged for the lawyer, not changed.
5. Fee-change times entered on the admin screen are read as Malaysia wall time.

## 6. Deferred, by the approved decisions
Reminders before expiry (E10 — no scheduler, ADR-015 open) · QR code and server-rendered PDF (E11) · auto-renewal (D10) · employer/corporate visibility (D13) · a trainer role recording completion (admin only) · signatory on the document (E12, pending the founder).
