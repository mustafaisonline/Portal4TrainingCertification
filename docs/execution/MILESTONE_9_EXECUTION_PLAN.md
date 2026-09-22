# Milestone 9 — "Production readiness" · Execution Plan

> **Status: ✅ EXECUTED 2026-09-23 (code and runbooks, §2) · ⛔ §4 decisions and all provisioning REQUIRE THE FOUNDER** — see [`MILESTONE_9_COMPLETION_REPORT.md`](MILESTONE_9_COMPLETION_REPORT.md). Nothing is provisioned, purchased or deployed.
> **Roadmap origin:** [`WIREFRAME_TO_PRODUCTION_PLAN.md`](WIREFRAME_TO_PRODUCTION_PLAN.md) §7 row M9 = [`PROJECT_PLAN_WBS.md`](PROJECT_PLAN_WBS.md) Phase 7 (7.1–7.13); [`DEPLOYMENT_ARCHITECTURE.md`](../architecture/DEPLOYMENT_ARCHITECTURE.md), [`SECURITY_ARCHITECTURE.md`](../architecture/SECURITY_ARCHITECTURE.md), [`TESTING_ARCHITECTURE.md`](../architecture/TESTING_ARCHITECTURE.md) §6.

## 1. What exists
A Next.js server application at the repository root; PostgreSQL via Prisma with forward-only migrations applied deliberately (`npm run db:deploy`); secrets by environment variable with `.env.example` as the name list; Better Auth sessions; DB-backed rate limits for sign-up, enquiries, reviews, verification search; Stripe webhook signature verification and an event log; audit log; a `log` email transport; styled 404 and 403 pages; a Docker Compose file for the local database. **Missing:** a health endpoint, security headers, fail-fast configuration validation, styled 500 pages, robots and sitemap, backup and restore scripts, runbooks, a release gate statement, and every production account.

## 2. Scope (built now)
1. **Health** — `GET /api/health`: database round-trip, the name of the latest applied migration, application version (from `package.json`) and a UTC timestamp; `200` or `503`; no secrets, no user data; `Cache-Control: no-store`. This is the uptime-check target; the second uptime target is `/verify` (WBS 7.7).
2. **Security headers** (`next.config.ts` `headers()`): `Strict-Transport-Security` (production only), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` (camera, microphone, geolocation, payment off), `Cache-Control: no-store` on `/verify/:id`, `/account/*`, `/admin/*`, `/api/*`. A Content-Security-Policy is **not** set yet (Tailwind inline styles and Stripe redirects need a tested policy) — listed in §4.
3. **Configuration validation** — `src/config/env.ts` read once at start-up through `instrumentation.ts`: in production every required variable must be present and well-formed (`DATABASE_URL`, `BETTER_AUTH_SECRET` ≥ 32 chars, `APP_BASE_URL` https, `PROFILE_ENCRYPTION_KEY`, `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` when payments are on, `LEGAL_DOCUMENT_VERSIONS`, `JOBS_SECRET`, `EMAIL_TRANSPORT`), the process refuses to start otherwise; in development a clear warning names what is missing. Values are never logged.
4. **Error pages** — `app/error.tsx` and `app/global-error.tsx` in the portal's design, with a correlation id shown to the person and logged server-side, never a stack trace.
5. **Crawling** — `app/robots.ts` (allow public pages; disallow `/account`, `/admin`, `/api`, `/checkout`, `/sign-in`, `/register`; the certificate pages already carry `noindex`) and `app/sitemap.ts` (public navigation pages and published programme pages, from the database).
6. **Backups and restore** — `scripts/backup.sh` (`pg_dump` custom format, dated file, checksum) and `scripts/restore-rehearsal.sh` (restores a dump into a scratch database, runs `prisma migrate status`, compares row counts for every business table, prints a pass/fail) — plain shell over tools already installed with PostgreSQL; the runbook explains the managed-host equivalents (PITR).
7. **Container image** — `Dockerfile` (multi-stage, Next.js standalone output, non-root user, `HEALTHCHECK` on `/api/health`) and `.dockerignore`, so "a single container on a managed host" (one of the two ADR-016 options) is a build away; Vercel needs none of this and is unaffected.
8. **Runbooks** under `docs/operations/`: `DEPLOYMENT_RUNBOOK.md` (both hosting options step by step, environment variables, migrations, Stripe production webhook, scheduler for the reminders endpoint, first-deploy checklist), `BACKUP_AND_RESTORE.md` (RPO/RTO placeholders for OQ-10, schedules, the rehearsal), `MONITORING_AND_INCIDENTS.md` (uptime targets, log fields, what to do when the webhook fails, when the database is unreachable, when Stripe is degraded), `SECURITY_CHECKLIST.md` (pre-launch review list mapped to SECURITY_ARCHITECTURE), `RELEASE_GATE.md` (proposal for OQ-18: the full Vitest + Playwright set before every production deploy).
9. **Restart resilience as an executable test** (Testing Arch §6): an integration test that, using only a fresh database connection, proves the critical state is in the database — fee in force, certificate status inputs, pending order holds, rate-limit counters, outbox rows — with nothing read from process memory.
10. **Tests** — health route (200, 503 when the DB is unreachable via an injected client), headers present on a public and an account response, robots and sitemap contents, env validation (missing / malformed / complete).

## 3. Defaults taken
| # | Default | Why |
|---|---|---|
| H1 | Health endpoint is public and unauthenticated but reveals nothing beyond up/down, migration name and version | Uptime services cannot hold secrets |
| H2 | Security headers without CSP | A wrong CSP breaks payments and styling silently; needs a report-only phase (§4) |
| H3 | Container image included though hosting is undecided | Costs nothing, keeps both ADR-016 options equally ready |

## 4. ⛔ Founder decisions and actions (nothing below is done by this milestone)
| # | Decision | Recommendation under AP-12 (free-first) |
|---|---|---|
| J1 | **Data residency** (ADR-032, WBS 7.1) — is Malaysian residency required by law, contract or preference? | Verify the seven inputs listed in the ADR; if none binds, **Singapore region** (nearest to Malaysia on every major provider) |
| J2 | **Hosting** (ADR-016) | **Vercel Pro** (Hobby is non-commercial) *or* a **single container on Fly.io / Railway / a small VPS** with the provided Dockerfile. Recommendation: Vercel for the fastest first deployment; revisit if evidence-pack generation later needs long-running work |
| J3 | **Production PostgreSQL** (ADR-005a) | **Neon** (Singapore, free tier to start, PITR on paid) or **Supabase** (Singapore). Recommendation: Neon with the pooled connection string for a serverless host |
| J4 | **Domain and email sending domain** (WBS 7.8, 7.9) | One apex domain for the portal; `/verify` stays on it (ADR-039); SPF/DKIM/DMARC before the first real email |
| J5 | **Email provider** (ADR-015) | **Resend** free tier to start; the transport interface already exists |
| J6 | **Release gate** (OQ-18) | Full Vitest + Playwright before every production deploy (`RELEASE_GATE.md`) |
| J7 | **RPO / RTO** (OQ-10) and **retention periods** (7.11) | Placeholders in the runbook: RPO 24 h (daily dump) until PITR is on, RTO 4 h; retention as Data Arch §7.1 assumptions pending decision |
| J8 | **Content-Security-Policy** | Ship report-only first on staging; enforce after one clean week |
| J9 | **Stripe production** | Activate the live account, add the production webhook endpoint, rotate the test key that was pasted in chat |

## 5. Verification criteria
1 `/api/health` 200 with DB up, 503 with DB down · 2 headers present on `/`, `/account`, `/verify/<id>` (no-store) · 3 missing `BETTER_AUTH_SECRET` in production mode refuses to start; dev warns · 4 error page renders without a stack, with a correlation id · 5 robots disallows the private areas; sitemap lists published pages only · 6 backup script produces a restorable dump and the rehearsal script reports pass on the dev database · 7 Docker image builds and answers `/api/health` locally (if Docker is available on the machine; otherwise recorded as untested) · 8 restart-resilience test passes · 9 tsc · Vitest · Playwright · build.
