# Security Checklist — pre-launch review

> **Status: DRAFT 2026-09-23 (Milestone 9 §2 item 8).** Walk this list before the first production deploy and after any change touching authentication, authorization, payments, personal data or headers. Each row maps to a section of [`../architecture/SECURITY_ARCHITECTURE.md`](../architecture/SECURITY_ARCHITECTURE.md) and names where the control lives in code. State: **Built** (exists and is tested), **Operator** (a step the founder performs at deploy), **Open** (decision or work outstanding).

| # | Security Arch § | Control | Where | State | How to verify |
|---|---|---|---|---|---|
| 1 | §3 Authentication | Email + password with verification; Better Auth sessions in `auth_sessions`; password reset by single-use token | `src/modules/identity/auth.ts` | Built | `tests/integration/identity.test.ts`, `tests/e2e/identity.spec.ts` |
| 2 | §3 | Sign-up, sign-in, reset, enquiry, review and verify-search rate limits **in the database** | `auth_rate_limits`, module repositories | Built | `restart-resilience.test.ts` reads a counter through a fresh client |
| 3 | §3 | Optional TOTP second factor | `/account/security` | Built | e2e identity |
| 4 | §4 Authorization | Roles in `user_roles`; server-side gates (`requireUser`, `requireRole`) before render; `forbidden()` returns a real 403 | `src/modules/identity/session.ts`, `app/forbidden.tsx` | Built | e2e "participant refused on admin paths" |
| 5 | §4 | The photo route serves only the caller's own photo; review photos only when public and consented | `app/api/me/photo`, `app/api/reviews/[id]/photo` | Built | integration profile/reviews |
| 6 | §5 Data protection | ID-document number AES-256-GCM at rest; last-4 only in UI; key per environment | `profile-crypto.ts`; `PROFILE_ENCRYPTION_KEY` validated (32 bytes) at start | Built | `tests/unit/profile-crypto.test.ts`, `env-config.test.ts` |
| 7 | §5 | Public verification shows only the R-V2 field set; `noindex`; `no-store` | `verify/[id]/page.tsx`; `next.config.ts` headers | Built | certificates tests; `readiness.spec.ts` |
| 8 | §5 | Audit snapshots carry ids and flags, never emails or ID fields | `writeAudit` callers | Built | code review per PR |
| 9 | §6 Transport | HTTPS only; HSTS 2 years incl. subdomains in production | host TLS; `next.config.ts` (`NODE_ENV=production`) | Built + Operator | `curl -sI https://<domain>/ \| grep -i strict` after deploy |
| 10 | §6 | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy` on every response | `next.config.ts` | Built | `readiness.spec.ts` |
| 11 | §6 | `Cache-Control: no-store` on `/verify/:id`, `/account/*`, `/admin/*`, `/api/*` (photo routes keep their own private/public caching) | `next.config.ts` | Built | `readiness.spec.ts`; `curl -sI` on a signed-in page |
| 12 | §6 | Content-Security-Policy | — | **Open — J8** | Ship `Content-Security-Policy-Report-Only` on staging first; Tailwind and Stripe redirects need a tested policy |
| 13 | §7 Payments | Stripe holds card data; we store ids, amounts, statuses; webhook signature verified over raw bytes; every event stored before processing; idempotent | `webhook.service.ts`, `stripe.ts` | Built | `commerce.test.ts` (official test-header signer) |
| 14 | §7 | Live keys only in the production store; **rotate the test key pasted in chat** | Stripe Dashboard | **Operator — J9** | key id differs from the pasted one |
| 15 | §8 Audit | Credential, payment, roster, profile, review and admin mutations write `audit_log` in the same transaction; insert-only | `src/modules/platform/audit` | Built | integration tests assert rows |
| 16 | §9 Secrets | `.env.example` names only; `.gitignore` excludes `.env*`; `.dockerignore` excludes `.env*`; validator messages never include values; email `log` transport never logs bodies | repo root; `src/config/env.ts`; `email.ts` | Built | `git ls-files \| grep -c '^\.env' ` → 1 (`.env.example`); `env-config.test.ts` "never echoes the value" |
| 17 | §9 | Per-environment secrets; rotation without code change | host secret store | Operator | MONITORING_AND_INCIDENTS §4.6 |
| 18 | §9 | Error pages show a correlation id, never a message or stack in production | `app/error.tsx`, `app/global-error.tsx` | Built | render check by the orchestrator; `NODE_ENV` gate in code |
| 19 | §10 Boundaries | Fail-fast: production refuses to start half-configured | `instrumentation.ts` | Built | start with a variable missing → `[config] refusing to start` |
| 20 | §10 | Health endpoint reveals no secret, no user data, no connection string | `src/config/health.ts` | Built | `health-route.test.ts` asserts the exact key set |
| 21 | §10 | Robots disallow private areas; nothing indexable until cutover | `app/robots.ts`; `app/layout.tsx` metadata | Built | `readiness.spec.ts`; lift `index:false` only at M10 |
| 22 | §11 Residency | No production data infrastructure before ADR-032 is answered | — | **Open — J1** | DEPLOYMENT_RUNBOOK §1 |
| 23 | §12 Dependencies | `npm audit` clean or triaged; no new dependency without approval (Rule 5) | `package.json` | Operator | `npm audit --omit=dev` before each release |
| 24 | Data Arch §7 | Retention schedule; account deletion vs credential permanence (OQ-12) | — | **Open — J7 / WBS 7.11–7.12** | founder decision |
| 25 | Backups | Dumps contain personal data — encrypted at rest, access-controlled, deleted on schedule | BACKUP_AND_RESTORE §3.2 | Operator | storage location reviewed |
| 26 | Container | Non-root user; production deps only; no `.env` in the image; `HEALTHCHECK` | `Dockerfile`, `.dockerignore` | Built (image **unbuilt**) | `docker run --rm p4tc-portal id` → `uid=100(portal)` (after the first build) |

## Before go-live, confirm in writing
- [ ] Rows 9, 14, 17, 23, 25 performed for production
- [ ] Rows 12, 22, 24 decided or explicitly deferred by the founder
- [ ] `npm run test` and `npm run test:e2e` green on the release commit (RELEASE_GATE)
