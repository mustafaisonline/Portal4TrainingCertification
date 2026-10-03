# CR-2026-10-03-1246 — No email address on the portal — every contact path leads to the Contact Us form

**Received:** 2026-10-03 12:46 MYT · **Status:** DEPLOYED (`v2026.10.03-3`) — two founder steps remain · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> 1 = … as from now on, we will not show email on the portal, means wherever way user want to conenct with portal staff, the control will tkae user to the contract us page, from where user can use the form (pelase create one, if not there) to send us email. Don't use anything which need to fee.
> 2 = … But no need to show user when we will reply then yes user will see this email: sales@yourpartnertechnologies.com

## 2. Facts gathered

- Email addresses and `mailto:` links currently appear in: the Contact Us page, training/schedule/pricing buttons (`interestMailto`, `localPartnerMailto`, `organisationMailto`), and the published Terms, Privacy and Refund policies (`src/content/legal/*`) as the contact email / Data Protection Contact. The Contact Us form was removed in Milestone 15 and returns now (CR-2026-10-03-1226).
- **Legal impact (flag):** the Privacy notice is the PDPA notice and names a contact for data requests; replacing the email by the Contact Us form changes published legal text → a new version (2026-10-03+), an update of `LEGAL_DOCUMENT_VERSIONS` on the server, and users consent again to the new version. The assistant is not a lawyer: confirm that a web form is an acceptable contact channel for the PDPA notice.

Proposal: [docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md](../docs/execution/EMAIL_AND_NOTIFICATIONS_PROPOSAL.md)

## 3. Decisions & assumptions

Decided by the founder on 2026-10-03 (see CR-2026-10-03-1225 §7). Assumptions are listed in the plan; anything uncertain is raised, not guessed.

## 4. Plan

After the Contact Us form works (CR-1226): replace every `mailto:` button/link and every printed address by a link to `/contact-us` (with the topic and training pre-selected through the query string); keep the address only inside staff replies. Update the three legal documents (version bump) and tests that look for the address; sweep `app/`, `src/`, FAQ and seed content for any remaining address.

## 5. Tracker

Spec: see `specs/`.

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Depends on the Contact Us form (CR-1226) | **DONE** | 2026-10-03 |
| 2 | Replace mailto links and printed addresses in pages/components | **DONE** — `contactUsHref()` replaces the mailto helpers: schedule, Trainings, training pages, price cards, local-partner checkout, account help; head-office card has no email row (a partner's own address is kept); FAQ seed answer | 2026-10-03 |
| 3 | Legal documents: the form instead of the address | **DONE in code** — Terms, Privacy, Refund (and the unpublished Malay draft) say "through the Contact Us page"; new version **2026-10-03** (effective 3 October 2026). **PDPA flag for the founder:** the Privacy policy is the PDPA notice and names a contact for data requests; a web form is a contact channel but the assistant is not a lawyer — please confirm | 2026-10-03 |
| 4 | Tests + sweep | **DONE** — no address remains in `app/`, `src/`, `prisma/`, `tests/` except a partner's own (Infocentric) and the internal constant; unit 737/737, e2e 187/187 | 2026-10-03 |
| 5 | **Deployed v2026.10.03-3; FAQ re-seeded.** Founder steps still open: (a) root: set `LEGAL_DOCUMENT_VERSIONS` to 2026-10-03 for terms/privacy/refund; (c) edit the YPT organisation's contact email in Admin | AWAITING founder's word | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:46 | CR created from the founder's answers. |
| 2026-10-03 13:00 | Built and verified. New address `sales@dataainexus.com` applied (CR-1257). Not deployed. |
| 2026-10-03 14:50 | **DEPLOYED `v2026.10.03-3` (`6649697`)** — gate green (tsc, Vitest, build, full Playwright), delta upload, 06-validate PASSED. Live: `/contact-us` shows the form and no mailto (only Infocentric's own address remains); privacy text names HostGator; FAQ answer refreshed (`db:seed` run on the server, idempotent). Production env is STILL `EMAIL_TRANSPORT=log` and `LEGAL_DOCUMENT_VERSIONS` 2026-10-02 until the founder runs the root block (SMTP settings + versions). |
