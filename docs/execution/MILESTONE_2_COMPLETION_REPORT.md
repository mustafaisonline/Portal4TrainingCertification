# Milestone 2 — "Identity & Access" · Completion Report

> **Status: IMPLEMENTED · TESTED — all thirteen verification criteria pass** · 2026-09-21
> **Executed under:** founder direction of 2026-09-21 (*"go ahead and implement the production ready product"*) and the defaults posted at the start (`WIREFRAME_TO_PRODUCTION_PLAN.md` §0.1). **Scope acceptance and ADR-006 B1/B2/B3 await the founder's ratification** — see §9.
> **Plan executed:** [`MILESTONE_2_EXECUTION_PLAN.md`](MILESTONE_2_EXECUTION_PLAN.md).
> **Branch:** `feat/production-foundation` · not pushed · nothing on `main`.
> Standard format per `AI_DEVELOPMENT_GUARDRAILS.md` §44.

---

## 1. Requested task

Deliver real identity and access for the portal: account creation, email verification, sign-in, sign-out, password reset, roles held in our own database, admin two-factor authentication, server-side gates on `/account/*` and `/admin/*`, and an audit trail — retiring the wireframe's simulated sign-in.

## 2. Understanding / scope

Exactly the plan's §2. The authentication provider decision (ADR-006) is still **PENDING**; the plan executed the documented **recommendation** — Better Auth — with its conditions 1–3 enforced in code and 4–5 recorded as commitments, because the founder's blanket direction plus §0.1 default 1 authorised proceeding on the recommendation. The identity-mapping pattern makes that choice cheap to reverse.

Out of scope and untouched: social sign-in, organisations, profile editing, PDPA export/delete, admin operations, a real email provider, passkeys, SSO.

## 3. Changes made

### 3.1 Schema (Rule 1 record) — migration `20260921012812_identity_and_access`

Twelve tables and three enum types, exactly as plan §5 (as-built notes are in the plan): `auth_users` · `auth_sessions` · `auth_accounts` · `auth_verifications` · `auth_two_factors` · `auth_rate_limits` (Better Auth's, renamed with the `auth_` prefix) · `users` · `auth_identities` · `user_roles` · `audit_log` · `outbound_emails` · `consents` (ours). Forward-only; no existing table changed; `domains` untouched. Verified with `\d` on both databases.

### 3.2 Dependency (Rule 5 record)

`better-auth` **1.7.5** (MIT), pinned. Nothing else. Its Prisma adapter is a transitive package imported as `better-auth/adapters/prisma`.

### 3.3 Files

| Area | Files |
|---|---|
| Identity module | `src/modules/identity/auth.ts` (provider config: surface, hooks, rate limits) · `auth-client.ts` · `session.ts` (`getCurrentUser`, `requireUser`, `authorise`) · `users.repository.ts` (mapping pattern) · `roles.repository.ts` (scoped RBAC) · `legal-documents.ts` (consent gate) · `emails.ts` · `components/AccountControls.tsx` |
| Platform | `src/modules/platform/audit/repository.ts` (insert-only) · `src/modules/notifications/email.ts` (outbox + transports) · `src/db/prisma.ts` (`Tx`, `withTransaction`) |
| Routes | `app/api/auth/[...all]/route.ts` · `app/(auth)/{layout,register,verify-email,sign-in,sign-in/two-factor,forgot-password,reset-password,sign-out}` · `app/account/{layout,page}` · `app/account/security/mfa` · `app/admin/{layout,page}` · `app/forbidden.tsx` · `app/not-found.tsx` |
| Shared (ported structure) | `src/shared/chrome/AuthScreen.tsx` · `AccountFrame.tsx` · `src/shared/ui/forms.tsx` · `src/shared/util/return-to.ts` |
| Ops | `scripts/grant-admin.ts` (`npm run admin:grant -- <email>`) · `.env.example` (three new names) · `next.config.ts` (`authInterrupts` for a real 403) · `app/layout.tsx` (theme script via `next/script`) |
| Tests | `tests/integration/identity.test.ts` (13) · `tests/e2e/identity.spec.ts` (6) · `tests/unit/{return-to,legal-documents,totp}.test.ts` (10) · `tests/helpers/{identity-db,totp}.ts` · CI/Playwright/Vitest env for the consent gate and secret |
| Governance | plan · this report · `README.md` · `PROJECT_PLAN_WBS.md` 4.2.2 · `BACKEND_HANDOFF_INDEX.md` §3 (five rows retired) · ADR-006 and ADR-015 execution notes |

### 3.4 How the design commitments were met

| Commitment (plan §6) | Where |
|---|---|
| Minimum plugin surface | `auth.ts` — `emailAndPassword`, `twoFactor`, `nextCookies` only |
| Mapping in one transaction; no half-registered person | `databaseHooks.user.create.after` → `createRegisteredIdentity(tx, …)`; on failure the provider row is deleted and the request fails — tested |
| One server-side answer to "who is this" | `session.ts`; no route imports the provider's session shape |
| Roles from our DB only | `roles.repository.ts`; `authorise()` never reads a provider claim |
| Consent gate on the endpoint | `hooks.before` on `/sign-up/email`: closed without `LEGAL_DOCUMENT_VERSIONS`, refused without `consent: true` — tested by direct POST |
| Enumeration-safe | neutral 401; repeat sign-up answers 200 and creates nothing; reset request 200 for unknown addresses — tested |
| Restart-safe rate limits | `auth_rate_limits` table; 6th sign-in in 60 s → 429 — tested |
| Admin MFA | `authorise("platform_admin")` → `mfa-required` unless `two_factor_enabled` — tested |
| Email behind an interface, nothing sent without a row | `notifications/email.ts`; links never logged; tests read them from `outbound_emails` |

## 4. What was not changed

`project-artifacts/mockup/` (untouched; its demo files are now *recorded* as retired, not deleted — retirement happens at M10). The specifications, `DR-02`, `AI_DEVELOPMENT_GUARDRAILS.md`, `CLAUDE.md` governance text. No push; no `main`; no external account; no secret committed (`.env.local` is ignored; the secret was generated locally). ADR statuses were **not** changed — execution notes were appended.

## 5. Testing

| Layer | What | Result |
|---|---|---|
| Type | `tsc --noEmit` | clean |
| Unit | return-to validator (4) · consent-gate parser (2) · TOTP helper vs RFC 4226/6238 vectors (3) · tokens, nav, boundaries (10) | 19 / 19 |
| Integration (real PostgreSQL, through Better Auth's HTTP handler) | registration rows and audit; consent refused; registration closed; **mapping rollback**; short/duplicate password; unverified sign-in refused → verify from emailed link; neutral 401 ×5 then 429; sign-out deletes the session row; reset link once, revokes sessions, audited; unknown-address reset indistinguishable; roles grant/revoke/re-grant + audit; scope semantics; **full 2FA** (enable → verify → sign-in needs code → backup code once → disable audited) | 13 / 13 |
| E2E (Playwright, real screens) | register → verify → account shows our identity/role; sign-out + redirect with return path; neutral error + off-site `return-to` ignored; password reset from the emailed link; **admin gate**: participant → **HTTP 403**, admin without MFA → enrol, enrol with a computed TOTP, `/admin` served, next sign-in demands the code; axe on register, sign-in, forgot-password, account, MFA | 6 / 6 (+4 M1) |
| Accessibility | `@axe-core/playwright`, WCAG 2.0/2.1/2.2 A+AA | 0 violations on every screen tested |
| Build | `next build` | clean, 14 routes |
| Manual (browser, `localhost:3100`, dev DB) | register → verify → account; MFA enrolment started (secret issued, not verified); **server process stopped and restarted** → still signed in on `/account`; MFA still off and enrolment restarts cleanly; `/admin` → 403 page | ✅ criterion 12 |

## 6. Results — the thirteen criteria (plan §8)

| # | Criterion | Result |
|---|---|---|
| 1 | Migration clean; tables/columns match §5 | ✅ |
| 2 | Registration creates every row — or none on mapping failure | ✅ both branches tested |
| 3 | Sign-in refused before verification; verification sets `email_verified_at` + audit | ✅ |
| 4 | Neutral error; 6th attempt in 60 s → 429 | ✅ |
| 5 | `/account` unauthenticated → sign-in with return path; off-site return ignored | ✅ |
| 6 | Sign-out deletes the session row; cookie dead | ✅ |
| 7 | Reset link once; other sessions revoked; audited | ✅ |
| 8 | `/admin`: participant 403 · admin without MFA → enrol · with MFA served; roles from `user_roles` | ✅ |
| 9 | MFA enrol / require / backup once / disable audited | ✅ |
| 10 | Grep proof: no `auth_*` or generated-client import outside `src/db` + identity; no browser storage for identity | ✅ (`tests/unit/boundaries.test.ts` + review) |
| 11 | axe clean on all identity screens | ✅ |
| 12 | Restart test: session survives; half-enrolled MFA is not enabled and restarts cleanly | ✅ manual, above |
| 13 | `tsc` · Vitest 39/39 · Playwright 10/10 · `next build` | ✅ |

## 7. Documentation updated

Plan (as-built notes, status) · this report · `docs/execution/README.md` (§3 index, §4 status) · `PROJECT_PLAN_WBS.md` (4.2.2, 4.2.2a–c) · `BACKEND_HANDOFF_INDEX.md` §3.1/§3.2 (five simulation rows marked retired) · `ARCHITECTURE_DECISION_REGISTER.md` (execution notes under ADR-006 and ADR-015; statuses unchanged) · `.env.example`.

## 8. Risks, observations and deviations

1. **ADR-006 executed on the recommendation, not an approval.** Conditions 1–3 are in code; **condition 4 (prompt patching) is an operational commitment the founder must own** — subscribe to Better Auth's advisory feed; **condition 5** (re-evaluate before public launch) is due at M9.
2. **Registration is closed in any environment that does not set `LEGAL_DOCUMENT_VERSIONS`.** That is deliberate: no name or email is stored without a published privacy notice (G0-13). Local `.env.local` carries a dev-only value. **Production stays closed until the founder publishes the Terms and Privacy policy** and names their versions.
3. **The `/terms` and `/privacy` links on the register form point at pages that do not exist yet** (legal pages are M10; public pages M3). Same for the header's public nav. Both are known and listed for M3/M10, not defects of this milestone.
4. **No QR code for MFA enrolment** — the secret is shown as text plus an `otpauth://` link; a QR image needs a dependency (like D15's question for certificates). Works with every authenticator app via manual entry.
5. **`sendVerificationEmail` / `sendResetPassword` are not awaited** (timing-safe responses per Better Auth's guidance). A failure is recorded on the `outbound_emails` row (`failed`, `last_error`), not raised to the user — the M3+ jobs table should drain `failed` rows.
6. **Rate-limit counters are per client key (IP).** Behind a proxy/CDN the real client IP header must be configured (Better Auth `advanced.ipAddress.ipAddressHeaders`) at deployment — flagged for M9.
7. **Better Auth's own `auth_two_factors` has three columns beyond the plan's first draft** (`verified`, `failed_verification_count`, `locked_until`) and `auth_users` carries `country` as an input carrier; both recorded in the plan as built. Role and scope are PostgreSQL enums rather than text + CHECK.
8. **`next.config.ts` enables `experimental.authInterrupts`** so a signed-in user without the role receives a real HTTP 403 rather than a redirect. It is a Next.js flag, not a new technology; if it is ever withdrawn the fallback is a redirect to `/account`.
9. **CI workflow still unexercised** (nothing pushed).
10. **Dev-only console notice** — React logs "Encountered a script tag while rendering React component" once when a client-side navigation re-renders the root layout (the theme no-flash script). Moving the script to `next/script` `beforeInteractive` did not silence it in development; production output is unaffected and the theme applies before paint. Cosmetic; left as is.

## 9. Human decisions required

| # | Decision | Default taken | Reversible? |
|---|---|---|---|
| 1 | **ADR-006 B1/B2/B3** — ratify Better Auth and conditions 1–5, or choose Clerk | Better Auth | Yes — mapping pattern; `auth_*` tables and `src/modules/identity/auth.ts` are the blast radius |
| 2 | **OQ-14 / G0-4** admin MFA mandatory | Yes | One flag in `session.ts` |
| 3 | Password minimum | 12 characters | `auth.ts` + two forms |
| 4 | Registration closed until legal documents are published | Closed | Set `LEGAL_DOCUMENT_VERSIONS` when B1/B2 are published |
| 5 | Roles at launch and the first `platform_admin` | Five roles; grant via `npm run admin:grant -- <email>` after the founder registers | Add `finance` later (AD-1) |
| 6 | **ADR-015** email provider (Resend recommended) + sending domain (OQ-3) | None wired; `log` transport | Add one transport class; no schema change |

**Completion status:** Implemented · **Tested** (all layers; 13 / 13 criteria) · Partially tested: none · Blocked: none · **Requires human validation:** the six ratifications above, and condition 4's operational commitment.
