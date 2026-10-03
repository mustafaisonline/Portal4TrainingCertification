# CR-2026-10-03-2251 — Interview and organisation tests: no timer, per-page results, cancel, save & exit, paginated results

**Received:** 2026-10-03 22:50 MYT · **Status:** ASSESSED — awaiting the founder's decisions (§3) · **Requested by:** founder · **Model:** opus

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
| 1 | Founder answers §3 | OPEN | 2026-10-03 |
| 2 | Build (after the answers) | NOT STARTED | — |
| 3 | Verify (tests, reviews) | NOT STARTED | — |
| 4 | Deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 22:50 | CR created from the founder's message; existing code inspected read-only; nothing built. |
