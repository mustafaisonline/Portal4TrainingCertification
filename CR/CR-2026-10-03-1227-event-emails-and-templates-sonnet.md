# CR-2026-10-03-1227 — Emails on the person's actions (interest, payment, launch) with shared templates and preferences

**Received:** 2026-10-03 12:27 MYT · **Status:** BLOCKED — proposal awaiting the founder's decisions (RED gate: new external service / new tables) · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> * Now let's connect email with our portal.
>    * What ever action user do on portal e.g., register their interest for a course. Pay for a training course launch.
>    * … Please elaborate all the best practice features we should have in our portal with respect to this email feature.

## 2. Facts gathered

- Templates already queued in code: verify-email, reset-password, registration confirmed/cancelled/transferred, interest-registered, support-received, knowledge-check-unlocked, certificate issued/renewed + reminders — none delivered today. Proposal §3E lists the full event map (incl. new ones: trainer notified of a new interest; training date opens/changes/cancelled).
- `User.marketingConsentAt` exists; Privacy §4: no marketing without opt-in.

Full proposal and best-practice checklist: [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

## 3. Open questions for the founder (with recommendations)

1. **D3** — `email_preferences` (RED, SQL approval).
2. Which events are in the first release? Recommended: confirmation, reset, interest registered (person + trainer), payment/registration confirmed, certificate issued; the rest next.
3. Wording of each email is business copy — drafts will be shown to the founder before going live.

## 4. Plan (after the answers; on the founder's "go")

One shared HTML+text layout; template registry with versioned copy; wire each event to enqueue via the existing outbox with an idempotency key; footer (identity, address, privacy link); service vs marketing split; unsubscribe/preference centre for marketing; tests that assert one email per event and none to suppressed addresses.

## 5. Tracker

See the spec: [CR-SPEC-2026-10-03-1227-event-emails-and-templates-sonnet](specs/CR-SPEC-2026-10-03-1227-event-emails-and-templates-sonnet.md).

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers + approvals | **AWAITING founder** | — |
| 2 | Build | NOT STARTED | — |
| 3 | Verify (tests, review, security where noted) | NOT STARTED | — |
| 4 | Deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:27 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
