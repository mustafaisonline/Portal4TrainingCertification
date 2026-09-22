# Milestone 7 — "Renewal reminders" · Execution Plan

> **Status: ✅ EXECUTED 2026-09-23** on the founder's overnight instruction of 2026-09-22 — see [`MILESTONE_7_COMPLETION_REPORT.md`](MILESTONE_7_COMPLETION_REPORT.md). No schema change; defaults in §3 for the founder's review.
> **Roadmap origin:** [`WIREFRAME_TO_PRODUCTION_PLAN.md`](WIREFRAME_TO_PRODUCTION_PLAN.md) §7 row M7 "Renewal & fees". The effective-dated fee, the renewal payment and the expiry arithmetic were delivered inside Milestone 6 on decisions E4–E7. **What remains is R-L7: reminders** ([`COMPLETION_CERTIFICATE_REQUIREMENTS.md`](COMPLETION_CERTIFICATE_REQUIREMENTS.md) §3.3), deferred from M6 by decision E10 "until a scheduler and an email provider exist". This milestone builds the reminder logic so that it is ready the day either exists, without inventing a scheduler.

## 1. What exists
Certificates with `expires_on`; status computed on read; the outbox `outbound_emails` (queued rows, `log` transport — ADR-015 still open); the insert-only `audit_log`; no job runner, cron or queue in the approved stack; `/account/notifications` is an empty state from M5.

## 2. Scope
1. **Reminder rule** (pure): for a certificate that is not revoked, stages are due at **30 days before expiry**, **7 days before expiry** and **the day after expiry** (lapsed), computed on MYT calendar dates; a stage is due once and only while it is still meaningful (a 30-day reminder is not sent when 6 days remain — the 7-day one is).
2. **Idempotency without a new table:** each queued reminder writes an audit row `certificate.reminder_queued` (entity `certificate`, `after: { stage, expiresOn }`) **in the same transaction** as the outbox row. A stage is skipped when such a row already exists for that certificate and that `expiresOn` (a renewal changes `expiresOn`, so the next cycle's reminders are new). Restart-proof and replay-proof by construction (Service Restart Test).
3. **Runner:** `POST /api/jobs/certificate-reminders`, authenticated by `Authorization: Bearer <JOBS_SECRET>` (constant-time compare; 401 otherwise; 503 when the secret is unset). Stateless: recomputes due stages from the database each call and returns `{ considered, queued, skipped }`. Safe to call any number of times a day. A `job.run` audit row (entity `job` / `certificate-reminders`) records each run and its counts so the admin can see the last run.
4. **Admin visibility:** `/admin/certificates` shows "Reminders: last run <time> · queued N" from the latest `job.run` row, and the certificate detail lists the reminders queued for that certificate.
5. **Holder visibility:** `/account/notifications` lists the person's outbox messages (subject, when, status) — the real data the M5 empty state was waiting for.
6. **Tests:** unit (stage rule across the boundaries), integration (queue once, replay skips, renewal re-arms, revoked skipped, audit and outbox rows committed together), route (401/503/200 with counts), e2e (notifications page shows a queued reminder; admin sees the last run).

## 3. Defaults taken (founder may change any)
| # | Default | Why |
|---|---|---|
| F1 | Stages 30 / 7 days before and 1 day after | R-L7's example values |
| F2 | Runner is an authenticated HTTP endpoint, invoked by whatever scheduler the hosting decision (ADR-016) provides — Vercel Cron, a system cron `curl`, or a GitHub Actions schedule | No scheduler technology is introduced; the choice belongs with hosting |
| F3 | Messages go to the outbox and are delivered only once ADR-015 is decided; until then they are visible in Notifications and in the log transport | Honest: nothing pretends to send |
| F4 | One reminder per stage per expiry cycle; no reminder for revoked certificates | Fairness and noise |

## 4. Out of scope
Auto-renewal (D10) · SMS or in-app push · choosing the email provider (ADR-015) · choosing the scheduler (with ADR-016).

## 5. Verification criteria
1 stage rule correct at 31/30/29, 8/7/6, 0/−1/−2 days · 2 second run queues nothing · 3 renewal moves `expiresOn` and re-arms the cycle · 4 revoked never reminded · 5 outbox row and audit row commit together (a failure leaves neither) · 6 route: no secret → 503, wrong → 401, right → 200 with counts · 7 notifications page and admin "last run" render · 8 tsc · Vitest · Playwright · build clean.
