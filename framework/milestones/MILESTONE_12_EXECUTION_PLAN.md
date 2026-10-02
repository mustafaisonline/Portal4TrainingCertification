# Milestone 12 — "Trainer role & training management (trainings · schedule · fees) from the admin area" · Execution Plan

> **Status: L1–L12 APPROVED 2026-09-26 as recommended (founder: "All recommendations accepted, L1-L12 = yes, start M12"; recorded as ADR-047). BUILT 2026-09-26 — all four work packages; see §8. Verified locally; nothing is deployed (M11 Phase B).**
> **Founder request (chat, 2026-09-26), verbatim:** *"Admin should see a tab where Admin should be able to assign someone a role: Trainer. When someone has a role of Trainer then he/she should be able to see all those feature using which trainer should be able to launch a new Training. On http://localhost:3100/admin page, we need a card to: allow admin to add trainings; set schedule; set fee structures i.e., 1) For Malaysia via HRD Corp 2) For Malaysia not via HRD Corp 3) For Pakistan 4) Rest of the world. All these we need to manage at database level. Nothing at front end. On context, please elaborate what you understood and what's your plan of execution. Let me review and approve before implementation."*

---

## 1. What I understood

Three capabilities, one principle:

| # | Capability | In my words |
|---|---|---|
| A | **Trainer role** | An admin can make a user a *Trainer* (and take it away) from the admin area. A Trainer signs in and sees the screens needed to **launch a training**: create/edit the training, set its dates, set its fees — but not the rest of the admin area (orders, users, audit, …). |
| B | **Admin cards** | The `/admin` dashboard gets cards for **Trainings** (add / edit), **Schedule** (dates) and **Fees**, so an admin (and a Trainer, for their own trainings) manages the whole launch from the portal. |
| C | **Fee structure** | Every training has **four** fee rows: Malaysia **via HRD Corp** · Malaysia **not via HRD Corp** · Pakistan · Rest of the world. |
| — | **"At database level, nothing at front end"** | Trainings, dates and fees are **data in PostgreSQL, edited through the portal** — not in `prisma/seed-data/*.ts`, not in a component, not in JSON that only a developer can change. Today's seed files become the *initial import* and stop being the place where content lives. |

If any of these readings is wrong, that is the first thing to correct.

## 2. What already exists (so the plan builds on it, not beside it)

| Area | State today | Consequence |
|---|---|---|
| Roles | `user_roles` with enum `participant · expert · assessor · org_admin · platform_admin`, scoped (`platform` / `offering` / `organisation`); grant/revoke audited. **Admin → Users → user page can grant/revoke `platform_admin` only.** `expert` is DR-02's word for the trainer (M8 §5 A7 already anticipated widening screen gates to "expert scoped to this offering") | The Trainer role can be the existing **`expert`** value, shown as "Trainer" in every screen — **no schema change** for the role itself (§6 L1) |
| Trainer profile | `experts` table (public profile on `/trainers`; `user_id` linked when the person registers); `programme_experts` links trainers to trainings | Gives us **ownership**: a Trainer "owns" the trainings they are linked to. No new table |
| Trainings | `programmes` (typed columns + `content` JSON of ~14 editorial sections) + `programme_modules`; **read-only in the portal — content lives in `prisma/seed-data/courses.ts` and is upserted by `npm run db:seed` (which would overwrite any edit made in the portal)** | Needs a full **create/edit screen** and a **seed policy change** (§6 L8) |
| Schedule | **Done** (M4/M8): `/admin/offerings` — new/edit, status `planned → open → full → completed → cancelled`, capacity, lead expert, participants list; `/schedule` shows open dates with **Register** → checkout → Stripe | Reuse; add the card, the Trainer gate, and (optionally) dates on the training page (§6 L11) |
| Fees | `programme_prices`: **one row per region**, enum `malaysia · pakistan · international` (list, offer, label, validity). The "Via HRD Corp / Without HRD Corp" split exists only as **JSON** in `content.regionalPricing.options` (a presentation mechanism added 2026-09-26). Checkout derives the region from the participant's country and takes that region's single row | The four-row structure the founder wants is **not** representable in the table today → **schema change (RED, §4)** |
| Admin dashboard | `/admin` cards: offerings, orders, enquiries, users, reviews, certificates, reports, audit | Add three cards; role-aware |

## 3. Proposed scope — four work packages

### WP1 — Fees as four database rows (the foundation; do first)
1. `PriceRegion` gains **`malaysia_hrdcorp`** (additive enum migration). Labels, in one data-driven table: *Malaysia — via HRD Corp* · *Malaysia — not via HRD Corp* · *Pakistan* · *Rest of the world* (renaming "International" → "Rest of the world" everywhere it is shown, §6 L12).
2. `programme_prices` gains **`min_participants INT NULL`** and **`note TEXT NULL`** so "minimum 25 participants" and "In-person price; no online option in Malaysia" are columns, not JSON.
3. Migration back-fills the flagship's HRD Corp row from the existing JSON; the `regionalPricing` JSON mechanism (`options`, `note`) is **retired** — `RegionCard`, `CourseCard` and the pricing tests read the rows.
4. **Checkout rule (§6 L5/L6):** a Malaysian participant paying by card is charged the **not-via-HRD-Corp** row; the via-HRD-Corp row is **displayed with "enquire / claim through your employer"** and never charged by Stripe (an HRD Corp claim is the employer's, invoiced — an invoice workflow is M8 §5 A3, not this milestone).
5. Admin/Trainer screen: **Fees tab** on a training — four rows, each: currency, list price, offer price, offer label, valid from/to, minimum participants, note. Server-side validation (offer ≤ list, ISO currency, dates), audited.

### WP2 — Trainings managed in the portal
1. `/admin/trainings` (list; filter by status/domain) → `/admin/trainings/new` and `/admin/trainings/[id]` with tabs **Details · Modules · Fees · Dates**.
2. **Details** = the typed columns (title, subtitle, slug, domain, level, status, flagship, duration, prerequisites, delivery formats, certificate label, audience, summary, value proposition, sort order) **plus** the editorial sections the public page renders, edited as structured fields (highlights, who should attend, outcomes / outcome groups, what you get, methodology, benefits, rationale, FAQ, related, external resources, pace notes) — stored where they are today (`content` JSON) but **only ever written by this screen**. §6 L9 decides whether v1 edits all sections or the launch-critical subset.
3. **Modules** = `programme_modules` rows (title, points, order) — add/edit/reorder.
4. **Dates** = the existing offerings list filtered to this training, with "Add a date" pre-filled.
5. **Status lifecycle** as today: `unlisted` (draft, invisible) → `published` (on `/programs`). Who may publish: §6 L2.
6. **Seed policy:** `npm run db:seed` becomes **insert-if-missing** for programmes, modules and prices (it still refreshes reference data that has no admin screen — domains, FAQ, diagnostic questions). The seed files stay in git as the initial import and the record of what was launched with; the database is the truth from then on. Documented in `PROJECT_STATUS.md` §5 and the seed header.
7. Slug is generated from the title and immutable once published (URLs are shared; `next.config.ts` already carries redirects for renamed routes).

### WP3 — Trainer role
1. **Admin → Users → user page:** "Grant Trainer" / "Revoke Trainer" beside the existing admin grant, same audit trail (`role.granted` / `role.revoked`). Granting creates the person's **Trainer profile** (`experts` row) if none exists, so they can be linked to trainings and appear on `/trainers` once published (§6 L10).
2. **Authorisation** (data-access layer, ADR-020): `platform_admin` → everything; `expert` → *their own* trainings (linked through `programme_experts`), the dates of those trainings, their fees; nothing else under `/admin`. Enforced in the repositories and actions, not only in the layout.
3. **What a Trainer sees:** the same `/admin` area with a **reduced dashboard** — cards *My trainings · Schedule · Fees*; every other card and nav item hidden **and** refused server-side (`forbidden()` 403, as M2 does). One UI, role-aware, rather than a second `/trainer` area (§6 L3).
4. Launching a training as a Trainer = create (draft) → modules → four fees → a date → **request publication** or publish (per L2).

### WP4 — Dashboard cards and the training page
1. `/admin` gets **Trainings** (add / edit; count of published and draft), **Schedule** (next open date, capacity used — links to `/admin/offerings`), **Fees** (trainings with an incomplete fee set, i.e. fewer than four rows — links to each). The existing "Manage offerings" card is folded into Schedule.
2. **Training page** (`/programs/<slug>`): list that training's **open dates with Register** (falls back to "Register your interest" when none) — the gap the founder hit on 2026-09-26 (§6 L11).

## 4. ⛔ Physical data model changes (Rule 1 — require explicit approval)

| Change | Kind | Reversible? | Why |
|---|---|---|---|
| `price_region` enum: add value `malaysia_hrdcorp` | additive | Yes (value unused → drop in a later migration) | The four-row fee structure |
| `programme_prices.min_participants INT NULL` | additive column | Yes | "Minimum 25 participants" is data, not JSON |
| `programme_prices.note TEXT NULL` | additive column | Yes | Region note ("no online option in Malaysia") is data |
| *(no change)* `programmes`, `programme_modules`, `user_roles`, `experts` | — | — | Everything else fits the existing model |

No table is dropped, renamed or retyped; no key changes. One forward-only migration, data back-fill included, rehearsed by the M11 sandbox once a server exists and by `tests/integration` now.

## 5. What is deliberately NOT in this milestone

- HRD Corp **claim/invoice workflow** at checkout (registration without Stripe, employer invoice) — M8 §5 A3/organisations; a separate plan.
- Trainers recording **attendance/completion** (M8 §5 A4/A7) — unchanged; still admin-only.
- A trainer **payout / revenue share** model — nothing in the specifications; ask before designing.
- Rich-text editing — sections are structured fields and plain text/Markdown-light as today's seed data is; no editor dependency (Rule 5).
- Image upload for trainings — none exists today; would need object storage (ADR-008, deferred).

## 6. ⛔ Founder decisions — answer by number ("L1 = a …")

| # | Decision | Recommendation |
|---|---|---|
| **L1** | Trainer role value: **(a)** reuse the existing `expert` enum value, shown as "Trainer" in every screen (no schema change) · (b) add a new `trainer` enum value (schema change; `expert` then unused) | **(a)** |
| **L2** | Publishing: **(a)** a Trainer creates and edits drafts; only an admin may set `published` (and un-publish) · (b) a Trainer may publish their own training directly | **(a)** — one human check before a price and a date go public |
| **L3** | Where Trainers work: **(a)** the `/admin` area, role-aware (reduced dashboard + server-side refusal elsewhere) · (b) a separate `/trainer` area | **(a)** — one UI to maintain |
| **L4** | Approve the three schema changes in §4 | **Yes** |
| **L5** | HRD Corp row at checkout: **(a)** display-only with "claim through your employer — enquire"; Stripe never charges it · (b) build an HRD Corp registration path now (no Stripe, pending approval, invoice) | **(a)** now; (b) as its own milestone |
| **L6** | Confirms open item 8(a): a Malaysian card payment is charged the **not-via-HRD-Corp** price | **Yes** |
| **L7** | Trainer scope: **(a)** only trainings they are linked to (`programme_experts`) · (b) any training | **(a)** |
| **L8** | Seed policy after this milestone: **(a)** insert-if-missing for trainings/modules/fees — the portal is the truth · (b) keep overwriting from the seed files (admin edits would be lost on the next seed) | **(a)** |
| **L9** | Training form v1: **(a)** all editorial sections editable (bigger form, one milestone) · (b) launch-critical subset first (details, highlights, who should attend, outcomes, what you get, modules, fees, dates) and the remaining sections in a follow-up | **(a)** — otherwise "nothing at front end" is not true until the follow-up |
| **L10** | Granting Trainer creates a Trainer profile (`experts` row: name from the account, bio empty, unlisted until the Trainer or an admin fills it) | **Yes** |
| **L11** | Training page lists its open dates with **Register** (falls back to "Register your interest") | **Yes** |
| **L12** | Rename the public label "International" → **"Rest of the world"** | **Yes** (founder's wording) |

## 7. Order of work and verification (pass/fail)

1. **WP1 fees** — migration + repositories + public pages read rows + checkout rule. *V1:* four rows per training render on `/programs` and the training page exactly as today's flagship does (Playwright); checkout for a Malaysian profile creates a Stripe session at the not-via-HRD-Corp amount (integration test); `regionalPricing` JSON no longer read anywhere (grep + test).
2. **WP2 trainings** — screens, validation, seed policy. *V2:* create a training from an empty form → modules → fees → date → publish → it appears on `/programs`, its page renders every section, `/schedule` shows the date, a test-mode payment completes (e2e). Re-running `db:seed` changes nothing on an admin-edited training (integration test).
3. **WP3 trainer** — grant/revoke, gates, reduced dashboard. *V3:* a Trainer can open only their trainings/dates/fees; every other `/admin` route and action returns 403 (e2e + integration, both directions); grant/revoke rows in the audit log.
4. **WP4 cards + training page dates.** *V4:* cards show live counts; Register from the training page reaches checkout.
5. Regression: full gate (`deploy/04-release-gate.sh`) green; restart-resilience test extended to a portal-created training (Rule 6).

Estimated size: WP1 ≈ 1 sitting, WP2 ≈ 2, WP3 ≈ 1, WP4 ≈ ½ — sequential, each with its own completion report.

## 8. Completion note (2026-09-26)

| WP | Delivered | Verified |
|---|---|---|
| **WP1 Fees** | Migration `20260926130859_fee_structure_four_rows` (enum `malaysia_hrdcorp`; `programme_prices.min_participants`, `.note`; back-fill from and removal of `content.regionalPricing`). `PriceRegion` widened; `CheckoutRegion` for what a participant can be charged; `PRICE_REGIONS` in the founder's row order with `card`/`optionLabel`; `pricesForCard`. `ProgrammePricing` and `CourseCard` render rows (the Malaysia card carries both Malaysian rows). `regionForCountry` never yields the HRD Corp row (L5/L6). "International" → "Rest of the world" (L12). Seed rows carry `minParticipants`/`note` | **V1** ✅ four rows render on `/programs` and the training page exactly as the founder approved on 2026-09-26 (DOM-verified + Playwright); checkout for a Malaysian profile takes the `malaysia` row (unit + integration); `regionalPricing` read nowhere (grep + test) |
| **WP2 Trainings** | `/admin/trainings` list · `new` · `[id]` workspace with **Details · Content · Curriculum · Formats · Fees · Dates** tabs. `admin.repository.ts` (validation, audit rows: `programme.created/updated/content_updated/modules_updated/formats_updated/fee_updated/fee_removed/status_changed`), `admin.actions.ts`, `content-codec.ts` (every editorial section as documented line formats — L9), `constants.ts`. Slug generated from the title and locked once published; flagship exclusive; a pace format with scheduled dates cannot be removed. "Add a date" pre-selects the training. **Seed = insert-if-missing** (L8) with `main()` guarded so tests call it in-process | **V2** ✅ e2e: draft → sections → module → four fees (with an in-place refusal) → open date → publish → listed on `/programs`, page renders, bookable; integration: the whole sequence, scope, slug lock, format-in-use, flagship exclusivity, re-seed keeps a portal edit; unit: codec round-trips on all 8 seeded trainings |
| **WP3 Trainer** | Admin → Users → person: **Grant / Revoke trainer** (`expert` role labelled "Trainer", L1; unpublished Trainer profile created on grant, L10). `trainingAccess()` — admin: everything; Trainer: trainings linked through `programme_experts` (L7). Admin layout admits Trainers with a reduced bar (Overview · Trainings, L3); every other admin page now calls `forbidden()` (403, never a blank page); offerings list/new/edit and their actions re-check the scope on the programme (a Trainer cannot take over or give away a date); participants stays admin-only; publishing is admin-only (L2) — Trainers see a readiness note | **V3** ✅ e2e: reduced dashboard and bar; 403 on six admin routes; 404 on another trainer's workspace; own draft created and listed; no publish control; offering form offers only their training. Integration: grant creates the profile, re-grant no-op, scope, revoke keeps the profile, revoke of a non-trainer refused |
| **WP4 Cards + dates** | `/admin` launch cards **Trainings · Schedule · Fees** with live counts (published/drafts, open dates, trainings missing fee rows → deep link to the first one's Fees tab); Trainer sees the reduced board. Training page: **Dates** section with Register → checkout for open dates (L11), hero "Register for a date"; `/schedule` lists **every published training's** dates grouped by training (was flagship-only — the reason a launched training could not be booked); `listUpcomingPublicOfferings` returns published trainings' dates only | **V4** ✅ DOM-verified on the dev server; e2e asserts Register from the training page and from the grouped schedule |
| Regression | — | tsc clean · **Vitest 438/438** · **Playwright 69/69** against the production build (`next build && PLAYWRIGHT_SERVER=start`), incl. axe WCAG 2.2 AA on every new screen · module-boundary rules green (client forms import only `constants`/`types`/`actions`; no module imports the generated Prisma client) |

**Deviations from the plan text:** the schedule page change (§3 above) was not in the plan — it was necessary for V2's last step to be true at all. The Fees tab also carries **Valid from / Valid to** (columns that already existed) so the "no end date" checklist item C14 can now be set without code.

**Not done, by design (plan §5):** HRD Corp claim/invoice checkout; trainers recording attendance; payouts; rich-text editing; image upload; a self-service editor for the Trainer's public profile.
