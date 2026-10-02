# policy — Terms of service

| Field | Value |
|---|---|
| Category | business |
| Kind | policy |
| Source of truth | `src/content/legal/terms.ts` (English; page copy as a typed content module) |
| Owner | founder |
| Version / date | `2026-10-02`; lastUpdated 2026-10-02 |
| Status | approved (status `published` in the source; published on the founder's word "consider reviewed", see CR-2026-10-02-0610) |
| Related | CR-2026-10-02-0610, `policy-privacy`, `policy-refund`, DR-05, DR-06, DR-08, `src/content/legal/types.ts` |

## Purpose
Describes the Terms of service that govern accounts, registrations, payments, Free Learning, the Free Assessment Check, one-off payments and the Certificate of Completion. This file describes the document; it does not reproduce it.

## Description
- **Version identifier.** `2026-10-02` (earlier draft identifiers had a `DRAFT-` prefix, for example `DRAFT-2026-09-28`). Registration consent is recorded against the version named in `LEGAL_DOCUMENT_VERSIONS` (`src/modules/identity/legal-documents.ts`); per CR-0610 the server value was set to `2026-10-02` for terms, privacy and refund.
- **Publication status.** `published` (previously draft for lawyer review; the CR records the founder's instruction to consider it reviewed). Whether a Malaysian-qualified lawyer has actually reviewed it is not determined from the source.
- **Language.** English only. No Bahasa Malaysia version exists for the Terms; whether one is needed was left as a question for counsel (CR-2026-10-02-0628).
- **Operator and contact.** Your Partner Technologies, Kuala Lumpur; contact is email only (no phone number was supplied).
- **Sections (18).** 1 Who we are and what the terms cover; 2 Definitions; 3 Your account and who may register (age 18 read as: under-18 registrations not accepted); 4 Registering for an offering; 5 Prices, currency and taxes; 6 Sales and Service Tax (not registered, none charged, per CR-0610); 7 Paying; 8 Cancelling, transferring and refunds; 9 If the Academy cancels or reschedules; 10 Taking part: conduct and materials; 11 Free Learning, assessments and one-off payments; 12 Certificate of Completion; 13 What we do not promise, and limits on liability; 14 Your personal data; 15 Changes to these terms; 16 Governing law and disputes; 17 General; 18 Contact.
- **Notes.** The Privacy policy and the Refund & cancellation policy form part of the Terms. A test (`tests/unit/legal-content.test.ts`) forbids draft notices and square-bracket placeholders.

## Change history
- 2026-09-21 first draft; 2026-09-28 updated for the site-wide "Training" wording, Free Learning, Knowledge Check and one-off payments; 2026-09-29 and 2026-10-01 updated for DR-05 and DR-07/DR-08 (per DR-05, DR-07, DR-08 text; exact version strings in between not determined from the source).
- 2026-10-02 published as `2026-10-02` (CR-2026-10-02-0610).
- 2026-10-02 this metadata file written.
