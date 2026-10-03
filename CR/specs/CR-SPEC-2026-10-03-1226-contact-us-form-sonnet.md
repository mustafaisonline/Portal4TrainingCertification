# CR-SPEC-2026-10-03-1226-contact-us-form-sonnet — Contact Us form that emails the team

**CR:** [CR-2026-10-03-1226-contact-us-form-sonnet](../CR-2026-10-03-1226-contact-us-form-sonnet.md) · **Recommended model:** Sonnet 5.5 — UI and wiring on top of the approved foundation · **Proposal:** [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

| # | Task | Files | Status | Notes |
|---|---|---|---|---|
| 1 | Founder answers; table SQL approved | `prisma/` | OPEN | RED gate |
| 2 | Form + server action + storage | `app/(public)/contact-us/*`, `src/modules/contact/*` | OPEN |  |
| 3 | Team email + acknowledgement | uses CR-1225 transport | OPEN | depends on 1225 |
| 4 | Admin inbox (list, reply, mark spam) | `app/admin/contact/*` | OPEN |  |
| 5 | Tests (e2e, axe, rate limit, honeypot) | `tests/*` | OPEN |  |

**Data model:** see the proposal §4 — every new table/column is a RED gate; SQL shown and approved before it is applied.
**Dependencies:** none new in the app; the external provider account is the founder's. **Rollback:** revert the commit; `EMAIL_TRANSPORT=log`; new tables are empty at first.
**Resume here:** open questions in the CR (§3). Nothing is built until they are answered.
