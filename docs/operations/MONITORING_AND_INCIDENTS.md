# Monitoring and Incidents

> **Status: DRAFT 2026-09-23 (Milestone 9 §2 item 8). No monitor, alert channel or error tracker is configured** — ADR-017 (observability vendors) is open and every candidate needs an account the founder creates. This document says what to watch and what to do; the tooling choice is J2's companion decision.

## 1. Uptime checks (WBS 7.7)

Two targets, from outside the hosting platform (any free uptime service, or a GitHub Actions schedule with `curl -f`):

| Target | Expect | Interval | Why |
|---|---|---|---|
| `GET https://<domain>/api/health` | `200`, body `"status":"ok"`, `"db":"up"` | 1 min | Application **and** database round-trip; `503` = database down |
| `GET https://<domain>/verify` | `200`, body contains "Search" | 5 min | The public verification page is the employer-facing promise (Deployment Arch §9) |

Alert after two consecutive failures. `/api/health` never needs a secret (M9 default H1) and reveals only up/down, migration name, version and time.

Also alert on: TLS certificate < 14 days to expiry (the host renews automatically; the alert catches a DNS mistake), and domain expiry (registrar reminder — a lapsed domain under issued certificates is Deployment Arch risk 5).

## 2. Log lines that mean an alert

The application logs to stdout; the host collects it (Vercel → Logs; container → `docker logs` / the platform's log drain). Configure a text match alert on each of these:

| Pattern | Meaning | Runbook |
|---|---|---|
| `[config] refusing to start` | Production started without required configuration — the instance is down by design | §4.1 |
| `[health] database probe failed` | `/api/health` could not reach PostgreSQL | §4.2 |
| `[commerce] webhook … failed` / `webhook processing failed` | A Stripe event was stored but processing threw; Stripe will retry, the event row says `failed` | §4.3 |
| `[commerce] webhook rejected` | Signature mismatch — wrong `STRIPE_WEBHOOK_SECRET`, or a replayed/forged request | §4.3 |
| `[commerce] webhook received but` | Payments not configured on an instance that received a webhook | §4.1 |
| `EmailNotConfiguredError` | `EMAIL_TRANSPORT` set to a provider that is not implemented | §4.1 |
| `[error-boundary]` / `[global-error]` are **browser** console lines; the server-side counterpart is Next's own error log carrying the same `digest` | A 500 was shown to a person with a correlation id | §4.5 |

## 3. Database rows that mean an alert (query daily, or from the admin screens)

| Query | Threshold | Meaning |
|---|---|---|
| `SELECT count(*) FROM stripe_events WHERE status='failed'` | > 0 | Money moved at Stripe and our record did not follow — highest priority (§4.3) |
| `SELECT count(*) FROM stripe_events WHERE status='received' AND received_at < now() - interval '10 minutes'` | > 0 | An event stuck mid-processing (instance died) — replay it from Stripe |
| `SELECT count(*) FROM outbound_emails WHERE status='failed'` | > 0 | Delivery failures (§4.4) |
| `SELECT count(*) FROM outbound_emails WHERE status='queued' AND created_at < now() - interval '1 hour'` | > 0 | Rows nothing ever sent — with the `log` transport this is expected to be 0 because `log` marks rows `sent` immediately; with a real provider it means the send never ran |
| `SELECT count(*) FROM orders WHERE status='pending' AND expires_at < now() - interval '1 day'` | growing | Expired holds not being reaped by `checkout.session.expired` — check the webhook |
| newest `audit_log` row with `action='job.run'` | older than 26 h | The reminders scheduler did not run (DEPLOYMENT_RUNBOOK §7) |
| `SELECT count(*) FROM auth_rate_limits` | thousands | Somebody is hammering sign-up / verify search; rows are cheap, but look at the keys |

The insert-only `audit_log` is business data, not telemetry (Security Arch §8) — read it, never ship it to a log vendor.

## 4. Incident runbooks

### 4.1 The server will not start / `[config] refusing to start`
1. Read the log line: it names the variable and the reason (`missing`, `must start with`, `must be at least`, …). It never prints the value.
2. Fix the variable in the host's secret store. Common causes: a pasted value with a trailing newline; `APP_BASE_URL` with `http://`; only one of the two Stripe values set; a `PROFILE_ENCRYPTION_KEY` that is not exactly 32 bytes (`openssl rand -base64 32` gives 44 characters ending in `=`).
3. Redeploy / restart. `/api/health` → 200.
4. If the *previous* build was fine and nothing changed: the host may have dropped a variable on a project re-link — compare the variable list with DEPLOYMENT_RUNBOOK §2.

### 4.2 Database unreachable (`/api/health` → 503, `db: "down"`)
1. Is it the database or the network? From your machine: `psql '<direct url>' -c 'select 1'`. Host status page (Neon/Supabase).
2. Managed host paused/suspended (free tiers auto-suspend on idle; the first query wakes them and may exceed the 3 s health timeout once — a single 503 followed by 200 is a wake-up, not an outage).
3. Connection limit hit (serverless fan-out): host console → connections. Switch `DATABASE_URL` to the **pooled** string if it is not already.
4. Credentials rotated on the host without updating the app: update `DATABASE_URL`, restart.
5. Storage/host incident: wait it out **or**, if the host declares data loss, follow BACKUP_AND_RESTORE §4. Do not restore for a transient outage.
6. While down, nothing is lost that was already committed: sessions, holds, orders and certificates are rows, not memory (restart-resilience test). Stripe keeps retrying webhooks for days; replay any it gave up on once the database is back.

### 4.3 Stripe webhook failing
Symptoms: `stripe_events.status='failed'`, Stripe Dashboard → Webhooks shows non-2xx responses, a participant paid but has no registration.
1. **Signature 400s** (`webhook rejected`): the `STRIPE_WEBHOOK_SECRET` does not match the endpoint that is sending. One secret per endpoint; the test-mode `stripe listen` secret is not the live one. Fix the variable; Stripe retries automatically (up to 3 days).
2. **500s** (`processing failed`): read the `error` column on the `stripe_events` row and the server log with the same event id. Typical causes: database unreachable (→ 4.2); an order id in metadata that does not exist (a checkout created against a different database — staging vs production key mix-up); a schema mismatch after a deploy without `db:deploy` (→ run the migration).
3. After the cause is fixed: Stripe → Webhooks → endpoint → the event → **Resend**. Processing is idempotent (duplicate events return `duplicate: true`; a `failed` row is reprocessed).
4. Verify in admin → Orders that the order is `paid` and the registration `confirmed`; the participant's confirmation email is in `outbound_emails`.
5. If Stripe is fine but our side keeps failing for hours, the fallback is manual: record what Stripe shows against the order **through the admin screens** (audit-logged), never by editing rows.

### 4.4 Stripe degraded / down
- Checkout redirects fail or hang: nothing to do on our side; the pending order's hold expires by itself (`expires_at`), and the seat frees. Put a notice on `/schedule` only if the outage is long (copy change → founder).
- Payments succeeded at Stripe but webhooks are delayed: orders stay `pending` until the event arrives; do not mark them paid by hand. If a hold expires before the delayed `checkout.session.completed` arrives, the handler still records the payment and confirms the registration when capacity allows; if capacity is gone it records the payment and the order for a refund/transfer decision by the founder (see `webhook.service.ts` notes) — check admin → Orders after the backlog drains.
- Email delivery degraded (once a provider exists): rows go `failed` with `last_error`; re-send from admin when the provider recovers (a re-send action is M7/M8 scope — until it exists, the row is the record and support handles it manually).

### 4.5 A person reports "Something went wrong · Reference: <id>"
1. Search the server log for the reference (Next's `digest`); the stack is there, never on the page.
2. If the reference is a 12-hex random id (no digest), the error was in the browser; ask for the page and the steps.
3. Fix forward; if a deploy caused it, roll back (DEPLOYMENT_RUNBOOK §5).

### 4.6 Key and secret rotation (Security Arch §9 — "rotation without a code change")
| Secret | How | Effect |
|---|---|---|
| `BETTER_AUTH_SECRET` | set a new value, restart | every session invalid — people sign in again; announce if planned |
| `JOBS_SECRET` | new value in the app **and** the scheduler at the same time | a mismatch = 401s until both agree; the job is idempotent, missing a day only delays reminders |
| `STRIPE_SECRET_KEY` | Stripe → API keys → **Roll key** (old key valid for a chosen grace period) → set new value → restart → confirm a test checkout on staging. For a restricted key (`rk_`, K1) re-check its permissions after rolling: Checkout Sessions write · Refunds write · PaymentIntents, Charges, Balance transactions read | **Do this now for BOTH keys pasted in chat — the test key (2026-09-21) and the live restricted key (2026-09-26)** |
| `STRIPE_WEBHOOK_SECRET` | Stripe → endpoint → Roll secret → update variable → restart; events sent in between fail signature and are retried | short 400 burst, self-healing |
| `PROFILE_ENCRYPTION_KEY` | **Not a variable swap.** Rows are `v1:` AES-GCM under the current key; rotating requires a re-encryption pass (decrypt with old, encrypt with new, in a transaction per row, audited) — a small script to be written and approved when needed. Until then: never lose this key; losing it makes every stored ID number unreadable | planned, not built |
| `DATABASE_URL` password | rotate on the host → update variable → restart | seconds of 503 |

### 4.7 Suspected credential compromise
Rotate per 4.6 in this order: database password, `BETTER_AUTH_SECRET`, Stripe keys, `JOBS_SECRET`. Review `audit_log` for the window (admin → Audit), `auth_sessions` for unknown sessions, Stripe Dashboard for unexpected refunds. Record the incident (§6). PDPA breach assessment is a founder/counsel step.

## 5. What is deliberately not monitored yet
Error tracking with stack aggregation, funnel analytics, SLA timing and session replay are ADR-017/ADR-035 decisions (vendor accounts). Until then: host logs + the database queries above + the admin screens. **No session replay on assessment, artifact or evaluation screens** whenever a vendor is chosen (ADR-035).

## 6. Incident record
Append to `docs/operations/INCIDENTS.md` (create on the first incident): date/time UTC, detection (alert or report), impact (who, how long), timeline, root cause, fix, follow-ups with owners. No personal data in the record — reference orders and users by id.
