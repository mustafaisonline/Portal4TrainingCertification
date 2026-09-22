# Milestone 5b — "Reviews" · Execution Plan

> **Status:** ✅ **EXECUTED 2026-09-22** on the founder's agreement to [`LEARNER_FEEDBACK_REQUIREMENTS.md`](LEARNER_FEEDBACK_REQUIREMENTS.md) §13 ("all as recommended"; feature named **Reviews**) — see [`MILESTONE_5B_COMPLETION_REPORT.md`](MILESTONE_5B_COMPLETION_REPORT.md). The certificate gate (item 6) is delivered as a function; M6 wires it.
> **Depends on:** M4 (registrations), M5a (profile, photo). **Feeds:** M6 (the certificate route calls `reviewRequirement()`).

## 1. Scope (phases 2–6 of the brief)
1. Table `reviews` + enums (§2); module `src/modules/reviews/` — validation (pure), repository, eligibility, visibility rule, server actions, moderation actions.
2. `/reviews` — public list (approved + consented + visible), guest CTA, signed-in: eligible registrations + form; optional diagnostic review (`kind = diagnostic`, private by default).
3. Dashboard: a Reviews status per registration (*Required · Submitted · Awaiting review · Published*); `/account/programmes` card link; account sidebar item **Reviews** → `/reviews`; footer "Explore" link **Reviews**.
4. `/admin/reviews` — list, search, filters, sort, pagination; Approve · Reject (note) · Hide · Restore (never overriding `consent_public = false`); audit on each.
5. `GET /api/reviews/[id]/photo` — reviewer photo only when publicly visible and `consent_photo`.
6. `reviewRequirement(registrationId)` for the M6 certificate gate (hidden/rejected still satisfies; pre-feature certificates n/a).
7. Tests per requirements §11; completion report.

## 2. Schema (Rule 1 — additive)
`reviews`: `id uuid PK` · `user_id → users (restrict)` · `registration_id uuid? → registrations (restrict), UNIQUE` · `programme_id → programmes (restrict)` · `offering_id uuid? → scheduled_offerings (restrict)` · `kind review_kind` (`registration · diagnostic`) · `body text` · `rating smallint?` · `category review_category?` (`programme_experience · course_content · certification_process · user_experience · technical_issue · other`) · `consent_public boolean` · `consent_photo boolean` · `moderation_status review_moderation` (`pending · approved · rejected`) · `visibility_status review_visibility` (`visible · hidden`) · `moderated_by_user_id uuid?` · `moderated_at timestamptz?` · `moderation_note text?` · `display_name_snapshot text` · `submitted_at timestamptz` · `edited_at timestamptz?` · `created_at` · `updated_at`. Indexes: `(moderation_status, visibility_status, consent_public, submitted_at)`, `(user_id)`, `(programme_id, submitted_at)`.
Audit actions: `review.submitted · review.edited · review.moderated · review.hidden · review.restored`.

## 3. Rules fixed by the decisions
Pending until approved · consent defaults private · photo consent separate · one review per registration (unique) · edit window 7 days, edit → pending · hidden/rejected satisfies the certificate gate · no delete in MVP · account deletion anonymises consented public reviews (implemented in M5 C20) · public name = display-name snapshot.

## 4. Verification criteria
1 migration clean · 2 guest: sees public reviews, cannot submit, "Log in to share a review" · 3 signed-in eligible person: header from profile, counter, validation (20–2 000), submit → pending; duplicate → same row · 4 dashboard/programmes show the status · 5 public query never returns pending/hidden/rejected/non-consented rows (integration) · 6 admin approve → appears; hide → disappears; restore → reappears; restore refused when consent is No; reject with note; every action audited; participant → 403 · 7 photo route: 404 unless visible + consented · 8 `reviewRequirement()` unit-tested for all states · 9 axe on `/reviews` and `/admin/reviews` · 10 tsc · Vitest · Playwright · build; earlier suites unchanged.
