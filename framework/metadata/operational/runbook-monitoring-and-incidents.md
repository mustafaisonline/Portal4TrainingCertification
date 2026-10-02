# runbook — Monitoring and incidents

| Field | Value |
|---|---|
| Category | operational |
| Kind | runbook |
| Source of truth | `docs/operations/MONITORING_AND_INCIDENTS.md` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved (draft source; no monitoring tooling configured) |
| Related | ADR-017; [runbook-deployment.md](runbook-deployment.md); [procedure-backup-and-restore.md](procedure-backup-and-restore.md); [job-certificate-reminders.md](job-certificate-reminders.md) |

## Purpose
What to watch in production and what to do when something goes wrong.

## Description
**Status per the source:** DRAFT 2026-09-23. No monitor, alert channel or error tracker is configured (ADR-017 open). Its wording predates the Droplet: references to Vercel, Neon, Supabase, container logs and staging are historical; on the Droplet the app runs under PM2 behind Caddy.

- **1. Uptime checks:** `GET /api/health` (expect 200, status ok, db up; 503 means database down; about 1 minute) and `GET /verify` (200, about 5 minutes); alert after two consecutive failures; also TLS under 14 days and domain expiry.
- **2. Log patterns that mean an alert:** `[config] refusing to start`, `[health] database probe failed`, `[commerce] webhook ... failed` or `rejected`, `[commerce] webhook received but`, `EmailNotConfiguredError`, and Next's server error log carrying a digest.
- **3. Database queries to run daily:** failed or stuck `stripe_events`, failed or stale `outbound_emails`, long-pending orders, newest `audit_log` `job.run` older than 26 h (reminders job did not run), growth of `auth_rate_limits`. The audit log is business data, not telemetry; never ship it to a log vendor.
- **4. Incident runbooks:** 4.1 server will not start (read the config log line, fix the variable, restart); 4.2 database unreachable (check database versus network, credentials, restore only if data loss is declared); 4.3 Stripe webhook failing (signature 400s mean wrong secret; 500s read the event row error; fix then Resend from Stripe, processing is idempotent; fallback is through admin screens, never row edits); 4.4 Stripe degraded (do not mark orders paid by hand); 4.5 a user reports an error reference (search the server log by digest, fix forward, roll back if a deploy caused it); 4.6 key and secret rotation table (BETTER_AUTH_SECRET signs everyone out; JOBS_SECRET must change in app and scheduler together; Stripe keys; PROFILE_ENCRYPTION_KEY is not a variable swap and needs an unbuilt re-encryption script; DATABASE_URL password); 4.7 suspected compromise (rotate in order: database password, auth secret, Stripe keys, jobs secret; review audit log, sessions and Stripe; PDPA assessment is a founder and counsel step).
- **5. Not monitored yet:** error tracking, analytics, replay; no session replay on assessment screens whenever a vendor is chosen.
- **6. Incident record:** append to `docs/operations/INCIDENTS.md` (created on first incident), with no personal data.

## Preconditions
Operator access to the server, Stripe Dashboard and the admin screens.

## Safety notes
Never edit business rows by hand to fix payments. Rotating PROFILE_ENCRYPTION_KEY without a re-encryption pass makes stored ID numbers unreadable. Rollback of code is via [procedure-governed-deploy.md](procedure-governed-deploy.md); the runbook's section 5 reference to Vercel or image tags is superseded.

## Change history
- 2026-10-02 — created from `docs/operations/MONITORING_AND_INCIDENTS.md`.
