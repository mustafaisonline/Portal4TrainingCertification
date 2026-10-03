# Email and in-app notifications — proposal and best-practice checklist

**Status:** PROPOSAL for the founder's decision (2026-10-03, MYT). Nothing here is built. Requested in the founder's message of 2026-10-03 ("Now let's connect email with our portal …"); tracked by CR-2026-10-03-1225 … -1229. Every item marked **RED** needs the founder's explicit approval first (CLAUDE.md: new external service, new tables).

## 0. Founder's decisions (2026-10-03 12:40 MYT) — these override the recommendations in §2
> 1 = I have emails on Hostgator .com where i have emails attached with yourpartnertechnologies.com. as from now on, we will not show email on the portal, means wherever way user want to conenct with portal staff, the control will tkae user to the contract us page, from where user can use the form (pelase create one, if not there) to send us email. Don't use anything which need to fee.
> 2 = no-reply@dataainexus.com ignore it. and use this sales@yourpartnertechnologies.com every. But no need to show user when we will reply then yes user will see this email: sales@yourpartnertechnologies.com
> 3 = Please go ahead as per the best practices.
> 4 = For sign-up, please send confirmation email with activation Link. Once user click this link, it should open new webpage and get confiramtion at database level to convfirme user is correct user. please also introduce that features that when user signup, it should show that verfiication game i.e. to verfiy whether user createing new account is ahuman or not
> 5 = Ok
>
> Provide is hostgator.com. Current email is sales@yourpartnertechnologies.com later we will change to dataasinexus.com email

Applied: **HostGator SMTP** (free, existing `sales@yourpartnertechnologies.com` mailbox; Postmark/Resend dropped — and with them the bounce/complaint webhooks and `email_events`: bounces arrive as mail in that mailbox); sender `sales@yourpartnertechnologies.com` for everything, changed later by one setting; **no email address on the portal** — everything goes through the Contact Us form; tables approved; **strict activation** with an emailed link plus a **human check at sign-up**; trainer-mail rules accepted. Open: the `nodemailer` dependency (RED) needs an explicit yes.

## 1. What exists today (verified in the repository, 2026-10-03)

| Area | Fact |
|---|---|
| Sending | `src/modules/notifications/email.ts`: every email is first written to the durable table `outbound_emails` (status `queued`), then a transport delivers it and the row becomes `sent` / `failed`. Transports `log` (production today — **nothing is delivered**), `resend` and `postmark` are named in `src/config/env.ts` but **not implemented** (selecting one throws, by design; no silent fallback). |
| Templates already decided in code | `identity.verify-email`, `identity.reset-password`, `commerce.registration-confirmed`, `-cancelled`, `-transferred`, `commerce.interest-registered`, `commerce.support-received`, `commerce.knowledge-check-unlocked`, certificate issued / renewed and the expiry-reminder stages. They are queued today and simply never leave the server. |
| Notification page | `/account/notifications` lists the person's `outbound_emails` rows by their address (subject, time, status — never the body). There is **no read/unread state**, **no header icon**, and in-app notifications do not exist as a concept separate from email. |
| Contact Us | `/contact-us` has **no form**: it shows contact details and `mailto:` links (the form was removed in Milestone 15 on the founder's 2026-09-29 instruction). |
| Trainer tooling | The trainer's "Users Interest" tab (CR-2138) offers *copy emails*, a *BCC draft* (opens the trainer's own mail app), CSV, and *mark as notified*. The portal sends nothing. |
| Consent data | `User.marketingConsentAt` exists; the interest form has a "the trainer may contact you" tick; Privacy §4 says no marketing without a separate opt-in. |
| Scheduled work | A systemd timer calls `/api/jobs/certificate-reminders` (secret-protected) — the pattern for any queue worker. |
| Domain / DNS | `dataainexus.com` DNS is at HostGator; **no MX, SPF, DKIM or DMARC records exist yet**. |

## 2. The decisions only the founder can make

| # | Decision | Recommendation |
|---|---|---|
| D1 | **Email provider** (new external service — RED) | **Postmark.** It separates *transactional* and *broadcast* streams (so a trainer's bulk mail can never damage the reputation of password-reset emails), has a simple HTTPS API, and bounce/complaint webhooks. Alternatives: *Resend* (simpler, cheaper start; one stream), *Amazon SES* (cheapest, most setup work). The code already recognises `postmark` and `resend`. Check each provider's current price and Malaysian/PDPA data-transfer terms before choosing. |
| D2 | **Sending identity** | From `no-reply@dataainexus.com` (display name "DataAI Nexus"); **Reply-To** `sales@yourpartnertechnologies.com` so replies reach a human. Trainer mail: From stays the portal's domain (never a trainer's personal address — spoofing/DMARC), display name "Trainer name via DataAI Nexus", Reply-To the trainer's own address. |
| D3 | **Database changes** (RED — each needs the SQL approved first) | See §4. Recommended set: `notifications`, `contact_messages`, `email_suppressions`, `email_campaigns` + `email_campaign_recipients`, `email_events`, and extra columns on `outbound_emails`. |
| D4 | **Account confirmation** | After registering: *soft* (they can use the portal; a banner and the email ask to confirm; paying/registering for a training requires a confirmed address) — recommended; or *strict* (cannot sign in until confirmed). |
| D5 | **Who may bulk-email whom** | Trainers: only people who registered **interest in, or paid for, their own trainings**, and only about that training (schedule, joining details, changes). Anything promotional additionally needs the person's **marketing opt-in**. Administrator: everyone with a lawful basis, always with audit. |
| D6 | **Approval for large sends** | Any send to more than N people (suggest N = 50) needs a second confirmation step ("You are about to email 312 people") and the administrator can switch bulk sending off globally. |

## 3. Best-practice feature list

### A. Deliverability and trust (the foundation)
1. **SPF, DKIM and DMARC** on `dataainexus.com` (DMARC starts at `p=none`, moves to `quarantine` after clean reports); a dedicated sending sub-domain (`mail.dataainexus.com`) is the clean way to keep it separate from the website.
2. **Plain text and HTML** versions of every email; a simple, accessible, mobile-first HTML layout (single column, real text, good contrast, no image-only content), one shared brand template.
3. **Transactional vs marketing kept apart** — different stream, different footer, different rules. Service messages (confirmations, receipts, security, schedule changes for something you registered) are not optional; marketing is opt-in only (PDPA, Privacy §4).
4. **One-click unsubscribe** for anything non-transactional: signed link + `List-Unsubscribe` and `List-Unsubscribe-Post` headers (required by Gmail/Yahoo for bulk senders), plus a **preference centre** in the account area (per category).
5. **Suppression list** — hard bounces, spam complaints and unsubscribes are never emailed again; checked on every send, including bulk.
6. **Bounce and complaint webhooks** from the provider update the outbox row and the suppression list; delivery events (delivered / opened is *not* tracked by default — privacy) are stored in `email_events`.
7. **Link and token safety** — verification and reset links are single-use, short-lived, never logged and never shown on a page (already the rule today); no tracking pixels or click-tracking redirects by default (privacy; fewer spam-filter hits).
8. Identity verified **before** sending: the From domain is verified at the provider, the Reply-To is monitored.

### B. Reliability
9. **Outbox + worker** — keep the existing "write first, send second" design; add a worker (the same secret-protected job route + timer pattern as the reminders) that sends `queued` rows in small batches, with **retry and exponential back-off**, a maximum attempt count, and a `failed` state visible to the administrator.
10. **Idempotency** — a unique key per (event, recipient) so a webhook replay or a double click can never send two receipts.
11. **Rate limiting** — contact form (per IP and per address), password reset, verification resend, and a global per-minute cap on bulk sends.
12. **Admin visibility** — an *Email log* screen (status, attempts, last error, provider id; never the body of one-time-link emails), a *resend* button for failed rows, and an alert when failures spike.
13. **Test sends** — a "send me a test" button and a **preview** before any bulk send; a staging-safe mode that never emails real people from a test environment (the `log` transport remains the default everywhere except production).
14. **Restart safety** — nothing lives only in memory: every message, notification and campaign is a database row (CLAUDE.md Service Restart Test).

### C. Privacy, consent and law (PDPA 2010)
15. Every email is classified **service** or **marketing**; marketing requires a recorded opt-in with timestamp and wording (the pattern the name-search listing already uses).
16. A visible sender identity and postal address in every footer; a link to the Privacy policy; the unsubscribe link (marketing).
17. **Data minimisation in bulk mail** — the trainer sees only the recipient list for their own trainings; the portal sends the mail (the trainer never exports addresses); personalisation tokens (`{{first_name}}`, `{{training}}`, `{{date}}`) merge per recipient, so nobody sees anyone else's address (**no CC/BCC leaks**).
18. **Retention** — email bodies and logs kept per Privacy §10 (audit 2 years; messages 12 months); the Privacy policy §5 is updated the day a provider is live.
19. Every bulk send and every contact-message read/reply is **audited** (who, when, how many, which template).

### D. Contact Us form
20. Fields: name, email, topic (general / training enquiry / organisation screening / support / partnership), message; optional "which training" pre-filled from the page; **honeypot + rate limit** (no CAPTCHA unless abuse appears); server-side validation; **the message is stored first** (`contact_messages`), then emailed to the team; the sender gets an auto-acknowledgement with a reference number.
21. An **administrator inbox** screen: new / answered / spam, reply from the portal (the reply is an outbox email with the same thread reference), assign, notes. Optional: new contact message creates an in-app notification for administrators.
22. Accessible form (labels, error summary, focus management), works without JavaScript.

### E. Emails the portal sends on the person's actions (the event map)
| Event | To | Type | Exists today? |
|---|---|---|---|
| Account created → **confirm your email** | the person | service | template exists, not delivered |
| Password reset / changed | the person | service (security) | template exists |
| Registered **interest** in a training format | the person (confirmation) + the trainer (new interest) | service | person: template exists; trainer: new |
| **Payment** received / registration confirmed / cancelled / transferred | the person | service (receipt) | templates exist |
| Training **scheduled / date opens / changed / cancelled** | everyone interested or registered | service | new (trainer or automatic) |
| Certificate issued / renewed / expiring soon | holder | service | templates exist |
| Free Assessment Check unlock paid; interview result ready | the person | service | partly |
| Support payment received | the person | service | template exists |
| New contact-form message | the team | internal | new |
| Weekly digest / launches / offers | opted-in people | **marketing** | new, later |

### F. Trainer dashboard messaging (bulk and individual)
23. **Compose** screen under the trainer's dashboard: choose **audience** = *interested in training X (format Y)* · *registered for offering Z* · *paid for X* · a **single person** (from the Users Interest list); subject, message (plain text with a few safe formatting options and the merge tokens above), preview, test send, schedule or send now.
24. **Recipient preview**: count and names, with anyone suppressed/unsubscribed greyed out and excluded; a clear label of *service* vs *promotional* (promotional only reaches opted-in people).
25. Delivery is **individual** (one email per person, personalised), never one email with many people in BCC; throttled in batches; progress and per-recipient status (queued / sent / bounced) shown afterwards.
26. **History**: every campaign kept with its audience snapshot, text, sender, time, results; "mark as notified" updates automatically when a schedule email is sent to the interested people.
27. Safety rails: daily send cap per trainer, second confirmation above N recipients, administrator can pause a campaign or disable a trainer's sending, no attachments in v1, no external links to unknown domains flagged for review (v2).
28. Replies go to the trainer (Reply-To); optional "reply received" notification.

### G. Notification centre and the header bell
29. A **bell icon in the header** (desktop and mobile — coordinated with the avatar/burger work) with an **unread badge** (cap "99+"), announced to screen readers (`aria-live`, text alternative "3 unread notifications"); a dropdown with the latest 5 and a "See all notifications" link.
30. A **dedicated page** `/account/notifications`: newest first, unread highlighted, **mark as read / unread**, **mark all as read**, filter (All · Unread · by category), pagination, empty state, each item **deep-links** to the thing it is about (the order, the registration, the certificate, the message).
31. **Every important event creates an in-app notification** (and, by category and preference, an email): payment confirmed, registration confirmed, interest registered, training date announced, certificate issued/expiring, trainer message received, support reply. Trainers/administrators get internal ones (new interest, new contact message, failed emails).
32. **Preferences** per category and channel (in-app / email); *service* and *security* notices cannot be switched off, *marketing* defaults to off.
33. **Freshness without new technology**: the badge refreshes by lightweight polling (e.g. every 60 s and on window focus) from a small authenticated endpoint; no websocket service is needed (a push channel can be a later, separately-approved addition).
34. Retention: read notifications are kept 12 months then removed; unread kept until read.
35. The existing `/account/notifications` outbox listing is **replaced** by real notifications; the email status ("sent / failed") stays visible to administrators only in the Email log.

## 4. Proposed data model (RED — SQL to be shown and approved before anything is applied)

| Table | Purpose | Key columns |
|---|---|---|
| `notifications` | in-app notifications with read state | `id`, `user_id`, `kind` (category), `title`, `body`, `link`, `read_at`, `created_at`, optional `outbound_email_id` |
| `contact_messages` | stored Contact Us messages | `id`, `name`, `email`, `topic`, `programme_id?`, `message`, `status` (new/answered/spam), `reference`, `answered_by`, `created_at` |
| `email_suppressions` | never email again | `email` (unique), `reason` (bounce/complaint/unsubscribe), `created_at` |
| `email_preferences` (or columns on `users`) | per-category opt-in/out + the existing marketing consent | `user_id`, `category`, `email_enabled`, `inapp_enabled`, `updated_at` |
| `email_campaigns` | one bulk send by a trainer/admin | `id`, `sender_user_id`, `programme_id?`, `format_id?`, `offering_id?`, `audience`, `kind` (service/marketing), `subject`, `body`, `status`, `scheduled_at`, `created_at` |
| `email_campaign_recipients` | per-recipient status | `campaign_id`, `user_id?`, `email`, `outbound_email_id`, `status` |
| `email_events` | provider webhooks | `outbound_email_id`, `type` (delivered/bounced/complained), `occurred_at`, `raw` (minimal) |
| `outbound_emails` (existing) — **add** | richer outbox | `html_body`, `reply_to`, `kind`, `user_id?`, `idempotency_key` (unique), `next_attempt_at`, `campaign_id?` |

Rollback for each: tables are new and empty at first (drop = revert); the added columns on `outbound_emails` are nullable.

## 5. Suggested order of work (each step = its own CR, deployable alone)

1. **Foundation (CR-1225, opus)** — provider chosen, domain DNS, transport implementation, worker/retry, suppression, webhooks, Email log, account-confirmation and password-reset delivered. *Everything else depends on this.*
2. **Contact Us form (CR-1226, sonnet).**
3. **Event emails and templates (CR-1227, sonnet)** — the event map in §3E, one shared layout, preferences/unsubscribe.
4. **Notification centre + header bell (CR-1228, sonnet)** — can be built in parallel with 2–3 once the `notifications` table is approved.
5. **Trainer bulk/individual messaging (CR-1229, opus)** — last, because it carries the legal and reputation risk.

## 6. Risks to keep in view
- Email deliverability is **earned**: new domain, no history → start with transactional only, warm up volume, watch bounce/complaint rates (< 0.3 % complaints).
- A trainer bulk send is the most dangerous feature (reputation, PDPA). Hence the audience limits, the service/marketing split, the cap, the preview and the audit.
- Provider outages: the outbox keeps messages and retries; nothing is lost.
- Cost grows with volume — set a monthly cap and an alert.
- A provider is a **data processor** outside Malaysia: Privacy §5/§7 are updated the day it goes live.
