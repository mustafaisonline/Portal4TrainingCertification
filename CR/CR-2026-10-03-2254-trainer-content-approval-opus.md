# CR-2026-10-03-2254 — Trainer-created training, formats and dates need admin approval before they go public

**Received:** 2026-10-03 22:50 MYT · **Status:** BUILT & VERIFIED — review next, then deploy · **Requested by:** founder · **Model:** opus

## 1. Request (verbatim)

> * When a user with Trainer role, creates a new training, format, schedule etc. admin must approve it before it gets published on this page.

## 2. Facts gathered (read-only investigation, 2026-10-03)

- Programme status is `published | unlisted | retired` (no "pending" state). Only an **administrator** can publish a training (`setTrainingStatusAction` is admin-only); a Trainer creates trainings as `unlisted` drafts, linked to them, and sees "ask an administrator to publish it". So **a brand-new training already needs admin approval** to appear on /programs.
- **Gaps:** (1) a Trainer can add formats, fees and *dates* to a training that is **already published** and can set a date to `open` — those can go live without admin review; (2) the administrator is not told when a Trainer has a training ready for review (no notification).
- An explicit "pending review" state would be a Prisma enum/column change (RED gate). A no-schema way exists: keep `unlisted`, add a "Submit for review" button that notifies administrators (bell + email) and writes an audit line; and let a Trainer save dates only as `planned` (admin changes it to `open`).

## 3. Decisions needed from the founder (with the assistant's recommendation)

1. **Approach:** (A, recommended) no schema change — "Submit for review" button notifies administrators; Trainer-created dates are saved as *planned* and only an administrator can set them *open*; edits to the text of an already-published training by a Trainer are allowed as today. (B) add a real "pending review" status — needs your explicit approval of a schema change.
2. **Edits to a published training by a Trainer** (price, content): should they also wait for approval? Recommendation: not now (it needs draft/versioned content, a larger change); revisit if needed.

## 4. Impacted elements

`src/modules/catalogue/programmes/{admin.actions.ts,admin.repository.ts,admin-access.ts,constants.ts}`, `src/modules/catalogue/offerings/admin.actions.ts`, `app/admin/trainings/[id]/page.tsx`, `TrainingStatusForm.tsx`, notifications (admin bell/email). Option B would add a `ProgrammeStatus` value (migration). Tests: admin-trainings and trainer scope specs.

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
| 2026-10-03 23:05 | Founder answered the §3 decisions: "I agree with all your recommendation with my few responses." **Item 11:** "I approved now" — approach A (no schema change): a "Submit for review" button notifies administrators; Trainer-created dates are saved as planned and only an administrator can open them; a Trainer's edits to an already-published training stay allowed as today. |
| 2026-10-04 03:10 | **BUILT & VERIFIED (approach A, no schema change).** (1) **Submit for review** on a Trainer's draft: disabled until the readiness check passes (same check as Publish); an audit row `programme.review_requested`, a bell notice to every administrator, at most one request per 10 minutes, refused for a published/retired training or another trainer's; the trainings list shows **"Review requested"** to administrators. (2) **A Trainer's dates are saved as *planned*** (the server sets it; the Status field is read-only for them) and cannot change a date's status; only an administrator opens a date; administrators get a bell notice when a trainer schedules a date. Publishing was already administrator-only. Tests: integration (review request rules), e2e (trainer flow: planned date, Submit disabled → enabled → sent → repeat refused, admin notices + chip); full unit/integration 849/849; related e2e specs green (three load flakes passed on re-run). **Not covered (noted for the founder):** pace *formats* a Trainer adds to an already-published training and a Trainer's edits to the text of a published training still go live immediately (as today). **Rollback:** revert the commit (no data change). |
| 2026-10-04 03:40 | **Review (governance + security): PASS WITH NOTES, nothing required.** Applied the cheap improvements: the "Review requested" marker clears once the training's status changes after the request; the Submit button is described by the not-ready list for screen readers; one "a trainer scheduled a date" notice per training per hour; a Trainer cannot move an already-open date to another training. **Noted, for the founder to decide:** (1) a Trainer's *planned* date on an already **published** training is publicly listed on /schedule (as "Register interest", not payable) without an administrator's approval — if that is not acceptable, the fix is to hide planned dates until an administrator opens them; (2) a Trainer can still edit the day/place/capacity of an administrator-opened date, and pace formats / published text, without review (as today); (3) no action-level test of the status override yet (covered by the e2e trainer flow). **Not deployed** — held with the header (CR-2250) for the founder's approval of the screenshots. |
