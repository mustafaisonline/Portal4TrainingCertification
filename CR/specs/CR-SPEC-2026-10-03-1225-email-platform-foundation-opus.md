# CR-SPEC-2026-10-03-1225-email-platform-foundation-opus — Email platform foundation — provider, delivery, suppression, email log

**CR:** [CR-2026-10-03-1225-email-platform-foundation-opus](../CR-2026-10-03-1225-email-platform-foundation-opus.md) · **Recommended model:** Opus 5.5 — security/legal-sensitive, new external service · **Proposal:** [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

| # | Task | Files | Status | Notes |
|---|---|---|---|---|
| 1 | Founder decisions D1–D4 | — | OPEN | needs answers |
| 2 | Written case + SQL for approval | docs, `prisma/` (proposal only) | OPEN | RED gate |
| 3 | Transport + worker + retry + idempotency | `src/modules/notifications/*`, `app/api/jobs/*` | BUILT (dev/test) | slice 1 SMTP deployed; slice 2 verifying |
| 4 | Suppression list (no webhooks: HostGator/SMTP2GO bounce mail is handled by staff) | `src/modules/notifications/*` | BUILT (dev/test) | SQL approved 2026-10-03 |
| 5 | Email log screen (admin) | `app/admin/email/*` | BUILT (dev/test) |  |
| 6 | Account confirmation + reset delivered | identity module | OPEN | depends on D4 |
| 7 | DNS + env (founder), live test, Privacy update | `/etc/p4tc/production.env`, DNS, `src/content/legal/privacy.ts` | OPEN | founder + assistant |

**Data model:** see the proposal §4 — every new table/column is a RED gate; SQL shown and approved before it is applied.
**Dependencies:** none new in the app; the external provider account is the founder's. **Rollback:** revert the commit; `EMAIL_TRANSPORT=log`; new tables are empty at first.
**Resume here:** slice 2 is built and under review; next is commit → tag → deploy (migration `20261003120000_*`), then the founder's SMTP2GO steps and the server timer (`deploy/systemd/p4tc-email.*`, needs `JOBS_SECRET`). Rollback: revert the commit; drop `email_suppressions` and the three `outbound_emails` columns in dev/test (see the CR log, 21:10).

**SCHEMA CHANGE APPROVED BY FOUNDER** — slice 2, 2026-10-03: `outbound_emails` + `last_attempt_at`, `next_attempt_at`, `idempotency_key` (unique where not null); new table `email_suppressions` (unique lower-cased address). Exactly the SQL in the CR progress log entry of 2026-10-03 19:30.
