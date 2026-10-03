# CR-SPEC-2026-10-03-1227-event-emails-and-templates-sonnet — Emails on the person's actions (interest, payment, launch) with shared templates and preferences

**CR:** [CR-2026-10-03-1227-event-emails-and-templates-sonnet](../CR-2026-10-03-1227-event-emails-and-templates-sonnet.md) · **Recommended model:** Sonnet 5.5 — UI and wiring on top of the approved foundation · **Proposal:** [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

| # | Task | Files | Status | Notes |
|---|---|---|---|---|
| 1 | Founder: event list + copy review | — | OPEN | needs answers |
| 2 | Shared layout + template registry | `src/modules/notifications/templates/*` | OPEN |  |
| 3 | Wire events (interest, payment, registration, certificate, schedule) | commerce / certificates / identity modules | OPEN | depends on 1225 |
| 4 | Preference centre + unsubscribe link | `app/account/notifications`, `app/unsubscribe` | OPEN | needs table approval |
| 5 | Tests | `tests/*` | OPEN |  |

**Data model:** see the proposal §4 — every new table/column is a RED gate; SQL shown and approved before it is applied.
**Dependencies:** none new in the app; the external provider account is the founder's. **Rollback:** revert the commit; `EMAIL_TRANSPORT=log`; new tables are empty at first.
**Resume here:** open questions in the CR (§3). Nothing is built until they are answered.
