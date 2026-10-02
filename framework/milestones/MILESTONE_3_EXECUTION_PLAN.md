# Milestone 3 — "Catalogue & Public Portal" · Execution Plan

> **Status:** ✅ **EXECUTED 2026-09-21** ([`MILESTONE_3_COMPLETION_REPORT.md`](MILESTONE_3_COMPLETION_REPORT.md)), under the founder's blanket direction of the same day and the §0.1 defaults (`WIREFRAME_TO_PRODUCTION_PLAN.md`). Scope acceptance **pending ratification on return**; every default is listed in §10.
> **Roadmap row:** `WIREFRAME_TO_PRODUCTION_PLAN.md` §7 M3 "Catalogue & staging". **The staging half is not executable here** — it needs the founder's hosting account, production-shaped database and secrets store (G0-6/G0-7, ADR-016/005a). This plan delivers the catalogue half and the public portal on real data; staging is carried to M9 and flagged.
> **Depends on:** M1 ✅ · M1b ✅ · M2 ✅.

---

## 1. Objective

> The public portal — home, programme, curriculum, trainer, HRD Corp, about, FAQ, contact, schedule, diagnostic — renders from the database, not from TypeScript constants; the catalogue (programme · delivery formats · prices · experts · scheduled offerings) exists as data per ADR-043; the header's navigation no longer points at pages that do not exist; and the contact form creates a persistent enquiry.

## 2. Scope

| # | Item | Source |
|---|---|---|
| 1 | **Catalogue schema** (§5): `programmes`, `programme_modules`, `delivery_formats`, `programme_prices`, `experts`, `programme_experts`, `scheduled_offerings` | ADR-043 concepts; ADR-023 expansion shape (`domain_id`, `sort_order`, `version`, `level` present) |
| 2 | **Content-as-data schema**: `faq_entries`, `diagnostic_questions`, `enquiries` | PORT list row 5 (content files become seed data); contact form must persist (Rule 6) |
| 3 | **Seeds** from the mockup's reviewed content: 5 capability areas, 7 programmes (1 published, 6 unlisted), 17-module curriculum, 3 delivery formats, 3 regional prices, 1 expert, FAQ, 10 diagnostic questions. **No scheduled offering is seeded** — no real date exists (DR-02 §4.1) | `data/{domains,courses,practitioners,faq,questions}.ts` |
| 4 | **Public pages ported** (structure + founder-reviewed copy), reading through repositories: `/`, `/DataBlueprint-AIVibeCoding`, `/courses/[slug]` (published only), `/trainers`, `/hrd-corp`, `/about-us`, `/faq`, `/contact-us`, `/for-organisations`, `/schedule`, `/diagnostic`, `/diagnostic/result`, and the four legal placeholders (`/terms`, `/privacy`, `/refund-policy`, `/credential-integrity-policy`) | PORT list row 4 |
| 5 | `/schedule` and every "Register" CTA reflect the **real** offering state: with none scheduled, the page says so and offers "Register interest" → enquiry. No sample dates, no sample seats | DR-02 §4.1; retires `demoParticipant.offerings` |
| 6 | Contact / register-interest form → `enquiries` row + notification email (log transport) → confirmation. Server action; validated; rate-limited by the same DB counters | ACCOUNT reqs; Rule 6 |
| 7 | Diagnostic: questions from the DB; the result page shows an honest per-area summary of the answers given — **no canned score or invented profile** | NEVER-PORT: `results.ts` fixtures are invented records |
| 8 | Header/footer navigation resolves: every `site-nav.ts` href has a page; e2e asserts it | M1b deferral |
| 9 | `PublicShell` mounted on the public routes with the M2 account controls | — |

**Explicitly out of scope:** staging / hosting / production DB (needs founder accounts — M9) · registration & payment (M4) · the YouTube "Community" video row (`lib/youtube.ts`, browser-side API key — re-evaluate server-side, ADR-030) · the certifications page (disabled by founder) · organisations table (M8) · admin editing of any catalogue row (M8) · diagnostic result persistence and scoring (Blueprint R1; needs the assessment design) · legal document text (founder + counsel).

## 3. Approved decisions relied on

ADR-043 (delivery model, conceptual) · ADR-023 (expansion shape) · ADR-020 (guards) · ADR-045 (port policy) · ADR-044 (no conferencing; joining details are data — column reserved, unused) · DR-02 §4.1 (no invented dates) · DR-01 (one credential; no ladder — `level` is an inert display attribute, never a gate).

## 4. RED-gate actions requested

| # | Action | Gate |
|---|---|---|
| 4.1 | Migration `catalogue_and_content` — tables in §5 | Rule 1 |
| 4.2 | Copy the founder-supplied images already in `project-artifacts/mockup/public/` (trainer photo, HRD Corp badge, book covers, delivery illustrations) to `public/` | Port (assets, not code) |
| 4.3 | Bounded commits on `feat/production-foundation` | §0.1 default 4 |

No new dependency. No external account.

## 5. Proposed schema — every table, every column (Rule 1)

Conventions as M2 (snake_case, `timestamptz(6)`, DB-generated UUIDs). `jsonb` is used for **editorial** structures that are rendered, never queried or joined (rationale paragraphs, outcome groups, value stacks) — a reviewable choice recorded here so it is not mistaken for schemaless data.

| Table | Purpose | Columns |
|---|---|---|
| `programmes` | The proposition a person chooses (ADR-043). Domain-scoped; count never encoded | `id uuid PK` · `domain_id uuid → domains` · `slug text unique` · `title` · `subtitle` · `level programme_level` (enum: foundation · practitioner · architect · executive · builder · mentorship — display only, DR-01) · `status programme_status` (enum: published · unlisted · retired) · `flagship boolean` · `duration_label` · `prerequisites` · `formats jsonb` (labels as published) · `certificate_label` · `audience_summary` · `summary` · `value_proposition` · `content jsonb` (highlights, whoShouldAttend, rationale, outcomes, outcomeGroups, included, pedagogy, benefits, careerPaths, methodology, valueStack, valueStackTotal, related, externalResources, mentorshipPackages) · `sort_order int` · `version int default 1` · `created_at` · `updated_at` |
| `programme_modules` | The curriculum, first-class | `id uuid PK` · `programme_id → programmes (cascade)` · `position int` · `title` · `description?` · `points jsonb?` · **unique** `(programme_id, position)` |
| `delivery_formats` | Pace variants of a programme (Bootcamp / Accelerator / Mastery) | `id uuid PK` · `programme_id → programmes (cascade)` · `code text` · `name` · `badge?` · `duration_label` · `schedule_label` · `total_time_label` · `best_for jsonb` · `position int` · **unique** `(programme_id, code)` |
| `programme_prices` | Published regional prices — data, not constants | `id uuid PK` · `programme_id → programmes (cascade)` · `region price_region` (enum: malaysia · pakistan · international) · `currency char(3)` (MYR · PKR · USD) · `list_amount_minor bigint` · `offer_amount_minor bigint` · `offer_label text` ("50% OFF") · `offer_name text` ("Founder's launch offer") · `valid_from timestamptz?` · `valid_to timestamptz?` · **unique** `(programme_id, region)` |
| `experts` | The trainer / practitioner record (DR-02: a real role with a public profile) | `id uuid PK` · `user_id uuid? → users` (linked when the person registers; null until then) · `slug text unique` · `name` · `role_title` · `location` · `headline` · `experience_line` · `summary` · `photo_path` · `expertise jsonb` · `profile jsonb` (about, background, specialisations, careerAchievements, books, frameworks, frameworksUrl, podcast, communityImpact, socialLinks, technologies, certifications, education, linkedin, mediumProfile) · `hrd_corp_accreditation jsonb?` · `published boolean` · `created_at` · `updated_at` |
| `programme_experts` | Expert association (ADR-043) | `programme_id → programmes (cascade)` · `expert_id → experts (restrict)` · `role text` ("lead") · **PK** `(programme_id, expert_id)` |
| `scheduled_offerings` | A dated instance of a programme — the thing a person registers for. **Zero rows until a real date exists** | `id uuid PK` · `programme_id → programmes (restrict)` · `delivery_format_id? → delivery_formats` · `modality delivery_modality` (enum: live_online · face_to_face · corporate_private) · `location text?` · `timezone text` · `starts_on date` · `ends_on date` · `schedule_note text?` · `capacity int?` (named, not enforced — ADR-043) · `status offering_status` (enum: planned · open · full · completed · cancelled) · `organisation_id uuid?` (private cohort scope; FK added when `organisations` exists in M8) · `lead_expert_id? → experts` · `joining_details text?` (ADR-044; participant-only, M5) · `created_at` · `updated_at` |
| `faq_entries` | FAQ content | `id uuid PK` · `group_title` · `position int` · `question` · `answer` · `href?` · `href_label?` · `tbc boolean` · `published boolean` · **unique** `(group_title, position)` |
| `diagnostic_questions` | The fixed question set | `id uuid PK` · `code text unique` · `domain_id → domains` · `position int unique` · `scenario` · `options jsonb` (string[]; "I'm not sure" appended by the UI, never stored) |
| `enquiries` | Contact / register-interest submissions | `id uuid PK` · `kind enquiry_kind` (enum: general · organisation · programme_interest) · `name` · `email` · `organisation?` · `message` · `programme_id? → programmes` · `source_path text` · `status enquiry_status` (enum: new · replied · closed) · `created_at` |

**Also:** seed adds the remaining four capability areas to `domains` (no schema change). **Forward-only; nothing dropped or altered.**

## 6. Design commitments

1. **No literal programme, domain or price in application code** — pages take slugs/ids from the URL or from repository results (ADR-023). The nav's `/DataBlueprint-AIVibeCoding` route stays as the founder-chosen URL and resolves the flagship by `flagship = true`, not by slug literal in the page.
2. **Unlisted programmes 404 publicly** (`status != published`) — "disable, not delete" (founder, 2026-09-20).
3. **Prices render from minor units** with the published labels; the seed records the source figures exactly.
4. **Offerings**: none seeded; the UI has a first-class "no dates yet" state. `capacity` is displayed, never enforced (M4 designs the hold).
5. **Diagnostic result** = per-area answer summary + a plain statement that the scored profile arrives with the assessment engine; nothing invented.
6. **Contact form** is a server action: validation, enquiry row, notification email through the outbox, then a confirmation; the client never sees a fake success.
7. **Images**: only files already in the mockup's `public/` (founder-supplied) are copied; nothing is taken from the reference archive.
8. **Provenance header on every ported file**, naming the mockup file.

## 7. Deliverables

Migration · `prisma/seed-data/*` (verbatim content, provenance headers) · `prisma/seed.ts` extended · `src/modules/catalogue/{programmes,experts,offerings,faq,diagnostic,enquiries}` repositories · `app/(public)/…` routes · `public/` assets · tests (repository integration; e2e: nav resolves, pages render from DB, unlisted 404, contact creates an enquiry, axe) · docs.

## 8. Verification criteria

| # | Criterion |
|---|---|
| 1 | Migration clean; tables match §5 |
| 2 | Seed idempotent: 5 domains · 7 programmes (1 published) · 17 modules on the flagship · 3 formats · 3 prices · 1 expert · FAQ rows · 10 questions · **0 offerings**; second run changes nothing |
| 3 | Every `site-nav.ts` and footer href returns 200 (e2e) |
| 4 | `/DataBlueprint-AIVibeCoding` renders title, formats, 17 modules and 3 prices **from the DB** (e2e compares against repository reads) |
| 5 | An unlisted programme's `/courses/[slug]` is a real 404; the published one renders |
| 6 | `/schedule` with zero offerings shows the "no dates yet" state and a working register-interest form |
| 7 | Contact form: invalid → field errors, no row; valid → `enquiries` row + `outbound_emails` row + confirmation |
| 8 | Grep proof: no `courses`/`practitioners`/`faq`/`questions` import from the mockup or a copied constant in `app/`/`src/` (seed-data is allowed only in `prisma/`) |
| 9 | axe clean on every public page |
| 10 | `tsc` · Vitest · Playwright · `next build` green; M1/M2 suites unchanged |
| 11 | Restart test: enquiry submitted → app restarted → row present |

## 9. Mockup files retired by this milestone

`data/courses.ts`, `practitioners.ts`, `domains.ts`, `faq.ts`, `questions.ts` (→ seeds) · `data/results.ts` (invented fixtures — not ported) · `data/demoParticipant.ts` offerings/`sampleSeats` (→ `scheduled_offerings`, empty) · `lib/basePath.ts` (static-export workaround) · `RegisterInterestButton`/`RegisterButton` demo routing (→ enquiry / M4) · `WireframeNote`, `SampleTag` on public pages · `components/signature/CommunityVideos.tsx` + `lib/youtube.ts` + `data/videos.ts` (not ported; see §2 out of scope).

## 10. Decisions for the founder's return

| # | Default taken | Alternative |
|---|---|---|
| 1 | Domain assignment of the seven programmes (essentials/blueprint/modelling → DF; architecture → DE; agentic strategy, flagship, mentorship → AI) | Any other mapping — one seed edit |
| 2 | Six non-flagship programmes seeded as **unlisted** (404 publicly, retained) | `retired`, or `published` |
| 3 | Community video row omitted until the YouTube key can be held server-side | Server-side proxy under ADR-030 |
| 4 | Diagnostic result shows an answer summary, not a score | Scope the diagnostic engine (M5+) |
| 5 | Staging deferred to M9 (needs accounts) | Provide hosting/DB credentials |
| 6 | Enquiry notifications go to `ENQUIRY_NOTIFY_EMAIL` (env; unset = recorded only) | Name the inbox |
