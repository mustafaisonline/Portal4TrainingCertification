# CR-2026-10-03-1257 — The portal's email address is sales@dataainexus.com

**Received:** 2026-10-03 12:57 MYT · **Status:** DEPLOYED (`v2026.10.03-3`) · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> Ok we got portal email: sales@dataainexus.com pelase use it everwhere.

## 2. Facts gathered

- Until now the portal's address was `sales@yourpartnertechnologies.com` (founder-supplied 2026-09-29; the founder said on 2026-10-03: "Current email is sales@yourpartnertechnologies.com later we will change to dataasinexus.com email"). It lives in one constant, `CONTACT_EMAIL` (`src/content/contact.ts`), plus the YPT organisation's contact email in the seed (`prisma/seed-interview.ts`) and a comment/doc mentions.
- Per the founder's earlier decision (same day, CR-1246) **no email address is printed on any page**; the address is the team's inbox (new Contact Us messages), the SMTP login and the From address of the portal's mail. The old address is no longer used by the portal.

## 3. Decisions & assumptions

- "Use it everywhere" is read as: replace the old address wherever the portal used it (team inbox, From/login, organisation contact). **Assumption:** it stays unprinted on pages (decision CR-1246). *If you want it shown on the Contact Us page, say so — one line.*
- Mail account for sending: when SMTP is wired (CR-1225) the server env gets `SMTP_USER` / `EMAIL_FROM` = `sales@dataainexus.com`; HostGator's mail server for that domain (host/port) is typed by the founder.
- **Production data:** the YPT organisation row seeded in production still holds the old contact email; change it in Admin → Organisations (not a deploy step).

## 4. Plan / 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | `CONTACT_EMAIL`, YPT seed contact, comments, unit test, current-state docs | **DONE** | 2026-10-03 |
| 2 | Production: edit the YPT organisation's contact email in Admin | AWAITING founder (admin screen) | — |
| 3 | When SMTP is configured: `SMTP_USER` / `EMAIL_FROM` = this address (CR-1225) | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:57 | CR created from the founder's message (arrived while the Contact Us form was being finished). Old address replaced in code and current-state docs; historical CRs keep what was true when written. |
| 2026-10-03 14:50 | Live in `v2026.10.03-3`. |
