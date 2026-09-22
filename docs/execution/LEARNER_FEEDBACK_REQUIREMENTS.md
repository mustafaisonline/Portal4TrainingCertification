# Learner Feedback & Reviews — Requirements Record and Implementation Plan

> **Status: AGREED 2026-09-22 — founder: "all as recommended", except D-10: the feature is named "Reviews"** (route `/reviews`, admin `/admin/reviews`, table `reviews`, sidebar item "Reviews"). Executed as Milestone 5b ([`MILESTONE_5B_EXECUTION_PLAN.md`](MILESTONE_5B_EXECUTION_PLAN.md)). · Phase 1 (discovery) completed 2026-09-22
> **Trigger:** founder brief of 2026-09-22 (18 sections; "start by auditing the existing portal; do not begin implementation until you understand the current architecture and certificate workflow"). **Founder decision already given:** the feedback requirement is associated with **the specific certificate being downloaded**.
> **Authorises nothing.** Tables and columns in §6 are Rule 1 items listed for approval. Open decisions are in §13.

---

## 1. The audit — what the portal actually has (Phase 1 deliverable)

### 1.1 Stack and conventions
Next.js 16 App Router + React 19 + TypeScript at the repo root; PostgreSQL 16 via Prisma 7 (`prisma/schema.prisma`, forward-only migrations); **no REST API layer** — server actions (`*.actions.ts`, `"use server"`) and route handlers only where a URL is needed (`app/api/**`) per ADR-004; repositories under `src/modules/<module>/…` are the only database readers; the design system is CSS tokens + `src/shared/ui/{Button,Card,Chip,forms}`; every public screen sits in `PublicShell`, every signed-in screen in `app/account/layout.tsx` (`AccountFrame` sidebar), every admin screen in `app/admin/layout.tsx`. Tests: Vitest (unit + integration on a real test database), Playwright + axe (e2e), boundary tests that fence client components from the DB layer.

### 1.2 Authentication and roles
Better Auth (email + password; no email verification required by founder decision; no MFA). `users` is the business identity (UUID); the provider's subject lives only in `auth_identities`. Roles in `user_roles` (`participant · expert · assessor · org_admin · platform_admin`), read by `getCurrentUser()` / `authorise(role)` in `src/modules/identity/session.ts`. Guests can read public pages; `/account/*` requires a session; `/admin/*` requires `platform_admin` (403 otherwise). Rate limits live in the database. Audit log (`audit_log`) is insert-only, written in the same transaction as the change.

### 1.3 User profile (M5a, 2026-09-22)
`user_profiles`: legal name, display name, phone, full address, ISO country, organisation, job title, industry, experience band, LinkedIn, ID document (encrypted), nationality, date of birth, marketing consent, **photo** (bytes, served only to the owner through `/api/me/photo`), completeness flag. **The photo is currently private by design** — showing it on a public reviews page needs a public, consented route (§7.3).

### 1.4 Tests and certificates — **the gap**
| Brief assumes | Portal today |
|---|---|
| "Free Test" with completion status | The **free diagnostic** (10 questions) — answers are kept in the browser's `localStorage`, **nothing is persisted server-side, nothing is scored**, no certificate results from it. Its result page deliberately shows only an answer summary |
| "Paid Test" | **Does not exist.** What is paid is a **programme registration** for a scheduled offering (M4: `orders → payments → registrations`, Stripe) |
| "Certificate generation / download" | **Not built.** Planned as the **Certificate of Completion** (`COMPLETION_CERTIFICATE_REQUIREMENTS.md`, decisions D1–D15; roadmap M6) issued when a **trainer records completion** of a registration (M8). `/account/certificate` and `/verify` are honest placeholders |
| "Retakes" | No tests → no retakes. A person can hold several registrations (different dates/programmes) |
| "Admin-issued certificates" | Foreseen (D12 corrections/reissue, AD-D3 manual issuance) — not built |

**Consequence:** the certificate-download gate cannot be wired until certificates exist. What *can* be built now — and should be, so M6 lands with feedback already in place — is everything else: the feedback model, the submission flow tied to a completed registration, the public reviews page, the admin moderation screen, the dashboard status, and the server-side eligibility function that M6 will call before serving a certificate.

### 1.5 Admin panel
`/admin` landing + `/admin/offerings` (list/create/edit) built on the pattern: server component list → `useActionState` form → server action that calls `authorise("platform_admin")` first → repository write with audit in-transaction. No generic CMS; new admin sections follow this pattern.

## 2. Mapping the brief onto this portal

| Brief term | Here |
|---|---|
| "Test / certification" the feedback is about | A **registration** (person × scheduled offering × programme). The certificate — when it exists — is issued per completed registration, so **one feedback per registration = one feedback per certificate**, exactly the founder's chosen association |
| "Certificate eligible" | Registration `confirmed` **and** completion recorded (M6/M8). Until then: "feedback can be given after your first session has run" (offering end date has passed) |
| "Course" | Programme (title shown on the card); "certification name" = the programme's certificate label |
| "Log in to share feedback" | Existing `/sign-in?return-to=/feedback` |
| "Profile image / name" | `user_profiles.photo` + display name (fallback legal name → initials via the existing `AccountMenu` avatar) |

## 3. MVP scope (founder's P0/P1 kept)

| Priority | Item | In this plan |
|---|---|---|
| P0 | Mandatory feedback before certificate download | Eligibility function + gate built now; **enforced the moment M6 serves a certificate** (the gate is a server check in the certificate route/action, never a client flag) |
| P0 | Profile-based user information | Yes — nothing re-asked |
| P0 | Public reviews page `/feedback` | Yes |
| P0 | Admin hide/show | Yes (`/admin/feedback`) |
| P0 | Auth + security | Yes |
| P1 | Rating 1–5 (optional) | Yes — separate column |
| P1 | Category | Yes |
| P1 | Moderation workflow | Yes — `pending → approved / rejected`, plus `hidden` visibility |
| P2 | Analytics dashboard, featured testimonials | Data shape supports it; **not built** |

## 4. Submission workflow (per registration = per certificate)

1. A signed-in participant opens **/feedback**. The page lists their registrations that are **feedback-eligible**: offering has ended (or completion recorded), no feedback yet. Each has "Share your experience".
2. The form (§5) is pre-headed with the person's avatar, display name, programme and dates — read from the session/profile; not editable there.
3. Submit → server action: session check → ownership check (registration belongs to the user) → eligibility check → validation → **one row per registration** (unique constraint; a second submit returns the existing feedback, no duplicate) → audit → success message. Optional edit window: the person may **edit their own feedback within 7 days** (D-6, §13); edits reset moderation to `pending`.
4. Certificate download (M6): the server asks `feedbackSatisfied(registrationId)` before rendering/serving; if not, it returns the "Share feedback to download your certificate" screen (brief §3.2 copy) with the button → `/feedback?registration=<id>&return-to=<certificate url>`. A hidden or rejected feedback **still satisfies** the requirement (brief §8.2).
5. Certificates issued before the feature (none exist today) would be grandfathered: the gate applies only to certificates issued after the feature ships (D-7).

**Free diagnostic:** not gated and not tied to a certificate (none results). Optionally, a lightweight "how was the diagnostic?" prompt on its result page can create a feedback row with `kind = diagnostic`, no registration — **D-2** in §13.

## 5. Form

| Field | Rule |
|---|---|
| Share your experience | required · 20–2 000 chars · live counter · stored as plain text, rendered as text (React escapes; no HTML accepted) · leading/trailing whitespace trimmed · server-side length and control-character checks |
| Rating | optional · 1–5 · stored separately (`rating` nullable) |
| Category | optional · `test_experience · course_content · certification_process · user_experience · technical_issue · other` (labels as in the brief; "test experience" shown as "Programme experience" if D-1 renames it) |
| Public display consent | explicit choice, **default "No, keep my feedback private"** · when "Yes": second checkbox "Show my photo alongside my name" (default off) — the photo is private data today |
| Displayed (read-only) | avatar, display name, programme, offering dates |

Rate limit: 5 submissions / 10 minutes per client (existing DB-backed limiter).

## 6. Data model (Rule 1 — every column; nothing dropped)

**Table `learner_feedback`**
`id uuid PK` · `user_id → users (restrict)` · `registration_id uuid? → registrations (restrict)` · `programme_id → programmes (restrict)` · `offering_id uuid? → scheduled_offerings (restrict)` · `kind feedback_kind` (enum `registration · diagnostic`) · `feedback_text text` · `rating smallint?` (CHECK 1–5 by validation; enum-free) · `category feedback_category?` (enum, §5) · `consent_public boolean` · `consent_photo boolean` · `moderation_status feedback_moderation` (enum `pending · approved · rejected`) · `visibility_status feedback_visibility` (enum `visible · hidden`) · `moderated_by_user_id uuid?` · `moderated_at timestamptz?` · `moderation_note text?` · `display_name_snapshot text` (name at submission; the public card uses it so a later name change does not silently alter a published review — D-5) · `submitted_at` · `edited_at?` · `created_at` · `updated_at`.
Constraints/indexes: **unique `(registration_id)`** where not null (one feedback per registration/certificate); index `(moderation_status, visibility_status, consent_public, submitted_at)` for the public query; index `(user_id)`; index `(programme_id, submitted_at)`.

**No change to `registrations`**; the certificate gate reads `learner_feedback` by `registration_id`. When M6 adds `certificates`, `certificate_id → registration_id` already resolves the association.

**Audit actions:** `feedback.submitted`, `feedback.edited`, `feedback.moderated` (approve/reject with note), `feedback.hidden`, `feedback.restored`, `feedback.deleted` (soft: we do **not** delete rows in MVP — D-8).

## 7. Screens, actions and routes

### 7.1 Public — `/feedback` (Learner Feedback & Reviews)
Title and intro as in the brief. Guests: intro + public reviews + "Log in to share feedback". Signed in: their eligible registrations + form, then the public list. Cards: avatar (photo only if `consent_photo`; else initials), display-name snapshot, programme, rating, text, month + year. Newest first; "Load more" (server-paged, 12 per page). Empty state; the list is a server component (no loading spinner needed; errors surface through the normal error boundary).
**Visibility rule (server-side, one function `isPubliclyVisible`)**: `consent_public = true AND moderation_status = approved AND visibility_status = visible`. Nothing else is ever selected for the public query.

### 7.2 Signed-in
`/feedback` (as above) · `/account` dashboard: a "Feedback" column per registration — *Required* / *Submitted* / *Awaiting review* — and, once M6 exists, the certificate column next to it (brief §10 table) · `/account/programmes`: "Share your experience" link on eligible cards.

### 7.3 Routes (only where a URL is unavoidable)
`GET /api/feedback/[id]/photo` — the reviewer's photo **only if** that feedback is publicly visible **and** `consent_photo` — public, cacheable for 1 h, 404 otherwise. (Keeps `/api/me/photo` private.) No other API surface; all writes are server actions with per-call session + ownership checks.

### 7.4 Admin — `/admin/feedback`
List with avatar, name, programme/offering, rating, excerpt, date, consent, moderation, visibility; search (text/name/email — email visible to admin only), filters (status, programme, consent, rating), sort newest/oldest, pagination 25. Actions (each a server action: `authorise("platform_admin")` → audit in-transaction): **Approve · Reject (note) · Hide from public · Restore** (restore never overrides `consent_public = false` — the button is disabled with the reason). Delete: **not in MVP** (D-8). A row detail drawer shows full text and history from `audit_log`.

## 8. Certificate-download enforcement (for M6)
`src/modules/feedback/eligibility.ts` → `feedbackRequirement(registrationId): "satisfied" | "required" | "not_applicable"`. M6's certificate route handler/action calls it **after** the ownership check and **before** rendering or streaming any certificate; direct URL access, old links, refresh and parameter tampering all hit the same server function. Hidden/rejected feedback = satisfied. Certificates issued before the feature = not applicable (D-7).

## 9. Security
Session on every write; ownership on every read/write of a specific row; admin role on moderation; input validated and length-checked server-side; text stored and rendered as plain text (React escaping — no `dangerouslySetInnerHTML`); DB-backed rate limit; public queries filtered by the single visibility function; emails never in public output; internal IDs exposed only as opaque UUIDs where a route needs one (photo route by feedback id); audit on every state change.

## 10. Edge cases
Abandoned form → nothing stored (no drafts in MVP) · network error → resubmit is idempotent per registration (unique constraint returns the existing row) · duplicate → same · several registrations → one feedback each, each certificate gated by its own · hidden/rejected → still satisfies the gate; disappears from public only · expired session → sign-in with `return-to` · profile name change → public card keeps the snapshot, admin sees both · account deletion (M5 C20) → feedback deleted with the account unless the person consented to public display, in which case the name snapshot is anonymised ("A learner") — D-9.

## 11. Testing (to be written with the code)
Unit: validation (lengths, control chars, rating range, category), visibility function, eligibility function. Integration (real DB): one-per-registration constraint, ownership refusal, moderation transitions + audit, public query never returns non-consented/pending/hidden rows, photo route rules. E2E: guest sees reviews and the log-in button and cannot submit; signed-in eligible user submits with profile-derived header; counter and validation; duplicate returns the same; admin hides → public page drops it → restore; restore blocked when consent is "No"; dashboard status column; axe on `/feedback` and `/admin/feedback`. Regression: existing account, checkout, admin-offerings suites unchanged. Certificate-gate e2e is added with M6.

## 12. Phases
1. **Discovery** — this record. 2. **Data + backend** — migration, repositories, validation, eligibility, actions. 3. **UI** — `/feedback`, form, dashboard column. 4. **Admin** — `/admin/feedback`. 5. **Public** — reviews list, photo route. 6. **Tests + report.** 7. **M6 hook** — the certificate route calls `feedbackRequirement()`.

## 13. Decisions for the founder

| # | Question | Recommendation |
|---|---|---|
| D-1 | The brief's "Free Test / Paid Test" do not exist. Confirm the association is **per completed programme registration** (= per certificate when M6 lands) | Yes |
| D-2 | Also ask for (ungated, optional) feedback after the **free diagnostic**? | Yes, lightweight, `kind = diagnostic`, private by default |
| D-3 | Build now (model, page, admin, dashboard) and wire the certificate gate with M6 — or wait for M6? | Build now; M6 then has feedback ready |
| D-4 | Moderation default: new feedback `pending` until an admin approves (public only after approval), or auto-approved and hidden on demand? | **Pending → approve** (the brief's model); admin sees a "Pending" count |
| D-5 | Public name: display name (falls back to legal name) with a snapshot at submission | Yes; option to show "First name L." instead — say if preferred |
| D-6 | Let the author edit within 7 days (edit resets moderation)? | Yes |
| D-7 | Certificates issued before the feature are not gated | Yes (none exist yet) |
| D-8 | Admin delete in MVP? | No — hide/reject only; hard delete is a later, audited action |
| D-9 | On account deletion, anonymise consented public reviews rather than delete? | Anonymise ("A learner") |
| D-10 | Feature name "Learner Feedback & Reviews"; nav placement: footer "Explore" list + account sidebar item "Feedback" | Yes; add to the primary nav only if you want a 8th item |

**Sequencing note:** Milestone 6 (Certificate of Completion) needs its own execution plan and the D1–D15 decisions in `COMPLETION_CERTIFICATE_REQUIREMENTS.md` — notably **D2 (what "completed" means and who records it)**, which is the true gate to any certificate. Feedback is ready to sit behind it.
