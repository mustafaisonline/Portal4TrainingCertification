# Milestone 5a — "User Profile" · Completion Report

> **Status: IMPLEMENTED · TESTED** · 2026-09-22
> **Executed on:** the founder's decisions of 2026-09-22 ([`USER_PROFILE_REQUIREMENTS.md`](USER_PROFILE_REQUIREMENTS.md) §8) and [`MILESTONE_5A_EXECUTION_PLAN.md`](MILESTONE_5A_EXECUTION_PLAN.md).
> **Branch:** `feat/production-foundation` · commits `3dd0e60` (foundation), `4266481` (screens) · not pushed.

## 1. Requested
Email as the single, mandatory account identifier; a best-practice training-portal profile — including full address, national ID/passport, date of birth, organisation and job title (mandatory), and a photo shown in the header menu.

## 2. Delivered
| Area | What |
|---|---|
| Email | Already unique + mandatory (M2); confirmed and documented; read-only on the profile until an email provider exists (founder decision 6) |
| Schema (Rule 1) | `user_profiles`, one row per user, every agreed field; ID number stored **only** as AES-256-GCM ciphertext + last 4; photo bytes as the interim store until ADR-008 |
| Profile page | Sections: photo · identity & contact · address · professional · identity document · preferences; completeness banner ("Before you can register for a date, please add: …"); per-field validation; ID never re-displayed (`••••1234`); date of birth 16–100 years |
| Photo | Browser resize to ≤ 256 px JPEG ≤ 300 KB → `/api/me/photo` (session-gated, private cache, ETag) → header avatar; remove restores initials |
| Checkout gate | Required set (legal name, mobile, address line 1, city, postal code, country, organisation, job title, ID type + number, nationality, date of birth) enforced on the checkout page **and** inside `startCheckout` |
| Pricing | By ISO country code (MY → MYR, PK → PKR, other → USD); registration's country is an ISO dropdown |
| Audit | `profile.updated` lists changed field names; never the ID number or photo bytes |
| A11y | `Field`/`SelectField` now use explicit `htmlFor`/`id`; axe clean on the profile page |

## 3. Testing
| Layer | Result |
|---|---|
| `tsc` · `next build` | clean |
| Vitest | **163 / 163** — cipher round-trip/tamper/no-key; validators (E.164, NRIC/passport, DOB range, LinkedIn); countries; integration: ciphertext ≠ number, masking, audit without digits, completeness → `completed_at`, photo save/remove; commerce re-run with the gate |
| Playwright | **30 / 30** — profile journey (missing list → every section → reload masked → photo in header → remove), validation keeps input, checkout gate redirect + completion, plus all earlier suites; per-test budget raised to 120 s for long journeys on a cold dev server |
| Browser | `/account/profile` and header avatar checked at `localhost:3100` |

## 4. Observations
1. **Disk space.** The founder's Mac ran out of disk mid-run (Turbopack caches + traces); regenerable caches were cleared (`.next`, npm, pip, Playwright traces). Keep ≥ 10 GB free for the dev workflow.
2. `AccountControls` adds one profile query per signed-in header render (cheap; could be folded into `getCurrentUser` later).
3. `updateUserProfile` (M2's name/country updater) is now unused — left for removal in a later tidy-up.
4. Existing dev-database users have no profile row until they save the page once; the banner tells them what to add.

## 5. Decisions taken by default
All mandatory fields are required at the first paid registration, not at sign-up; date of birth minimum age 16; photo max 300 KB after resize, stored in the database until object storage is decided.
