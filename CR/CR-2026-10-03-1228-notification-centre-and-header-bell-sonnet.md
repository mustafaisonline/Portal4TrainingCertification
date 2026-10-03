# CR-2026-10-03-1228 — Notification centre page and header bell with unread count

**Received:** 2026-10-03 12:28 MYT · **Status:** BUILT & VERIFIED — review + deploy next · **Requested by:** founder · **Model:** sonnet

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

Spec: see `specs/`.

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers | **DONE** ("go ahead with all of it"; recommended event list; polling every 60 s) | 2026-10-03 |
| 2 | Schema: `notifications` (new additive table + FK to users; migration `20261003063832_notifications`; SQL in the migration) — applied to dev + test; production at deploy (backup + sandbox) | **DONE (dev/test)** | 2026-10-03 |
| 3 | Repository + service (`src/modules/notifications/notifications.{repository,service}.ts`): per-person scoping on every query, dedupe by event, same-site links only, retention; `sendEmail` also creates the notification for an allow-listed template (never a verification/reset email), and the reminder job; a new Contact Us message notifies every active administrator | **DONE** | 2026-10-03 |
| 4 | Header bell (`NotificationBell`): unread badge (99+), latest five, mark all, see all, Escape/outside-click, accessible name "Notifications, N unread", polite live region; refreshed by a 60 s poll + on focus from `GET /api/me/notifications`; adopts fresh server counts after actions on the page | **DONE** | 2026-10-03 |
| 5 | Phones: measured — at 320 px the header has no room for a fifth control (the burger ends at 364 px), so the bell button shows from `sm` up and on phones the count is a badge on the avatar (`MobileUnreadBadge`, spoken in full) with "Notifications" in the account menu | **DONE** (design decision recorded) | 2026-10-03 |
| 6 | `/account/notifications` rebuilt: newest first, unread highlighted, filters (All · Unread · category), paging (20), mark read / unread / all, deep links that mark read on open, empty states | **DONE** | 2026-10-03 |
| 7 | Retention: read notifications older than 12 months are purged by the existing daily job route; unread kept | **DONE** | 2026-10-03 |
| 8 | Tests: integration 10 (scoping, dedupe, links, paging, retention, allow-list, admins) + e2e 8 (bell, poll, page, filters, admin notice, isolation, 320 px, axe light/dark); full unit/integration 807/807; affected existing specs updated (account menu order, reminders page) | **DONE** | 2026-10-03 |
| 9 | Review + deploy | IN PROGRESS | 2026-10-03 |
| 10 | NOT in this slice (own CRs): per-category/channel preferences and unsubscribe (with CR-1227/1229, marketing is opt-in); notifications for trainers (new interest) | OPEN | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:28 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
| 2026-10-03 12:40 | Founder answered D1–D6 (see §7): HostGator SMTP, sales@ sender, no public emails, strict activation + human check, tables approved, D5/D6 ok. |
| 2026-10-03 17:45 | Built while the founder was away. Findings: (a) the daily certificate-reminder job writes its email rows directly (status stays `queued` — written in M7 when no mail could be sent) so it bypassed `sendEmail`; it now also creates the bell notification, and — **important for CR-1225 slice 2** — those queued reminder emails will never be DELIVERED until a worker sends `queued` rows (not built yet); (b) after a page action the header bell kept its old client state until it adopted the new server values (fixed with a signature compare); (c) the bell's "Mark all" now clears every unread, not only the five shown. |
| 2026-10-03 18:05 | **Reviews on 5ca44ff:** governance PASS WITH NOTES (one REQUIRED fix: the unlocked-result notification said "certificate document" — DR-03 §3 / DR-04 — reworded to "Free Assessment Check result document" and linked to /assessment, guarded by a test); security PASS WITH NOTES (no HIGH; **MEDIUM: a contact-form flood could create unlimited unread administrator notices** → admin notices now sit under the same portal-wide caps as the emails (20/hour, 40/day, 300/30 days; the inbox still keeps every message); LOW: `?page=` clamped to 10,000, `isSafeLink` re-checked on read, the focus/visibility polls de-duplicated); tests PASS (807/807, migration applied). **Deploy runbook for the migration:** the pipeline takes its automatic backup and runs the migration in its sandbox first. **Rollback:** the old release ignores the table, so a code rollback needs no database action; a full reversal is `DROP TABLE notifications` plus removing its row from `_prisma_migrations` (the table holds only derived UX state). |
