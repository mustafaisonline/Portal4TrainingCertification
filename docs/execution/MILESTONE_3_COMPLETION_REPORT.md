# Milestone 3 — "Catalogue & Public Portal" · Completion Report

> **Status: IMPLEMENTED · TESTED — all eleven verification criteria pass** · 2026-09-21
> **Executed under:** founder direction of 2026-09-21 and the §0.1 defaults. **Scope acceptance pending founder ratification** (§9).
> **Plan executed:** [`MILESTONE_3_EXECUTION_PLAN.md`](MILESTONE_3_EXECUTION_PLAN.md). The roadmap's "staging" half (§7 M3) was **not** executable without the founder's hosting/database accounts and is carried to M9.
> **Branch:** `feat/production-foundation` · not pushed · nothing on `main`.

---

## 1. Requested task

Make the public portal real: the catalogue (programme, curriculum, formats, prices, expert, offerings) as data per ADR-043; every public page rendered from the database; navigation that resolves; a contact form that persists.

## 2. Understanding / scope

Exactly the plan's §2. The wireframe's reviewed content crossed to production **as seed data** (ADR-045 PORT list) and its pages **as ported structure and copy**, each with a provenance header; its simulations (invented dates, seat counts, canned diagnostic results, demo routing) did not.

## 3. Changes made

### 3.1 Schema (Rule 1) — migration `20260921015336_catalogue_and_content`

Ten tables and seven enum types exactly as plan §5: `programmes` · `programme_modules` · `delivery_formats` · `programme_prices` · `experts` · `programme_experts` · `scheduled_offerings` · `faq_entries` · `diagnostic_questions` · `enquiries`. Forward-only; no existing table altered (the `domains` model gained two relation fields only — no column change).

### 3.2 Seeds (`prisma/seed-data/*`, verbatim from the mockup; `prisma/seed.ts` maps them)

5 capability areas · 7 programmes (**1 published** — the flagship; 6 `unlisted`) · 65 modules (17 on the flagship) · 3 delivery formats · 18 prices (published figures parsed to minor units and reproduced exactly) · 1 expert (with HRD Corp accreditation) linked to every programme · 20 FAQ entries in 4 groups · 10 diagnostic questions · **0 scheduled offerings**. Idempotent: a second run changes nothing.

### 3.3 Code

| Area | Files |
|---|---|
| Repositories | `src/modules/catalogue/{programmes,experts,offerings,faq,diagnostic,enquiries}/repository.ts` · `programmes/types.ts` (`formatMoney`, `PRICE_REGIONS`) · `enquiries/actions.ts` (server action: validation, honeypot, DB-stored rate limit, enquiry row, outbox notification) · `src/content/hrd-corp.ts` |
| Public routes (`app/(public)/`) | `layout.tsx` (PublicShell + account controls) · `page.tsx` (home) · `DataBlueprint-AIVibeCoding` · `courses/[slug]` · `schedule` · `trainers` · `hrd-corp` · `about-us` · `for-organisations` · `faq` · `contact-us` (+ `EnquiryForm`) · `diagnostic` (+ `DiagnosticFlow`) · `diagnostic/result` (+ `DiagnosticResultView`) · `verify` (placeholder until M6) · `terms` · `privacy` · `refund-policy` · `credential-integrity-policy` |
| Shared components (ported) | `src/shared/marketing/{HomeHero,HomeDiagnostic,TrainerCard,CourseCard,ProgrammePricing,ImageFrame,DotField,NeuralNetworkBackground,DeliveryIllustrations}.tsx` · `src/shared/signature/{DiagnosticIntro,DiagnosticQuestionCanvas,DiagnosticStartCard,SkillMeter}.tsx` + `diagnostic.ts` · `src/shared/legal/PolicyPlaceholder.tsx` |
| Assets | `public/{experts,hrd-corp,books,delivery}` — the founder-supplied images already in the mockup; nothing from the reference archive |
| M1 proof page | `app/page.tsx` → `app/domains/page.tsx` (the real homepage now owns `/`); its e2e updated |
| Root layout | Caveat handwriting face added (homepage hero annotations), as in the mockup |
| Tests | `tests/integration/catalogue.test.ts` (8) · `tests/e2e/public.spec.ts` (6) · `tests/unit/money.test.ts` (3) · `boundaries.test.ts` gains the "no mockup / seed-data import in app or src" fence |

### 3.4 Ported honestly — what changed from the wireframe, and why

| Page / component | Change | Reason |
|---|---|---|
| `/schedule` | No sample dates or seat counts; first-class "The first dates are being prepared" state; "Register interest" → enquiry | DR-02 §4.1; seats need registrations (M4) |
| `/diagnostic/result` | Canned fixtures (`results.ts`, `roles.ts`) not ported; shows per-area answer counts, completion gauge labelled "Completed", the plain statement that the scored profile arrives with the assessment engine; "Request certificate — USD 10" stays disabled and says it is not available | No simulated logic (AP-07); nothing invented |
| Diagnostic mid-flow insight card | Canned "you're reading strongly on…" replaced by a factual progress sentence | Same |
| `/contact-us` | Real form → `enquiries` row; controlled fields so a validation error never wipes what was typed | Rule 6; found by e2e |
| `/for-organisations` | Inert team form replaced by "Send enquiry" → `/contact-us?kind=organisation` | The action collects the enquiry fields; extra fields were never stored |
| `/trainers` | Community video row omitted (browser-side YouTube key) | ADR-030; re-evaluate server-side |
| Pricing region tabs | `.text-label` colour trap fixed (selected tab was ink-faint on blue, 1.9:1 — inherited from the mockup) | axe |
| Everywhere | `WireframeNote`, `SampleTag`, demo routing, `assetPath`, footer strip removed | NEVER-PORT |

## 4. What was not changed

`project-artifacts/mockup/` untouched. No new dependency. No external account. Legal text not written (placeholders state "not yet published"). ADR statuses unchanged. `main` untouched; nothing pushed. The `/certifications` links on `/hrd-corp` and the course detail page still 404 — **the mockup left them that way deliberately when the founder paused the page** ("re-pointing is a content decision"); parity kept, listed in §9.

## 5. Testing

| Layer | What | Result |
|---|---|---|
| Type / build | `tsc --noEmit` · `next build` (31 routes) | clean |
| Unit | money formatting vs published strings; boundary fences (mockup/seed-data/preview/generated client) | 51 / 51 Vitest total |
| Integration (real PostgreSQL) | flagship content == seed-data; prices reproduce published figures; unlisted invisible publicly but retained; zero offerings; expert accreditation; FAQ order; questions in order with areas; enquiry persistence | (part of the 51) |
| E2E (Playwright) | every header/footer href → 200; programme page shows the DB's 17 modules and MYR price, detail page shows the 3 formats; unlisted → 404; schedule empty state + register-interest path; contact form: invalid → errors and no row, valid → row + confirmation; axe on `/`, trainers, hrd-corp, about, faq, for-organisations, diagnostic, verify, programme, detail, schedule, contact | **16 / 16** (M1 4 + M2 6 + M3 6) |
| Accessibility | `@axe-core/playwright` WCAG 2.0/2.1/2.2 A+AA | 0 violations after the tab-contrast fix |
| Manual (browser, `localhost:3100`) | home, programme, schedule, contact rendered; enquiry submitted → **app process restarted** → row present; fresh process serves `/DataBlueprint-AIVibeCoding` 200, unlisted `/courses/data-blueprint` 404, `/schedule` 200 | ✅ criterion 11 |

## 6. Results — criteria (plan §8)

| # | Criterion | Result |
|---|---|---|
| 1 | Migration clean; tables match §5 | ✅ |
| 2 | Seed counts as listed; idempotent | ✅ (`domains=5 programmes=7 (published=1) modules=65 formats=3 prices=18 experts=1 faq=20 questions=10 offerings=0`, twice) |
| 3 | Every nav/footer href → 200 | ✅ e2e |
| 4 | Programme page renders from the DB (compared to repository reads) | ✅ e2e |
| 5 | Unlisted → 404; published served | ✅ e2e |
| 6 | Schedule "no dates" state + register interest | ✅ e2e |
| 7 | Contact: invalid → no row; valid → row + confirmation (+ outbox row when `ENQUIRY_NOTIFY_EMAIL` is set) | ✅ e2e (notification path exercised only in code review — env unset) |
| 8 | Grep proof: no mockup/seed-data import in `app/`/`src/` | ✅ boundary test |
| 9 | axe clean on every public page | ✅ |
| 10 | tsc · Vitest · Playwright · build green; M1/M2 unchanged | ✅ 51 / 51 · 16 / 16 |
| 11 | Restart test: enquiry survives | ✅ manual |

## 7. Documentation updated

Plan (status) · this report · `README.md` (§3 index, §4 status row) · `BACKEND_HANDOFF_INDEX.md` §3.2 (content files, fixtures and invented offerings marked retired) · `.env.example` (`ENQUIRY_NOTIFY_EMAIL`). **Not updated:** `PROJECT_PLAN_WBS.md` has no M3 row (M3–M10 enter the WBS only when the transition plan is accepted — its §11); proposed there on acceptance.

## 8. Risks, observations and deviations

1. **Staging not delivered** — needs G0-6 (residency), G0-7 (hosting + production DB) and a secrets store; carried to M9.
2. **Hub page title vs programme title.** The nav/hub say "Data Blueprint & AI / Vibe Coding" (founder-chosen page copy); the programme row is titled "AI-Powered Product Development" (the source site's course name). Both are as the wireframe had them; unifying them is a content decision.
3. **`/certifications` links** on two pages 404 (see §4) — founder decision pending.
4. **Copy carried verbatim that remains an unbacked commitment:** hero card "1–2 top candidates will be brought to Malaysia"; the diagnostic tier names (Basic/Associate/Professional/Master "(soon)") and the "USD 10" certificate-of-attempt fee — all flagged by the mockup itself against DR-01; unchanged here.
5. **Homepage images** are large PNGs served through `next/image` at up to 3840 px; fine for a dev check, worth a size pass before launch (M9).
6. **Enquiry notification** goes nowhere until `ENQUIRY_NOTIFY_EMAIL` is set; enquiries are always recorded. Rate limit reuses the auth counter table with an `enquiry:` key prefix (no new table).
7. **Diagnostic answers live in the browser only** (localStorage, per-browser convenience) — a completed diagnostic is not persisted server-side; Blueprint R1's 30-day anonymous retention is a later, separately-scoped design.
8. **The mentorship packages' region badges** ("Save up to 20%") were a mockup constant and are not in the database; the mentorship programme is unlisted, so nothing public shows them.
9. **CI still unexercised** (nothing pushed).

## 9. Human decisions required

| # | Decision | Default taken |
|---|---|---|
| 1 | Ratify M3 scope and the plan's §10 defaults (domain mapping; six programmes `unlisted`; diagnostic answer-summary; staging to M9) | As listed |
| 2 | `/certifications`: re-enable the paused page, or re-point the two links | 404 parity |
| 3 | Programme title vs hub/page title | Both kept |
| 4 | `ENQUIRY_NOTIFY_EMAIL` — which inbox | Unset (DB only) |
| 5 | Community videos: server-side proxy for the YouTube key, or drop | Omitted |

**Completion status:** Implemented · **Tested** (11 / 11) · Partially tested: enquiry notification email (code path only) · Blocked: staging (accounts) · Requires human validation: the five items above.
