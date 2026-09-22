# Milestone 6 — "Certificate of Completion & verification" · Execution Plan

> **Status: ▶ EXECUTING 2026-09-22 — founder answered §3 E1–E14 "Yes" to every recommendation (chat, 2026-09-22), which approves the §4 schema under Rule 1.**
> **Source of requirements:** the founder's brief of 2026-09-20 and its polished record [`COMPLETION_CERTIFICATE_REQUIREMENTS.md`](COMPLETION_CERTIFICATE_REQUIREMENTS.md) (R-* requirements, D1–D15 decisions), the founder's 2026-09-22 decision that the review requirement is tied to **the specific certificate being downloaded** ([`LEARNER_FEEDBACK_REQUIREMENTS.md`](LEARNER_FEEDBACK_REQUIREMENTS.md) §8), `DR-01` / `DR-02` §6 (this certificate is **not** the earned credential), and the M6 row of [`WIREFRAME_TO_PRODUCTION_PLAN.md`](WIREFRAME_TO_PRODUCTION_PLAN.md) §7.
> **Depends on:** M4 (registrations, Stripe, webhook), M5a (profile: legal name, country), M5b (`reviewRequirementForRegistration()`). **Rule 1:** every table and column in §4 needs the founder's approval before a migration is written.

---

## 1. What exists today (read before deciding)

| Area | State |
|---|---|
| Certificates | **No table, no row, no route logic.** `/verify` is a placeholder that says nothing can be searched; `/account/certificate` shows "No certificate has been issued yet". Both were ported from the wireframe without its sample data |
| Completion | **Nothing records that a participant completed a programme.** `registrations` has `confirmed · cancelled · transferred` only; there is no attendance model and no per-offering participant list in `/admin/offerings/[id]` |
| Payments | Stripe Checkout for programme registrations only. `orders` requires an offering and a programme and is assumed to produce a registration when paid; the webhook stores the event first and processes it idempotently |
| Roles | `platform_admin` is the only role granted in practice; `expert` exists in the enum with an offering scope but has no UI |
| Reviews gate | `reviewRequirementForRegistration(registrationId)` returns `required · satisfied · not_applicable` and is **called by nothing yet** |
| Email | Outbox `outbound_emails` with the `log` transport (ADR-015 still open) — messages are queued, not delivered |
| Scheduler | None. There is no job runner, cron or queue in the approved stack |
| Rate limiting | Database-backed, reusing `auth_rate_limits` with a key prefix (enquiries, reviews) |
| Legal | The Privacy policy DRAFT §6 says verification is "reached by identifier, **not by searching for a person**" — public **name** search contradicts it and needs a paragraph on opt-in listing (R-X2) |
| Verified rules | `project-artifacts/mockup/lib/certificates.ts` — month arithmetic, inclusive expiry, 30-day window, renewal arithmetic, ID alphabet/normalisation, search rules — 42 assertions passed on 2026-09-20; to be re-implemented in `src/` with Vitest, unchanged in substance |

## 2. Scope

**In (this milestone):** completion recording by an administrator → automatic, idempotent issuance with a unique ID · holder page (document, live status, listing consent, copy link, print/save-as-PDF, renewal, renewal history) · public `/verify` search (ID exact; name prefix over listed holders only) · `/verify/[id]` dynamic page with live status and a real 404 · renewal payment through the existing Stripe Checkout + webhook path · admin-managed, effective-dated renewal fee · revocation and name correction by an administrator · **the reviews gate on the certificate document** · audit on every state change · issued-certificate email into the outbox · tests per requirements §9.

**Out (explicitly):** reminders before expiry (needs a scheduler and a real email provider — §3 E10) · QR code and server-rendered PDF (D15, a new dependency) · auto-renewal (D10) · corporate/employer visibility (D13) · a trainer/expert role recording completion (admin only for the MVP) · the earned credential and its verification surface (DR-01, ADR-018) · any change to the primary navigation labels.

## 3. Decisions for the founder — answer by number, "Yes" or your alternative

Each recommendation is the one the requirements record already carries, made concrete for this codebase.

| # | Decision (record ref.) | Recommendation |
|---|---|---|
| **E1** | Name and positioning (D1) | **Certificate of Completion.** The document and every page state it records completion and is not the Academy's earned credential. "Certificate of participation" wording is replaced, not kept alongside |
| **E2** | What "completed" means and who records it (D2) — **the gate to issuance** | An **administrator records completion per participant** from a new participant list on the offering's admin page, **only after the offering's end date** and only for a **confirmed** registration. No attendance percentage, no assessment, no self-declaration. Recording completion **issues the certificate in the same transaction** (R-I1/R-I3) |
| **E3** | Listing in public name search (D3) | **Opt-in, default off, revocable at any time** from the holder page; the choice is recorded as a consent row (wording version, time) and audited. Turning it off takes effect immediately; the ID link keeps working (R-H3) |
| **E4** | Renewal fee (D5) | **USD 10.00, charged in USD to everyone** (as the founder specified) regardless of the currency the programme was paid in; **year 1 included** in the programme fee; the amount is an **admin-managed, effective-dated setting** in the database, applied at each holder's next renewal, seeded at USD 10.00 with a `platform_admin` screen to change it (audited). Stripe's Malaysian pricing takes roughly 4–6 % of a USD 10 charge including currency conversion — acceptable, but confirm against the current Stripe fee sheet |
| **E5** | Renewal window and arithmetic (D6, D7) | Window opens **30 days before expiry** and stays open indefinitely after lapse; **no grace period** (Expired the day after). On-time renewal extends **from the old expiry**; lapsed renewal extends **from the renewal date**. Always **+12 calendar months**, clamped to month end |
| **E6** | Expired display and timezone (D8, D9) | An expired certificate stays verifiable as **Expired** with the completion facts. All dates are **calendar dates in Asia/Kuala_Lumpur (MYT)**, stated on the page |
| **E7** | Refund of renewals (D10) | **No self-service cancellation or refund** of a renewal (the extension is delivered instantly). An administrator can refund manually through Stripe if ever needed; the refund policy draft gains one sentence saying so — **for the lawyer's review** |
| **E8** | Revocation and corrections (D11, D12) | Add **Revoked** as a distinct state (reason, actor, time; audited). A revoked certificate verifies as "Revoked" — it never disappears. **Name correction** by an administrator only, same ID, audited; the holder requests it via Contact us |
| **E9** | **Reviews gate — what exactly is gated** | The **certificate document** (on-screen view, print, save-as-PDF, copy-link block) on `/account/certificate` is served only when `reviewRequirementForRegistration()` returns `satisfied` or `not_applicable`; otherwise the page shows the certificate's ID, status and a "Share your review to view and download your certificate" call to action. **Not gated:** issuance itself, the status, and the public `/verify/[id]` page (a third party must always be able to verify). `/verify/[id]` shows the verification facts in a verification layout, **not the printable document**, so the gate cannot be bypassed through the public link |
| **E10** | Reminders (R-L7) | **Defer** until a scheduler and a transactional email provider (ADR-015) exist. Status is computed on read, so nothing is wrong without reminders; the holder page and dashboard show "renewal due" |
| **E11** | QR and PDF (D15) | **Defer QR.** Print / save-as-PDF via the browser's print stylesheet now. No new dependency |
| **E12** | Issuer identity on the document (D14) | Brand "Data & AI Academy" (working name, `HO-4`) with the line "Issued by Your Partner Technologies" as the legal issuer, matching the legal drafts; a signatory name and title are **not** printed until you give them |
| **E13** | Renewal currency exception | If a holder's profile country is MY or PK, still USD (per E4). Say so if you would rather price renewals by country like programme fees |
| **E14** | Schema in §4 (Rule 1) | Approve the three new tables and the **two additive columns on `orders`** exactly as listed |

## 4. Schema (Rule 1 — additive only; nothing dropped, renamed or retyped)

**`certificates`** — one per completed registration
`id uuid PK` · `certificate_id text UNIQUE` (`DAA-YYYY-XXXX-XXXX`, 31-symbol alphabet, `crypto.randomInt`, retry on unique violation) · `registration_id uuid UNIQUE → registrations (restrict)` · `user_id → users (restrict)` · `programme_id → programmes (restrict)` · `offering_id → scheduled_offerings (restrict)` · `holder_name text` (legal name from the profile at issue, correctable by admin) · `holder_name_search text` (lower-cased, accent-stripped; for name search) · `programme_title text` · `format_name text` (snapshots — a later catalogue edit must not rewrite a printed certificate) · `completed_on date` · `issued_on date` · `expires_on date` · `listed boolean default false` · `listed_changed_at timestamptz?` · `revoked_at timestamptz?` · `revoked_by_user_id uuid?` · `revocation_reason text?` · `issued_by_user_id uuid` · `created_at` · `updated_at`.
Indexes: `(user_id)`, `(listed, holder_name_search)`, `(expires_on)`.
No `status` column: Active / Renewal due / Expired / Revoked are **computed on read** from `expires_on`, `revoked_at` and today's MYT date (R-L1).

**`certificate_fee_settings`** — insert-only history
`id uuid PK` · `amount_minor integer` · `currency char(3)` · `effective_from timestamptz` · `created_by_user_id uuid` · `note text?` · `created_at`. Seed: `1000 USD`, effective at migration time. The fee in force = newest row with `effective_from <= now`.

**`certificate_renewals`** — insert-only
`id uuid PK` · `certificate_id → certificates (restrict)` · `order_id uuid UNIQUE → orders (restrict)` · `fee_setting_id → certificate_fee_settings (restrict)` · `previous_expires_on date` · `new_expires_on date` · `amount_minor` · `currency` · `created_at`. Written **only** by the paid-webhook transaction (C3/C4).

**`orders` — two additive columns:** `kind order_kind default 'registration'` (enum `registration · certificate_renewal`) and `certificate_id uuid? → certificates (restrict)`. A renewal order keeps the original registration's `offering_id` / `programme_id`, so no column becomes nullable. Capacity counting and the "already registered / order pending" checks are filtered to `kind = registration`; the webhook branches on `kind`.

**Consent:** listing uses the existing `consents` table with `document_key = 'certificate_listing'` and the wording version.

**Audit actions added:** `certificate.issued · certificate.renewed · certificate.listing_changed · certificate.revoked · certificate.name_corrected · certificate_fee.changed`.

## 5. Behaviour fixed by the recommendations

- **Issuance** — `recordCompletion(registrationId, completedOn, adminUserId)`: registration confirmed, offering ended, `completed_on` within the offering's dates or after; creates the certificate with `issued_on = today (MYT)`, `expires_on = issued_on + 12 months`; audits; queues the "your certificate is ready" email. A second call returns the existing certificate (idempotent).
- **Status** — `statusOf(cert, today)`: `revoked` if `revoked_at` · `expired` if `today > expires_on` · `renewal_due` if `expires_on − today ≤ 30` · else `active`. Days shown in words and with an icon, never colour alone.
- **Search** — input shaped like an ID → exact lookup (listed or not, revoked or not) → 0 or 1 result. Otherwise ≥ 3 characters, every word a **word-prefix** of `holder_name_search`, `listed = true` and not revoked, cap 10 with a "narrow your search" note. Rate-limited per client key (10 searches / minute, database-backed). "No results" is identical for unlisted and non-existent.
- **Verification page** — `/verify/[id]` dynamic; `robots: noindex`; `Cache-Control: no-store`; unknown or malformed ID → 404 page with neutral copy; fields limited to R-V1/R-V2.
- **Renewal** — `startRenewalCheckout(certificateId)`: owner only; window open (E5); no pending renewal order; amount from the fee in force; Stripe Checkout with the existing gateway; on `checkout.session.completed` the webhook (kind = `certificate_renewal`) computes the new expiry (E5), inserts the renewal row and updates `expires_on` in one transaction; a replayed event does nothing. Return URL shows server truth, as M4 does for registrations.
- **Reviews gate** — one server function decides; the holder page, the print view and any future download route call it after the ownership check (requirements §8).
- **Admin** — `/admin/offerings/[id]/participants` (roster of confirmed registrations with "Record completion", disabled until the offering has ended) · `/admin/certificates` (list, search by ID/name/email, status filter; detail with Revoke, Correct name, listing state read-only) · `/admin/certificates/fee` (current fee, history, new effective-dated fee).
- **Holder** — `/account/certificate`: document (gated per E9), status card, expiry, "Renew" (window open) with the exact amount, renewal history, listing toggle with the effect explained, copy link, print. Dashboard chip: *Active · Renewal due · Expired · Revoked*.
- **Emails (outbox)** — issued; renewed (receipt link). Reminders deferred (E10).

## 6. Verification criteria (pass/fail)

1. Migration applies cleanly to dev and test; no existing test changes behaviour.
2. Recording completion twice yields one certificate; the ID matches `^DAA-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[…]{4}$`; recording before the end date or on a cancelled registration is refused.
3. Status boundaries: 31 days left → Active; 30 → Renewal due; expiry date → still active; the next day → Expired; computed in MYT at 23:59 and 00:01 across the boundary; revoked wins.
4. Renewal arithmetic: 31 Jan + 12 months, 29 Feb + 12 months, on-time from old expiry, lapsed from today; early renewal (> 30 days) refused.
5. Webhook: a paid renewal extends once; a replayed event extends nothing; two concurrent renewals produce one extension per paid order; a browser-supplied amount is ignored (server-set).
6. Fee: a change effective tomorrow does not alter today's renewal; the renewal row records the amount, currency and fee-setting id actually charged and shown.
7. Privacy: an unlisted holder is never returned by name (service and route level); an ID lookup finds them; the response body contains no email, country, order or ID-document field; unknown ID → HTTP 404.
8. Search rules: prefix, case-, accent- and word-order-insensitive; mid-word no match; ≥ 3 chars; cap 10 with truncation; rate limit trips at the 11th request in a minute.
9. Reviews gate: with no review the holder page shows ID/status and the call to action and **no document**; after any review (pending, hidden or rejected included) the document renders; `/verify/[id]` is unaffected.
10. Listing toggle writes a consent row and an audit row; off → invisible to name search immediately.
11. Revocation: verifies as Revoked; excluded from name search; holder page explains; audited with reason.
12. Restart test: stop the dev server and Postgres client, restart — every status and pending renewal order is unchanged (nothing lives in memory).
13. axe WCAG 2.2 AA on `/verify`, `/verify/[id]`, `/account/certificate`, admin roster and certificates; 320 px layout; status never by colour alone.
14. `tsc` · Vitest · Playwright · `next build` clean; all earlier suites unchanged.

## 7. Files (planned)

`src/modules/certificates/` — `constants.ts` (alphabet, window, validity, labels) · `dates.ts` (MYT calendar dates, month arithmetic) · `rules.ts` (status, canRenew, renewedExpiry, normaliseId — pure, ported from the mockup's tested logic) · `id.ts` (generation) · `repository.ts` · `issuance.service.ts` · `search.service.ts` · `renewal.service.ts` (+ webhook branch in `commerce/webhook.service.ts`) · `fee.repository.ts` · `certificate.actions.ts` · `admin.actions.ts` · `components/{CertificateDocument,StatusChip}.tsx` (design ported from the mockup, sample watermark removed)
`app/(public)/verify/page.tsx` (search, server-side) · `app/(public)/verify/[id]/page.tsx` · `app/account/certificate/page.tsx` (+ `renew` return handling) · `app/admin/offerings/[id]/participants/page.tsx` · `app/admin/certificates/{page,[id]/page,fee/page}.tsx`
`src/content/legal/privacy.ts` (§6 rewritten for opt-in listing — DRAFT, lawyer) · `refund-policy.ts` (renewal sentence — DRAFT)
Tests: `tests/unit/certificate-rules.test.ts`, `certificate-id.test.ts`, `certificate-search-rules.test.ts`; `tests/integration/certificates.test.ts`, `certificate-renewal.test.ts`; `tests/e2e/certificates.spec.ts`; completion report.

## 8. Risks and observations

- **Legal prerequisite (R-X2).** Publishing listed holders' names is personal-data processing; the privacy DRAFT must be updated before the first real certificate is issued, and the lawyer's review is still outstanding for every legal document.
- **Fee economics.** USD 10 net of Stripe fees and conversion is thin; the effective-dated setting lets you change it without a release.
- **Sample data.** None will be seeded: the first certificate appears when the first completion is recorded. Test and e2e fixtures create and delete their own.
- **Name source.** The certificate prints the profile's **legal name**; participants who registered before M5a have no profile row until they save it — the roster will show "profile incomplete" and refuse issuance until a legal name exists.
