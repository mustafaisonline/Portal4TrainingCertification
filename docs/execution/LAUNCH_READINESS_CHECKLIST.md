# Launch Readiness Checklist — Milestone 10 §1

> **Status: AUDIT COMPLETE 2026-09-23 · LAUNCH BLOCKED — every item below is Open until the founder acts.** Built under [`MILESTONE_10_EXECUTION_PLAN.md`](MILESTONE_10_EXECUTION_PLAN.md) §1. This is the single list the founder walks before deciding to go live. **No public copy was changed by this audit** (default K2; Rule 8) — every discrepancy is reported here for decision.
>
> States: **Open** (nothing done) · **Ready** (the code/runbook side exists; the founder's action remains) · **Done** (evidence recorded).

## 1. Blockers

| # | Blocker | Owner | Evidence required | State | Where the "how" lives |
|---|---|---|---|---|---|
| B1 | **Legal documents published** — Terms, Privacy, Refund & cancellation reviewed by counsel; square-bracket placeholders replaced (§2 row C33) | Founder + counsel | `LEGAL_DOCUMENT_VERSIONS` set in production; the three pages render without `[…]`; the DRAFT banner gone | **Open** | `src/content/legal/*.ts` (counsel's text goes here); `.env.example` |
| B2 | **Consent gate live** — registration opens only after B1 | Founder | `/register` shows the consent sentence with the published versions | **Ready** (code) / **Open** (config) | `legal-documents.ts` |
| B3 | **Contact channel live** — `ENQUIRY_NOTIFY_EMAIL` delivering | Founder (ADR-015 / J5) | an enquiry submitted on production arrives in the founder's inbox | **Open** — needs a real email transport (only `log` exists) | DEPLOYMENT_RUNBOOK §2; MONITORING §3 |
| B4 | **Public claims reconciled** — §2 below, every UNVERIFIED row confirmed or copy changed | Founder | each §2 row marked Verified / Changed / Removed | **Open** | §2 |
| B5 | **Production accounts** — hosting, database, domain, email provider (J1–J5) | Founder | ADR-016, ADR-005a, ADR-015, ADR-032 rows marked APPROVED with the chosen vendor and region | **Open** | `docs/operations/README.md` |
| B6 | **Domain and DNS** — apex + `www`; TLS issued; `APP_BASE_URL` set | Founder | `curl -sI https://<domain>/` → 200 with HSTS | **Open** | DEPLOYMENT_RUNBOOK §3.6 / §4 |
| B7 | **Stripe live mode + production webhook**; test key from chat rotated | Founder (J9) | test event → 200; `stripe_events` row; key id changed | **Open** | DEPLOYMENT_RUNBOOK §6 |
| B8 | **Migrations applied and seeded** on production; timezone UTC | Founder (operator) | `npx prisma migrate status` clean; `SHOW timezone` = UTC; `/api/health` shows the newest migration | **Ready** (scripts) / **Open** | DEPLOYMENT_RUNBOOK §3.2–3.3 |
| B9 | **Backups scheduled and one restore rehearsal PASSED on production** | Founder | rehearsal row in BACKUP_AND_RESTORE §3.3 dated, PASS | **Ready** (scripts rehearsed on dev 2026-09-23) / **Open** (production) | BACKUP_AND_RESTORE |
| B10 | **Uptime checks** on `/api/health` and `/verify` with an alert channel | Founder | screenshot / config of the monitor; a test alert received | **Ready** (endpoints) / **Open** (monitor) | MONITORING §1 |
| B11 | **Reminders scheduler** running daily with `JOBS_SECRET` | Founder | `job.run` audit row from production | **Ready** (endpoint, M7) / **Open** | DEPLOYMENT_RUNBOOK §7 |
| B12 | **Release gate passed on the production build** (tsc · Vitest · Playwright · build) | Operator | recorded run on the release commit | **Open** — policy itself is J6 | RELEASE_GATE |
| B13 | **Accessibility pass** — axe WCAG 2.2 AA in the e2e suite green on every public and account route | Operator | Playwright run | **Ready** (suite) / **Open** (run on release commit) | `tests/e2e/*.spec.ts` |
| B14 | **Tier 1 workflow set green** — register → verify email → profile → checkout (staging, Stripe test) → webhook → registration → completion → certificate → `/verify/<id>` → renewal | Operator | e2e + one manual staging run | **Ready** (suites) / **Open** (staging run) | Testing Arch §3 |
| B15 | **Security checklist walked** | Founder | SECURITY_CHECKLIST rows 9, 14, 17, 23, 25 ticked; 12, 22, 24 decided or deferred | **Open** | SECURITY_CHECKLIST |
| B16 | **Lift `noindex`** — `app/layout.tsx` `robots: { index: false, follow: false }` removed at cutover, not before | Agent on founder instruction | commit | **Open** (deliberate) | `app/layout.tsx`; `app/robots.ts` |
| B17 | **Founder admin account** granted on production | Operator | `npm run admin:grant` output | **Open** | `scripts/grant-admin.ts` |
| B18 | **Certificate issuer name and signatory confirmed** (M6 E12) | Founder | decision recorded | **Open** | M6 completion report |
| B19 | **Dead links fixed** — `/certifications` is linked from `hrd-corp` and `courses/[slug]` but has no page; `/courses` index is linked as a fallback on the home page and does not exist | Founder decision → agent | links point at existing pages or the pages exist | **Open** | §4 |
| B20 | **Mockup archived** — `project-artifacts/mockup` (founder asked it to stay for comparison; archiving is a separate approved step) | Founder | decision | **Open** (default K1: untouched) | WIREFRAME_TO_PRODUCTION_PLAN §9 |
| B21 | **Content-Security-Policy** report-only on staging (J8) | Founder decision → agent | header present in report-only; one clean week | **Open** — not a hard launch blocker; recommended | M9 plan §4 |

## 2. Claims reconciliation (M10 §1.2)

Every factual statement rendered on a public or auth route, where its value comes from, and its source. **UNVERIFIED — founder to confirm** means no approved specification, decision record, legal draft or recorded founder message backs the exact claim. Sources: MVP = `DATA_AI_ACADEMY_MVP_BUILD_SPEC.md`, BP = `…PORTAL_BLUEPRINT.md`, DR-02, CCR = `COMPLETION_CERTIFICATE_REQUIREMENTS.md`, APR = `ACCOUNT_AND_PAYMENT_REQUIREMENTS.md`. Origin: *seed* = `prisma/seed-data/*`, *content* = `src/content/*`, *code* = literal in the page/component.

### 2.1 HRD Corp

| # | Route | Claim (short) | Origin | Source / state |
|---|---|---|---|---|
| C1 | `/hrd-corp` | "A genuine HRD Corp accreditation — verified, not just claimed" | code `hrd-corp/page.tsx` | Backed by the seeded accredited-trainer record with a live HRD Corp verify URL — **Verified (trainer accreditation)** |
| C2 | `/hrd-corp` | The company "has an active application in progress to become an HRD Corp Registered Training Provider" | content `hrd-corp.ts` | Founder statement 2026-09-06 (file header). **UNVERIFIED — founder to confirm it is still true at launch** |
| C3 | `/hrd-corp`, `/for-organisations` | "No course on this site is registered as HRD Corp Claimable today" | content / code | Consistent negative claim — **Verified** (nothing claims otherwise) |
| C4 | `/hrd-corp` | Employers registered with HRD Corp can claim training costs; PSMB / Ministry of Human Resources; scheme descriptions (Claimable Course / ALAT / ITS) | code + content | Cited to hrdcorp.gov.my on the page — **external source; founder to re-check wording before launch** |
| C5 | `/`, programme pages, `/trainers` | "HRD Corp Accredited Trainer — Verified, Trainer ID 68923", certificate id and validity 8 Jul 2026 → 8 Jul 2029 | seed `practitioners.ts` | Founder's own accreditation with public verify URL — **Verified** |

### 2.2 Trainer credentials

| # | Route | Claim | Origin | Source / state |
|---|---|---|---|---|
| C6 | `/trainers`, `/courses/[slug]`, `/about-us` | "Mustafa Qizilbash · Founder & Lead Trainer"; "24+ years · enterprise data & AI"; "banking, energy, telecom and government" | seed `practitioners.ts` (from the founder's résumé — reference material) | **UNVERIFIED in specs — founder to confirm** the figure and sectors as of launch |
| C7 | `/DataBlueprint-AIVibeCoding` | "24+ years … 40,000+ member Big Data community … 80+ episodes" | **code** (hardcoded in the page, duplicating seeded `communityImpact`) | **UNVERIFIED — founder to confirm**; also a drift risk: the page will not follow the database if the seed changes |
| C8 | `/trainers` | "1 trainer · founder-led today" | computed from the database | **Verified** (honest count) |
| C9 | *(not rendered)* | Certifications (DAMA CDMP, CDGE, PMI…), education, books, employer achievements | seed | Seeded but **not shown** on any public page; no PhD claim anywhere. No action |

### 2.3 Prices, offers, payment

| # | Route | Claim | Origin | Source / state |
|---|---|---|---|---|
| C10 | programme + course pages | Malaysia "RM 4,999 / ~~RM 9,999~~ · 50% OFF · you save RM 5,000" | seed `courses.ts` | Founder direction 2026-09-06 (inline note). **UNVERIFIED in specs — founder to confirm** |
| C11 | same | Pakistan "Rs. 102,839.86 / ~~Rs. 342,799.53~~ · 70% OFF" ("Regional scholarship") | seed | **UNVERIFIED — founder to confirm** |
| C12 | same | International "USD 2,811 / ~~USD 3,124~~ · 10% OFF" | seed | **UNVERIFIED — founder to confirm** |
| C13 | same | Value stack "Total value RM 14,498+" (7 items incl. "PromptOS Starter Edition RM 1,500+") | seed | Arithmetic consistent; component values **UNVERIFIED — founder to confirm** |
| C14 | same | "reflect a time-limited launch offer" — no end date stated | code `ProgrammePricing.tsx` | **Risk** — a strike-through "was" price with no end date; Malaysian consumer-protection exposure. **Founder to set an end date or remove the strike-through** |
| C15 | programme pricing block | **"Enquiry-based — no online payment yet"** | code `ProgrammePricing.tsx` | **CONTRADICTS** the live checkout (`/schedule` → `/checkout/[offeringId]` takes Stripe payments since M4). **Stale copy — founder decision to update** |
| C16 | `/faq` | **"The refund and cancellation policy has not been published yet. Do not register on assumptions about refunds"** | seed `faq.ts` | **CONTRADICTS** the refund policy draft page and the checkout consent step. **Stale — founder decision to update the FAQ row** |
| C17 | `/checkout/[id]` | Price "charged in {currency}, as published"; refund tiers "100 % less processing fee / 50 % / 0 %; transfer free, once" | code `commerce/refund-policy.ts` from the DB price | Matches the refund policy content and M4 founder decision 2026-09-21 — **Verified** |

### 2.4 Refund and cancellation

| # | Route | Claim | Origin | Source / state |
|---|---|---|---|---|
| C18 | `/refund-policy`, `/terms` §, checkout | 14+ days → 100 %; 7–13 days → 50 %; < 7 days → 0 % (legal draft: "of the amount paid"; checkout: "less the payment-processing fee") | content + code | Founder decision 2026-09-21; **check the two wordings agree on the processing fee** — **founder/counsel to align** |
| C19 | `/refund-policy` | "typically 5 to 10 business days"; "after 15 business days, tell us" | content | Bank-dependent estimate — **UNVERIFIED — counsel to confirm** |
| C20 | `/refund-policy`, `/terms`, `/privacy` | "not yet in force" DRAFT banner; `noindex` | code | **Correct today; must disappear at B1** |

### 2.5 Certificate wording

| # | Route | Claim | Origin | Source / state |
|---|---|---|---|---|
| C21 | `/faq` | "active for 12 months from issue … renew each year for a fee — currently USD 10" | seed `faq.ts` | CCR R-F7; APR; fee seeded USD 10.00 — **Verified** (the amount is read from the fee table at checkout; the FAQ sentence is a snapshot the founder must update if the fee changes) |
| C22 | `/verify`, `/verify/[id]` | "confirms Certificates of Completion. It is **not** the Academy's earned credential" | code | CCR; DR-02 — **Verified** |
| C23 | `/courses/[slug]` | "This course awards a **certificate of participation**" | seed `courses.ts` (`certificate:` field) | **Inconsistent** with "Certificate of Completion" everywhere else — **founder to choose one term; seed change** |
| C24 | `/terms` §11 | "not a professional licence, an academic qualification or a guarantee of employment" | content | **Verified** — and contradicted by C27 |

### 2.6 Company, contact

| # | Route | Claim | Origin | Source / state |
|---|---|---|---|---|
| C25 | `/hrd-corp`, legal pages | Legal entity "Your Partner Technologies", Kuala Lumpur, Malaysia | content | MVP §"Owner" / BP — **Verified** |
| C26 | `/contact-us`, legal pages | No email, phone, address, SSM number or SST status anywhere; the legal drafts render **literal `[SSM registration number]`, `[contact email]`, `[phone number]`, `[registered business address]`, `[effective date]`, `[SST registration status]`** | content `legal/*.ts` (`legal/types.ts` lists the placeholders) | **BLOCKER (B1)** — visible bracketed placeholders in public legal copy. Founder supplies the values to counsel |
| C26b | footer | "Legal — not yet published"; "Credential verification available once the first credential is issued" | code `PublicShell.tsx` | Both now **stale**: the drafts are live pages and `/verify` works. **Founder decision to update the footer strings** |

### 2.7 Delivery formats and durations

| # | Route | Claim | Origin | Source / state |
|---|---|---|---|---|
| C27a | `/`, `/about-us` | "Live means live … never watching a recording"; expert-led delivery at your location incl. outside Malaysia | code | DR-02 §1–2 — **Verified** |
| C27b | course, schedule, checkout | Bootcamp 2 days × 8 h = 16 h · Accelerator 10 days × 2 h = 20 h · Mastery 20 days × 1 h = 20 h | seed `courses.ts` | Consistent with the FAQ; **UNVERIFIED in specs — founder to confirm** |
| C27c | `/courses/[slug]` | "All formats cover the same curriculum, learning outcomes, exercises and certification requirements" | code | **UNVERIFIED — founder to confirm** |

### 2.8 Outcome and guarantee claims — highest risk

| # | Route | Claim | Origin | Source / state |
|---|---|---|---|---|
| C27 | **`/` hero** | **"1–2 top candidates will be brought to Malaysia for job opportunities."** | code `HomeHero.tsx` (comment: "an open policy commitment, not yet backed by terms") | **UNVERIFIED — no spec, no terms; contradicts `/terms` §11. Founder must back it with terms or remove it before launch** |
| C28 | `/DataBlueprint-AIVibeCoding` | "a company's workflow that used to take 25 people now runs on 5" | code | **UNVERIFIED** — unnamed client, no evidence on file. **Founder to substantiate or remove** |
| C29 | same | "exposed to 10–15 real frameworks" | code | **UNVERIFIED** (BP's "10–15" refers to diagnostic minutes) |
| C30 | same | "Designed to lead to paid work"; "Freelance-ready from day one … real client work immediately"; "visibility with the practitioner network behind this Academy" | code | **UNVERIFIED**; soft outcome promises; the network is one trainer today (C8). **Founder to review against `/terms` §11** |
| C31 | `/` hero | "Start Freelance Right After Training"; "Practical skills for a brighter tomorrow" | code | Marketing tone; note adjacency to C27 — **founder to review** |
| C32 | `/`, `/diagnostic` | "Ten minutes, free … not a score"; "Free · no account to start" | code | BP diagnostic section — **Verified** |
| C33 | programme, schedule, trainers, about, reviews | Honest empty states: "The first cohort has not run yet … we will not invent any"; "The first dates are being prepared"; "no placeholder profiles … and there never will be"; "No reviews have been published yet"; "No invented dates, cohort numbers, client logos or testimonials" | code / DB | DR-02 §4.1, §7 — **Verified** (note: C28 sits in tension with the last statement) |

### 2.9 Summary for the founder

Seven decisions clear most of the table: **(1)** supply the legal-entity details to counsel (C26/B1); **(2)** back or remove the "brought to Malaysia" promise (C27); **(3)** substantiate or remove the 25→5 claim (C28); **(4)** confirm the three price rows and set an offer end date (C10–C14); **(5)** fix the three stale payment sentences (C15, C16, C26b); **(6)** pick "completion" vs "participation" (C23); **(7)** confirm the trainer figures (C6, C7) and format durations (C27b). Everything else is verified or a wording check for counsel.

## 3. Wireframe remnants (M10 §1.5)

Audit of `app/` and `src/` for `Wireframe`, `WireframeNote`, `SAMPLE`, `Mockup`, `Lorem`, `placeholder`:

- **Rendered copy: none of the wireframe markers.** Every `Wireframe`/`WireframeNote` (8), `SAMPLE`/`SampleTag` (3) and `Mockup` (2) occurrence is inside a source comment recording what was removed in the port. `Lorem`: none.
- `placeholder` appears (a) as HTML `placeholder=` attributes on inputs — fine; (b) in honest copy ("no placeholder profiles") — intentional; (c) in the legal drafts' own sentence "appear as placeholders in square brackets" plus the bracketed tokens — **the B1 blocker**, not a wireframe remnant.
- `tests/unit/boundaries.test.ts` already forbids importing from `project-artifacts/`; `tests/e2e/readiness.spec.ts` (M9) now asserts none of the four markers renders on any route in `site-nav.ts`.

## 4. Redirect table — mockup paths that differ (M10 §1.4)

The mockup was served under `basePath` `/Portal4TrainingCertification` on a different origin; production has no basePath. When the domain exists, these are the only paths where an old link would not land on the same page. Redirects are **not** configured until the founder decides which (a `redirects()` entry in `next.config.ts`, or nothing if the mockup origin is simply retired).

| Mockup path | Production | Proposed action |
|---|---|---|
| `/Portal4TrainingCertification/*` (basePath prefix) | `/*` | If the mockup origin ever points at production: strip the prefix with one wildcard redirect (301) |
| `/certifications` | **no page** (also linked from two production pages — B19) | Founder decision: create the page, or redirect to `/DataBlueprint-AIVibeCoding` and fix the two links |
| `/journey-placeholder` | no page (mockup scaffolding) | 404 — nothing to preserve |
| `/checkout` (index) and `/checkout/confirmation` | `/checkout/[offeringId]`; confirmation is `/account/orders/[id]` via `?order=` | 301 `/checkout` → `/schedule`; `/checkout/confirmation` → `/account/orders` |
| `/account/certificate/renew` | renewal is started from `/account/certificate` | 301 → `/account/certificate` |
| `/account/programmes/[id]`, `/account/orders/[id]` | `/account/programmes`, `/account/orders` (detail routes not ported / different) | 301 to the list pages |
| `/admin/emails`, `/admin/organisations`, `/admin/participants[/id]`, `/admin/programme`, `/admin/registrations`, `/admin/settings` | not ported (M8 scope differs: `/admin/reviews`, `/admin/users`, `/admin/enquiries`, `/admin/orders`, `/admin/reports`, `/admin/audit`, `/admin/certificates`) | 301 → `/admin`; behind the admin gate anyway |
| `/courses` (index) | no page; home links to it as a fallback (B19) | Founder decision: add an index or redirect to `/DataBlueprint-AIVibeCoding` |
| *(same path)* everything else in `site-nav.ts`, `/verify/[id]`, `/courses/[slug]`, auth routes | identical | none |

Production-only additions with no mockup counterpart (no redirect needed): `/reviews`, `/domains[/id]`, `/reset-password`, `/verify-email`, `/account/security`, `/admin/certificates/fee`, `/admin/offerings/new`, `/admin/offerings/[id]/participants`, `/api/*`, `/robots.txt`, `/sitemap.xml`.

## 5. Sign-off

| Gate | Signature | Date |
|---|---|---|
| Counsel: B1 documents published | | |
| Founder: §2 decisions recorded; B4 closed | | |
| Operator: B5–B13, B15, B17 evidence attached | | |
| Founder: **go live** (B16 executed after this line is signed) | | |
