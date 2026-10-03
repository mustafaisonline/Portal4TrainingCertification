# CR-SPEC-2026-10-03-1229-trainer-bulk-and-individual-email-opus — Trainer dashboard: send bulk or individual email to interested / paid people

**CR:** [CR-2026-10-03-1229-trainer-bulk-and-individual-email-opus](../CR-2026-10-03-1229-trainer-bulk-and-individual-email-opus.md) · **Recommended model:** Opus 5.5 — security/legal-sensitive, new external service · **Proposal:** [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

| # | Task | Files | Status | Notes |
|---|---|---|---|---|
| 1 | Founder answers D5/D6 + table SQL approved | `prisma/` | OPEN | RED gate |
| 2 | Campaign model + audience resolver (own trainings only) | `src/modules/notifications/campaigns/*` | OPEN | depends on 1225, 1227 |
| 3 | Compose + preview + test send UI | `app/expert/*` or trainer dashboard route | OPEN |  |
| 4 | Batch sender + history + auto mark-as-notified | worker + `app/admin`/trainer pages | OPEN |  |
| 5 | Security tests + admin controls | `tests/*` | OPEN | security-review required |

**Data model:** see the proposal §4 — every new table/column is a RED gate; SQL shown and approved before it is applied.
**Dependencies:** none new in the app; the external provider account is the founder's. **Rollback:** revert the commit; `EMAIL_TRANSPORT=log`; new tables are empty at first.
**Resume here:** open questions in the CR (§3). Nothing is built until they are answered.
