# CR-2026-10-03-1228 — Notification centre page and header bell with unread count

**Received:** 2026-10-03 12:28 MYT · **Status:** BLOCKED — proposal awaiting the founder's decisions (RED gate: new external service / new tables) · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> * When we need a notification dedicated page and an Ican in the header sow when there is a email generated a notification is initiated. The icons gets highlight with number of unreal notifications etc.
>    * Please elaborate all the best practice features we should have in our portal with respect to this email feature.

## 2. Facts gathered

- `/account/notifications` exists but only lists `outbound_emails` rows by address (subject/time/status); there is no read state, no header icon and no in-app notification model. Header work in flight/finished: avatar visible on phones, first-name label, burger scroll (CR-2012/2013/2016, deployed) — the bell must fit the 320 px header.
- Best-practice list: proposal §3G.

Full proposal and best-practice checklist: [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

## 3. Open questions for the founder (with recommendations)

1. **D3** — new table `notifications` (RED, SQL approval).
2. Refresh by polling every 60 s + on focus (recommended, no new technology) or something heavier later?
3. Which events create a notification in v1? Recommended: payment/registration confirmed, interest registered, schedule announced/changed, certificate issued/expiring, trainer message; internal: new interest, new contact message, failed emails.

## 4. Plan (after the answers; on the founder's "go")

`notifications` table + repository; creating a notification from the same places that create emails (one helper); header bell with badge (99+ cap, aria-live, keyboard), dropdown of the latest 5; `/account/notifications` rebuilt: unread highlight, mark read/unread/all, filter, pagination, deep links; authenticated polling endpoint; retention job; tests incl. 320 px and axe.

## 5. Tracker

See the spec: [CR-SPEC-2026-10-03-1228-notification-centre-and-header-bell-sonnet](specs/CR-SPEC-2026-10-03-1228-notification-centre-and-header-bell-sonnet.md).

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers + approvals | **AWAITING founder** | — |
| 2 | Build | NOT STARTED | — |
| 3 | Verify (tests, review, security where noted) | NOT STARTED | — |
| 4 | Deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:28 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
