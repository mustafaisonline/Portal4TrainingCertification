# CR-2026-10-03-2255 — Publish error: make "Not ready to publish" say exactly what is missing

**Received:** 2026-10-03 22:50 MYT · **Status:** BUILT & VERIFIED — deploy after review · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> * https://dataainexus.com/admin/trainings I created one training but I am unable to publish it. It keep giving this error: Not ready to publish: 1 of 4 fee rows · sections still hold placeholder text.
>    * I have filled all the fields properly. Please assist to fix the issue.

## 2. Facts gathered (read-only investigation, 2026-10-03)

- No code defect. The check (`app/admin/trainings/[id]/page.tsx:27-30`) requires: at least one curriculum module; **all four regional fee rows saved** (Malaysia HRD Corp, Malaysia, Pakistan, International — "1 of 4" means only one is saved); and no "to be written" text in the **Highlights** or the **Who should attend** intro (the starter text every new draft gets). The Publish button stays disabled until all pass.
- The message does not say *which* fee regions or sections are missing. The check ignores the "Who should attend" roles and the "Why this training" paragraphs, which also start as placeholders. A region the business does not sell still blocks publishing (no "not applicable"). The server does not re-check readiness (UI only).
- **Immediate help given to the founder (no code):** save all four fee rows on the Fees tab; rewrite Highlights and the Who-should-attend intro on the Content tab; then press Publish (administrator only).

## 3. Decisions needed from the founder (with the assistant's recommendation)

1. **Message wording:** list exactly what is missing ("Fees missing for: Pakistan, International · Highlights still say 'to be written' · …") with links to the Fees/Content tabs. Recommendation: yes.
2. **Also check** the "Who should attend" roles and the "Why this training" text for placeholders? Recommendation: yes.
3. **Regions not sold:** must every training have all four fee rows? Recommendation: keep it (the price table on the site expects four); a "not offered" option would need a schema or content-model change, so only do it if you ask.
4. **Server-side re-check** of readiness when publishing (so it cannot be bypassed)? Recommendation: yes.

## 4. Impacted elements

`app/admin/trainings/[id]/page.tsx`, `TrainingStatusForm.tsx`, `src/modules/catalogue/programmes/admin.repository.ts` (`setTrainingStatus`), `fees/page.tsx`; tests in `admin-trainings.spec.ts`. No schema change.

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
| 2026-10-03 23:05 | Founder answered the §3 decisions: "I agree with all your recommendation with my few responses." Decision 12 as recommended: list exactly what is missing, also check the roles and rationale placeholders, and re-check readiness on the server when publishing. Regions-not-sold stays as is (all four fee rows). |
| 2026-10-03 23:55 | **BUILT & VERIFIED.** New `publishReadiness()` (one pure check) lists exactly what is missing, each with a link to its tab (Fees: names the missing regions and "N of 4"; Content: Highlights, Who-should-attend intro+roles, Why-this-training; Curriculum: modules); the same check is re-run on the server in `setTrainingStatus` (refuses with the reasons, code `not_ready`). Trainers see the list read-only. Tests: 3 unit + the integration launch sequence now asserts the server refusal. No schema change. **Rollback:** revert the commit. |
