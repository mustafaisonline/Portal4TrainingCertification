# CR-2026-10-02-0628 — Bahasa Malaysia version of the Privacy notice

**Received:** 2026-10-02 06:28 MYT · **Status:** DRAFT WRITTEN, UNPUBLISHED (deployed as inert code in `-4`) — awaiting translator/counsel review and the founder's "reviewed" · **Requested by:** founder

## 1. Request (verbatim)

> Smaller items: … Bahasa Malaysia notice: the privacy notice may also be needed in Bahasa Malaysia. … Response: Please fix these as per best practices

## 2. Facts gathered

- The deleted draft section (Privacy, "About this draft") listed "A Bahasa Malaysia version of this notice, if counsel advises that one is required". The Personal Data Protection Act 2010 s.7 requires a written notice in the national language (Bahasa Malaysia) and in English. The assistant is not a lawyer; this is a pointer, not advice.
- The portal has no i18n; legal text is typed content modules (`src/content/legal/*.ts`) rendered by `LegalDocumentView`; a second language would be a second content module and a route (e.g. `/privacy/ms`) plus a link from `/privacy` and a sitemap entry.
- The English text was published on the founder's word ("consider reviewed"); an assistant-written translation of a legal notice would NOT be reviewed.

## 3. Decisions & assumptions

- **Open decision (founder):** who supplies the Bahasa Malaysia text? (a) the assistant drafts it as an unpublished draft for the founder / a Malaysian translator or counsel to correct, then it is published only on the founder's word; (b) the founder supplies his own text.
- Until then the English notice is live and nothing claims a BM version exists.

## 4. Plan

After the decision: add `src/content/legal/privacy-ms.ts`, route `app/(public)/privacy/ms/page.tsx`, language link on `/privacy`, sitemap entry, unit test that BM and English have the same section count/numbering, and the same `[placeholder]` guard. No data model. Terms and Refund are not covered by the PDPA notice rule — ask counsel whether they need BM.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder chooses (a) or (b) | **DONE** — (a) chosen ("Open items (Recommended)") | 2026-10-02 |
| 2 | Draft BM text (`privacy-ms.ts`, DRAFT, unpublished) + parity test (5 tests) | **DONE** — assistant-written, NOT reviewed | 2026-10-02 |
| 3 | Translator/counsel corrects the text; then build route `/privacy/ms`, language link, sitemap entry | **AWAITING founder** | — |
| 4 | Founder confirms reviewed → publish/deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 06:28 | CR created; planned; blocked on the authorship decision. |
| 2026-10-02 07:00 | Founder chose option (a). Drafting `src/content/legal/privacy-ms.ts` (status `draft`, version `DRAFT-MS-2026-10-02`) mirroring the 16 English sections one-to-one, with a unit test for structural parity. NOT routed, NOT linked, NOT in the sitemap — so nothing public changes. Publication needs: a Malaysian translator/counsel's correction, the founder's "reviewed", then the route `/privacy/ms`, a language link on `/privacy`, a sitemap entry and the `LEGAL_DOCUMENT_VERSIONS` question (the consent version stays the English one). |
| 2026-10-02 07:08 | Draft written: 16 sections mirroring the English notice; `tests/unit/privacy-ms-draft.test.ts` checks draft status, that nothing imports it, section/paragraph/bullet parity, figures and no placeholders. Observation: English §15 still says "when we confirm our hosting provider" — stale now that hosting is DigitalOcean; fix it (and the Malay mirror) in the next version of the notice. The draft's last line says the effective date is "(draf — belum diterbitkan)". |
