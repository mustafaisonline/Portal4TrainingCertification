# CR-SPEC-2026-10-03-1225-email-platform-foundation-opus — Email platform foundation — provider, delivery, suppression, email log

**CR:** [CR-2026-10-03-1225-email-platform-foundation-opus](../CR-2026-10-03-1225-email-platform-foundation-opus.md) · **Recommended model:** Opus 5.5 — security/legal-sensitive, new external service · **Proposal:** [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

| # | Task | Files | Status | Notes |
|---|---|---|---|---|
| 1 | Founder decisions D1–D4 | — | OPEN | needs answers |
| 2 | Written case + SQL for approval | docs, `prisma/` (proposal only) | OPEN | RED gate |
| 3 | Transport + worker + retry + idempotency | `src/modules/notifications/*`, `app/api/jobs/*` | OPEN |  |
| 4 | Suppression + bounce/complaint webhooks + `email_events` | `src/modules/notifications/*`, `app/api/email/webhook` | OPEN | after SQL approval |
| 5 | Email log screen (admin) | `app/admin/email/*` | OPEN |  |
| 6 | Account confirmation + reset delivered | identity module | OPEN | depends on D4 |
| 7 | DNS + env (founder), live test, Privacy update | `/etc/p4tc/production.env`, DNS, `src/content/legal/privacy.ts` | OPEN | founder + assistant |

**Data model:** see the proposal §4 — every new table/column is a RED gate; SQL shown and approved before it is applied.
**Dependencies:** none new in the app; the external provider account is the founder's. **Rollback:** revert the commit; `EMAIL_TRANSPORT=log`; new tables are empty at first.
**Resume here:** open questions in the CR (§3). Nothing is built until they are answered.
