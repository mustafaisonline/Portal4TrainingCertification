# CR-2026-10-02-2015 — Email API and confirmation email after creating an account — ACTIVATES the deferred provider decision

**Received:** 2026-10-02 20:15 MYT · **Status:** BLOCKED on the founder's provider choice — RED gate (new external service) · **Requested by:** founder

## 1. Request (verbatim)

> ⁠Email Api and confirmation after creating new account

*Source: Founder message of 2026-10-02 ("New more change …", seven bullets; the CR for them was requested: "Add a new CR for these requirements").*

## 2. Facts gathered (read-only; nothing changed yet)

- This activates **CR-2026-10-02-0626** (email provider, DEFERRED on 2026-10-02: "We will do it later. Please remind me later."); it is now wanted.
- Production runs `EMAIL_TRANSPORT=log`: nothing is delivered. The code (`src/modules/notifications/email.ts`) already writes every email to the durable table `outbound_emails` first and then calls a transport; **`resend` and `postmark` are recognised in `src/config/env.ts` but NOT implemented** — selecting one throws by design (no silent fallback). So the missing piece is a transport implementation + credentials + a sending domain, not the queue/outbox.
- Templates already decided by the system (e.g. `identity.verify-email`, password reset, receipts, reminders) are queued today but never leave the server. A `/verify-email` route exists.
- `dataainexus.com` DNS is at HostGator (A records only; no MX/SPF/DKIM yet), so a provider needs SPF/DKIM (and DMARC) records added there.
- Privacy §5 says "email provider — none at present": must be updated the day a provider is live (and the provider named).

## 3. Open questions for the founder

1. **Which provider?** Resend and Postmark are the two already recognised in the code (either is a small, well-documented HTTPS API). Others (SES, SendGrid, SMTP) would also be new. Recommendation to be written as the formal case once you pick.
2. **Sending address**: e.g. `no-reply@dataainexus.com` for system mail and `sales@yourpartnertechnologies.com` as Reply-To? Is the domain's DNS editable by you at HostGator (SPF/DKIM records are needed)?
3. **Confirmation behaviour**: after registering, must the person click the email link **before they can sign in** (strict), or may they use the portal and only be reminded (soft)? What does the portal do today in each case should be confirmed before changing it.
4. Which emails go live first: account confirmation + password reset only (recommended), then receipts/reminders?

## 4. Plan (after the answers; one CR at a time, on the founder's "go")

Written case for approval (problem, why the existing `log` transport is insufficient, provider options, cost, PDPA/data-transfer note, risks, rollback = set `EMAIL_TRANSPORT=log`) → founder approves provider → founder creates the account and adds API key to `/etc/p4tc/production.env` (root-owned; the assistant never handles the key) and the DNS records → implement the one transport behind the existing interface, with tests using a fake HTTP server (never real mail in CI) → deploy → send a real confirmation to a founder-controlled address → update Privacy §5 and the Terms if needed → verify the outbox rows move queued → sent.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder: provider, sender, confirmation behaviour | **AWAITING founder** | — |
| 2 | Written case + approval (RED gate) | NOT STARTED | — |
| 3 | Account, API key (founder), DNS SPF/DKIM (founder) | NOT STARTED | — |
| 4 | Implement transport + tests | NOT STARTED | — |
| 5 | Deploy + live test + Privacy §5 | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:15 | CR created from the founder's list. Facts gathered read-only. CR-0626 is marked ACTIVATED by this CR. |
| 2026-10-02 | run-cr 2026-10-02: kept OPEN (BLOCKED) — RED gate (new external service): the founder must choose the email provider (Resend or Postmark), the sending address, and confirm DNS access. Re-run run-cr after the decision. |
| 2026-10-02 | Founder: "let this CR there" — kept open and blocked (RED gate: provider not chosen). |
