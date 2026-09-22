# Deployment Runbook

> **Status: DRAFT 2026-09-23 (Milestone 9 §2 item 8). Nothing is provisioned.** Hosting (J2), database (J3), domain (J4) and email (J5) are the founder's decisions; this runbook covers **both** hosting options of ADR-016 so either can be executed the day the decision is made.

## 0. What is being deployed

One Next.js 16 server application (repository root) + one PostgreSQL 16 database. No object storage, queue, worker or cache service exists in V1 — the outbox and the reminders job are database rows drained by an HTTP call. The application is stateless (Deployment Arch §5): any instance can be replaced at any moment; every business fact is in PostgreSQL (`tests/integration/restart-resilience.test.ts` proves the critical ones).

```
Internet ─▶ [ host: Vercel  |  container on Fly.io / Railway / VPS ] ─▶ Next.js ─▶ PostgreSQL (Neon / Supabase / other managed)
                                              ▲                                   ▲
                    Stripe webhooks ──────────┘        scheduler → POST /api/jobs/certificate-reminders
```

## 1. Prerequisites the founder provides (RED gates — none exist yet)

| Item | Where it comes from | Decision |
|---|---|---|
| Managed PostgreSQL 16 with a **UTC** default timezone and a connection string | Neon / Supabase / other | J1, J3 |
| Hosting account | Vercel Pro **or** Fly.io / Railway / VPS | J2 |
| Domain + DNS control; TLS is provided by the host | Registrar | J4 |
| Stripe account in **live** mode; production webhook endpoint | Stripe Dashboard | J9 |
| Email provider account + sending domain with SPF/DKIM/DMARC | Resend / Postmark | J5 (until then `EMAIL_TRANSPORT=log`) |
| A scheduler that can make one authenticated HTTPS POST per day | Vercel Cron / system cron / CI schedule | follows J2 |


> **`APP_ENV=test`** exists solely for the automated suite running against a production build on a developer machine (`npx next build && PLAYWRIGHT_SERVER=start npm run test:e2e`). It downgrades the fail-fast configuration check to warnings. It must never be set on staging or production; the health endpoint and the start-up log will show `(test)` if it is.

## 2. Environment variables

Names come from `.env.example`; **values live only in the host's secret store** (ADR-030). `src/config/env.ts` is run at every server start by `instrumentation.ts`:

- `NODE_ENV=production` → the server **refuses to start** if anything below marked *required* is missing or malformed. The log line names the variable and the reason, never the value.
- any other mode → one warning line.

| Variable | Required in production | Well-formedness | Generate / obtain | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | yes | `postgres://` or `postgresql://` | database host | On a serverless host use the **pooled** connection string (Deployment Arch §7 "connection exhaustion"). The database's session timezone must be UTC: `ALTER DATABASE <name> SET timezone TO 'UTC'` (Neon: also set per role or use `?options=-c%20timezone%3DUTC`) — `tests/integration/timestamps.test.ts` is the guard |
| `BETTER_AUTH_SECRET` | yes | ≥ 32 chars | `openssl rand -base64 32` | Per environment; rotating it signs everyone out |
| `APP_BASE_URL` | yes | `https://…` | the chosen domain | Used in emails, verification links, `robots.txt`, `sitemap.xml`, `metadataBase` |
| `PROFILE_ENCRYPTION_KEY` | yes | base64 of exactly 32 bytes | `openssl rand -base64 32` | AES-256-GCM for the ID-number column; rotation = re-encrypt rows (see MONITORING_AND_INCIDENTS §5.4) |
| `EMAIL_TRANSPORT` | yes | `log` \| `resend` \| `postmark` | — | Only `log` is implemented (ADR-015 open). `resend`/`postmark` refuse at first send until the transport exists; do not set them before J5 is done **and** the transport is built |
| `JOBS_SECRET` | yes | ≥ 16 chars | `openssl rand -base64 32` | Bearer for `POST /api/jobs/certificate-reminders`; unset → the endpoint answers 503 |
| `STRIPE_SECRET_KEY` | yes | `sk_live_…` | Stripe → Developers → API keys | A `sk_test_` key in production starts with a **warning** and every payment fails at Stripe — treat it as a defect |
| `STRIPE_WEBHOOK_SECRET` | yes | `whsec_…` | the production endpoint's signing secret (§6) | Both Stripe values together or neither |
| `LEGAL_DOCUMENT_VERSIONS` | **no — warning only** | JSON `{"terms":"<v>","privacy":"<v>"[,"refund":"<v>"]}` | set the day counsel publishes | Unset = **registration closed** (consent gate shut) — a supported launch state (M10 §2). Set-but-malformed **is** fatal |
| `ENQUIRY_NOTIFY_EMAIL` | no | email address | founder's inbox | Where contact-form enquiries are announced through the outbox; without a real email transport the row is written but nothing is delivered |
| `NEXT_TELEMETRY_DISABLED` | no | `1` | — | Set in the Dockerfile; set it on Vercel too if desired |

Never set `DATABASE_URL_TEST` in production.

## 3. Option A — Vercel Pro + Neon (recommended under J2/J3)

1. **Database.** Create the Neon project in the region J1 decides (Singapore recommended). Copy the *pooled* connection string. Run `ALTER DATABASE <name> SET timezone TO 'UTC';` in the SQL editor.
2. **Migrations — from the founder's machine, never from the deploy** (ADR-029):
   ```bash
   export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
   DATABASE_URL='<direct, non-pooled connection string>' npm run db:deploy      # prisma migrate deploy
   DATABASE_URL='<direct connection string>' npx prisma migrate status           # must say "Database schema is up to date!"
   ```
3. **Seed** the reference data the product needs to render (domains, programmes, formats, prices, FAQ, diagnostic questions, the fee setting): `DATABASE_URL='<direct>' npm run db:seed`. Seeds are idempotent upserts (ADR-023); re-running is safe. **Do not seed test users into production.**
4. **Project.** Vercel → New Project → import `mustafaisonline/Portal4TrainingCertification`, root directory `/`, framework Next.js, Node 24. Build command `npm run build` (default). No `output: "standalone"` is needed on Vercel.
5. **Variables.** Settings → Environment Variables → add every *required* row of §2 for **Production** (and a separate set for **Preview** pointing at a *staging* database — never production data; Deployment Arch §3).
6. **Domain.** Settings → Domains → add the apex and `www`; follow the DNS records shown. TLS is automatic.
7. **Deploy** (push to the production branch or "Deploy"). First deploy logs must show **no** `[config] refusing to start` line.
8. **Scheduler.** Add `vercel.json` at the repository root (a code change — commit it with the deploy):
   ```json
   { "crons": [ { "path": "/api/jobs/certificate-reminders", "schedule": "0 1 * * *" } ] }
   ```
   Vercel Cron sends a **GET** without a bearer by default; the endpoint requires **POST with `Authorization: Bearer <JOBS_SECRET>`**. Two ways to reconcile, to be chosen with J2: (a) Vercel's `CRON_SECRET` convention (Vercel sends `Authorization: Bearer $CRON_SECRET` when that variable is set — set `CRON_SECRET` equal to `JOBS_SECRET`) **and** accept GET in the route — a code change owned by the M7 module, to be requested; or (b) an external scheduler (§7) that POSTs. Until decided, (b) works without a code change.
9. **Stripe webhook** — §6. **Uptime checks** — MONITORING_AND_INCIDENTS §1. **First-deploy checklist** — §8.

## 4. Option B — single container (Fly.io / Railway / VPS) with `Dockerfile`

The image at the repository root is **written but unbuilt** (no container runtime on the authoring machine). First step is therefore to build it once locally or in CI and fix anything the build reveals:

```bash
docker build -t p4tc-portal .
docker run --rm -p 3000:3000 --env-file <file with the §2 variables, never committed> p4tc-portal
curl -s http://localhost:3000/api/health      # {"status":"ok","db":"up",…}
```

Notes on the image: Node 24 alpine, non-root user `portal`, `HEALTHCHECK` on `/api/health`, listens on `$PORT` (3000). It runs `next start`, not the standalone server — see the Dockerfile header for why and how to switch. Migrations are **not** run by the container (ADR-029): run `npm run db:deploy` from a machine with the repository, exactly as in §3 step 2.

- **Fly.io:** `fly launch --no-deploy` (accept the Dockerfile), set the region per J1, `fly secrets set NAME=value …` for §2, `fly deploy`. Add a `[checks]` block pointing at `/api/health`. Scheduler: Fly Machines scheduled run or an external cron (§7).
- **Railway:** New project → Deploy from GitHub → detected Dockerfile; Variables from §2; Settings → Healthcheck path `/api/health`; Cron: a second service or an external scheduler (§7).
- **VPS:** Docker Engine + a reverse proxy that terminates TLS (Caddy gives automatic certificates); `docker run --restart unless-stopped --env-file … -p 127.0.0.1:3000:3000 p4tc-portal`; proxy `https://<domain>` → `127.0.0.1:3000`; crontab from §7. Keep the env file `chmod 600`, owned by the deploy user.

## 5. Every subsequent deploy

1. Release gate green on the exact commit (`RELEASE_GATE.md`).
2. If the release includes a migration: `npm run db:deploy` **first**, then deploy the code (forward-only migrations are written to be compatible with the previous code for the minutes between the two steps — a migration that is not must be flagged in its PR). Never in the reverse order; never automatically.
3. Deploy. Watch the start log for `[config]` lines and the first `/api/health`.
4. Smoke: `/`, `/verify`, `/api/health`, sign-in, one Stripe test-mode checkout on **staging** (not production).
5. Roll back = redeploy the previous build (Vercel: "Promote" the earlier deployment; container: the previous image tag). Database migrations are **not** rolled back — that is a RED-gate destructive operation; design forward (ADR-029).

## 6. Stripe production webhook (J9)

Stripe Dashboard (live mode) → Developers → Webhooks → **Add endpoint**:

- URL: `https://<APP_BASE_URL host>/api/stripe/webhook`
- Events the application handles (`src/modules/commerce/webhook.service.ts`): `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `charge.succeeded`, `charge.updated`, `charge.refunded`, `refund.created`, `refund.updated`. Any other event is stored and marked `ignored`.
- Copy the endpoint's **signing secret** → `STRIPE_WEBHOOK_SECRET` (production). The test-mode `whsec_` from `stripe listen` is not it.
- Verify: Stripe → the endpoint → "Send test webhook" → the row appears in `stripe_events` (admin → Orders shows the effect) and the response is `200 {"received":true}`.
- **Rotate the test secret key that was pasted in chat** (Developers → API keys → roll key) before go-live, and update `.env.local`.

## 7. Reminders scheduler

`POST /api/jobs/certificate-reminders` with `Authorization: Bearer <JOBS_SECRET>`, once a day; idempotent, so a duplicate run is harmless (M7 plan). The audit log records each run (`job.run`).

- **crontab** (any Linux box, including the VPS option); 01:00 UTC = 09:00 MYT:
  ```
  0 1 * * * curl -fsS -X POST -H "Authorization: Bearer $JOBS_SECRET" https://<domain>/api/jobs/certificate-reminders >> /var/log/p4tc-reminders.log 2>&1
  ```
  with `JOBS_SECRET` in the crontab's environment or a `chmod 600` file it sources — never inline in the crontab line if other users can read it.
- **GitHub Actions** schedule (free, no server): a workflow with `on: schedule: - cron: "0 1 * * *"` and one `curl` step reading `${{ secrets.JOBS_SECRET }}`. Repository secrets are the store.
- **Vercel Cron** — §3 step 8 caveat (GET vs POST / bearer).

Check: the response is `{"considered":n,"queued":m,"skipped":k}` and admin → Audit shows `job.run` today.

## 8. First-deploy checklist (production)

- [ ] J1–J5 decided and recorded in `ARCHITECTURE_DECISION_REGISTER.md`
- [ ] Database created in the decided region; timezone UTC verified (`SHOW timezone` → `UTC`)
- [ ] `npm run db:deploy` and `npx prisma migrate status` clean against production
- [ ] Reference seed applied; **no test users** present
- [ ] Every required variable from §2 set; **live** Stripe keys; `LEGAL_DOCUMENT_VERSIONS` set only if counsel has published
- [ ] Server started with no `[config]` refusal; `/api/health` → 200, `db: up`, `migration` = newest folder in `prisma/migrations`
- [ ] Security headers present (`curl -sI https://<domain>/` shows `strict-transport-security`, `x-frame-options: DENY`, `x-content-type-options: nosniff`)
- [ ] Stripe production webhook added and test event → 200
- [ ] Scheduler configured; first manual run → 200 with counts
- [ ] Uptime checks on `/api/health` and `/verify` (MONITORING_AND_INCIDENTS §1)
- [ ] Backup schedule live and **one restore rehearsal passed against production** (BACKUP_AND_RESTORE §3)
- [ ] `app/layout.tsx` `robots: { index: false }` lifted **only** at cutover (M10) — until then the site is deliberately unindexed
- [ ] `admin:grant` run for the founder's account (`npm run admin:grant -- <email>` against production `DATABASE_URL`)
- [ ] `docs/execution/LAUNCH_READINESS_CHECKLIST.md` walked through
