# Milestone 7 — "Renewal reminders" · Completion Report

> **Status: IMPLEMENTED · TESTED** · 2026-09-23
> **Executed on:** the founder's overnight instruction of 2026-09-22 ("implement all the remaining milestones and their .md files as per the best practices") against [`MILESTONE_7_EXECUTION_PLAN.md`](MILESTONE_7_EXECUTION_PLAN.md). **No schema change** (Rule 1 untouched): idempotency lives in the existing insert-only `audit_log`. Defaults F1–F4 of the plan §3 were taken and are listed again in §5 for the founder's morning review.
> **Branch:** `feat/production-foundation` · commit `9bacb37` (code and tests) · `64728c8` (plan) · not pushed.

## 1. Requested
R-L7 (COMPLETION_CERTIFICATE_REQUIREMENTS.md §3.3), deferred from Milestone 6 by decision E10: remind a holder before and after their certificate expires, without inventing a scheduler or choosing an email provider (ADR-015 and ADR-016 stay open). Plan §2: a pure stage rule, restart-proof idempotency without a new table, an authenticated stateless runner, admin visibility of the last run, and the holder's notification centre fed with real rows.

## 2. Delivered
| Area | What | Where |
|---|---|---|
| Stage rule (pure) | `before_30` when 30 ≥ days left > 7 · `before_7` when 7 ≥ days left ≥ 0 · `lapsed_1` when −1 ≥ days left ≥ −30 · nothing when revoked (F4) or beyond a month after expiry (no indefinite nagging; documented in the file header). Only the most specific stage is due at a time, so a certificate first seen with 6 days left gets the 7-day reminder, never a late 30-day one (plan §2.1). Subject and plain-text body per stage: holder name, certificate ID, expiry date, fee in force formatted "USD 10.00", renewal link `${APP_BASE_URL}/account/certificate`; on-time vs lapsed renewal arithmetic stated in words. MYT calendar dates via the M6 `dates.ts` helpers | `src/modules/certificates/reminders.ts` |
| Runner | `runCertificateReminders({ now })`: selects non-revoked certificates with `expires_on` within ±30 days of today (indexed), computes the due stage, **skips** when an audit row `certificate.reminder_queued` already exists for that certificate with the same `stage` **and** the same `expiresOn`, otherwise writes the `outbound_emails` row (`queued`, `template_key = certificate.reminder.<stage>`) **and** the audit row in ONE transaction. A renewal changes `expiresOn`, so the next cycle's reminders are new by construction. One certificate's failure is counted (`failed`), logged and retried next run — it never stops the rest. Every run ends with a `job.run` audit row (entity `job` / `certificate-reminders`, counts, `byStage`, `today`, `ranAt`). Also `lastReminderRun()`, `listRemindersForCertificate(id)`, `listNotificationsForRecipient(email)` | `src/modules/certificates/reminders.service.ts` |
| Endpoint | `POST /api/jobs/certificate-reminders` — `Authorization: Bearer <JOBS_SECRET>`; 503 `jobs_disabled` when the secret is unset; 401 on a missing or differing token (`crypto.timingSafeEqual` on equal-length buffers); 200 with the counts; 500 with the counts when `failed > 0` so a scheduler alerts; other methods 405 (Next's default for an unexported method); `force-dynamic`, Node runtime; the token is never logged | `app/api/jobs/certificate-reminders/route.ts` |
| Holder visibility | `/account/notifications` lists the signed-in person's `outbound_emails` by their address, newest first, capped at 50: subject, time, status label (Queued · Sent · Failed) with the sentence "“Queued” means the message is recorded and will be delivered once email sending is enabled". **Never the body** (identity messages carry one-time links). The M5 empty state remains for a person with none. `data-testid="notification-row"` | `app/account/notifications/page.tsx` |
| Admin visibility | `/admin/certificates`: one line "Reminders: last run 23 Sep 2026, 08:00 MYT · considered N · queued N" (plus "· failed N" only when non-zero) or "Reminders have not run yet" (`data-testid="reminders-last-run"`). `/admin/certificates/[id]`: a "Reminders" card listing stage label · queued time · the expiry it was for, or "None yet." | `app/admin/certificates/page.tsx`, `app/admin/certificates/[id]/page.tsx` |
| Configuration | `JOBS_SECRET` was already in `.env.example`; `playwright.config.ts` now passes a test-only value (`e2e-jobs-secret`) to the web server, alongside the other test keys | `playwright.config.ts` |
| Audit | `certificate.reminder_queued` (actor null; `after: { stage, expiresOn, outboundEmailId, certificateId }`) · `job.run` — both already in the `AuditAction` union | — |

## 3. Testing
| Layer | Result |
|---|---|
| `tsc --noEmit --incremental false` | clean |
| Vitest | **297 / 297** (263 earlier + 34 new). Unit (24): `dueStage` at 31/30/29, 8/7/6, 1/0/−1/−2, −30/−31 and far-out days; at most one stage across −40…+40; revoked never; template keys and labels; fee formatting "USD 10.00"; every stage's subject and body name the ID, the date, the fee, the programme and the link; lapsed wording; no-fee degradation; MYT run-time formatting across midnight. Integration (10, real test database): before_30 queued once with outbox row and audit row cross-referenced; replay queues nothing; before_7 is a new stage; a year-out expiry queues nothing; a NEW `expiresOn` re-arms `before_30`; revoked never reminded; lapsed yesterday → `lapsed_1` once; lapsed 45 days → nothing; injectable clock walks one certificate through all three stages; `job.run` row with counts and `lastReminderRun` reads the newest; **atomicity**: an injected `writeAudit` failure leaves neither the outbox row nor the audit row, is reported as `failed: 1`, and the next run succeeds; invariant outbox rows = reminder audit rows and all rows still `queued`; route: 503 / 401 (no header, wrong, wrong length, Basic, bare) / 200 with counts |
| Playwright | `tests/e2e/certificate-reminders.spec.ts` **62 / 62 passed 2026-09-23** — the whole suite, run by the orchestrator against a production build (`npx next build && PLAYWRIGHT_SERVER=start npm run test:e2e`, because another session's `next dev` held the directory lock). Covers: 401 without and with a wrong token, 405 on GET, 200 with `byStage.before_30 ≥ 1` for a certificate expiring in 20 days, replay `queued: 0`, the holder's Notifications row with the certificate ID and "Queued" and the explanatory sentence, no body in the page, admin "last run" line, the detail's "30 days before expiry" entry; axe WCAG 2.2 AA on both screens |
| `next build` | clean (orchestrator, 2026-09-23) |

## 4. Security and privacy
The endpoint holds no session and performs no reads for the caller: it either runs the job or refuses; the secret is compared in constant time and never written to a log. Reminder emails and audit snapshots carry the certificate ID, dates and the outbox row id — no email address in the audit row, no ID-document field anywhere. The notification centre shows only the signed-in person's own rows, by their address, subject and status only. Nothing is delivered (F3): the outbox row is the durable record and the transport decision (ADR-015) is untouched.

## 5. Defaults taken (founder may change any)
| # | Default | Where to change |
|---|---|---|
| F1 | Stages 30 / 7 days before, 1 day after; lapsed reminders stop 30 days after expiry | `reminders.ts` `dueStage`, `REMINDER_WINDOW_DAYS` |
| F2 | Runner is an authenticated HTTP endpoint for whatever scheduler hosting provides (Vercel Cron, system cron `curl`, CI schedule) | with ADR-016 |
| F3 | Messages go to the outbox and stay `queued` until ADR-015 is decided; visible in Notifications and the admin screens | `reminders.service.ts` header |
| F4 | One reminder per stage per expiry cycle; none for revoked certificates | — |
| new | A per-certificate failure is counted and returned (HTTP 500 with counts) rather than aborting the run; the job.run row records `failed` | `reminders.service.ts`, `route.ts` |

## 6. Observations
1. **Delivery is not wired, by design and by module ownership.** `sendEmail` inserts its own row and then delivers, so it cannot be used for a row created inside the reminder transaction, and `notifications/email.ts` exports no "deliver this queued row" function. The service therefore leaves the row `queued` and prints the same one-line `[email:log]` entry the log transport would (recipient, template, subject, id — never the body). When ADR-015 is decided, a small `deliverQueued(id)` in `email.ts` (or a dispatcher over `status = queued`) delivers these and every other undelivered message; nothing in M7 needs to change. Until then the notification centre labels them honestly as "Queued".
2. `withTransaction` is bound to the process client; the service's optional `db` is used for reads only. Passing a transaction client would not nest the writes — documented in the function's comment.
3. The `considered` count is "certificates within ±30 days of today", so `skipped` includes both "nothing due today" and "already queued for this expiry". A finer split (`already` vs `not_due`) is a one-line change if the admin line should show it.
4. ICU prints "Sep" or "Sept" for en-GB depending on the runtime version; the admin "last run" line follows the runtime. Tests match either.
5. The holder's Notifications page also lists identity messages (verification, password reset) by subject — a useful side effect of reading the real outbox, but the founder may prefer to filter to `certificate.*` and `enquiry.*` templates.
6. The M8 plan's admin status board wants "last reminder run" too — `lastReminderRun()` is the function to call.

## 7. Deferred, by the approved decisions
Choosing the email provider (ADR-015) and the scheduler (with ADR-016) · auto-renewal (D10) · SMS or in-app push · a "resend" action for a failed message · `next build` and Playwright from this session (orchestrator).
