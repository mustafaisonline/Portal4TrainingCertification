# CR-2026-10-02-2014 — Free skill diagnostic: the score is not displayed

**Received:** 2026-10-02 20:14 MYT · **Status:** NOT STARTED — not yet reproduced · **Requested by:** founder

## 1. Request (verbatim)

> ⁠Free diagnostics issue: Score not displayed

*Source: Founder message of 2026-10-02 ("New more change …", seven bullets; the CR for them was requested: "Add a new CR for these requirements").*

## 2. Facts gathered (read-only; nothing changed yet)

- Route: `app/(public)/free-learning/diagnostic/` — `DiagnosticFlow.tsx` (client, answers held only in the visitor's browser by design — Privacy §2/§3), `result/page.tsx` + `DiagnosticResultView.tsx`.
- Per the published Privacy policy the diagnostic collects **nothing**: its questions and answers never leave the browser. So the score must be computed and shown on the client; an empty score is most likely a client-state/hydration/navigation problem (e.g. the result page is opened directly or after a refresh and has no answers), or a rendering bug on one viewport.
- Not yet reproduced; existing Playwright coverage for the diagnostic passes in the release gate, so the failing case is one the tests do not cover.

## 3. Open questions for the founder

1. **Where** do you see it missing — on the final page right after finishing the questions, or when opening the result page later / refreshing? On **desktop or mobile**, and which browser?
2. A **screenshot** of the result page would settle it. What did the page show instead (blank, "0", a dash, the text with no number)?

## 4. Plan (after the answers; one CR at a time, on the founder's "go")

Reproduce in dev with the same steps; find the root cause (not a patch); fix; add a regression test for the failing path; confirm the diagnostic still sends nothing to the server.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Reproduction details | **AWAITING founder** | — |
| 2 | Reproduce + root cause | NOT STARTED | — |
| 3 | Fix + regression test | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:14 | CR created from the founder's list. Facts gathered read-only.  |
| 2026-10-02 | run-cr 2026-10-02: kept OPEN — not reproduced; needs where/when the score is missing (right after finishing vs later/refresh, desktop/mobile) and a screenshot. Re-run run-cr after that. |
