# CR-SPEC-2026-10-02-2014 — Free diagnostic: show the total score and a chart per learning area

**CR:** [CR-2026-10-02-2014](../CR-2026-10-02-2014-free-diagnostic-score-not-displayed.md) · **Recommended model:** Sonnet 5.5 — client/repository change with tests; no data-model change after all (see below).

**Founder decision:** option B — a real score. "Schema approval = consider it approved."

**Finding that removes the schema change:** the live diagnostic does not use `diagnostic_questions`. Since 2026-09-28 it draws 10 random questions from the reviewed Free Learning bank (`topic_questions` + `topic_question_options.is_correct`), which already stores the correct option. So no column, table or migration is needed; the approved schema permission was not used.

| # | Task | Files | Notes |
|---|---|---|---|
| 1 | Return the correct option's text with the drawn questions | `src/modules/free-learning/quiz.repository.ts` (`drawDiagnosticQuestions`, type `DiagnosticDrawQuestion.correct`) | explanations still not selected |
| 2 | Carry it to the browser | `app/(public)/free-learning/diagnostic/actions.ts`; `src/shared/signature/diagnostic.ts` (`DrawnDiagnosticQuestion.correct`, `CompletedAnswer.correct`); `DiagnosticFlow.tsx` (stores it in the completed record) | scoring is computed in the browser; no answer is sent to the server (Privacy §2/§3 stay true) |
| 3 | Result page | `app/(public)/free-learning/diagnostic/result/DiagnosticResultView.tsx`: total "X of 10" and %, a bar and "n of m correct" per learning area, "Where to focus next" (areas with fewer correct, weakest first) | no level/band names — none approved. A record without correct options (homepage walkthrough's fixed set, older attempts) keeps the counts view and links to the full diagnostic |
| 4 | Copy | `DiagnosticStartCard.tsx` ("you get a score, not a credential"); result outcome text | still "not a certificate, not the credential" (DR-01/DR-03) |
| 5 | Tests | `tests/e2e/diagnostic-score.spec.ts` (new: score and bars from a record; fallback without keys; real flow with a fixture bank — 7 right → "7 of 10", no answers in any POST); `tests/integration/free-learning-quiz.test.ts` (draw shape now includes `correct`) | |
| 6 | Header side-fix found by the 320 px test | `src/modules/identity/components/AccountControls.tsx` (signed-out header "Sign in" stays `sm`-up) | regression from CR-2013, caught and fixed |

**Trade-off recorded:** the correct options travel to the browser with the questions, so a visitor can read them in the network panel. Acceptable for a free, unsaved self-check; the graded Free Assessment Check is unaffected (server-graded).
**Not changed:** the homepage "Not sure where you stand?" band (fixed seeded set, no answer key) and its "not a score" wording — open question for the founder.
**Rollback:** revert the commit. Data model: none.
