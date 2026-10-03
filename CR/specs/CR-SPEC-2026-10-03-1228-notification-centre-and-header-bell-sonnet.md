# CR-SPEC-2026-10-03-1228-notification-centre-and-header-bell-sonnet — Notification centre page and header bell with unread count

**CR:** [CR-2026-10-03-1228-notification-centre-and-header-bell-sonnet](../CR-2026-10-03-1228-notification-centre-and-header-bell-sonnet.md) · **Recommended model:** Sonnet 5.5 — UI and wiring on top of the approved foundation · **Proposal:** [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

| # | Task | Files | Status | Notes |
|---|---|---|---|---|
| 1 | Founder answers; table SQL approved | `prisma/` | OPEN | RED gate |
| 2 | Table + repository + helper | `src/modules/notifications/*` | OPEN |  |
| 3 | Header bell + dropdown + polling endpoint | `src/shared/chrome/*`, `app/api/me/notifications` | OPEN | coordinate with avatar/burger |
| 4 | Notifications page rebuilt | `app/account/notifications/*` | OPEN |  |
| 5 | Tests (unit, e2e, 320 px, axe) | `tests/*` | OPEN |  |

**Data model:** see the proposal §4 — every new table/column is a RED gate; SQL shown and approved before it is applied.
**Dependencies:** none new in the app; the external provider account is the founder's. **Rollback:** revert the commit; `EMAIL_TRANSPORT=log`; new tables are empty at first.
**Resume here:** open questions in the CR (§3). Nothing is built until they are answered.
