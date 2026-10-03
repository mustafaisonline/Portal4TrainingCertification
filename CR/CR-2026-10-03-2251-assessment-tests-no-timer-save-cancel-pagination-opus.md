# CR-2026-10-03-2251 — Interview and organisation tests: no timer, per-page results, cancel, save & exit, paginated results

**Received:** 2026-10-03 22:50 MYT · **Status:** BUILT & VERIFIED locally — awaiting review and deploy · **Requested by:** founder · **Model:** opus

## 1. Request (verbatim)

> * https://dataainexus.com/assessment/interview When user start a test for any role.
>    * Remove timer on all the tests from interview page
>    * Now as there are 10 questions on every page and there is pagination of 10 questions, on every page, please include a button which will allow user to view the results of that page itself.
>    * Then we need to give the option to the user to cancel the test any time. If user cancel then there will be no record.
>    * Then we need to give user the option to the user to save and exit as well so user can come back and continue from where they left off.
>    * When user finish the page and see the result then please add pagination of 10 questions on page in results page as well.
> * https://dataainexus.com/assessment/organisations/ypt/
>    * When user finish the page and see the result then please add pagination of 10 questions on page in results page as well.

## 2. Facts gathered (read-only investigation, 2026-10-03)

- Interview roles and organisation tests share one set of screens (`app/(public)/assessment/_role-test/`: `RoleIntroScreen`, `RoleTestScreen`, `RoleTestForm`, `RoleResultScreen`). 10 questions per page (`QUESTIONS_PER_PAGE`). **Answers are stored in the database** (`role_test_attempts.answers`) each time a page is saved.
- **Timer:** a 90-minute limit, derived from `started_at` (no stored column), enforced on the server (`ROLE_TEST_TIME_LIMIT_MS`; save refused after the deadline; unfinished attempts auto-scored when read). It was a founder-approved rule in CR-2026-10-01-1711 ("90 minutes, server-enforced, auto-scored at the deadline"). The shared client countdown is `AttemptTimer`. Removing it is code-only (no schema change) but changes that earlier rule and the "time taken" figure (shown on the result, the results list and the organisation CSV).
- **Resume:** a running attempt is already stored and the intro already offers "Return to my running test"; what is missing is a "Save and exit" button and opening on the first unanswered page.
- **Cancel with no record:** not available for role tests (only deleting a *finished*, non-organisation result). The Knowledge Check already has "Cancel test" (deletes the row, audit entry only). Code-only; organisation results are the organisation's record, so a finished ypt result is not deletable by the person.
- **View results of a page:** does not exist. The running test deliberately never receives correct answers (`attemptPage` omits them). Showing them mid-test is a policy change.
- **Results pagination:** `RoleResultScreen` lists up to 100 questions in one list, no paging. Code-only. The same component serves interview and organisation (ypt) results.
- **No Prisma schema change is needed** for any of the five items.

## 3. Decisions needed from the founder (with the assistant's recommendation)

1. **"View results of this page":** this shows correct answers before the test is finished. Recommendation: once a person views a page's results, that page's answers are locked (otherwise the score is meaningless) and the page still counts in the final score; unviewed pages stay editable.
2. **Cancel:** allowed for any *unfinished* attempt (interview or organisation) — it deletes the unfinished attempt and its answers, with an audit line "cancelled" (no result, no content). A *finished* result is never affected. Recommendation: yes.
3. **Time taken:** with no timer it becomes "time since start" (meaningless if the person leaves and returns). Recommendation: stop showing "time taken" on results and drop that column from the organisation CSV.
4. **Save & exit:** the attempt stays open indefinitely until finished or cancelled (no expiry). Recommendation: yes; the intro keeps showing "Return to my running test".

## 4. Impacted elements

`src/modules/assessment/{constants.ts,rules.ts,attempts.repository.ts,role-test.actions.ts}`, `_role-test/{RoleTestForm,RoleTestScreen,RoleIntroScreen,RoleResultScreen,RoleResultsList}.tsx`, interview and organisation route files, `tests/integration/role-tests.test.ts` and the assessment e2e specs. Audit action names (`role_test.cancelled`) are a TypeScript union (no schema change). The org CSV export changes if "time taken" is dropped.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers §3 | DONE | 2026-10-03 |
| 2 | Build (after the answers) | DONE | 2026-10-04 |
| 3 | Verify (tests, reviews) | DONE | 2026-10-04 |
| 4 | Deploy | v2026.10.04-3 | 2026-10-04 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 22:50 | CR created from the founder's message; existing code inspected read-only; nothing built. |
| 2026-10-03 23:05 | Founder answered the §3 decisions: "I agree with all your recommendation with my few responses." **Item 5:** "I dont want time taken to remove from Organization test, only remove from Interview preparaton tests." Assistant's reading (to confirm with the founder before building this CR): interview-preparation tests lose the timer and "time taken"; organisation tests keep their timer and "time taken" unchanged and only get paginated results (10 per page). Items 3, 4, 6 as recommended (lock a page's answers after its results are viewed; cancel any unfinished attempt; save & exit stays open until finished or cancelled). |
| 2026-10-03 23:15 | **Founder confirmed the reading of item 5:** "Agree on these recommendations." Interview-preparation tests: no timer, no time taken, plus per-page results, cancel and save & exit. Organisation tests (YPT and others): unchanged timer and time taken; only results paginated 10 per page. |
| 2026-10-04 (night) | **Built.** Interview practice (no organisation): no timer, no expiry, no "time taken" (result, results list); **View results of this page** (saves the page, locks its answers, shows correct options + model answers for that page only; the page still counts); **Save and exit** (back to the role page; "Return to my running test" opens the first page with an unanswered question); **Cancel test** (two-step confirmation; deletes the unfinished attempt; audit `role_test.cancelled` with no content; never a finished result or an organisation test). Results of both interview AND organisation tests are listed ten a page (`?page=`; score and topic breakdown still cover the whole test). Organisation tests keep their 90-minute timer and time taken unchanged. **No schema change:** the viewed pages are kept inside the existing `answers` JSON under the reserved key `_viewedPages` (question ids are UUIDs, so no collision); `toRecord` separates them, and `attemptPage` reveals answers only for an interview attempt's viewed page. Tests: integration `role-tests.test.ts` (5 new tests; the 90-minute tests now use an organisation attempt), e2e `assessment-interview.spec.ts` (rewritten: no timer, view/lock, save & exit/resume, cancel, paged result) and `assessment-organisations.spec.ts` (paged result, time taken kept). Hub/interview-index/intro wording changed from "90 minutes / against the clock" to "no time limit" for interview practice only. |
| 2026-10-04 (night) | **Independent review: PASS WITH NOTES** (no answer leakage, timer rules correct). Fixed: the "View results" e2e asserted a URL that matched before the redirect landed (now asserts `?page=1`); resume now skips a viewed (locked) page that still has unanswered questions; per-user advisory lock added to save / view / cancel / finish so two tabs cannot drop a page lock or lose answers (integration test with concurrent save + view); the lock warning is visible text beside the button (was screen-reader only); focus goes to "No, keep going" when Cancel opens and back to the trigger afterwards; interview-index copy tidied. **Founder item (not changed by the assistant):** the legal text in `src/content/legal/terms.ts` (line ~136) still says interview assessments have "a time limit of 90 minutes" and share "time taken" — now true only for an organisation's screening test; suggested wording: apply the 90 minutes and "time taken" to organisation screening tests only. Also noted: an organisation test now also opens on the first unanswered page when returning (harmless). |
