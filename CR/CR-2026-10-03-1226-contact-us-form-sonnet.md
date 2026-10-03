# CR-2026-10-03-1226 — Contact Us form that emails the team

**Received:** 2026-10-03 12:26 MYT · **Status:** DEPLOYED (`v2026.10.03-3`) — emails deliver only after the SMTP env step · **Requested by:** founder · **Model:** sonnet

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
| 6 | Deploy | **DONE** — `v2026.10.03-3` | 2026-10-03 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:26 | CR created from the founder's message; existing code inspected read-only; proposal written. Nothing built. |
| 2026-10-03 12:40 | Founder answered D1–D6 (see §7): HostGator SMTP, sales@ sender, no public emails, strict activation + human check, tables approved, D5/D6 ok. |
| 2026-10-03 13:00 | Built on the existing Enquiry system (no schema change — a first draft of a new `contact_messages` table was rolled back on dev/test before anything was committed). Verified in dev (desktop and 375 px) and on the production build. |
| 2026-10-03 14:10 | **Security review (pre-deploy) found H1 + M1–M3 + L1–L6 — all fixed before deploy.** H1 (HIGH): the email-check regex backtracked quadratically — one crafted request could freeze the whole server → replaced by a linear, regex-free `isPlainEmailAddress` (`src/shared/util/email-address.ts`) + early size caps (a 2,000,000-character attack input is refused in < 50 ms; tested). M1: the rate limit was read-then-write (a parallel burst bypassed it) → one atomic statement under a per-key advisory lock (a burst of 60 lets exactly 5 through — integration test, 3 runs). M2: the acknowledgement could make our mailbox deliver attacker-chosen text → it is now FIXED text + reference (nothing typed is echoed, no name); plus a portal-wide cap of 60 messages/hour (HostGator's hourly limit is shared with registration mail) and the IP key reduced to the IPv6 /64. M3: `a,b@c.com` could mean two recipients → lists/display names refused; SMTP `to` is an address object. L3: honeypot renamed `hp_ref_code` (autofill-safe). L4: `sourcePath` must be a plain site path; the team email marks the sender's text as untrusted and keeps our link outside it. L5: a malformed `ENQUIRY_NOTIFY_EMAIL` falls back to the portal address. Not changed: L1 (slow table growth, bounded by the limits), L2 (SMTP is awaited inside the request, bounded by timeouts). Also from the governance review: privacy §2/§5/§7 now describe Contact Us messages and name HostGator as the email host (the "no email provider" line would have become false); refund §3 no longer says "your email reaches us"; the admin Reply refuses to say "sent" while mail is log-only in production (`emailDeliveryProblem`). Unit 769/769; e2e (contact, public, admin) 22/22.
| 2026-10-03 14:35 | **Pre-deploy checks on the exact code:** governance 843cf5d PASS WITH NOTES → re-check 830c18a PASS WITH NOTES (Y2 privacy text fixed; Y1 PDPA contact point and Y3 consent-version step remain founder items); security 843cf5d **STOP** → fixed → re-review 830c18a PASS WITH NOTES (no HIGH/MEDIUM; 4 LOW); test-verifier 830c18a PASS (tsc clean, 769/769). The 4 LOW notes were then applied as strict-only hardening in the next commit (client key must be a real IP else one `unknown` bucket and IPv4-mapped IPv6 = its IPv4; email local part narrowed to letters, digits and `. _ + -`; our admin link comes FIRST in the team email with everything after marked untrusted; control characters refused in the organisation field and blanked in the message) — unit 772/772 run by the assistant on that commit; the deploy gate re-runs tsc, Vitest, build and the full Playwright suite. |
| 2026-10-03 14:50 | **DEPLOYED `v2026.10.03-3` (`6649697`)** — gate green (tsc, Vitest, build, full Playwright), delta upload, 06-validate PASSED. Live: `/contact-us` shows the form and no mailto (only Infocentric's own address remains); privacy text names HostGator; FAQ answer refreshed (`db:seed` run on the server, idempotent). Production env is STILL `EMAIL_TRANSPORT=log` and `LEGAL_DOCUMENT_VERSIONS` 2026-10-02 until the founder runs the root block (SMTP settings + versions). |
| 2026-10-03 15:40 | Global caps retuned for the SMTP2GO free quota (1,000 emails/month shared with sign-up and replies; each message = 2 emails): 20 messages/hour and 40/day portal-wide (was 60/hour for the HostGator limit). Governance + tests PASS on `de159c7`; founder approved deploying the corrected privacy wording while away. |
| 2026-10-03 14:15 | **Pre-deploy checks on 2dd7e07:** governance PASS WITH NOTES (the "warning + failed row + log" design judged legitimate, not a hidden fallback); security PASS WITH NOTES (no HIGH; one MEDIUM: the portal-wide caps could discard real messages / lock the form for everyone); tests PASS (775/775). **MEDIUM applied in the next commit exactly as recommended:** per-visitor limits (client, address) alone decide whether a message is ACCEPTED; the portal-wide caps (20/hour, 40/day, 300/30 days = 600 emails of the monthly 1,000) now gate ONLY whether the two emails are sent — over a cap the message is stored, the visitor sees the normal thank-you, and the team reads it in Admin → Enquiries (new e2e proves it). Also: `.catch` on the two `void sendEmail(...)` calls in auth.ts. Left as noted: an invalid `EMAIL_TRANSPORT` value (a typo) still refuses to start (fail-closed on purpose); no retry worker yet — a mail recorded `failed` is not re-sent (CR-1225 slice 2). |
| 2026-10-03 14:05 | **DEPLOYED `v2026.10.03-5` (`2291000`)** — gate green (the earlier `-4` had been aborted by the flaky title race, now fixed), 06-validate PASSED. Live: privacy names SMTP2GO; incomplete SMTP env can no longer take the portal down; the portal-wide caps gate only the emails. Production env is `EMAIL_TRANSPORT=log` (restored). `-4` was never deployed. |
