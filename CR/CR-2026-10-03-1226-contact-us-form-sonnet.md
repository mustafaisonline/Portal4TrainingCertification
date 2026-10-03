# CR-2026-10-03-1226 — Contact Us form that emails the team

**Received:** 2026-10-03 12:26 MYT · **Status:** BUILT & VERIFIED — awaits the founder's deploy word · **Requested by:** founder · **Model:** sonnet

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

Spec: see `specs/`.

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers; table | **DONE — NO NEW TABLE:** the existing `enquiries` table, admin screens and audit already fit (kind general/programme interest/organisation, name, email, message, training, source page, status new/replied/closed); topics = those three kinds (support/partnership dropped) | 2026-10-03 |
| 2 | Form + server action + storage (`src/modules/catalogue/enquiries/*`, `app/(public)/contact-us/EnquiryForm.tsx`) | **DONE** — honeypot (silent), 5 per 10 min per client + 3 per hour per address (DB-backed), header-injection-safe, lower-cased address, reference = first 8 of the id | 2026-10-03 |
| 3 | Team notification + sender acknowledgement (outbox) | **DONE** — built; delivered once SMTP is wired (CR-1225); until then recorded in `outbound_emails` | 2026-10-03 |
| 4 | Admin: reply by email from `/admin/enquiries/[id]` (outbox + marks replied + audit `enquiry.replied`) | **DONE** — the existing list/detail/status screens kept | 2026-10-03 |
| 5 | Tests | **DONE** — unit 14 + e2e 8 (form, errors keep input, store + 2 emails, training link, honeypot, two rate limits, admin reply, axe light/dark); full suite on the production build 187/187; unit 737/737 | 2026-10-03 |
| 6 | Deploy | AWAITING founder's word | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:26 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
| 2026-10-03 12:40 | Founder answered D1–D6 (see §7): HostGator SMTP, sales@ sender, no public emails, strict activation + human check, tables approved, D5/D6 ok. |
| 2026-10-03 13:00 | Built on the existing Enquiry system (no schema change — a first draft of a new `contact_messages` table was rolled back on dev/test before anything was committed). Verified in dev (desktop and 375 px) and on the production build. |
