# Milestone 2 — "Identity & Access" · Execution Plan

> **Status:** ✅ **EXECUTED 2026-09-21 — 13 / 13 criteria pass** ([`MILESTONE_2_COMPLETION_REPORT.md`](MILESTONE_2_COMPLETION_REPORT.md)), under the founder's blanket direction of the same day (*"go ahead and implement the production ready product … if you need any clarifications, ask in the start"*) and the defaults posted at the start (`WIREFRAME_TO_PRODUCTION_PLAN.md` §0.1 — notably **default 1: Better Auth**). Scope acceptance by the founder is therefore **pending ratification on return**; every reversible choice below is listed in §10 for that purpose.
> **Created:** 2026-09-21 · **Roadmap row:** `WIREFRAME_TO_PRODUCTION_PLAN.md` §7 M2 · **WBS:** Track B, Milestone 2.
> **Depends on:** Milestone 1 ✅ (foundation) and M1b ✅ (tokens, primitives, chrome).

---

## 1. Objective

> Real identity: a person can create an account, verify their email, sign in, reset a password and sign out; the portal knows who they are on the **server**, what roles they hold from **our** database, and refuses `/account/*` and `/admin/*` to anyone who is not entitled — with every identity mutation audited in the same transaction.

The mockup's simulated sign-in is retired. Nothing about *what a signed-in person can do* is built here beyond seeing their own account; that is M5 (participant) and M8 (admin).

## 2. Scope

**In scope**

| # | Item | Source |
|---|---|---|
| 1 | Better Auth (self-hosted, MIT) mounted at `/api/auth/*`; **email + password only**; sessions in our PostgreSQL | ADR-006 recommendation + §0.1 default 1; DECISION_B §B conditions 1–3 |
| 2 | **Identity-mapping pattern**: our `users` row is the business identity (own UUID); the provider's subject lives only in `auth_identities` | DECISION_B §B — condition 3, "mandatory" |
| 3 | `user_roles (user_id, role, scope_type, scope_id)` — the *only* authorisation source; Better Auth's organisation/roles features **not enabled** | ADR-020; condition 2 |
| 4 | Register → verification email → verify → sign in → sign out (server-side session revocation) → forgot / reset password | SECURITY_ARCHITECTURE §2; ACCOUNT reqs C1, §6 |
| 5 | **Admin MFA (TOTP + backup codes)**, enforced on `/admin/*`: a `platform_admin` without MFA is sent to enrol before anything else | OQ-14 / G0-4 recommendation "Yes"; ADMIN reqs AD-3 |
| 6 | Server-side gates: `requireUser()` / `requireRole()` guards in the identity module; `/account/*` and `/admin/*` layouts call them; never a client-only check | ADR-020 enforcement point; ACCOUNT reqs §6 |
| 7 | `audit_log` (insert-only) — every identity mutation here writes a row **in the same transaction** | ADR-022; AD-4 |
| 8 | Transactional email **behind an interface** with a durable `outbound_emails` record and a **log transport** only; provider adapters are stubs that refuse to start when selected without credentials | ADR-015 OPEN → §0.1 default 5; ADR-010 spirit (durable, visible, retryable) |
| 9 | Recorded **consent** at registration, keyed to a published document version — and **registration closed until the Terms and Privacy documents are published** (configuration, not code) | G0-13 (*"B2 is required the moment a form stores a name"*); §0.1 default 6; the mockup's `BlockedConsent` convention |
| 10 | Rate limiting on the auth endpoints, stored in the database (restart-safe) | ACCOUNT reqs §6 "locked/rate-limited"; Rule 6 |
| 11 | `return-to` after sign-in restricted to same-site paths | ACCOUNT reqs §6, C17 |
| 12 | Minimal signed-in landing (`/account`: who am I, verification and MFA status, sign out) and an `/admin` landing that proves the gate. **Screen structure only** from the mockup; no sample data | PORT list row 7 |
| 13 | A CLI to grant the first `platform_admin` (there is no admin UI until M8) | AD-D1: founder = Administrator |
| 14 | Retire the mockup's demo identity (`lib/demo*`, `SignInForm`, `SignInGate`, `AccountFrame` gate, `sessionStorage` keys) from the production path — they were never ported; this plan records them as *not to be ported* | NEVER-PORT list |

**Explicitly out of scope:** Google / social sign-in (needs the founder's OAuth client — default 5) · organisations and `org_admin` scoping data (M3/M8) · profile editing, PDPA export/delete (M5, C20) · any admin operation (M8) · a real email provider (needs an account and a sending domain — G0-8 / OQ-3) · passkeys · account linking · SSO/SCIM (deferred by ADR-006 context).

## 3. Approved decisions this milestone relies on

| Need | Decision | Status |
|---|---|---|
| Authentication provider | Better Auth, conditions 1–5 | **ADR-006 PENDING** → executed on §0.1 default 1; **B1/B2/B3 need the founder's ratification** |
| Authorisation model + enforcement point | Scoped RBAC in our DB, guards in the service layer | ADR-020 ✅ |
| Audit in-transaction, insert-only | | ADR-022 ✅ |
| No queue; durable state in tables | | ADR-010 ✅ |
| Secrets: env / platform store, `.env.example` names only | | ADR-030 ✅ |
| Email provider | Resend or Postmark | **ADR-015 OPEN** → interface + log transport only |
| Admin MFA in V1 | Recommended "Yes" | **OQ-14 / G0-4 open** → built as recommended |
| Testing layers | Vitest · Playwright · axe | ADR-025/038 ✅ |

## 4. RED-gate actions this plan requests (Rule 1, Rule 5)

| # | Action | Gate | Covered by |
|---|---|---|---|
| 4.1 | Install `better-auth` **1.7.5** (MIT) — pinned. No other new runtime dependency. (`@better-auth/prisma-adapter` is a transitive dependency of `better-auth`; the adapter is imported from `better-auth/adapters/prisma`.) | New dependency (auth) | §0.1 default 1 |
| 4.2 | **Schema — migration `identity_and_access`**, tables in §5 | Rule 1 | This plan; ratification pending |
| 4.3 | Two new environment variables: `BETTER_AUTH_SECRET`, `EMAIL_TRANSPORT`; optional `LEGAL_DOCUMENT_VERSIONS` | Config | ADR-030 |
| 4.4 | Bounded commits on `feat/production-foundation` | Repository | §0.1 default 4 |

**Not requested:** any external account, any email provider key, any hosting change, any change to `main`.

## 5. Proposed schema — every table, every column (Rule 1)

Naming: snake_case tables, `_id` suffixes, `timestamptz(6)`. UUIDs are generated by PostgreSQL where we own the row; Better Auth generates its own identifiers for the tables it owns (they are text, opaque, and confined to the `auth_*` tables by rule).

### 5.1 Tables Better Auth owns — `auth_*` (its core schema, renamed so the separation from business identity is visible in every query)

These are Better Auth's required tables (`user`, `session`, `account`, `verification`) plus the two the `twoFactor` plugin and database-backed rate limiting add. Columns follow its 1.7.x core schema exactly (generated by its CLI, then mapped); no business column is added to them.

| Table | Purpose | Columns |
|---|---|---|
| `auth_users` | Better Auth's user record — **authentication only, never referenced by a business table** | `id text PK` · `name text` · `email text unique` · `email_verified boolean` · `image text?` · `two_factor_enabled boolean?` · `country text?` *(input carrier for the registration form's Country field; copied to `users.country` by the mapping hook — as built)* · `created_at` · `updated_at` |
| `auth_sessions` | Server-side sessions; sign-out deletes the row | `id text PK` · `user_id → auth_users.id (cascade)` · `token text unique` · `expires_at` · `ip_address text?` · `user_agent text?` · `created_at` · `updated_at` |
| `auth_accounts` | One row per credential/provider per user; holds the **scrypt password hash** for email+password | `id text PK` · `user_id → auth_users.id (cascade)` · `account_id text` · `provider_id text` · `access_token?` · `refresh_token?` · `id_token?` · `access_token_expires_at?` · `refresh_token_expires_at?` · `scope?` · `password text?` · `created_at` · `updated_at` |
| `auth_verifications` | Email-verification and password-reset tokens | `id text PK` · `identifier text` · `value text` · `expires_at` · `created_at` · `updated_at` |
| `auth_two_factors` | TOTP secret + encrypted backup codes per user | `id text PK` · `user_id → auth_users.id (cascade)` · `secret text` · `backup_codes text` · `verified boolean?` · `failed_verification_count int?` · `locked_until timestamptz?` *(the last three are Better Auth 1.7.5's own columns, printed from its schema at build time — as built)* |
| `auth_rate_limits` | Sliding-window counters for the auth endpoints (restart-safe) | `id text PK` · `key text unique` · `count int` · `last_request bigint` |

### 5.2 Tables we own — business identity, authorisation, audit, email, consent

| Table | Purpose | Columns |
|---|---|---|
| `users` | **The business identity.** One person, one account (DATA_ARCHITECTURE §3.1). Immutable UUID that every future business table references | `id uuid PK default gen_random_uuid()` · `email text unique` (citext-free: stored lower-cased by the service) · `name text` · `country text?` · `email_verified_at timestamptz?` · `created_at` · `updated_at` |
| `auth_identities` | **The only place a provider subject appears** | `id uuid PK` · `user_id uuid → users.id (restrict)` · `provider text` (`"better-auth"`) · `provider_subject text` (= `auth_users.id`) · `created_at` · **unique** `(provider, provider_subject)` · **unique** `(user_id, provider)` |
| `user_roles` | Scoped RBAC — **never a role column on users** | `id uuid PK` · `user_id uuid → users.id (restrict)` · `role user_role_name` — a PostgreSQL enum type: `participant · expert · assessor · org_admin · platform_admin` (SECURITY_ARCHITECTURE §3.1; *as built: enum type rather than text + CHECK, so the database itself rejects an unknown role*) · `scope_type role_scope_type` — enum `platform · organisation · offering` · `scope_id uuid?` (null only for `platform`) · `granted_at` · `granted_by_user_id uuid?` · `revoked_at timestamptz?` · `revoked_by_user_id uuid?` · **unique** `(user_id, role, scope_type, scope_id)`. Revocation is a new state on the row, not a delete, so history is kept |
| `audit_log` | **Insert-only.** Actor, action, entity, before/after (ADR-022). Written in the same transaction as the change. No update or delete path exists in code | `id uuid PK` · `actor_user_id uuid?` (null = system) · `action text` (e.g. `user.registered`, `user.email_verified`, `role.granted`, `role.revoked`, `mfa.enabled`, `mfa.disabled`, `password.reset`, `consent.recorded`) · `entity_type text` · `entity_id text` · `before jsonb?` · `after jsonb?` · `reason text?` · `created_at` |
| `outbound_emails` | Durable record of every email the system decides to send — the thing a provider adapter later drains. Nothing is "sent" without a row | `id uuid PK` · `to_email text` · `template_key text` · `subject text` · `text_body text` · `status outbound_email_status` (enum `queued · sent · failed`) · `attempts int default 0` · `last_error text?` · `provider_message_id text?` · `created_at` · `sent_at?` |
| `consents` | Recorded acceptance of a **published** legal document version. Never written when no version is published | `id uuid PK` · `user_id uuid → users.id (restrict)` · `document_key text` (`terms · privacy`) · `document_version text` · `accepted_at` · **unique** `(user_id, document_key, document_version)` |

**Not created here:** `organisations`, `jobs` (ADR-010 — arrives with the first background job in M3/M4), profile fields beyond name/country.

**Forward-only. No destructive change.** `domains` is untouched.

## 6. Design commitments (recorded so review can hold them)

1. **Better Auth surface = `emailAndPassword` + `twoFactor` + `nextCookies`.** No `organization`, `admin`, `oidc-provider`, `api-key`, `magic-link`, `anonymous`, device-authorisation or SCIM plugins (condition 1). Telemetry disabled.
2. **Mapping, in one transaction, at registration.** A Better Auth `databaseHooks.user.create.after` hook creates `users` + `auth_identities` + `user_roles(participant, platform)` + `consents` + `audit_log` atomically. If that transaction fails, the Better Auth user is removed and the registration returns an error — no half-registered person.
3. **Every server read of "who is this" goes through `src/modules/identity/session.ts`** (`getCurrentUser()` → our `users` row + active roles; `requireUser()`, `requireRole()`), never through Better Auth's session object directly. Route code never queries `auth_*`.
4. **Password policy:** minimum **12** characters, maximum 128, scrypt (Better Auth default hash). *12 is a documented default, not a founder decision — §10.*
5. **Sessions:** 7 days, refreshed after 1 day of use; **no cookie cache** — sign-out and password reset revoke server-side and take effect immediately (`revokeSessionsOnPasswordReset: true`).
6. **Enumeration-safe:** registration with an existing email, sign-in failure and password-reset requests return the same neutral message; timing is not awaited on the email send.
7. **Rate limits (database-stored):** sign-in 5 / 60 s, sign-up 3 / 60 s, reset request 3 / 60 s, verification resend 3 / 60 s per client key.
8. **Admin MFA:** a user holding `platform_admin` reaches `/admin/*` only with `two_factor_enabled = true` and a session that passed 2FA; otherwise `/account/security/mfa` (enrol) is the only admin-area page served. Backup codes are shown once.
9. **Consent gate:** `LEGAL_DOCUMENT_VERSIONS` (JSON, e.g. `{"terms":"2026-10-01","privacy":"2026-10-01"}`) names the published versions. When absent, `/register` renders the consent control blocked with the reason and the submit disabled — **exactly the mockup's convention** — and the sign-up endpoint refuses. Tests run with the variable set.
10. **Email:** `EMAIL_TRANSPORT=log` (default, dev/test) writes the row and logs the message; `resend` / `postmark` throw at boot until their keys and G0-8 exist. Verification and reset links are read **from the database** in tests, never from logs.
11. **Nothing from `src/preview/`** is used on any identity path.

## 7. Deliverables

`src/modules/identity/` (auth config, session guards, users/roles/audit repositories, consent, email interface + log transport) · `app/api/auth/[...all]/route.ts` · `app/(auth)/{register,sign-in,forgot-password,reset-password,verify-email,sign-out}` · `app/account/{layout,page}`, `app/account/security/mfa` · `app/admin/{layout,page}` · migration + seed unchanged · `scripts/grant-admin.ts` · tests (unit, integration on real PostgreSQL, e2e + axe) · `.env.example` additions · `BACKEND_HANDOFF_INDEX.md` §3 rows marked retired · completion report.

## 8. Verification criteria — pass / fail

| # | Criterion |
|---|---|
| 1 | Migration applies cleanly on a fresh database; tables and columns match §5 exactly (`\d`) |
| 2 | Register → one row each in `auth_users`, `auth_accounts`, `users`, `auth_identities`, `user_roles(participant)`, `consents(terms, privacy)`, `outbound_emails(verify-email)`, `audit_log(user.registered)` — **or none of them** when the mapping transaction is forced to fail |
| 3 | Sign-in before verification is refused; after visiting the verification link, `users.email_verified_at` is set and an audit row exists |
| 4 | Wrong password → neutral error; 6th attempt in 60 s → 429 |
| 5 | `/account` unauthenticated → redirect to `/sign-in?return-to=/account`; `return-to=https://evil.example` is ignored |
| 6 | Sign-out deletes the `auth_sessions` row; the old cookie no longer opens `/account` |
| 7 | Reset password: link works once, all other sessions are revoked, audit row written |
| 8 | `/admin` as participant → 403 page; as `platform_admin` without MFA → redirected to enrol; with MFA → served. Roles are read from `user_roles`, not from anything Better Auth returns |
| 9 | MFA: enrol (TOTP verified), sign-in requires code, backup code works once, disable requires password and writes audit |
| 10 | Grep proof: no import of `auth_*` models or the generated client outside `src/db` and `src/modules/identity/**`; no `sessionStorage`/`localStorage` used for identity |
| 11 | axe: no WCAG 2.2 AA violations on register, sign-in, forgot-password, reset, MFA and account pages |
| 12 | **Restart test:** sign in → restart the app process → still signed in; enrol MFA half-way (secret issued, not verified) → restart → the account is *not* MFA-enabled and enrolment can restart cleanly |
| 13 | `npm test`, `npm run test:e2e`, `tsc`, `next build` all green; M1 suites still pass |

## 9. Mockup files this milestone retires (never ported)

`lib/demoSession.ts` · `lib/demoCredentials.ts` · `components/auth/SignInForm.tsx` · `components/auth/ClearDemoSession.tsx` · `components/account/SignInGate.tsx` · the gate branch of `components/account/AccountFrame.tsx` · `components/account/AccountMenu.tsx` (demo persona) · `sessionStorage` keys `mockup:demo-session`, `mockup:demo-return-to`. **Ported as structure only:** `components/auth/AuthScreen.tsx`, `FormParts.tsx` (`Field`, `PasswordField`, input class), the copy of `/sign-in`, `/register`, `/forgot-password`, `/sign-out`.

## 10. Decisions for the founder's return (each reversible)

| # | Decision taken by default | Alternative |
|---|---|---|
| 1 | **Better Auth** (B1 deviation, B2 provider, B3 conditions) | Clerk — the mapping pattern makes the swap a one-table rewrite |
| 2 | Admin **MFA mandatory** (OQ-14 "Yes") | Make optional — one flag |
| 3 | Password minimum **12** | 8 (Better Auth default) or higher |
| 4 | **Registration closed until legal documents are published** (`LEGAL_DOCUMENT_VERSIONS`) | Open registration with consent deferred — *not recommended*: PII collected without a privacy notice |
| 5 | Roles at launch: `participant · expert · assessor · org_admin · platform_admin`; founder = `platform_admin` via CLI | Add `finance` now (AD-1) |
| 6 | Email provider: none — log transport; **Resend** is the on-file recommendation when G0-8 is decided | Postmark |
