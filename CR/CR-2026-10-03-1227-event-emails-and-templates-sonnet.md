# CR-2026-10-03-1227 — Emails on the person's actions (interest, payment, launch) with shared templates and preferences

**Received:** 2026-10-03 12:27 MYT · **Status:** DECIDED — founder answered 2026-10-03; build order below; awaiting the `nodemailer` dependency yes · **Requested by:** founder · **Model:** sonnet

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
| 1 | Founder answers + approvals | **DONE** (§7); only the `nodemailer` dependency yes is open | 2026-10-03 |
| 2 | Build | NOT STARTED | — |
| 3 | Verify (tests, review, security where noted) | NOT STARTED | — |
| 4 | Deploy | NOT STARTED | — |

## 7. Founder's decisions (2026-10-03 12:40 MYT) — recorded verbatim, then how they are applied

> 1 = I have emails on Hostgator .com where i have emails attached with yourpartnertechnologies.com. as from now on, we will not show email on the portal, means wherever way user want to conenct with portal staff, the control will tkae user to the contract us page, from where user can use the form (pelase create one, if not there) to send us email. Don't use anything which need to fee.
> 2 = no-reply@dataainexus.com ignore it. and use this sales@yourpartnertechnologies.com every. But no need to show user when we will reply then yes user will see this email: sales@yourpartnertechnologies.com
> 3 = Please go ahead as per the best practices.
> 4 = For sign-up, please send confirmation email with activation Link. Once user click this link, it should open new webpage and get confiramtion at database level to convfirme user is correct user. please also introduce that features that when user signup, it should show that verfiication game i.e. to verfiy whether user createing new account is ahuman or not
> 5 = Ok
>
> Provide is hostgator.com. Current email is sales@yourpartnertechnologies.com later we will change to dataasinexus.com email

**How applied (assistant's reading — shout if wrong):**
- **D1 provider = HostGator** (the mailbox already exists; free): the portal sends through HostGator's **SMTP** server with the `sales@yourpartnertechnologies.com` account. No paid service. Postmark/Resend/SES are dropped. HostGator has **no webhooks** → bounce/complaint handling is by mail in that mailbox and a manual/admin suppression list (the "email events" table is not needed now).
- **D2 sender** = `sales@yourpartnertechnologies.com` for everything (From and Reply-To); `no-reply@dataainexus.com` is dropped. It is changed later to a `dataainexus.com` address by changing **one setting** (`EMAIL_FROM` + SMTP login), no code change.
- **No email address is shown on the portal.** Every "contact us" path leads to the Contact Us page and its form (CR-2026-10-03-1246). People see the address only when staff reply by email.
- **D3 tables = approved "as per best practices":** the SQL is shown in each CR's build step; applied to dev/test; production receives it only when the founder deploys.
- **D4 = strict activation:** sign-up sends an activation link; the link opens a confirmation page and sets `users.email_verified_at` in the database; until then the account cannot sign in. Plus a **human check ("verification game")** on the sign-up form — see CR-2026-10-03-1245.
- **D5/D6 = "Ok"** to the proposed rules (own-training audience only, promotional only to opted-in people, second confirmation above 50 recipients, daily cap per trainer 200).
- **Only new dependency needed:** an SMTP client library (`nodemailer`, MIT, no sub-dependencies) — a RED item; **awaiting the founder's explicit yes** (the alternative, writing our own SMTP client, is riskier). Everything else is built with the existing stack.
- **Founder actions later (the assistant never handles secrets):** type `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` into the root-owned `/etc/p4tc/production.env` and set `EMAIL_TRANSPORT=smtp`. HostGator shared mail has an hourly send limit (commonly cited around 500/hour — **to be confirmed with HostGator**), so bulk sends are throttled and capped accordingly.

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:27 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
| 2026-10-03 12:40 | Founder answered D1–D6 (see §7): HostGator SMTP, sales@ sender, no public emails, strict activation + human check, tables approved, D5/D6 ok. |
