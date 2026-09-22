# Milestone 5b — "Reviews" · Completion Report

> **Status: IMPLEMENTED · TESTED** · 2026-09-22
> **Executed on:** the founder's decision of 2026-09-22 — "all as recommended, except point 10: the feature is named **Reviews**" — recorded in [`LEARNER_FEEDBACK_REQUIREMENTS.md`](LEARNER_FEEDBACK_REQUIREMENTS.md) §13 and planned in [`MILESTONE_5B_EXECUTION_PLAN.md`](MILESTONE_5B_EXECUTION_PLAN.md).
> **Branch:** `feat/production-foundation` · commits `8cc5856` (plan, schema, audit actions), `bd94a97` (module and screens), `8a05493` (tests) · not pushed.

## 1. Requested
Mandatory learner feedback tied to the specific certificate being downloaded; a public reviews page; admin moderation; consent-based publication with a separate photo consent; dashboard status; the certificate-download gate. The audit (requirements §1.4) found that certificates do not exist yet, so the gate is delivered as a server-side function for Milestone 6 to call (D-3).

## 2. Delivered
| Area | What |
|---|---|
| Schema (Rule 1, additive) | Table `reviews` + enums `review_kind`, `review_category`, `review_moderation`, `review_visibility`; `registration_id` UNIQUE (one review per registration); `display_name_snapshot`; back-relations only on `users`, `registrations`, `programmes`, `scheduled_offerings`. Migration applied to dev and test |
| Module `src/modules/reviews/` | `constants` (bounds, labels) · `review-validation` (pure; body 20–2 000, rating 1–5, category) · `visibility` — **one rule** `consent_public AND approved AND visible`, used by both `isPubliclyVisible()` and the Prisma `publicWhere()` · `eligibility` (confirmed registration on an offering that ended before today; per-registration status *Required · Submitted · Awaiting review · Published*) · `repository` (create, edit within 7 days → back to pending, public page, admin list with search/filters/sort/pagination, moderate, hide, restore) · `review.actions` / `admin.actions` (server actions; admin actions behind `authorise("platform_admin")`) |
| `/reviews` (public) | Guest: title, intro, published list or empty state, "Log in to share a review" — never a form. Signed in: each eligible registration gets a form headed with the person's profile name/photo; counter; validation with input kept; consent **defaults to private**; photo consent only when public consent is Yes; own reviews with status and Edit; optional "Tried the free diagnostic?" private note (`kind = diagnostic`) |
| `/admin/reviews` · `/admin/reviews/[id]` | List with search (name, email, words), moderation / visibility / consent / programme / rating filters, sort, pagination; Approve · Reject (note) · Hide · Restore; **Restore is refused when the author's consent is No**; every action writes an audit row; admin dashboard card shows the pending count and deep-links to the pending filter |
| Photo route | `GET /api/reviews/[id]/photo` returns bytes only when the review is publicly visible **and** `consent_photo`; otherwise 404 |
| Dashboard | `/account` and `/account/programmes` show the review status per registration with "Share your experience" when required; account sidebar item **Reviews** (→ `/reviews`); footer Explore link **Reviews** |
| Certificate gate (M6) | `reviewRequirement()` and `reviewRequirementForRegistration()`: *required* until any review exists for the registration; hidden or rejected still satisfies; certificates issued before the feature date are *not applicable* (D-7). **Not yet called by anything** — there is no certificate route |
| Audit | `review.submitted`, `review.edited`, `review.moderated`, `review.hidden`, `review.restored` — status before/after, never the body |
| Shared UI | `Card` now forwards the remaining `div` attributes (`data-*`, `aria-*`); a `data-testid` placed on a Card was silently dropped |

## 3. Testing
| Layer | Result |
|---|---|
| `tsc` · `next build` | clean |
| Vitest | **206 / 206** — validation bounds; visibility rule and `publicWhere()` agree; `reviewRequirement()` for every state; integration on the real test database: eligibility windows (ends today → not yet; yesterday → yes), display-name snapshot with fallbacks, no duplicate per registration, photo consent never stored without public consent, public query excludes pending / rejected / hidden / non-consented, paging, moderation state machine with audit, admin list, own edit window and refusals, photo route, certificate requirement; all earlier suites unchanged |
| Playwright | **34 / 34** — guest view; learner journey (profile-headed form → counter → validation → submit → pending → dashboard status); second learner's private review; admin approve → public, hide → gone, restore → back, restore refused for a private review; axe WCAG 2.2 AA on `/reviews` and `/admin/reviews`; all earlier specs pass |
| Browser | `/reviews` and `/admin/reviews` served with 200 and no server errors at `localhost:3100` |

## 4. Security
Server actions re-check session and ownership; moderation actions require `platform_admin` (participant → refused). Public data is selected by one server-side rule; the admin list is the only path that returns emails. Photo bytes are never served for a non-public or non-photo-consented review. Body text is rendered as text (no HTML). Audit rows carry status transitions only.

## 5. Observations
1. `tests/e2e` grew to 34 cases; the full run takes about 1.4 minutes on the founder's Mac with a single worker.
2. The account sidebar's "Reviews" item is the only entry outside `/account`; the sidebar e2e and the nav unit test allow exactly that one exception.
3. Existing dev-database users have no reviewable registrations until an offering they hold a confirmed registration for has ended.

## 6. Decisions taken by default / not done
- **Certificate gate not wired** — no certificate route exists; M6 must call `reviewRequirementForRegistration()` before serving a certificate (requirements §8).
- **No admin delete** (D-8); hide and reject only.
- **Account-deletion anonymisation** of consented public reviews (D-9) is deferred to the account-deletion work item (M5 C20); the `display_name_snapshot` column is where "A learner" will be written.
- Reviews are not in the primary navigation (D-10, second sentence): footer Explore list and account sidebar only.
