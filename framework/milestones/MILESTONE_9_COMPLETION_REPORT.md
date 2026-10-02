# Milestone 9 — "Production readiness" · Completion Report (DRAFT)

> **Status: IMPLEMENTED · TESTED · Docker image UNTESTED (no Docker on this machine)** · 2026-09-23
> **Executed on:** the founder's overnight instruction of 2026-09-22 and [`MILESTONE_9_EXECUTION_PLAN.md`](MILESTONE_9_EXECUTION_PLAN.md) §2 items 1–10. **§4 (J1–J9) was not touched: nothing was provisioned, purchased, signed up for or deployed.**
> **Branch:** `feat/production-foundation` · commit `83edf36` (with Milestone 10) · `64728c8` (plan) · not pushed.
> Built concurrently with M7/M8 by a separate agent under strict file ownership; no file owned by another milestone was edited.

## 1. Requested
Everything the first deployment needs the moment the founder's hosting, database, domain and email decisions are made: a health endpoint, security headers, fail-fast configuration validation, styled 500 pages, robots and sitemap, backup and restore scripts, a container image, operator runbooks, an executable restart-resilience test, and tests for all of it.

## 2. Delivered

| Plan item | What | Files |
|---|---|---|
| 1 Health | `GET /api/health` → `{status, db, migration, version, time}`; `SELECT 1` + newest applied `_prisma_migrations` row under a 3 s timeout; 200 / 503; `Cache-Control: no-store`; `force-dynamic`; `healthCheck(db?)` accepts an injected client for tests; version from `package.json` | `app/api/health/route.ts`, `src/config/health.ts` |
| 2 Security headers | `next.config.ts` `headers()`: nosniff, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` (camera/microphone/geolocation/payment off) on `/:path*`; HSTS `max-age=63072000; includeSubDomains` **only** under `NODE_ENV=production`; `Cache-Control: no-store` on `/verify/:id`, `/account/:path*`, `/admin/:path*`, `/api/:path*`; later, more specific rules restate `/api/me/photo` (`private, max-age=0, must-revalidate`) and `/api/reviews/:id/photo` (`public, max-age=3600`) so the config agrees with the route handlers (Next "last rule wins"). Existing options untouched. No CSP (default H2 → J8) | `next.config.ts` |
| 3 Config validation | `validateEnv(env, mode)` → `{ok, missing, invalid[{name,why}], warnings, mode}`; required always: `DATABASE_URL` (postgres scheme), `BETTER_AUTH_SECRET` ≥ 32, `APP_BASE_URL` (https in production), `PROFILE_ENCRYPTION_KEY` (base64 of 32 bytes, same rule as `profile-crypto.ts`), `EMAIL_TRANSPORT` ∈ log/resend/postmark; production adds `JOBS_SECRET` ≥ 16 and both Stripe values (`sk_live_`/`sk_test_` and `whsec_` prefixes checked; test key in production = warning); Stripe both-or-neither outside production; **`LEGAL_DOCUMENT_VERSIONS` absent = warning, never fatal** (registration deliberately closed is a supported launch state); set-but-malformed = invalid. Messages never contain values. `instrumentation.ts` `register()` (Node runtime only): production + not ok → throw (server refuses to start); otherwise one `console.warn` line | `src/config/env.ts`, `instrumentation.ts` |
| 4 Error pages | `app/error.tsx` (client) and `app/global-error.tsx` (own `<html><body>`, imports `globals.css`): "Something went wrong", correlation id = `error.digest` or a 12-hex random id generated once, "Try again" (`retry()` — the Next 16 prop) and "Home"; `error.message` rendered in development only; no stack ever. Same classes as `not-found.tsx` | `app/error.tsx`, `app/global-error.tsx` |
| 5 Crawling | `robots.ts`: allow `/`; disallow `/account`, `/admin`, `/api`, `/checkout`, `/sign-in`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/sign-out`; sitemap URL from `APP_BASE_URL`. `sitemap.ts`: `primaryNav` + `footerExplore` + `footerLegal` hrefs (deduplicated, from `site-nav.ts`) + `/courses/<slug>` for every **published** programme via `listPublishedProgrammes()`. Both `force-dynamic` (env and DB read at request time; build needs no DB) | `app/robots.ts`, `app/sitemap.ts` |
| 6 Backup & restore | `scripts/backup.sh` (`pg_dump -Fc --no-owner --no-privileges` → `backups/<db>-<UTC>.dump` + `.sha256`; refuses without `DATABASE_URL`; prints size). `scripts/restore-rehearsal.sh <dump> [--keep]` (checksum → scratch DB `p4tc_restore_<ts>` on the same server, UTC timezone → `pg_restore --exit-on-error` → `npx prisma migrate status` → per-table row-count comparison, table list from the source's `information_schema` = the schema's `@@map` set → PASS/FAIL → drop). `backups/` added to `.gitignore` | `scripts/backup.sh`, `scripts/restore-rehearsal.sh`, `.gitignore` (+1 line) |
| 7 Container image | Multi-stage `Dockerfile` (deps → build with `prisma generate` + `next build` → prod-deps → `node:24-alpine` runtime, non-root `portal`, `HEALTHCHECK` on `/api/health`, `$PORT` 3000). **Runs `next start`, not standalone:** the bundled Next docs do not state `output: "standalone"` is inert on Vercel, so per instruction the flag was **not** added; the Dockerfile header documents the two-line switch. `.dockerignore` excludes `node_modules`, `.next`, `.env*`, `project-artifacts`, `test-results`, `backups`, `docs`, `tests` | `Dockerfile`, `.dockerignore` |
| 8 Runbooks | `docs/operations/`: `README.md` (index; J1–J9 all **OPEN**), `DEPLOYMENT_RUNBOOK.md` (both ADR-016 options step by step; env table; migrations forward-only and never automatic; seeding; Stripe production webhook URL and the nine handled event types; scheduler with Vercel Cron JSON, crontab and GitHub Actions; first-deploy checklist), `BACKUP_AND_RESTORE.md` (RPO/RTO placeholders for OQ-10, schedule, rehearsal record, actual-restore + Stripe reconciliation), `MONITORING_AND_INCIDENTS.md` (uptime on `/api/health` and `/verify`; log patterns and DB queries to alert on; runbooks for config refusal, DB unreachable, webhook failing, Stripe degraded, error reference, key rotation incl. the pasted test key, compromise), `SECURITY_CHECKLIST.md` (26 rows mapped to SECURITY_ARCHITECTURE §3–§12), `RELEASE_GATE.md` (proposal for OQ-18) | `docs/operations/*` (6 files) |
| 9 Restart resilience | Integration test: fixtures written with the process client; a **second `PrismaClient` + `PrismaPg` built only from `DATABASE_URL`** (different backend pid asserted) reads back the fee in force (through `currentFeeSetting(now, db)`), an issued certificate's `expires_on` and public status, a pending order's hold, an `auth_rate_limits` counter and a queued `outbound_emails` row | `tests/integration/restart-resilience.test.ts` |
| 10 Tests | unit `env-config` (12: missing, blank, invalid-with-reasons and no value echoed, complete, LEGAL warning-only, LEGAL malformed fatal, Stripe test-key warning, dev mode, Stripe pairing, mode default); integration `health-route` (3: 200 with real test DB and exact key set, 503 path with a throwing client, timeout path); `restart-resilience` (6); e2e `readiness.spec.ts` (**unrun**, 6: headers on `/`, no-store on `/account`, `/verify/<id>`, `/api/health`; health JSON; robots; sitemap incl. unlisted absent; no wireframe remnant text on any `site-nav` route) | `tests/unit/env-config.test.ts`, `tests/integration/health-route.test.ts`, `tests/integration/restart-resilience.test.ts`, `tests/e2e/readiness.spec.ts` |
| `.env.example` | Appended a "Production (Milestone 9)" section naming what the validator requires; nothing reordered | `.env.example` |

## 3. Testing

| Check | Result |
|---|---|
| `npx tsc --noEmit --incremental false` | **0 errors** (final run; an earlier run showed 4 errors in `tests/unit/admin-nav.test.ts`, an M8 file since fixed by its owner) |
| `npx vitest run` (new files) | **21 / 21** (env-config 12 · health-route 3 · restart-resilience 6) |
| `npx vitest run` (full, final run) | **374 / 375** — the one failure is in `tests/integration/audit-admin.test.ts` (M8 agent's file, being written concurrently against the same test database; a different case failed on the earlier run, consistent with in-progress work); no M9 test failed and no pre-existing test regressed |
| `npx next build` | **green** (final run): `ƒ /api/health`, `ƒ /robots.txt`, `ƒ /sitemap.xml` dynamic; `○ /_not-found` static; 28 static pages generated without a database |
| Playwright `readiness.spec.ts` | **62 / 62 passed 2026-09-23** — the whole suite, run by the orchestrator against a production build (`npx next build && PLAYWRIGHT_SERVER=start npm run test:e2e`, because another session's `next dev` held the directory lock) |
| Live probe (read-only, against the dev server another session already had running on :3100, hot-reloaded) | `/api/health` → 200 `{"status":"ok","db":"up","migration":"20260922150846_certificates","version":"0.1.0",…}` with `Cache-Control: no-store`; `/robots.txt` exactly as specified; `/sitemap.xml` 16 nav URLs + the one published programme, no private paths; `/` carries nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy (no HSTS — dev mode, as designed); `/api/stripe/webhook` `no-store` (config rule honoured on handlers); `/api/me/photo` keeps `private, max-age=0, must-revalidate` (exception rule works) |
| **Finding — Cache-Control on pages** | For dynamic **pages** Next's renderer stamps its own header *after* the config rule: `/account`, `/admin` (307) and `/verify/<id>` showed `no-cache, must-revalidate` in dev. In production the same code path sets `private, no-cache, no-store, max-age=0, must-revalidate` (`node_modules/next/dist/server/base-server.js`), which contains `no-store`. Outcome: pages are uncacheable in both modes; the config's literal `no-store` is authoritative for route handlers. The e2e assertion accepts `no-store|no-cache` and says why; `next.config.ts` carries the same note |
| `scripts/backup.sh` on `p4tc_dev` | 192 KB dump + checksum in ~1 s |
| `scripts/restore-rehearsal.sh` on that dump | **PASS** — checksum OK, 8 migrations "up to date", **33/33 tables** equal row counts, scratch DB dropped. Dump and `backups/` removed afterwards |
| Docker | **UNTESTED** — `docker info` failed (no container runtime on the machine). Recorded in the Dockerfile header and the runbook; first build is the operator's step |

## 4. Verification criteria (plan §5)
1 ✅ (200 / 503 with injected client) · 2 ✅ headers on `/`; `/account` and `/verify/<id>` no-store asserted in the unrun e2e and by live probe · 3 ✅ unit + instrumentation (production throw; dev warn) · 4 ✅ code; visual render pending orchestrator · 5 ✅ live probe · 6 ✅ PASS on dev · 7 ⏸ untested (no Docker) · 8 ✅ · 9 ✅ tsc · Vitest 375/375 · Playwright 62/62 · build clean.

## 5. Not changed
`prisma/schema.prisma`, migrations, `project-artifacts/`, `app/admin/**`, `app/account/**`, `app/api/jobs/**`, `app/api/me/**`, `src/modules/**`, `playwright.config.ts`, `app/layout.tsx` (the `noindex` stays until cutover), existing `next.config.ts` options, `.env.example` existing content. No dependency added. No service provisioned.

## 6. Defaults taken (beyond plan §3)
| # | Default | Why |
|---|---|---|
| D1 | `output: "standalone"` **not** added; Dockerfile runs `next start` | Instruction: add only if the Next docs confirm no dev/Vercel change; they do not say so |
| D2 | Config validation runs the same rules in development but only warns | Plan: "in development a clear warning names what is missing" |
| D3 | `LEGAL_DOCUMENT_VERSIONS` absent = warning in every mode | Founder may launch with registration closed (M10 §2) |
| D4 | A Stripe `sk_test_` key in production = warning, not refusal | Loud but not blocking; the runbook calls it a defect |
| D5 | Sitemap omits `lastModified` for programmes | `listPublishedProgrammes()` does not expose `updated_at`; extending the repository is catalogue-module work outside M9 ownership — small follow-up |
| D6 | Photo routes' caching restated in `headers()` rather than excluded | Next's "last matching rule wins" makes it deterministic and self-documenting |
| D7 | Rehearsal script reads the table list from `information_schema` | Same set as the schema's `@@map` names, without a hand-maintained copy that would drift |

## 7. Risks / observations (not acted on)
- Vercel Cron issues GET without a custom bearer; the M7 endpoint requires POST + bearer. Reconciling is a small M7-module change or an external scheduler (runbook §3.8 / §7).
- `PROFILE_ENCRYPTION_KEY` rotation needs a re-encryption script that does not exist yet (MONITORING §4.6).
- Dead links: `/certifications` (two pages) and `/courses` (home fallback) have no page — recorded as M10 B19.
- The M8 agent's in-progress files currently break `tsc`/build; not M9's to fix.

## 8. Human decisions required
J1–J9 (plan §4) — all **OPEN**; RELEASE_GATE adoption (J6); the follow-ups above.
