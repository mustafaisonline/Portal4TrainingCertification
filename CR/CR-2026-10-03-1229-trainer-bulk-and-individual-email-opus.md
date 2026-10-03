# CR-2026-10-03-1229 — Trainer dashboard: send bulk or individual email to interested / paid people

**Received:** 2026-10-03 12:29 MYT · **Status:** BLOCKED — proposal awaiting the founder's decisions (RED gate: new external service / new tables) · **Requested by:** founder · **Model:** opus

## 1. Request (verbatim)

> * Now let's connect email with our portal.
>    * Then from Trainers dashboard, training should be able to send bulk or individual email to people who has either registered their interest for a course. Pay for a training course launch.
>    * … Please elaborate all the best practice features we should have in our portal with respect to this email feature.

## 2. Facts gathered

- Today the trainer's Users Interest tab only offers copy-emails, a BCC draft in the trainer's own mail app, CSV, and *mark as notified* — the portal sends nothing. Authorisation for the tab already limits a trainer to their own trainings.
- This is the highest-risk email feature (sender reputation, PDPA, abuse). Best-practice list: proposal §3F; data model §4.

Full proposal and best-practice checklist: [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

## 3. Open questions for the founder (with recommendations)

1. **D5** who may be emailed: only people interested in / paid for the trainer's own trainings, about that training (recommended); promotional content only to marketing-opted-in people.
2. **D6** confirmation threshold for large sends (suggest 50) and a daily cap per trainer (suggest 200) — your numbers.
3. **D3** — `email_campaigns`, `email_campaign_recipients` (RED, SQL approval).
4. Individual email: from the interest list row, and also from a registered participant?
5. Attachments: none in v1 (recommended).

## 4. Plan (after the answers; on the founder's "go")

Compose screen (audience picker, subject, message with merge tokens, preview, test send, send/schedule) → recipient preview with suppressions removed → one personalised email per person via the outbox (never BCC) → throttled batches → campaign history with per-recipient status → auto-mark-as-notified → audit; administrator pause/disable; tests for authorisation (a trainer cannot reach another trainer's audience), suppression, cap, no address leaks.

## 5. Tracker

See the spec: [CR-SPEC-2026-10-03-1229-trainer-bulk-and-individual-email-opus](specs/CR-SPEC-2026-10-03-1229-trainer-bulk-and-individual-email-opus.md).

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers + approvals | **AWAITING founder** | — |
| 2 | Build | NOT STARTED | — |
| 3 | Verify (tests, review, security where noted) | NOT STARTED | — |
| 4 | Deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:29 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
