# Milestone 5a — "User Profile" · Execution Plan

> **Status:** ▶ **EXECUTING 2026-09-22** on the founder's agreement to [`USER_PROFILE_REQUIREMENTS.md`](USER_PROFILE_REQUIREMENTS.md) §8.
> **Depends on:** M2 (identity), M4 (checkout — the profile gates it).

## 1. Objective

> A participant keeps one profile (email immutable, one account per email) with the details a training portal needs — legal name, contact, address, organisation, ID document, date of birth, photo — asked progressively, stored safely, and required **before the first paid registration**, not at sign-up.

## 2. Scope

1. Table `user_profiles` (§4) + application-level encryption of the ID number.
2. `/account/profile` rewritten in sections; ISO country list; phone with country code; masked ID; photo upload (browser-resized, ≤ 256 px, JPEG/PNG/WebP, ≤ 300 KB) with remove; completeness indicator.
3. Header `AccountMenu` shows the photo when present (initials otherwise), served by a session-gated route (`/api/me/photo`) — never a public URL.
4. Checkout gate: `/checkout/[offeringId]` redirects to `/account/profile?complete=1&return-to=…` until the required set (§3) is complete; the profile page says exactly what is missing.
5. Pricing region uses `country_code` (ISO) when present; falls back to the legacy free-text country.
6. Registration form unchanged (name, email, password, country); the country field there now also writes `country_code` via the same ISO list.
7. Audit `profile.updated` lists changed field names; the ID number never appears (only "changed" + last 4); the photo appears as "changed".

**Out of scope:** email change (ADR-015), data export/delete (M5 C20), object storage (ADR-008 — the photo column is the interim; migrating it to a bucket later is a data move, not a redesign), face-to-face logistics fields (founder: no).

## 3. Required before the first paid registration

legal name · mobile (E.164) · address line 1 · city · postal code · country · organisation · job title · ID type + number · nationality · date of birth. Optional: display name, address line 2, state, time zone, industry, experience band, LinkedIn, marketing opt-in, heard-about, photo.

## 4. Schema (Rule 1 — every column; additive; nothing dropped)

`user_profiles`: `user_id uuid PK → users (restrict)` · `legal_name text` · `display_name text?` · `phone_e164 text?` · `address_line1 text?` · `address_line2 text?` · `city text?` · `state text?` · `postal_code text?` · `country_code char(2)?` · `timezone text?` · `organisation text?` · `job_title text?` · `industry text?` · `experience_band text?` · `linkedin_url text?` · `id_type id_document_type?` (enum `nric · passport`) · `id_number_ciphertext text?` · `id_number_last4 text?` · `nationality_code char(2)?` · `date_of_birth date?` · `marketing_consent_at timestamptz?` · `heard_about text?` · `photo bytea?` · `photo_mime text?` · `photo_updated_at timestamptz?` · `completed_at timestamptz?` · `created_at` · `updated_at`.

`users` unchanged (`name`, `country` stay; `legal_name` seeded from `name` on first save).

**Encryption:** AES-256-GCM (Node `crypto`, no dependency); key `PROFILE_ENCRYPTION_KEY` (32 bytes, base64) from the environment/secret store (ADR-030); ciphertext = `v1:` + base64(iv ‖ tag ‖ data). Missing key → profile saves that include an ID number fail loudly; nothing is stored in clear.

## 5. Verification criteria

1 migration clean · 2 save each section, reload, values persist; ID shows last 4 only; DB holds ciphertext, never the number · 3 audit lists field names, never the ID · 4 photo upload → header avatar shows it; remove → initials; the photo route 401s when signed out and never serves another user's photo · 5 checkout with an incomplete profile → redirected with the missing list; complete → checkout proceeds; pricing uses the ISO country (MY → MYR, PK → PKR, other → USD) · 6 registration unchanged and green · 7 tsc · Vitest · Playwright · build.

## 6. Defaults taken (for the founder's note)

- All address and identity fields are required **at first checkout**, not at registration (progressive profiling; registration friction unchanged).
- Photo stored in the database (interim) — ADR-008 undecided; max 300 KB after browser resize.
- Date of birth required at checkout (founder said "yes" to collecting it; used for certificate data).
