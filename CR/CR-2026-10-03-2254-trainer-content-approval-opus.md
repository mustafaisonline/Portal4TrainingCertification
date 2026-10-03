# CR-2026-10-03-2254 — Trainer-created training, formats and dates need admin approval before they go public

**Received:** 2026-10-03 22:50 MYT · **Status:** ASSESSED — awaiting the founder's decisions (§3) · **Requested by:** founder · **Model:** opus

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
