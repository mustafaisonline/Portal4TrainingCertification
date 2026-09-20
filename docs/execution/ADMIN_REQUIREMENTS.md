# Trainer & Administrator Side — What the Wireframe Implies

> **Status: REQUIREMENTS RECORD — authorises nothing.** Created 2026-09-20.
> It does not approve a decision, change the data model, or authorise
> backend work. Execution remains gated by [`README.md`](README.md) and every
> RED gate in `CLAUDE.md`.
>
> **Why it exists.** The 2026-09-20 review found the participant side
> (registration, attendance, certificates, renewal) could not work because
> nothing existed for the people who *run* it. The founder asked for a full
> admin side in wireframe. This record is the checklist for building the
> real one.

## 1. Founder direction (2026-09-20)

> Let's create Admin Side on URL `/admin` in wireframe to test, please create
> all kind of pages, dashboards etc etc you think an admin side must have to
> support our portal. Also show pre-loaded username and password for testing
> purpose.

## 2. The wireframe: `/admin`

**Sign in** with the second demo persona shown on `/sign-in`:
`demo.admin@example.com` / `Demo-Admin-2026`. A participant who opens
`/admin` is told an administrator account is needed.

⚠ **The role is a word the browser stores** (`lib/demoSession.ts`); it is a
label, not a permission. Nothing is enforced — every page is a static file.

| Route | Screen | Purpose |
|---|---|---|
| `/admin` | Dashboard | What needs attention today (attendance to record, completions to mark, pending invoice, open enquiries, renewals due), KPIs, upcoming offerings, recent orders/enquiries/activity |
| `/admin/programme` | Programme | The one programme: formats, prices per currency, curriculum, supporting materials — edit actions |
| `/admin/offerings`, `/admin/offerings/[id]` | Dates & seats | Scheduled offerings with capacity and state; per-offering: sessions & attendance, roster, joining information, materials, cancel |
| `/admin/registrations` | Registrations & attendance | All registrations with payment / attendance / completion; record attendance, **mark complete** (issues a certificate), refund |
| `/admin/participants`, `/admin/participants/[id]` | Participants | Accounts; per participant: registrations, orders, certificate, listing consent, PDPA export/delete |
| `/admin/orders` | Orders & payments | States, receipts, refunds, raise invoice |
| `/admin/enquiries` | Enquiries | Inbox from the Contact and For Organisations forms |
| `/admin/organisations` | Organisations | Corporate clients, engagement, invoice, HRD Corp status, evidence pack |
| `/admin/certificates`, `/admin/certificates/[id]` | Certificates | Status, listing; per certificate: history, correct name, reissue, **revoke** |
| `/admin/settings` | Fees & settings | Renewal fee (effective-dated), validity, window, search rules; currencies, eligibility rule, payment methods, tax, entity, Stripe; policy publication & versions |
| `/admin/emails` | Emails | Catalogue of transactional emails and triggers |
| `/admin/users` | Users & roles | Staff, roles (Administrator, Trainer, Assessor, Finance) |
| `/admin/audit` | Audit log | Insert-only record of every action |
| `/admin/reports` | Reports | Attendance, revenue, certificate status, pricing usage, enquiry funnel |

Everything shown is **sample** (`data/adminSamples.ts`: fictional people and
"… Example Sdn Bhd" organisations) and **every action button is disabled**.

## 3. Requirements the wireframe implies (PROPOSED)

### 3.1 Identity and access
| ID | Requirement |
|---|---|
| AD-1 | Separate **roles**, scoped and enforced at the data layer (`ADR-020`): Administrator, Trainer, Assessor (future), Finance. A trainer sees only their offerings' rosters; finance sees orders. |
| AD-2 | **Separation of duties** (DR-02 §7.1): whoever delivers a cohort must not assess it. The wireframe's single "Owner · Trainer · Administrator" is the reality today; the model must not bake that in. |
| AD-3 | Admin sign-in with **MFA** (Blueprint: "MFA mandatory" for admin). |
| AD-4 | **Every action audited** in the same transaction (`ADR-022`): who, what, target, before/after, reason where required. |

### 3.2 Delivery operations
| ID | Requirement |
|---|---|
| AD-5 | Create/edit/cancel **offerings**: format, dates, sessions, capacity, state (draft / open / full / waitlist / closed / cancelled), trainer, joining information, materials release rules (DR-02 §5). Cancelling triggers participant notification and refund per B3. |
| AD-6 | **Record attendance per session** per participant (present / absent / partial), editable within a window, audited — this is the evidence an HRD Corp claim needs (`docs/HRD_CORP.md`). |
| AD-7 | **Record completion** against the decided criterion (D2) → the system issues the Certificate of Completion (R-I1..I3). No self-issue; manual issue requires a reason. |
| AD-8 | Move a participant to another date; withdraw; refund — per A12 / B3. |
| AD-9 | Bulk email a roster (joining information, reminders) — needs A2. |

### 3.3 Commerce
| ID | Requirement |
|---|---|
| AD-10 | Orders list with Stripe-driven states; **refund** action tied to the policy, audited, reflected in the participant's orders (C14). |
| AD-11 | **Raise and track invoices** for corporate buyers (A5) with the legal entity and tax treatment (B4, B5). |
| AD-12 | Enquiry inbox with assignment, reply, states; response-time target if one is ever committed to. |
| AD-13 | Organisations: contacts, participants, engagements, invoices, the client-facing dashboard (`O01`) and **HRD Corp evidence pack** (`O10`) — the last only once registration/claimability exist (OQ-8). |

### 3.4 Certificates
| ID | Requirement |
|---|---|
| AD-14 | View status, listing consent, renewal history; **correct name** keeping the ID (D12); **revoke** with reason → public page shows Revoked, not Expired (D11); reissue PDF. |
| AD-15 | Renewal fee, validity and window as **effective-dated settings** with history (R-F1, R-F2, R-F6). |

### 3.5 Configuration
| ID | Requirement |
|---|---|
| AD-16 | Currencies offered, **regional eligibility rule** (A8), payment methods × currency (A9), tax (B5), entity (B4), Stripe connection (test → live; keys only in the environment, C5). |
| AD-17 | **Policy publication with versions** so consent records reference the version accepted (C7). |
| AD-18 | Email template catalogue with triggers; reminders persisted and idempotent (R-L7). |

### 3.6 Records and reporting
| ID | Requirement |
|---|---|
| AD-19 | Audit log with filters and export. |
| AD-20 | Operational reports: attendance by offering, revenue by currency/method, certificate status, pricing-currency usage (input to A8), enquiry funnel. Product success metrics remain governed by `MVP_BUILD_SPEC` §12.3. |
| AD-21 | PDPA: participant data export and deletion **with retention of financial records** (C20, B2). |

## 4. Decisions the admin side needs (in addition to A/B/D lists)

| # | Decision | Recommendation |
|---|---|---|
| AD-D1 | Who holds which role at launch; whether the founder is sole admin | Founder = Administrator + Trainer; add Finance when a second person exists |
| AD-D2 | Attendance rule: what counts as present; partial sessions; edit window | Present = attended ≥ 80% of the session; edits allowed 7 days, audited |
| AD-D3 | Manual certificate issuance — allowed? | Yes, reason required, audited, rare |
| AD-D4 | Offering cancellation policy (notice, refunds) | Part of B3 |
| AD-D5 | Enquiry response-time commitment | None publicly until staffing exists |

## 5. What to delete or replace when the real admin exists

| Wireframe artefact | Replace with |
|---|---|
| `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` (`lib/demoCredentials.ts`), role in `lib/demoSession.ts` | Real accounts and RBAC (AD-1) |
| `components/admin/AdminFrame.tsx` role gate | Server-side authorisation on every admin route |
| `data/adminSamples.ts` | Database queries |
| All `Disabled` action buttons | Real actions with confirmation, validation, audit rows |
| Static `generateStaticParams` on `/admin/*/[id]` | Dynamic routes |

Reusable: navigation grouping, the table/stat/key-value scaffolding
(`components/admin/AdminTable.tsx`), the dashboard's "needs attention" pattern.

## 6. Test checklist for the real build

- A participant account cannot load any `/admin` route (server-side).
- A trainer sees only their own offerings; finance cannot mark completion.
- Recording attendance twice for one session does not double-count.
- Marking completion issues exactly one certificate; a retry does not duplicate.
- Revoking a certificate shows "Revoked" on `/verify/<id>` immediately.
- A fee change today does not alter a renewal already in progress.
- Refund updates the order state, the participant's view and the audit log atomically.
- Every action above leaves an audit row; deleting a participant preserves financial records.
- Kill and restart all services: nothing above is lost (Service Restart Test).
