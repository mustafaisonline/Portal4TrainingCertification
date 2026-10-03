# CR-2026-10-03-1225 — Email platform foundation — provider, delivery, suppression, email log

**Received:** 2026-10-03 12:25 MYT · **Status:** BLOCKED — proposal awaiting the founder's decisions (RED gate: new external service / new tables) · **Requested by:** founder · **Model:** opus

## 1. Request (verbatim)

> * Now let's connect email with our portal.
>    * Means on contact us page, we should create a form for user to send email to us.
>    * What ever action user do on portal e.g., register their interest for a course. Pay for a training course launch.
>    * … Please elaborate all the best practice features we should have in our portal with respect to this email feature.

## 2. Facts gathered

- Supersedes the PARKED CR-2026-10-02-2015 (email provider / confirmation email): the founder has now activated it ("Now let's connect email with our portal").
- `src/modules/notifications/email.ts` already queues every email in `outbound_emails` first; `resend` / `postmark` transports are named but not implemented; production runs `EMAIL_TRANSPORT=log` (nothing delivered); DNS for `dataainexus.com` has no MX/SPF/DKIM/DMARC. Details and the best-practice list: the proposal §1, §3A–B.

Full proposal and best-practice checklist: [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

## 3. Open questions for the founder (with recommendations)

1. **D1 provider** — recommendation: Postmark (separate transactional/broadcast streams, webhooks); alternatives Resend, SES.
2. **D2 sending identity** — `no-reply@dataainexus.com`, Reply-To `sales@yourpartnertechnologies.com`.
3. **D3 tables/columns** (RED) — `email_suppressions`, `email_events`, extra columns on `outbound_emails` (proposal §4) — SQL will be shown for approval before anything is applied.
4. **D4** account confirmation: soft (recommended) or strict.
5. Founder actions later (the assistant never handles keys): create the provider account, add the API key to the root-owned `/etc/p4tc/production.env`, add the SPF/DKIM/DMARC DNS records at HostGator.

## 4. Plan (after the answers; on the founder's "go")

Written case for approval (RED: new external service) → approval → implement one transport behind the existing interface (fake-HTTP tests only; no real mail in CI) + worker with retry/back-off + idempotency + suppression + webhook endpoint (signature-verified) + Email log screen → deploy → send a real confirmation/reset to a founder address → update Privacy §5/§7. Rollback: `EMAIL_TRANSPORT=log`.

## 5. Tracker

See the spec: [CR-SPEC-2026-10-03-1225-email-platform-foundation-opus](specs/CR-SPEC-2026-10-03-1225-email-platform-foundation-opus.md).

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers + approvals | **AWAITING founder** | — |
| 2 | Build | NOT STARTED | — |
| 3 | Verify (tests, review, security where noted) | NOT STARTED | — |
| 4 | Deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:25 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
