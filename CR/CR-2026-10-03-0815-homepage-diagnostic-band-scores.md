# CR-2026-10-03-0815 — Homepage diagnostic band: make it score too

**Received:** 2026-10-03 08:15 MYT · **Status:** BUILT & VERIFIED in dev — not deployed · **Requested by:** founder
**Recommended model:** Haiku 4.5 would do (three copy edits plus one test); executed on Sonnet 5.5, this session's model.

## 1. Request (verbatim)

> Yes, make the homepage band score too

(Answer to my question after v2026.10.02-5: "The homepage 'Not sure where you stand?' band … still uses its fixed question set with no answer key, so it shows counts only and still says 'not a score'. Should I make it score too?")

## 2. Facts gathered

- The homepage band is rendered in `teaser` mode (`app/(public)/page.tsx:125`, UX review U3): it shows the pitch and a **"Free Diagnostic" button to `/free-learning/diagnostic`** — it does not run the ten questions itself. That page is the one CR-2014 made score. So the band's flow **already leads to the scored diagnostic**; my earlier remark that it "shows counts only" applies only to the non-teaser mode of `HomeDiagnostic`, which no page uses.
- What is still wrong on the homepage is wording: three places say the diagnostic is "not a score": the Home card "Assess your capability" (`app/(public)/page.tsx:174`), the trust point "Named gaps, not a score" (`src/shared/signature/DiagnosticIntro.tsx:110`), and the band text "names your gaps in plain language" (`src/shared/marketing/HomeDiagnostic.tsx:237`).

## 3. Decisions & assumptions

- Edit those three strings to match the scored result (a score for each learning area). No new business rule; wording follows the founder's own instruction and the CR-2014 behaviour. **Wording is mine — awaiting the founder's approval; trivial to change.**
- The unused non-teaser walkthrough in `HomeDiagnostic.tsx` is left as is (dead path, no page renders it). Making it score would duplicate `DiagnosticFlow`; not done unless the founder wants the quiz back on the home page.

## 4. Plan

Three copy edits; one e2e assertion (homepage band and card no longer say "not a score", the band button still opens `/free-learning/diagnostic`). No data model.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Copy edits (3 strings) | **BUILT** | 2026-10-03 |
| 2 | Test | **VERIFIED** | 2026-10-03 |
| 3 | Deploy | NOT STARTED (founder's word) | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 08:15 | CR created. Found the band is teaser-only and already leads to the scored diagnostic; fixed the three "not a score" strings. |
