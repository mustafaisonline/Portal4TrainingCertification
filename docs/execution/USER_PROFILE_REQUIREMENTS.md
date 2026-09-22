# User Profile — Requirements Record

> **Status: PROPOSED — for founder agreement before implementation** · 2026-09-22
> **Trigger:** founder direction — *"make email the unique ID at the backend, one account one email, mandatory; then add profile fields as per best practices of a training portal (location, national ID or passport number, and more)."*
> **Authorises nothing.** Implementation starts only after the decisions in §7 are answered. Any table or column below is a **Rule 1** change and is listed for that approval.

---

## 1. Email as the unique identifier — already true; what remains

| Fact | Where enforced | Status |
|---|---|---|
| One account per email | `users.email` **NOT NULL, UNIQUE** (lower-cased by the identity service) and the provider's `auth_users.email` UNIQUE | ✅ since M2 |
| Registration with an existing email is refused with a clear message; the existing password is never touched | `/sign-up/email` before-hook → 422 `USER_ALREADY_EXISTS` | ✅ (founder option A, 2026-09-21) |
| Email is mandatory at registration and at sign-in | register form + Better Auth | ✅ |
| Email is the login name | Better Auth `emailAndPassword` | ✅ |
| **Email is read-only on the profile page** | `/account/profile` | ✅ deliberately — a change of address needs a verification email to the *new* address, which no provider can deliver until ADR-015 is decided |

**Proposed for this piece of work:** keep email as the immutable login identifier; add an **"Request email change"** path only when the email provider exists (out of scope here). Internally the immutable key remains `users.id` (UUID) — email is the *login* identifier, never the foreign key (ADR-020, DECISION_B §B).

## 2. Principles the field set follows

1. **Data minimisation (PDPA 2010, General Principle):** collect a field only when a stated purpose needs it; say the purpose on the form.
2. **Progressive profiling:** registration stays minimal (name, email, password, country). Further fields are asked **when first needed** — at the first paid registration (checkout) or from the profile page — and the account shows "profile incomplete" until then.
3. **Certificate correctness:** the name on a Certificate of Completion must match an identity document; that is the reason a legal name and an ID number are asked at all.
4. **HRD Corp readiness:** a claimable course needs the employer's details and the participant's NRIC/passport on the attendance evidence (verify against current e-TRIS rules — OQ-8). Collected but marked *optional until the organisation is registered*.
5. **Sensitive data is isolated and encrypted:** ID numbers are stored encrypted at application level, shown masked, never logged or put in audit snapshots, and excluded from the data export unless the person asks.
6. **No field without a purpose or an owner decision.** Items the founder has not confirmed are listed in §7, not built.

## 3. Proposed fields

**M** = mandatory · **M@checkout** = optional at registration, required before the first paid registration · **O** = optional · **F2F** = required only for face-to-face registrations.

### 3.1 Identity & contact
| Field | Rule | Purpose | Validation / notes |
|---|---|---|---|
| Email | M, read-only | Login identifier; receipts; joining details | Unique; lower-cased |
| **Legal full name (as on ID)** | M | Certificate; attendance evidence | 2–200 chars; replaces today's single "name" for certificate purposes |
| Preferred / display name | O | Greeting, badge | ≤ 100 |
| **Mobile number** | M@checkout | Joining details, day-of contact | E.164 with country code; one number |
| **Country** | M | Pricing region (PK/MY/other), tax, compliance | **ISO 3166-1 dropdown** (replaces today's free text — fixes the pricing-region matching flagged in M4) |
| City / state | O | Face-to-face logistics, reporting | ≤ 100 each |
| Time zone | O (auto-filled from browser) | Live-online session times | IANA name |

### 3.2 Professional
| Field | Rule | Purpose | Validation / notes |
|---|---|---|---|
| Organisation / employer | O; **M for HRD Corp claim** | Invoicing, HRD Corp, cohort reporting | ≤ 200 |
| Job title | O | Tailoring examples, reporting | ≤ 120 |
| Industry | O | Reporting | Small fixed list (banking, energy, telecom, government, tech, education, other) |
| Years of experience | O | Tailoring | Band: 0–2, 3–5, 6–10, 10+ |
| LinkedIn URL | O | Community, alumni | URL on linkedin.com |

### 3.3 Certificate & compliance (sensitive)
| Field | Rule | Purpose | Validation / notes |
|---|---|---|---|
| **ID document type** | M@checkout | Certificate; HRD Corp | `nric` \| `passport` |
| **ID number** | M@checkout | Certificate name match; HRD Corp evidence | NRIC 12 digits; passport 6–12 alphanumerics. **Encrypted at rest**; UI shows last 4 only; re-entry to change |
| Nationality | M@checkout | Passport context; HRD Corp | ISO country |
| Date of birth | **O — founder to decide (§7)** | Some certificate bodies print it; HRD Corp does not require it | Only if a purpose is confirmed |

### 3.4 Delivery needs (face-to-face)
| Field | Rule | Purpose | Notes |
|---|---|---|---|
| Dietary requirements | O, F2F | Catering | Free text ≤ 200; **sensitive** (may reveal religion/health) → explicit consent line |
| Accessibility needs | O, F2F | Venue arrangements | Free text ≤ 300; sensitive → explicit consent line |
| Emergency contact name + phone | F2F | Duty of care on site | Asked at F2F checkout only |

### 3.5 Preferences & consent
| Field | Rule | Purpose |
|---|---|---|
| Marketing consent (opt-in) | O | PDPA-compliant marketing; default off |
| How did you hear about us | O | Attribution |

### 3.6 Deliberately NOT proposed
Gender · religion · race · photo · home address (invoices use organisation/billing details at M8; a home address has no current purpose) · payment details (Stripe holds them) · social logins.

## 4. Where each field is asked (progressive)

| Moment | Fields |
|---|---|
| Registration (unchanged) | legal name (today's "Full name"), email, password, country |
| First checkout (before "Pay with Stripe") | mobile, ID type + number, nationality; for F2F dates also emergency contact; optional dietary/accessibility with consent |
| Profile page, any time | everything above plus professional and preference fields; completeness indicator |
| HRD Corp claim (M8, when the organisation is registered) | employer details confirmed |

## 5. Proposed schema (Rule 1 — every column; nothing dropped)

**New table `user_profiles`** (1:1 with `users`; keeps the identity row minimal and lets the sensitive columns be governed separately):

`user_id uuid PK → users.id (restrict)` · `legal_name text` · `display_name text?` · `phone_e164 text?` · `country_code char(2)?` · `city text?` · `state text?` · `timezone text?` · `organisation text?` · `job_title text?` · `industry text?` · `experience_band text?` · `linkedin_url text?` · `id_type id_document_type?` (enum `nric · passport`) · `id_number_ciphertext text?` · `id_number_last4 text?` · `nationality_code char(2)?` · `date_of_birth date?` (only if §7.2 says yes) · `dietary_requirements text?` · `accessibility_needs text?` · `sensitive_consent_at timestamptz?` · `emergency_contact_name text?` · `emergency_contact_phone text?` · `marketing_consent_at timestamptz?` · `heard_about text?` · `completed_at timestamptz?` · `created_at` · `updated_at`.

**`users`:** unchanged now. `users.name` continues to feed the display name; `legal_name` is seeded from it on first profile save. `users.country` (free text) stays until every profile has `country_code`, then is retired in a later, separately approved migration (no destructive change here).

**Pricing region** (`commerce/pricing.ts`) reads `country_code` when present, falling back to the free-text country.

**Encryption:** AES-256-GCM at application level with `PROFILE_ENCRYPTION_KEY` from the environment/secret store (ADR-030); rotation by re-encrypting rows. No new dependency (Node `crypto`).

**Audit:** `profile.updated` records *which* fields changed; for ID number only "changed" and the new last-4 — never the number.

**Data-subject rights (C20, M5):** export includes profile fields; ID number exported masked unless explicitly requested; deletion honours financial-record retention.

## 6. Page design (`/account/profile`)

Sections in the order above; each optional field states its purpose in its hint; sensitive fields sit in their own card with the consent sentence; a "Profile completeness" line at the top ("3 details needed before you can register: mobile, ID, nationality"); country and nationality as searchable dropdowns; phone with country-code prefix; ID number masked after save with a "Change" action; save via server action with per-field errors; axe-clean.

## 7. Decisions needed from the founder

| # | Question | Recommendation |
|---|---|---|
| 1 | Collect **national ID / passport number** at all in MVP 1? It is the highest-risk data the portal would hold. | **Yes, but only at first paid registration**, encrypted, masked — because certificates and HRD Corp evidence need it |
| 2 | **Date of birth** — needed for anything you issue or claim? | **No** unless a certificate or HRD Corp rule requires it |
| 3 | **Mobile number** mandatory before paying? | **Yes** — joining details and day-of contact |
| 4 | Emergency contact and dietary/accessibility for **face-to-face** dates? | **Yes**, F2F only, with an explicit consent line for the sensitive two |
| 5 | Organisation / job title mandatory or optional? | Optional; mandatory only when an HRD Corp claim is requested (M8) |
| 6 | Keep email immutable until an email provider exists? | Yes |
| 7 | Any field the founder wants added or removed from §3? | — |

**On agreement** this record becomes the Milestone 5a execution plan: migration `user_profiles`, encryption helper + key, profile page rewrite, checkout "complete your details" step, pricing by `country_code`, tests (unit for validation/encryption, integration for masking/audit, e2e for the progressive flow, axe), and a data-export note.
