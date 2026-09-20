# Account, Registration & Payment — What the Wireframes Need Before They Can Be Real

> **Status: REQUIREMENTS RECORD — authorises nothing.** Created 2026-09-20,
> revised the same day after the registration/checkout wireframe.
> It does not approve a decision, resolve an open question, or authorise
> implementation. Backend work remains subject to the execution gate in
> [`README.md`](README.md) and every RED gate in `CLAUDE.md`.
>
> **Purpose:** when the backend is built, this is the checklist that stops
> anything the wireframe *implies* from being missed. Read §2 (what the
> founder decided), §4 (requirements), §5 (demo files to delete/replace) and
> §6 (test checklist) before starting.

## 1. Context

On 2026-09-20 wireframe screens were added to the mockup
(`project-artifacts/mockup/`) — no backend:

| Screens | Routes |
|---|---|
| Account | `/sign-in`, `/register`, `/forgot-password`, `/sign-out` |
| Signed-in area (demo account, sample data) | `/account`, `/account/programme`, `/account/programmes`, `/account/programmes/[id]`, `/account/orders`, `/account/skills`, `/account/profile` |
| Registration & payment | `/checkout`, `/checkout/confirmation` |
| Certificate of Completion (added later 2026-09-20) | `/verify`, `/verify/[id]` (public), `/account/certificate`, `/account/certificate/renew` — see [`COMPLETION_CERTIFICATE_REQUIREMENTS.md`](COMPLETION_CERTIFICATE_REQUIREMENTS.md) |
| Public CTA (changed 2026-09-20) | The "Register your interest" button on `/DataBlueprint-AIVibeCoding` now leads to sign-in or `/checkout` |

**Master index.** Every screen, its simulated behaviour and its backend
requirements are cross-referenced in [`BACKEND_HANDOFF_INDEX.md`](BACKEND_HANDOFF_INDEX.md) — start there.

Sign-in works only for a **public demo account**, and checkout ends in a
**simulated** payment confirmation — both are labelled simulations confined to
the demo session. What was drawn and why is recorded in
`project-artifacts/mockup/docs/SITE_PAGES.md` and
`project-artifacts/mockup/docs/MOCK_DATA_REGISTER.md`.

## 2. Founder decisions and inputs (2026-09-20) — do not lose these

| # | Statement | Effect on the real build |
|---|---|---|
| F1 | Wireframe only; **no real payment yet** | Nothing here authorises Stripe work |
| F2 | After sign-in, show **our programme — only one** | The signed-in area shows the single flagship. The real product needs a programme + scheduled-offering model that can grow past one without a redesign (`ADR-023`, DR-01 expansion columns) — but must not build the multi-programme catalogue DR-02 retired |
| F3 | The user must **register = check out the programme**, after signing in | Account is mandatory to buy. No guest checkout |
| F4 | **Keep all payment options**, not card-only | Multiple methods, not only cards. The **exact list is undecided** (see A3/A9) |
| F5 | **Show prices in all available currencies; the user chooses** | Multi-currency at checkout, user-selected (see A8/C12) |
| F6 | **Simulate a successful payment** in the demo | Wireframe only. The real product must never do this (see C3, §5) |
| F7 | Sample dates: **labelled illustrative dates** instead of "date to be announced" | A knowing override of DR-02 §4.1 for the wireframe only. Real dates come from real scheduled offerings (A6) |
| F8 | Stripe is the gateway; **the founder holds the account** (2026-09-02, `ADR-014`) | Provider settled; integration still deferred |

## 3. Is it "just" the backend?

**No — and the distinction matters.** Building the backend does *not*
automatically make these screens real. Three different kinds of blocker are
mixed together:

| Kind | Who resolves it | Can an engineer just build it? |
|---|---|---|
| **A. Decisions** | The founder | No — building first would mean inventing the answer |
| **B. Legal / policy documents** | The founder with legal counsel | No — an agent must not draft a binding legal instrument |
| **C. Backend engineering** | Engineering, once A is settled and execution is authorised | Yes |

Order: **A and B → then C.**

## 4. Requirements

### A. Decisions (founder)

| # | Decision | Blocks | Reference |
|---|---|---|---|
| A1 | **Authentication approach** — provider (Better Auth / Auth.js v4 / Clerk) and conditions | Sign-in, register, forgot-password, sign-out; social sign-in, MFA, session length, password rules | `ADR-006`, `docs/architecture/DECISION_B_AUTHENTICATION.md` — **pending approval** |
| A2 | **Transactional email provider** | Email verification (`S04`), password-reset links, registration confirmation, receipts | `ADR-015` — deferred |
| A3 | **Malaysian payment rail** alongside Stripe | The payment-method list; conversion | `ADR-014` — Stripe approved, **rail open**; `OQ-2`. F4 ("keep all options") is an *input* here, not an answer |
| A4 | **Is individual online payment offered at all?** (vs. enquiry / invoice only) | Whether `/checkout` exists for individuals | `HO-10`; DR-02 §4. The wireframe **assumes yes**; this is unconfirmed |
| A5 | **Invoice vs. card for corporate buyers** | Corporate path; HRD Corp interaction | `OQ-2` |
| A6 | **What is bought and how a seat is scoped** — programme → dated offering → seat; **capacity per offering**; waitlist/closed states | The start-date step; overselling protection | DR-02 §4.1 (no invented dates); the wireframe's three start dates are invented |
| A7 | **Account-linking / recovery policy** (e.g. changed employer email) | Recovery flows beyond the basics | Mockup Spec open issue 6 |
| **A8** | **Who may pay in which currency — the regional pricing eligibility rule.** The Pakistan price is a **"Regional Scholarship Program" (70% off)**; International is a 10% offer; Malaysia a 50% "Founder's Launch Offer". F5 lets *anyone* pick *any* of them. Decide: verified-residency rule? country-of-billing? open to all? proof required? Is the discount a scholarship (eligibility-gated) or a price list? | Revenue; fairness; abuse. **Unrestricted choice lets any buyer take the 70% price** | `data/courses.ts` header; wireframe `currencyChoices` |
| **A9** | **The final payment-method list and its currency compatibility** — which of card / online banking / e-wallet (and which named rails) are enabled, and in which currencies. Some methods work only in one currency/country | The method step; whether a method can be shown for a chosen currency | `ADR-014`; Stripe account configuration |
| **A10** | **Are the launch prices standing prices or time-limited offers?** The published figures are time-limited launch offers that "will date" | What an order is priced at and until when; what a registered buyer is owed if the price changes | `data/courses.ts` header |
| **A11** | **Price basis: tax-inclusive or exclusive**, and the display rule per currency | Order summary, receipts, invoices | `SECURITY_ARCHITECTURE.md` M-5; `OQ-9` |
| **A12** | **Cancellation / transfer rules for a registration** — moving to another start date, withdrawal window | The registration lifecycle and refund flow | `OQ-9` |

### B. Legal & policy documents (founder + counsel)

| # | Document | Blocks | Reference |
|---|---|---|---|
| B1 | **Terms of service** | Consent on register and checkout | `SITE_PAGES.md` — "Blocked on legal drafting" |
| B2 | **Privacy policy** (PDPA — what is *actually* collected, stored, where, how long; includes what "Download my data" and "Delete my account" do) | Consent on register; collecting any personal data; the profile page's data controls | as above; `ADR-032` residency |
| B3 | **Refund & cancellation policy**, per product type | **A prerequisite for taking payment at all** | `OQ-9`; `OQ-2`; `SECURITY_ARCHITECTURE.md` M-6 |
| B4 | **Invoicing legal entity** (registered name, number) | Receipts, invoices, Stripe business details | `OQ-9` |
| B5 | **Tax treatment** (service tax on training; inclusive/exclusive) | Tax line, receipts | `SECURITY_ARCHITECTURE.md` M-5 |
| B6 | **Certificate-of-participation wording / terms** | The certificate the participation page promises | `OQ-21` boundary: it is *not* the earned credential |

The consent checkboxes on `/register` and `/checkout` are drawn **disabled**
until B1–B3 exist. They must become real, recorded consent (who, what
version, when) — not merely enabled. **In the wireframe the demo Pay button
does not wait for the tick; in the real product Pay must stay disabled until
it is ticked.**

### C. Backend engineering (after A and B, with execution authorised)

| # | Work | Notes |
|---|---|---|
| C1 | **Real authentication** per the approved A1 | Sessions, password hashing/reset, sign-out that *invalidates the server-side session*. Our database stays the source of truth for identity and roles (`ADR-020`, AP-04) |
| C2 | **Persistent records** — user, programme, scheduled offering, registration, order, payment, consent | Physical data-model change → **RED gate**: approve the schema before any table exists. Must pass the Service Restart Test |
| C3 | **Registrations are created by the SERVER, only after Stripe confirms payment** | The wireframe creates them in the browser on a button click — **exactly what must not exist in production.** Registration/entitlement must never derive from the client or from the redirect back from Stripe (`ADR-014`) |
| C4 | **Stripe integration** | Server-created payment intent / Checkout Session with the **amount set by the server** from our records (never trust a browser-supplied amount or currency); card data only in Stripe's own fields; **webhook with signature verification and idempotency**; reconciliation after an outage. Integration style (hosted Checkout vs embedded Payment Element) still to be chosen |
| C5 | **Secrets** | Live Stripe keys in the deployment environment only — never the repo, never an agent. Use test mode first |
| C6 | **Email** | Registration confirmation, receipts, password reset, verification (A2) |
| C7 | **Consent records** | Persist acceptance of B1–B3 with version and timestamp |
| C8 | **Refund / withdrawal flow** | Admin-side, per B3/A12 |
| C9 | **Security review** | Authentication and payment are both security-sensitive: rate-limiting on sign-in/reset, enumeration-safe recovery, CSRF, no card data in logs |
| C10 | **Tests** | Auth, authorisation, payment and webhook paths — `docs/architecture/TESTING_ARCHITECTURE.md` (§6 below is the checklist) |
| **C11** | **Seat capacity and overselling protection** | Concurrent registrations for the last seat; hold-then-confirm or atomic decrement; what happens when payment fails or is abandoned (release the hold) |
| **C12** | **Multi-currency presentment** | Confirm the Stripe account can charge each currency the wireframe offers (RM, Rs., USD — Pakistani rupee support in particular must be verified in the Stripe dashboard, not assumed). Store the *charged* currency and amount on the order. Decide FX/settlement handling and who bears conversion fees |
| **C13** | **Payment-method ↔ currency rules** | Enforce A9 server-side: do not offer a method the chosen currency cannot use |
| **C14** | **Payment lifecycle states** | Pending · succeeded · failed · abandoned · refunded · disputed. The wireframe only draws "paid". Each needs a screen state (orders list, participation page, dashboard) |
| **C15** | **Confirmation page must read server truth** | `/checkout/confirmation` must show the order the *server* recorded (from the webhook), handle "payment still processing" and "payment failed", and never trust the redirect alone |
| **C16** | **Post-payment side effects** | Confirmation email, seat allocation, joining information, materials release, audit row — all in one idempotent transaction triggered by the webhook |
| **C17** | **Return-to after sign-in** | The wireframe stores a path in `sessionStorage`. Real auth needs a validated redirect (same-site paths only) that survives the auth provider's flow |
| **C18** | **Server-side access control for `/account/*`** | The wireframe's "not signed in" card is a client-side check and protects nothing — every page is a static file. Enforce on the server (`ADR-020`) |
| **C19** | **Real receipts and invoices** | Number series, legal entity (B4), tax (B5); replaces "Receipt: available once payments are connected" |
| **C20** | **"Download my data" / "Delete my account"** | Implement per B2 (PDPA); note interaction with financial-record retention obligations |
| **C21** | **Certificate of Completion issuance** *(renamed from "certificate of participation" — see `COMPLETION_CERTIFICATE_REQUIREMENTS.md` D1)* | Triggered by **recorded completion** (criterion is decision D2), never self-requested; needs a trainer/admin-side surface to record it (not drawn). Full requirements: R-I1…R-X4 in that record |
| **C22** | **Real skills profile** | The wireframe reuses a canned diagnostic fixture; the real one needs evidence-backed capability data (`L05`) |

**RED gates that will be crossed by C:** new dependency (auth provider,
Stripe SDK) · new external service (Stripe, email) · authentication
architecture · payment logic · physical data model. Each is requested at the
moment it is performed.

## 5. Demo artefacts — delete or replace when the backend exists

Everything below is a **labelled simulation**. None may be evolved into the
real thing; each has a real replacement.

| Demo artefact | What it fakes | Replaced by |
|---|---|---|
| `lib/demoCredentials.ts` | A public username/password | Real authentication (C1) |
| `lib/demoSession.ts` | A `sessionStorage` "signed in" flag; the return-to path | Real sessions (C1); validated redirect (C17) |
| `components/auth/SignInForm.tsx` | Compares against the public constants | Real sign-in via the approved provider |
| `components/auth/ClearDemoSession.tsx` | Ends the demo session on `/sign-out` | A server-side sign-out action (C1) |
| `lib/demoRegistrations.ts` | **A payment success created in the browser** | Server-created registrations from a signature-verified webhook (C3, C4, C16) |
| `components/account/CheckoutFlow.tsx` — `pay()` | A 900 ms timer then a fake confirmation | Server-created payment intent / Checkout Session (C4) |
| `components/account/ConfirmationView.tsx` | Shows the last locally stored registration | Server truth (C15) |
| `data/demoParticipant.ts` — `offerings` | Three invented start dates | Real scheduled offerings (A6, C2) |
| `data/demoParticipant.ts` — `paymentMethods` | A provisional generic list | The decided list (A9), enforced server-side (C13) |
| `data/demoParticipant.ts` — `currencyChoices` | All currencies to everyone | The eligibility rule (A8), verified server-side |
| `data/demoParticipant.ts` — `PROGRAMME_TITLE` | Title duplicated from the public page (**placeholder**) | The real programme record; final Data Blueprint + Vibe Coding curriculum (founder, pending) |
| `components/account/RegisterInterestButton.tsx` (public CTA) | Click-time check of the demo-session flag, then routes to sign-in or checkout | A server-aware link/route; validated return path (C17, C18) |
| `components/account/SignInGate.tsx`, `AccountFrame.tsx` gate | Client-side "not signed in" card | Server-side access control (C18) |
| `components/account/SampleTag.tsx`, the orange demo banner, all "Wireframe" notes | Honesty labels | Removed when the data is real |
| `/account/skills` fixture (`data/results.ts` fixture "A") | A canned diagnostic result | Real skills data (C22) |
| The disabled consent checkboxes (`BlockedConsent`) | An un-agreeable consent | Real recorded consent (C7) |

Reusable as-is (layout, copy, routes): the account frame and navigation, the
programme page, the checkout's five-step structure, the order summary, the
participation and orders screens' structure, the form components in
`components/auth/FormParts.tsx`.

## 6. Test checklist for the real build

Must exist before "done" (each is a behaviour the wireframe only pretends to
have):

- Sign-in: wrong password, locked/rate-limited, sign-out invalidates the
  session server-side, `/account/*` refuses an unauthenticated request.
- Return-to: redirects only to same-site paths.
- Checkout: server ignores a tampered amount/currency; a method not allowed
  for the currency is refused; a duplicate registration for a start date is
  refused server-side.
- Payment: success, failure, abandonment, 3-D Secure/authentication
  challenge, and a **replayed / duplicated webhook** (idempotency); a webhook
  with a bad signature is rejected; registration exists **only** after a
  verified success event.
- Capacity: last-seat race between two buyers; a held seat is released on
  failure/abandonment.
- Confirmation page: shows "processing" until the webhook lands; never shows
  success from the redirect alone.
- Refunds and cancellation per B3/A12.
- Regression: public pages still route their CTAs to `/contact-us` unless the
  founder decides otherwise (A4).

## 6a. The Certificate of Completion builds on all of this

The 2026-09-20 certificate requirement (unique ID, yearly expiry, USD 10
annual renewal, public search) inherits every dependency above — auth (A1),
email for reminders (A2), the payment stack and **webhook-confirmed** renewals
(C3, C4), payment states (C14), receipts and tax (C19, A11, B5), the Privacy
policy (B2) and multi-currency handling (C12; renewal is USD 10). Its own
requirements, 15 decisions and demo-file inventory are in
[`COMPLETION_CERTIFICATE_REQUIREMENTS.md`](COMPLETION_CERTIFICATE_REQUIREMENTS.md).
Two that touch this file directly: **A4** (is individual online payment offered
at all?) now also gates whether holders can renew online, and the
"certificate of participation" wording (B6) is superseded by that record's D1.

## 7. Also record — small things that are easy to forget

- **Changed 2026-09-20 (founder):** the "Register your interest" button on the
  public `/DataBlueprint-AIVibeCoding` page now leads to sign-in (if signed
  out) or the registration page (if signed in) —
  `components/account/RegisterInterestButton.tsx`, opt-in via
  `CoursePricing`'s `registrationFlow`. In the real product this becomes a
  server-aware link (session check on the server; validated return path —
  C17/C18). The other course pages and package "Enquire" buttons still go to
  `/contact-us`; public copy elsewhere still says "no online payment yet" —
  reconcile once A4 (is individual online payment offered?) is decided. Add
  `RegisterInterestButton.tsx` to the §5 inventory of demo artefacts.
- The header "Explore courses" button was removed from the shared header by a
  separate founder instruction; "Programme" in the nav reaches the same page.
- The seven-course catalogue data remains in `data/courses.ts` (disabled, not
  deleted). The signed-in area deliberately shows one programme.
- Certification is paused (founder, 2026-09-06), so `L09` My Credentials is
  absent from the signed-in area.
- Pricing figures date; A10 decides what a registered buyer is owed.
