# Account & Payment — What the Wireframes Need Before They Can Be Real

> **Status: REQUIREMENTS RECORD — authorises nothing.** Created 2026-09-20.
> It does not approve a decision, resolve an open question, or authorise
> implementation. Backend work remains subject to the execution gate in
> [`README.md`](README.md) and every RED gate in `CLAUDE.md`.

## 1. Context

On 2026-09-20 five **wireframe** screens were added to the mockup
(`project-artifacts/mockup/`): `/sign-in`, `/register`, `/forgot-password`,
`/sign-out`, `/checkout`. They are inert by design — no authentication, no
email, no database, no Stripe. What they show, and what was deliberately left
out, is recorded in `project-artifacts/mockup/docs/SITE_PAGES.md`
("Account & payment wireframes").

This document records **what must exist before they can be made to work**.

## 2. Is it "just" the backend?

**No — and the distinction matters.** Building the backend does *not*
automatically make these screens real. Three different kinds of blocker are
mixed together:

| Kind | Who resolves it | Can an engineer just build it? |
|---|---|---|
| **A. Decisions** | The founder | No — building first would mean inventing the answer |
| **B. Legal / policy documents** | The founder with legal counsel | No — an agent must not draft a binding legal instrument |
| **C. Backend engineering** | Engineering, once A is settled and execution is authorised | Yes |

Kind C is what "when we implement the backend" covers. Kinds A and B are
prerequisites *to* it, not part of it. The order is A and B → then C.

## 3. Requirements

### A. Decisions (founder)

| # | Decision | Blocks | Reference |
|---|---|---|---|
| A1 | **Authentication approach** — provider (Better Auth / Auth.js v4 / Clerk) and conditions | Sign-in, register, forgot-password, sign-out. Also: social sign-in, MFA, session length, password rules | `ADR-006`, `docs/architecture/DECISION_B_AUTHENTICATION.md` — **pending approval** |
| A2 | **Transactional email provider** | Email verification (`S04`), password-reset links, receipts | `ADR-015` — deferred; trigger is "real email verification is required" |
| A3 | **Malaysian payment rail** (alongside Stripe) and which payment methods are offered | The payment-method list on checkout; conversion | `ADR-014` — Stripe half approved 2026-09-02, **rail open**; `OQ-2` |
| A4 | **Is individual online payment offered at all?** (vs. enquiry / invoice only) | Whether `/checkout` exists for individuals | `HO-10`; DR-02 §4 |
| A5 | **Invoice vs. card for corporate buyers** | Corporate path; HRD Corp interaction | `OQ-2` |
| A6 | **Which product is bought at checkout** and how a purchase is scoped (programme → dated offering → seat) | The order-summary line item; there is currently no cart and no dated offerings | DR-02 §4.1 (no invented dates); `ADR-014` |
| A7 | **Account-linking / recovery policy** (e.g. changed employer email) | Recovery flows beyond the basics | Mockup Spec open issue 6; External Review §"account-linking" |

### B. Legal & policy documents (founder + counsel)

| # | Document | Blocks | Reference |
|---|---|---|---|
| B1 | **Terms of service** | Consent checkbox on register and checkout | `SITE_PAGES.md` — "Blocked on legal drafting" |
| B2 | **Privacy policy** (PDPA — must describe what is *actually* collected, stored, where, how long) | Consent on register; collecting any personal data | as above; `ADR-032` residency answer feeds this |
| B3 | **Refund & cancellation policy**, per product type | **A prerequisite for taking payment at all** | `OQ-9`; `OQ-2`; `SECURITY_ARCHITECTURE.md` M-6 |
| B4 | **Invoicing legal entity** (registered name, registration number) | Receipts, invoices, Stripe account business details | `OQ-9`; `SITE_PAGES.md` open gap |
| B5 | **Tax treatment** (service tax on training services; whether prices are tax-inclusive) | The tax line on the order summary and receipts | `SECURITY_ARCHITECTURE.md` M-5; needs accounting input |

The two consent checkboxes on `/register` and `/checkout` are drawn
**disabled** until B1–B3 exist. They must become real, recorded consent (who,
what version, when) — not merely enabled.

### C. Backend engineering (after A and B, with execution authorised)

| # | Work | Notes |
|---|---|---|
| C1 | **Real authentication** per the approved A1 | Sessions, password hashing/reset, sign-out that *invalidates the server-side session*. Our database stays the source of truth for user identity and roles (`ADR-020`, AP-04) — the provider is authentication only |
| C2 | **Persistent user & account records** | Physical data-model change → **RED gate**: needs explicit approval of the schema before any table is created |
| C3 | **Orders / registrations as authoritative records** | Payment state lives in *our* database, not only at Stripe. **Entitlement must never derive from the payment provider** (`ADR-014`). Must pass the Service Restart Test |
| C4 | **Stripe integration** | Server-created payment intents / sessions; Stripe's own fields for card entry (card data never touches our servers); **webhook endpoint with signature verification and idempotency**; reconciliation after an outage |
| C5 | **Secrets handling** | Live Stripe keys live in the deployment environment only — **never** in the repository, and never handled by an agent |
| C6 | **Email sending** | Verification, password reset, receipts — per A2 |
| C7 | **Consent records** | Persist acceptance of B1–B3 with version and timestamp |
| C8 | **Refund / withdrawal flow** | Admin-side, per B3 |
| C9 | **Security review** | Authentication and payment code are both security-sensitive; rate-limiting on sign-in and reset, enumeration-safe recovery, CSRF, etc. |
| C10 | **Tests** | Auth, authorisation, payment and webhook paths all require tests under `docs/architecture/TESTING_ARCHITECTURE.md` |

**RED gates that will be crossed by C:** new dependency (auth provider,
Stripe SDK) · new external service (Stripe, email) · authentication
architecture · payment logic · physical data model. Each is requested at the
moment it is performed.

## 4. What the wireframes will need when C begins

> **Demo sign-in added 2026-09-20.** `/sign-in` now signs in a public demo
> account and opens the sample-data `/account/*` screens. It is a
> simulation (`lib/demoSession.ts`, `lib/demoCredentials.ts`,
> `components/auth/SignInForm.tsx`) — **delete those three files when real
> authentication (C1) is built; do not evolve them into it.** The
> signed-in screens' layouts are reusable; `data/demoParticipant.ts` is
> replaced by real queries (which need C2/C3 — participant, registration
> and order records, all behind the physical-data-model RED gate), and the
> client-side "not signed in" card is replaced by server-side access control
> (`ADR-020`). Signed-in screens also depend on DR-02's scheduled-offerings
> model (A6): a "next session" needs real dated offerings to exist.


- Replace the disabled buttons and `InertForm` with real submission — the
  screens' layout, copy and routes are the reusable part.
- Replace the dashed Stripe slot on `/checkout` with Stripe's Payment Element.
- Replace the hard-coded sample line item with the real selected product (A6).
- Add the screens the wireframes deliberately omit: email-verification (`S04`),
  the "check your email" and "set a new password" steps, onboarding (`S03`),
  and any decided social / MFA / SSO options.
- Remove the "Wireframe" notes and update `docs/MOCK_DATA_REGISTER.md` (rows
  for these pages become REAL) and `docs/SITE_PAGES.md`.
