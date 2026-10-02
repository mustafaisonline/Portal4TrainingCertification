# runbook — Deployment runbook

| Field | Value |
|---|---|
| Category | operational |
| Kind | runbook |
| Source of truth | `docs/operations/DEPLOYMENT_RUNBOOK.md` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved (partly superseded, see Description) |
| Related | [procedure-governed-deploy.md](procedure-governed-deploy.md); `deploy/README.md`; ADR-046; CR-2026-10-02-0030; [runbook-monitoring-and-incidents.md](runbook-monitoring-and-incidents.md); [job-certificate-reminders.md](job-certificate-reminders.md) |

## Purpose
The operator's manual for standing up and deploying the portal: what is deployed, the environment variables, the hosting options that were considered, the chosen option, Stripe webhook wiring, the reminders scheduler and the first-deploy checklist. Use it for the environment-variable table, the Stripe webhook details and the first-deploy checklist; use the governed procedure for the actual deploy.

## Description
**Operative deploy procedure: [procedure-governed-deploy.md](procedure-governed-deploy.md) and `deploy/README.md`.** The runbook's own banner (updated 2026-09-28) says the chosen path is Option C (section 4a), executed through the governed framework in `deploy/`, and that Options A and B are kept only as the record of what was considered.

### Contents of the document (summary)
- **0. What is deployed** — one Next.js 16 server application plus one PostgreSQL 16 database; no object storage, queue, worker or cache; the application is stateless and every business fact is in PostgreSQL.
- **1. Prerequisites the founder provides** — database, hosting account, domain, Stripe live account, email provider (until then `EMAIL_TRANSPORT=log`), and a scheduler for one daily authenticated POST. `APP_ENV=test` is only for the automated suite and must never be set on production.
- **2. Environment variables** — table of names, whether required in production, well-formedness and notes. Values live only in the host's secret store; production refuses to start if a required one is missing. Required: DATABASE_URL, BETTER_AUTH_SECRET, APP_BASE_URL, PROFILE_ENCRYPTION_KEY, EMAIL_TRANSPORT, JOBS_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET. LEGAL_DOCUMENT_VERSIONS is warning-only (unset means registration closed). DATABASE_URL_TEST must never be set in production.
- **3. Option A (Vercel + Neon) and 4. Option B (single container)** — retained as the record of options considered.
- **4a. Option C (chosen)** — Droplet, self-hosted PostgreSQL, through `deploy/`; one-screen table of provision, bootstrap, secrets (typed on the server only), build, deploy, migrations (by the server wrapper after backup and sandbox, never by hand), rollback, scheduler. Also notes the Free Learning content load after the first promotion.
- **5. Every subsequent deploy** — policy steps, enforced by `deploy/start.sh`; migrations are forward-only.
- **6. Stripe production webhook** — endpoint `/api/stripe/webhook`, the nine handled events, signing secret into STRIPE_WEBHOOK_SECRET; see [checklist-stripe-go-live.md](checklist-stripe-go-live.md).
- **7. Reminders scheduler** — see [job-certificate-reminders.md](job-certificate-reminders.md).
- **8. First-deploy checklist** — database timezone UTC, migrations clean, reference seed with no test users, variables set, no `[config]` refusal, health 200, security headers, webhook test, live card check, scheduler, uptime checks, backup plus one restore rehearsal, robots, admin grant, launch readiness checklist.

### Parts superseded or stale (per the document banner and `deploy/README.md`)
- **Superseded by the laptop-build deploy of 2026-10-02** (`deploy/README.md` banner item 4, CR-2026-10-02-0030): the Option C "Build" row in section 4a (git tag, push, GitHub Actions `release.yml` builds and uploads an artifact, `start.sh` fetches it) no longer applies. The release is now built and proven on the laptop from the tagged commit and shipped by rsync; GitHub is not in the deploy path and the push to GitHub happens only afterwards, on the founder's answer. `release.yml` stays in the repository but nothing requires it. The runbook text was not updated for this in the source.
- **Superseded earlier (per the runbook banner):** Managed PostgreSQL (K3 reversed 2026-09-28, now self-hosted); Docker/registry (K2/K6/K9, now PM2); staging (dropped 2026-09-27). Options A and B are record only. Smoke-test and migration wording in sections 3 and 5 that mentions staging or running `db:deploy` from the founder's machine is the pre-framework policy; the governed pipeline runs migrations on the server.
- Section 7's crontab and GitHub Actions scheduler options are not needed: the bootstrap installs a systemd timer (banner and section 4a).
- Whether any other detail has been superseded is not determined from the source.

## Preconditions
Founder access to the Droplet, Stripe and domain registrar; Node 24 on the laptop PATH for any local command.

## Safety notes
No secret belongs in this document or in chat; env values are typed on the server only. Never run migrations by hand against production. Never set `APP_ENV=test` or `DATABASE_URL_TEST` in production.

## Change history
- 2026-10-02 — created from `docs/operations/DEPLOYMENT_RUNBOOK.md` and `deploy/README.md`.
