# CR-2026-10-03-1225 — Email platform foundation — provider, delivery, suppression, email log

**Received:** 2026-10-03 12:25 MYT · **Status:** DECIDED — founder answered 2026-10-03; build order below; `nodemailer` dependency APPROVED by the founder 2026-10-03 ("yes add nodemailer") · **Requested by:** founder · **Model:** opus

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
| 1 | Founder answers + approvals | **DONE** (§7); `nodemailer` APPROVED 2026-10-03 | 2026-10-03 |
| 2a | **Slice 1 — SMTP sender:** `nodemailer` + `@types/nodemailer` (dev); `src/modules/notifications/smtp.ts` (implicit TLS on 465 / STARTTLS required otherwise, TLS ≥ 1.2, timeouts, refused recipient = failure); `EMAIL_TRANSPORT=smtp` in `email.ts`; env validation of the five SMTP settings; `.env.example`; `npm run email:test`; `resend`/`postmark` removed | **DONE** — unit 751/751 | 2026-10-03 |
| 2b | **Slice 2 — reliability:** retry worker with back-off (route + timer, like the reminders), suppression list, Email log screen | NOT STARTED (needs schema: `last_attempt_at`, `idempotency_key`, `email_suppressions`) | — |
| 3 | Verify (tests, governance + security review) | IN PROGRESS | 2026-10-03 |
| 4 | Deploy slice 1 | **DONE** `v2026.10.03-3` | 2026-10-03 |
| 5 | Founder sets the SMTP settings on the server (root block), then `npm run email:test` | **AWAITING founder** | — |

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
| 2026-10-03 12:25 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
| 2026-10-03 12:40 | Founder answered D1–D6 (see §7): HostGator SMTP, sales@ sender, no public emails, strict activation + human check, tables approved, D5/D6 ok. |
| 2026-10-03 12:57 | Founder: the portal's address is now `sales@dataainexus.com` (CR-1257) — SMTP login and From use it; HostGator's mail host/port for that domain is typed by the founder in the server env. |
| 2026-10-03 13:10 | Founder: "yes add nodemailer, push it" — the RED dependency gate is cleared for `nodemailer` (MIT, no sub-dependencies) and its TypeScript types (`@types/nodemailer`, dev only). Slice 1: SMTP transport + env validation + a test-send script; slice 2: retry worker, suppression list, Email log. |
| 2026-10-03 13:30 | Founder: "Yes lets setup the Hostgator email in our portal" / "set SMTP and all related items to make sure emails works". Slice 1 built. **Order matters:** the code must be deployed BEFORE `EMAIL_TRANSPORT=smtp` is set on the server (an unknown transport value would fail validation at start-up). Then the founder types the five settings in `/etc/p4tc/production.env`; the assistant runs `npm run email:test` over SSH and checks the outbox. |
| 2026-10-03 14:10 | Slice 1 reviewed: governance PASS WITH NOTES, security STOP→fixed (see CR-1226 log), tests PASS. SMTP transport: implicit TLS 465 / STARTTLS required otherwise, TLS ≥ 1.2, certificate verification on, timeouts, refused recipient = failure, `to` as an address object, errors name variables never values. `npm audit --omit=dev`: nodemailer has no advisories; the audit lists 5 findings — 4 known (prisma → deepmerge-ts, mysql2) and 1 CRITICAL on `next` 16.3.3 (GHSA-vcvr-r3jv-pc5j, RCE in `next/og` ImageResponse; fixed in 16.3.6+, `fixAvailable` 16.3.8, not a major). The portal does not use `next/og`/ImageResponse, so it is not exploitable here — recommend a small upgrade CR (founder's word needed: a dependency change). |
| 2026-10-03 14:35 | **Pre-deploy checks on the exact code:** governance 843cf5d PASS WITH NOTES → re-check 830c18a PASS WITH NOTES (Y2 privacy text fixed; Y1 PDPA contact point and Y3 consent-version step remain founder items); security 843cf5d **STOP** → fixed → re-review 830c18a PASS WITH NOTES (no HIGH/MEDIUM; 4 LOW); test-verifier 830c18a PASS (tsc clean, 769/769). The 4 LOW notes were then applied as strict-only hardening in the next commit (client key must be a real IP else one `unknown` bucket and IPv4-mapped IPv6 = its IPv4; email local part narrowed to letters, digits and `. _ + -`; our admin link comes FIRST in the team email with everything after marked untrusted; control characters refused in the organisation field and blanked in the message) — unit 772/772 run by the assistant on that commit; the deploy gate re-runs tsc, Vitest, build and the full Playwright suite. |
| 2026-10-03 14:50 | **DEPLOYED `v2026.10.03-3` (`6649697`)** — gate green (tsc, Vitest, build, full Playwright), delta upload, 06-validate PASSED. Live: `/contact-us` shows the form and no mailto (only Infocentric's own address remains); privacy text names HostGator; FAQ answer refreshed (`db:seed` run on the server, idempotent). Production env is STILL `EMAIL_TRANSPORT=log` and `LEGAL_DOCUMENT_VERSIONS` 2026-10-02 until the founder runs the root block (SMTP settings + versions). |
