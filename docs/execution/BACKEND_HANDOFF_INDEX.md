# Backend Handoff Index — Everything the Wireframe Implies

> **Status: REQUIREMENTS RECORD — authorises nothing.** Created 2026-09-20.
> It does not approve a decision, resolve an open question, change the data
> model, or authorise backend work. Execution remains gated by
> [`README.md`](README.md) and every RED gate in `CLAUDE.md`.
>
> **Purpose.** The mockup (`project-artifacts/mockup/`) now shows a signed-in
> participant journey, registration and payment, a Certificate of Completion
> with public verification, and mobile behaviour — all **without a backend**.
> Much of it *looks* finished and is not. **This is the one place that ties
> every screen to what is fake, what the real build must do, and which
> decision blocks it.** Read it before writing the first line of backend code.
>
> **Rule for keeping it true.** When a wireframe screen, simulation or sample
> value changes, update this file, `MOCK_DATA_REGISTER.md` and `SITE_PAGES.md`
> in the same change. §14 gives a command that finds files no doc mentions.

## 1. Reading order

| # | Document | Read it for |
|---|---|---|
| 1 | **This file** | The map: every screen ↔ simulations ↔ requirements ↔ blockers |
| 2 | [`ACCOUNT_AND_PAYMENT_REQUIREMENTS.md`](ACCOUNT_AND_PAYMENT_REQUIREMENTS.md) | Founder decisions F1–F8, open decisions A1–A12, legal documents B1–B6, backend work C1–C22, demo-file inventory, test checklist |
| 3 | [`COMPLETION_CERTIFICATE_REQUIREMENTS.md`](COMPLETION_CERTIFICATE_REQUIREMENTS.md) | The certificate feature: requirements R-*, verified logic, privacy design, decisions D1–D15 |
| 4 | `project-artifacts/mockup/docs/SITE_PAGES.md` | What each page shows, why, and what was deliberately not built |
| 5 | `project-artifacts/mockup/docs/MOCK_DATA_REGISTER.md` | REAL vs FAKED for every claim the wireframe makes |
| 6 | `docs/architecture/` (`ADR-006`, `-014`, `-015`, `-016`, `-018`, `-020`, `-022`) | The approved/pending architecture the build must respect |
| 7 | `DR-01`, `DR-02` (repo root) | Product boundaries — especially DR-02 §6 (credential ≠ attendance) |

## 2. Screen-by-screen matrix

**Legend.** *Simulated* = looks real, is not. Requirement IDs: **A/B/C** →
`ACCOUNT_AND_PAYMENT_REQUIREMENTS.md`; **D/R-** → `COMPLETION_CERTIFICATE_REQUIREMENTS.md`.

### 2.1 Account and entry

| Route | Purpose | Simulated / faked | Real build needs | Requirements | Blocked by |
|---|---|---|---|---|---|
| `/sign-in` | Sign in (`S01`) | **Demo account with public credentials**; a `sessionStorage` flag; return-to path stored in `sessionStorage` | Real auth, sessions, rate limiting, validated return-to, enumeration-safe errors | C1, C9, C17 | **A1** (`ADR-006`) |
| `/register` | Create account (`S02`) | Inert — button disabled, nothing stored | Account creation, email verification, password rules, consent records | C1, C6, C7 | A1, A2, **B1, B2** |
| `/forgot-password` | Request reset | Inert; request step only | Reset flow (email link, set-new-password step, expiry, single-use tokens) | C1, C6 | A1, A2 |
| `/sign-out` | Post-sign-out screen | Clears the demo flags on mount | A server-side sign-out that invalidates the session, then redirects here | C1 | A1 |
| Header avatar menu · `AccountFrame` gate · orange demo banner | Signed-in chrome | Client-side check of the demo flag — **protects nothing** (pages are static files) | Server-side access control on every `/account/*` request | **C18** | A1 |
| `/DataBlueprint-AIVibeCoding` "Register your interest" | Public CTA | Click-time check of the demo flag → `/sign-in` or `/checkout` | A server-aware link; validated return path | C17, C18 | **A4** |

### 2.2 Programme, registration, payment

| Route | Purpose | Simulated / faked | Real build needs | Requirements | Blocked by |
|---|---|---|---|---|---|
| `/account/programme` | The one programme, signed-in (`P10`) | **Start dates are invented** ("Sample"); title is a **placeholder** | Programme + scheduled-offering records; real dates, capacity; the final curriculum | C2, C11 | **A6**; founder's curriculum |
| `/checkout` | Register: date → currency → details → method → confirm | **Pay** adds a record to `sessionStorage`; consent tick disabled; method list provisional; card panel is a *picture* | Server-created payment (amount/currency set server-side); Stripe; webhook-confirmed registration; capacity hold; consent record | **C3, C4, C5, C11, C12, C13**, C7 | **A3, A4, A6, A8, A9, A10, A11**, **B1, B3, B4, B5** |
| `/checkout/confirmation` | Confirmation | Shows the last locally stored registration — **a fake "payment received"** | Reads the *server's* record; handles processing / failed; never trusts the redirect | **C15**, C14, C16 | as above |
| `/account` | Dashboard (`L01`) | Registered / not-registered from `sessionStorage` | Real registration + certificate queries | C2, C3 | A6 |
| `/account/programmes` · `/[id]` | My registrations · participation | Registrations from `sessionStorage`; `[id]` is a sample start-date id | Registration records; trainer-recorded attendance; joining information | C2, C21 | A6 |
| `/account/orders` | Orders & receipts (`S07`) | Rows from `sessionStorage`; "Paid" and order numbers invented; **no receipts** | Order/payment records, receipts and invoices, payment states | C14, C19 | **A11, B4, B5** |

### 2.3 Certificate of Completion

| Route | Purpose | Simulated / faked | Real build needs | Requirements | Blocked by |
|---|---|---|---|---|---|
| `/verify` | **Public** search by ID or name | Searches an **invented registry** in the browser | Server-side, rate-limited search over real certificates; listed-holders rule | R-S1…S8, R-X2 | **D3, D4**; **B2** |
| `/verify/[id]` | The certificate's unique URL; live status | Sample records; only pre-built IDs exist (static export) | Dynamic route resolving any ID; real 404; short-lived cache; `noindex` | R-D4, R-V1…V6, R-L1, R-L5 | D8, D9 |
| `/account/certificate` | Holder's certificate, print/share, listing consent, renewal | **Issuance, "a year passing" and the clock jumps are demo buttons** | Issue on recorded completion; status from stored dates; recorded listing consent | R-I1…I5, R-H1…H4, R-L1 | **D1, D2, D3** |
| `/account/certificate/renew` | Renew (USD 10) | **Simulated payment success**; fee is a code constant | Server-set fee from admin-managed, effective-dated config; webhook-confirmed renewal | R-F1…F7, R-L3, R-L4, **C3, C4** | **D5, D6, D7, D10**; A3 |

### 2.4 Other account screens

| Route | Purpose | Simulated / faked | Real build needs | Requirements | Blocked by |
|---|---|---|---|---|---|
| `/account/skills` | Skills profile (`L05`) | **Canned diagnostic fixture**, not computed from anyone's answers | Evidence-backed capability data | C22 | Diagnostic engine (out of scope of this record) |
| `/account/profile` | Profile & security (`S06`) | Inert; export/delete/password buttons disabled | Profile edit, password change, PDPA export & deletion | C20, C1 | **B2**, A1 |

### 2.4b Added in the 2026-09-20 review round

| Route | Purpose | Simulated / faked | Real build needs | Requirements | Blocked by |
|---|---|---|---|---|---|
| `/faq` | FAQ (`data/faq.ts`) | "To be confirmed" chips where policy is open | Replace each TBC answer as decisions land | — | A4, A9, A11, B2, B3 |
| `/refund-policy`, `/terms`, `/privacy`, `/credential-integrity-policy` | Legal placeholders | No text — state "not yet published" | The documents | B1–B3, integrity policy | Founder + counsel |
| `/schedule` | Upcoming dates, seats, waitlist (`P24`) | Sample dates/seats; waitlist inert | Offerings with capacity and states; waitlist records + notifications | A6, C11 | A6 |
| `/for-organisations` | Team engagement + HRD Corp + team enquiry (`P17`/`P19`) | Inert form | Corporate enquiry handling; invoice path; org dashboard (`O01`) and evidence pack (`O10`) later | A5 | A5, OQ-8 |
| `/account/orders/[id]` | Receipt | Placeholder issuer, tax "not determined" | Real receipts/invoices with numbering, entity, tax | C19 | B4, B5, A11 |
| `/account/notifications`, `/account/help` | Notification centre (`S05`), help | Static samples / signposts | Notification records; delivery | C6 | A2 |
| `/admin`, `/admin/offerings`, `/registrations`, `/certificates`, `/settings`, `/emails` | **Trainer/admin operations** | Sample tables; **no roles**; every action disabled | RBAC (`ADR-020`), audit (`ADR-022`); record attendance/completion → issue certificate; revoke/correct; effective-dated fee; offerings & capacity; email catalogue | C2, C21, R-I1, R-F1/F2, R-L8, D2, D11, D12 | A1, A2, D2 |

### 2.5 Shared chrome

| Item | Change | Note |
|---|---|---|
| Header nav | **"Search"** (→ `/verify`) added 2026-09-20 — seven nav items | — |
| Footer | "Verify a certificate → Search completion certificates" (`/verify`); the earned-credential line is kept, still "available once the first credential is issued" | The two verifications are **different things** — never merge them (DR-02 §6, D1) |
| Header | The "Explore courses" CTA was **removed** by a separate founder instruction (see the comment in `PublicShell.tsx`); "Sign in" became the avatar menu when in the demo session | — |
| Print stylesheet (`globals.css`) | "Print / Save as PDF" outputs only `.print-area` | Reuse for the real certificate |

## 3. Simulation inventory — delete or replace

Nothing below is production logic. Each item has a real replacement.

### 3.1 Browser-tab state

| `sessionStorage` key | Holds | Cleared by |
|---|---|---|
| `mockup:demo-session` | "signed in" flag | Sign-out / "End demo session" |
| `mockup:demo-registrations` | Simulated registrations (the fake payments) | `endDemoSession()` |
| `mockup:demo-certificate` | The demo participant's certificate and renewals | `endDemoSession()` |
| `mockup:demo-return-to` | Path to resume after sign-in | Consumed on sign-in |
| *(pre-existing, approved)* `mockup:diagnostic:in-progress`, `mockup:theme` (localStorage) | Diagnostic answers; theme | Not part of this work |

### 3.2 Files

| File | Fakes | Replace with |
|---|---|---|
| `lib/demoCredentials.ts`, `lib/demoSession.ts` | Credentials, session flag, return-to | Real auth (C1), validated redirect (C17) |
| `components/auth/SignInForm.tsx`, `ClearDemoSession.tsx` | Sign-in / sign-out | Real forms + server actions/routes |
| `lib/demoRegistrations.ts` | **A payment success created in the browser** | Server-created registrations from a verified webhook (C3, C4, C16) |
| `lib/demoCertificate.ts` | Issuance, time travel, renewal | Server issuance, computed expiry, webhook-confirmed renewal |
| `components/account/CheckoutFlow.tsx` (`pay()`), `RenewFlow.tsx` (`pay()`), `ConfirmationView.tsx` | Payment | Server-created payment; server-truth confirmation (C4, C15) |
| `components/account/SignInGate.tsx`, `AccountFrame.tsx` (gate), `RegisterInterestButton.tsx`, `RegisterButton.tsx` | Client-side gating/routing on the flag | Server-side access control (C18) |
| `data/demoParticipant.ts` | The participant, the **3 invented start dates**, generic payment methods, all currencies to everyone | Real records; decided list (A9); eligibility rule (A8) |
| `data/certificates.ts` | The invented public registry + `DEMO_CERT_ID` | The database |
| `data/certificateConfig.ts` | Fee/validity/window as constants | Admin-managed, effective-dated config (R-F1/F2) |
| `components/certificates/records.ts` (`useRegistry`, `verificationUrl`) | Client-side search; URL built in browser | Server search; canonical URL |
| `components/account/SampleTag.tsx`, `certificates/SampleBanner.tsx`, watermark, orange banner, "Wireframe" notes | Honesty labels | Remove when data is real |
| QR placeholder in `CertificateDocument.tsx` | A missing QR | Real QR (D15, needs approval) |

### 3.3 Reusable as-is (not simulations)

`lib/certificates.ts` (pure, **tested** rules) · `lib/useNow.ts` · the certificate
document design and print stylesheet · `components/certificates/StatusChip.tsx` ·
`components/account/PaymentParts.tsx` (`Choice`, `CardFieldsPicture`) ·
`components/auth/FormParts.tsx` · `AuthScreen.tsx` · the account navigation and
layouts · the verification/search screens' structure and copy.

### 3.4 Complete file map (everything added or changed for this work)

**New — routes (`app/`):** `sign-in`, `register`, `forgot-password`,
`sign-out`, `checkout`, `checkout/confirmation`, `account` (layout + `page`,
`programme`, `programmes`, `programmes/[id]`, `orders`, `skills`, `profile`,
`certificate`, `certificate/renew`), `verify`, `verify/[id]`.

**New — components:**
`auth/` — `AuthScreen` (page frame) · `FormParts` (`InertForm`, `Field`,
`PasswordField`, `BlockedConsent`, `WireframeNote`) · `SignInForm` · `ClearDemoSession`.
`account/` — `AccountFrame` (sidebar/tabs/banner/gate) · `AccountMenu` (header
avatar menu + mobile actions) · `SignInGate` · `CheckoutFlow` · `ConfirmationView`
· `PaymentParts` (`Choice`, `CardFieldsPicture`) · `RegisterButton` (programme
page CTA) · `RegisterInterestButton` (public CTA) · `ParticipationView` ·
`CertificateView` · `RenewFlow` · `SampleTag`.
`certificates/` — `CertificateDocument` · `StatusChip` · `SampleBanner` ·
`VerifySearch.tsx` (public search UI) · `VerifyDetail.tsx` (a certificate's public page) · `records.ts` (registry hook, demo record, URL).

**New — lib/data:** `lib/demoCredentials.ts`, `demoSession.ts`,
`demoRegistrations.ts`, `demoCertificate.ts`, `certificates.ts` (tested rules),
`useNow.ts` · `data/demoParticipant.ts`, `certificateConfig.ts`, `certificates.ts`.

**Changed (pre-existing files):** `components/PublicShell.tsx` (avatar menu,
mobile actions, footer verify link, reviewer index) · `components/CoursePricing.tsx`
(opt-in `registrationFlow`) · `app/DataBlueprint-AIVibeCoding/page.tsx` (enables
it) · `app/globals.css` (mobile rules, print stylesheet) · mobile-audit fixes:
`components/HomeHeroLight.tsx` (journey row), `components/CourseCard.tsx`,
`components/TrainerCard.tsx`, `app/trainers/page.tsx`,
`app/courses/[slug]/page.tsx`, `components/signature/DiagnosticQuestionCanvas.tsx`.

## 4. Data invented vs real

| Real (from `data/courses.ts` etc.) | Invented, labelled "Sample" |
|---|---|
| The programme (title as on the public page, outcomes, curriculum, "included" list) | Every **start date** and time |
| The 3 delivery formats, durations, schedules | Order numbers, payment status, order dates |
| Published prices in **RM / Rs. / USD** | The participant ("Demo Participant"), all four public certificate holders |
| The trainer's name (the founder) | Certificate IDs (contain `0`/`1`, which the real alphabet never produces) |
| The diagnostic *questions* (pre-existing) | The skills profile (canned fixture) |

**Founder override on record:** offered "date to be announced" (DR-02 §4.1) or
labelled illustrative dates, the founder chose **illustrative dates** — for the
wireframe only. Real dates come from real scheduled offerings (A6).

## 5. Entities the real build implies (conceptual — NOT a schema)

Physical data-model change is a **RED gate**; this is a checklist of what the
screens require, so none is forgotten. Each must pass the Service Restart Test.

- **Identity:** user, authentication identity (provider mapping — `ADR-006`),
  session, password-reset token, email-verification token.
- **Catalogue:** programme, delivery format, **scheduled offering** (dates,
  capacity, status), **price per currency** with its offer label, **regional
  eligibility rule** (A8).
- **Commerce:** registration (participant ↔ offering), order, payment
  (provider reference, amount, **currency actually charged**, method, state),
  refund, receipt/invoice with number series, tax treatment, **webhook event
  log** (idempotency).
- **Consent & policy:** consent record (who, which document/version, when),
  policy versions (Terms, Privacy, Refund).
- **Certificate:** certificate (unique ID, holder, registration, dates,
  revoked flag), **renewal** (insert-only), **fee setting** (effective-dated),
  **listing consent**, notification log.
- **Delivery ops:** attendance / completion record, trainer-and-admin actions.
- **Cross-cutting:** audit log (`ADR-022`), rate-limit store, roles/permissions
  (`ADR-020`).

## 6. Consolidated open decisions

Full text and recommendations are in the two requirement records; this is the
checklist. **None is decided.**

| Group | Decisions |
|---|---|
| **Auth & email** | A1 auth provider (`ADR-006`) · A2 email provider (`ADR-015`) · A7 account-linking/recovery |
| **Payments** | A3 Malaysian rail · A4 is individual online payment offered at all (`HO-10`) · A5 invoice vs card for corporate · **A8 regional-price eligibility** (Pakistan price is a *scholarship*) · **A9 final payment-method list × currency** · A10 launch-price durability · A11 tax-inclusive/exclusive · A12 cancel/transfer rules |
| **Offering** | A6 what a seat is; capacity; waitlist |
| **Legal documents (founder + counsel)** | B1 Terms · B2 Privacy (PDPA) · B3 Refund & cancellation · B4 invoicing entity · B5 tax · B6 certificate wording |
| **Certificate** | D1 name/positioning vs the earned credential · D2 what "completed" means · D3 listing consent model · D4 name-search rules · D5 fee, year-1, currency, processing-fee economics · D6 renewal window/grace · D7 renewal date arithmetic · D8 expired presentation · D9 timezone · D10 auto-renew, refunds, consumer-law review · D11 revocation · D12 corrections · D13 corporate visibility · D14 certificate design & issuer identity · D15 QR/PDF approach |
| **Infrastructure** | **Hosting** (`ADR-016`) — see §8 · integration style: Stripe **hosted Checkout vs embedded Payment Element** |

## 7. Suggested build order (PROPOSED)

1. **Decisions and legal documents** (§6) — most are not engineering.
2. **Foundations:** hosting (§8), database, auth (C1, C2 subset), secrets (C5),
   audit, test suite carrying over `lib/certificates.ts`'s 42 cases.
3. **Catalogue:** programme, scheduled offerings, capacity.
4. **Registration and payment:** server-priced checkout, Stripe, webhooks,
   capacity holds, payment states, receipts.
5. **Account screens** on real data (dashboard, registrations, orders, profile).
6. **Certificate:** completion recording → issuance → verification page/search →
   listing consent.
7. **Renewal:** fee configuration, renewal payment, reminders.
8. **Trainer/admin surfaces** (record completion, attendance, fee setting,
   revocation) — **not drawn in the wireframe at all**.
9. **Hardening:** security review, rate limiting, accessibility, load, restart.

## 8. Hosting — the wireframe's deployment cannot host a backend

The mockup deploys as a **static export to GitHub Pages**
(`.github/workflows/deploy-pages.yml`; `next.config.ts` sets `output: "export"`,
`basePath`, `trailingSlash` when `GITHUB_PAGES=true`). Static hosting **cannot
run server code**: no API routes, server actions, webhooks or sessions.
`/verify/[id]` works today only because the export pre-builds five known IDs.
A real build needs a host that runs server code (`ADR-016` is **open**), and
must drop `output: "export"`. Also plan: the production app is a **separate
application** from this disposable mockup (its own `CLAUDE.md` says so).

## 9. Not built — so nobody assumes it exists

- **Auth:** social sign-in, MFA, SSO, "remember me", session length, the
  email-verification step (`S04`), onboarding (`S03`), the "check your email"
  and set-new-password steps.
- **Commerce:** tax line, invoices, refunds, disputes, auto-renew, coupons, a
  cart (there is one programme), corporate/team purchase, HRD Corp claim flow.
- **Certificate:** revocation, reminders/email, real QR, PDF generation beyond
  the browser's print, holder corrections, employer/corporate views, an ID
  check character.
- **Operations surfaces:** now *drawn* under `/admin` (2026-09-20) as sample
  tables with disabled actions — but **no roles, permissions, forms or
  behaviour** exist behind them.
- **Other:** corporate-manager persona
  (`O01`, `O10`), "My credentials" (`L09` — Certification is paused, founder
  2026-09-06), lesson player / AI tutor / learning paths / community (retired or
  deferred by DR-02).

## 10. Public-copy reconciliation still owed

These statements now disagree with the wireframe or with each other; decide and
align once A4 and D1 are settled.

| Where | Says | Conflict |
|---|---|---|
| `about-us`, course-detail template, `CoursePricing` (other courses) | "no online payment yet", "Register your interest" → `/contact-us` | The flagship's public CTA now leads to sign-in/checkout |
| Course pages, source content | "**Certificate of participation**" | Superseded by "Certificate of Completion" if D1 is accepted |
| Footer | *(resolved 2026-09-20 — plain-text "Certifications" / "For organisations" removed)* | — |
| Homepage hero card | "Job Opportunities in Malaysia — 1–2 top candidates will be brought to Malaysia" (founder intent, 2026-09-20) | Needs terms before launch: selection criteria, what "brought" includes (visa, travel, employment), and who decides — a published policy, not hero copy |
| Legal pages | `/terms`, `/privacy`, `/credential-integrity-policy` are placeholders | The documents (B1, B2 and the integrity policy) remain undrafted |
| `/courses/ai-powered-product-development` (flagship's own detail page) | Enquiry CTA | Only `/DataBlueprint-AIVibeCoding` opts in to the sign-in/registration flow |
| Pricing copy | "time-limited launch offers" | A10 — what a registered buyer is owed if prices change |
| Brand | "Data & AI Academy" is a **working placeholder** (`HO-4`) and is printed on every certificate | D14 |

## 11. Quality commitments the real build must keep

From the mobile audit (`SITE_PAGES.md` → "Mobile friendliness"):

- No horizontal scroll from **320px** up; tested at 320/375/600/768/820/1024/1280.
- Form fields **≥ 16px on phones** (iOS zooms the page otherwise); tap targets
  **≥ 40px** on phones/touch (`globals.css`).
- Certificate status is conveyed by **icon and words, never colour alone**.
- Forms **must not submit values into the URL** (the wireframe swallows Enter;
  real forms POST).
- Certificate pages are `noindex`; verification data is **short-cache**.
- A **print stylesheet** outputs the certificate alone.
- Honest labelling: anything simulated says so on the page. Keep that discipline
  for any future demo mode.

## 12. What was verified — and what was not

| Verified | How |
|---|---|
| Certificate rules (dates, renewal, IDs, search, privacy) | 42 Node assertions (scratch script; **not committed** — the mockup has no test framework) |
| Every flow (sign-in gate & return, checkout, simulated payment, dashboard/registrations/orders, sign-out wipe, certificate issue → expire → renew, listing on/off, public search, unknown ID) | Driven in the browser pane |
| No horizontal overflow; tap targets; field sizes | Automated probe at 320/375/768 (+600/820/1024/1280) |
| Static export builds; every route pre-built | `next build` with `GITHUB_PAGES=true` in a scratch copy |
| Type-check | `tsc --noEmit` clean |

**Not verified:** physical devices, Safari/Firefox, landscape, OS text-size
settings, colour contrast re-audit, real printing to PDF, screen-reader pass,
and any load or security testing. There is no automated test suite for the
mockup UI.

## 13. Chronology of the wireframe work (2026-09-20)

1. Account wireframes: sign-in, register, forgot-password, sign-out, checkout.
2. Requirements record created (`ACCOUNT_AND_PAYMENT_REQUIREMENTS.md`).
3. **Demo sign-in** and the signed-in area (dashboard, programmes, orders,
   skills, profile) with labelled sample data.
4. **One programme; registration = checkout**; currency choice; all payment
   options; **simulated confirmation**; requirements record rewritten (A8–A12,
   C11–C22).
5. **Mobile audit** across the whole portal; fixes recorded in `SITE_PAGES.md`.
6. **Public CTA:** "Register your interest" → sign-in or checkout.
7. **Certificate of Completion** with public verification; polished
   requirement (`COMPLETION_CERTIFICATE_REQUIREMENTS.md`).
8. **This documentation audit:** stale statements corrected, this index added.

## 14. How to check the docs still cover the code

From the repository root — lists changed/new code files that **no** markdown
file mentions (pages are matched by route, everything else by file name):

```bash
# All markdown once (avoids broken-pipe noise), then look each code file up in it.
{ git ls-files '*.md'; git ls-files -o --exclude-standard '*.md'; } | sort -u | while IFS= read -r m; do cat "$m"; done > /tmp/all_md.txt
{ git ls-files 'project-artifacts/mockup/*.ts' 'project-artifacts/mockup/*.tsx' 'project-artifacts/mockup/*.css'
  git ls-files -o --exclude-standard 'project-artifacts/mockup/*.ts' 'project-artifacts/mockup/*.tsx' 'project-artifacts/mockup/*.css'; } | sort -u \
| while IFS= read -r f; do
  b=$(basename "$f")
  if [ "$b" = "page.tsx" ]; then key=$(echo "$f" | sed 's|^project-artifacts/mockup/app||; s|/page.tsx$||; s|^$|/|'); [ -z "$key" ] && key="/"; else key="$b"; fi
  grep -qF -- "$key" /tmp/all_md.txt || echo "UNDOCUMENTED: $f"
done
```

A file listed there is not necessarily wrong (many pre-existing files predate
this work) — but any file **added or changed for the account, checkout,
certificate or mobile work** that appears there is a gap to close.
