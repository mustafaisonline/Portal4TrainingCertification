# CR-2026-10-04-0607 — Terms: the 90-minute limit applies to organisation screening tests only

**Received:** 2026-10-04 06:07 MYT · **Status:** BUILT & VERIFIED locally — deploy pending · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> Yes, update the terms text to organisation screening only

(Answer to the assistant's report of 2026-10-04: the Terms of service still said interview assessments have "a time limit of 90 minutes", which is no longer true for Prepare for Interview after CR-2026-10-03-2251 — the 90 minutes and "time taken" now apply only to an organisation's screening test.)

## 2. Facts gathered

- `src/content/legal/terms.ts` section on assessments (the "Interview assessments are free practice and screening tests…" paragraph) said, for all interview assessments, "a time limit of 90 minutes".
- Since `v2026.10.04-3`: Prepare for Interview has no time limit (save & exit, cancel); an organisation's screening test keeps its 90-minute limit, scored as it stands, and shares "time taken" with the organisation.
- `privacy.ts` (the "time taken" shared with an organisation) is still correct — organisation tests only. No change.
- Version/date: all four legal documents carry version/effective date 2026-10-03 and a unit test pins them together. This is a factual correction of one sentence, so the version and effective date are NOT changed (founder/lawyer may wish to re-issue the set under a new version — noted below).

## 3. Plan

1. Edit the one paragraph: remove the 90 minutes from interview practice (say it has no time limit, can be saved and resumed or cancelled with nothing kept); attach the 90-minute limit, "scored as it stands", to the organisation screening test sentence.
2. Extend the legal-content unit test with a guard so the sentence cannot drift back (interview practice: no 90-minute claim; organisation screening: 90 minutes).
3. Gate, deploy as the next tag, push.

## 4. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Edit terms text | DONE | 2026-10-04 |
| 2 | Unit-test guard | DONE | 2026-10-04 |
| 3 | Deploy | OPEN | — |

## 5. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-04 06:07 | CR created from the founder's reply; terms paragraph and privacy policy inspected; no schema/payment impact. |
