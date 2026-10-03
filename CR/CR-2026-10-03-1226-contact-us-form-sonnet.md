# CR-2026-10-03-1226 — Contact Us form that emails the team

**Received:** 2026-10-03 12:26 MYT · **Status:** BLOCKED — proposal awaiting the founder's decisions (RED gate: new external service / new tables) · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> * Now let's connect email with our portal.
>    * Means on contact us page, we should create a form for user to send email to us.

## 2. Facts gathered

- `/contact-us` has no form today (removed in M15 on the founder's 2026-09-29 instruction); it shows details and `mailto:` links. Best-practice list: proposal §3D.
- Needs the foundation (CR-1225) to deliver; the form can be built and tested against the `log` transport first.

Full proposal and best-practice checklist: [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

## 3. Open questions for the founder (with recommendations)

1. **D3** — new table `contact_messages` (RED, SQL for approval).
2. Topics list OK? (general · training enquiry · organisation screening · support · partnership)
3. Who receives it: `sales@yourpartnertechnologies.com` only, or also the administrators' in-app notification (CR-1228)?

## 4. Plan (after the answers; on the founder's "go")

Server action + zod validation; honeypot and rate limit; store first, then email the team and send the sender an acknowledgement with a reference; admin inbox (new/answered/spam, reply from the portal); accessible, works without JavaScript; e2e + axe.

## 5. Tracker

See the spec: [CR-SPEC-2026-10-03-1226-contact-us-form-sonnet](specs/CR-SPEC-2026-10-03-1226-contact-us-form-sonnet.md).

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers + approvals | **AWAITING founder** | — |
| 2 | Build | NOT STARTED | — |
| 3 | Verify (tests, review, security where noted) | NOT STARTED | — |
| 4 | Deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:26 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
