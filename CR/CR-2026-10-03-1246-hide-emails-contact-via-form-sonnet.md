# CR-2026-10-03-1246 — No email address on the portal — every contact path leads to the Contact Us form

**Received:** 2026-10-03 12:46 MYT · **Status:** IN PROGRESS · **Requested by:** founder · **Model:** sonnet

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

Spec: [CR-SPEC-2026-10-03-1246-hide-emails-contact-via-form-sonnet](specs/CR-SPEC-2026-10-03-1246-hide-emails-contact-via-form-sonnet.md).

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Depends on the Contact Us form (CR-1226) | NOT STARTED | — |
| 2 | Replace mailto links and printed addresses in pages/components | NOT STARTED | — |
| 3 | Legal documents: replace the email by the form, new version | NOT STARTED | — |
| 4 | Tests + sweep for any leftover address | NOT STARTED | — |
| 5 | Deploy + server `LEGAL_DOCUMENT_VERSIONS` step (founder) | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 12:46 | CR created from the founder's answers. |
