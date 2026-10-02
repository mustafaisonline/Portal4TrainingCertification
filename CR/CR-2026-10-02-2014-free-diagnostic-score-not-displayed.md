# CR-2026-10-02-2014 — Free skill diagnostic: the score is not displayed

**Received:** 2026-10-02 20:14 MYT · **Status:** DEPLOYED (`v2026.10.02-5`) · **Requested by:** founder · **Recommended model:** Sonnet 5.5 — no schema change was needed; this session is Sonnet 5.5

Spec: [`CR-SPEC-2026-10-02-2014-free-diagnostic-score-not-displayed.md`](specs/CR-SPEC-2026-10-02-2014-free-diagnostic-score-not-displayed.md)

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
| 2 | Reproduce + root cause | **VERIFIED** (e2e + integration) | 2026-10-02 |
| 3 | Fix + regression test | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 20:14 | CR created from the founder's list. Facts gathered read-only.  |
| 2026-10-02 | run-cr 2026-10-02: kept OPEN — not reproduced; needs where/when the score is missing (right after finishing vs later/refresh, desktop/mobile) and a screenshot. Re-run run-cr after that. |
| 2026-10-02 | Founder: the page is https://dataainexus.com/free-learning/diagnostic/result — the total score and the learning-area charts are missing. Finding: this is by design today, not a bug. `DiagnosticResultView.tsx` states 'Never a score': it shows only answered / not-sure counts per capability area, and `diagnostic_questions` stores no correct answers, so a score cannot be computed. A total score and charts would need new business rules (what is correct, how scored, level bands) and, for a score, a data-model change (RED gate). Questions raised with the founder; nothing built. |
| 2026-10-02 | Founder: option B (score), "schema approval = consider it approved", then "commit, push and deploy". Finding: the live diagnostic draws from `topic_questions`, which already stores the correct option — **no schema change was needed**. Built: correct option returned with the draw, scoring in the browser (nothing sent to the server), result page with total, % and a bar per area, where-to-focus, no bands. New e2e (3) including a real flow; side-fix for a 320 px header overflow I introduced in CR-2013. Open: homepage band still counts-only. |
| 2026-10-02 | Founder: "commit, push and deploy in production". Deployed as `v2026.10.02-5` (commit `2487ad3`): gate PASSED (tsc, Vitest, build, Playwright; npm-audit advisory warning), backup, migration sandbox, switch, health 200, post-deploy validation PASSED. Live check: `/schedule` generic Register interest → `/programs`; diagnostic pages 200. |
