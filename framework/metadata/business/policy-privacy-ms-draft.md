# policy — Privacy policy, Bahasa Malaysia (unpublished draft)

| Field | Value |
|---|---|
| Category | business |
| Kind | policy |
| Source of truth | `src/content/legal/privacy-ms.ts` (exports `privacyPolicyMs`) |
| Owner | founder |
| Version / date | `DRAFT-MS-2026-10-02` |
| Status | draft |
| Related | CR-2026-10-02-0628, `policy-privacy`, `tests/unit/privacy-ms-draft.test.ts` |

## Purpose
Describes the assistant-written Bahasa Malaysia translation of the privacy notice, kept unpublished until reviewed. This file describes it; it does not reproduce it.

## Description
- **Version identifier.** `DRAFT-MS-2026-10-02`.
- **Publication status.** `draft`, unpublished on purpose: no route, no link from `/privacy`, no sitemap entry, and nothing imports the module. The English notice is the one in force.
- **Language.** Bahasa Malaysia (title "Dasar privasi").
- **Review state.** Assistant-written; not reviewed by a Malaysian translator or counsel. CR-0628 records that the PDPA 2010 s.7 requires a notice in the national language as well as English (a pointer, not legal advice). Publication needs: translator/counsel correction, the founder's "reviewed", then a route (`/privacy/ms`), a language link, a sitemap entry; the consent version stays the English one.
- **Coverage.** Mirrors the English notice one-to-one: the same 16 sections, with matching paragraph and bullet counts (guarded by a unit test), so see `policy-privacy` for the section list.
- **Open.** Whether Terms and Refund need a Bahasa Malaysia version is a question for counsel.

## Change history
- 2026-10-02 07:00-07:08 MYT draft written (CR-2026-10-02-0628); tracker steps 3-4 awaiting the founder.
- 2026-10-02 this metadata file written.
