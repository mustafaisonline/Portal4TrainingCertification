# CR-SPEC-2026-10-03-2254-trainer-content-approval-opus — Trainer-created training and dates need admin approval

**CR:** [CR-2026-10-03-2254-trainer-content-approval-opus](../CR-2026-10-03-2254-trainer-content-approval-opus.md)

| # | Task | Files | Status | Notes |
|---|---|---|---|---|
| 1 | Submit for review (audit row, bell + email to administrators) | `programmes/admin.repository.ts`, `admin.actions.ts`, `admin-emails.ts`, `SubmitForReviewForm.tsx` | DONE | no schema change |
| 2 | A Trainer's new date is hidden until an administrator approves it | `prisma/schema.prisma` (`OfferingStatus` + `pending_review`), migration, `offerings/constants.ts`, `offerings/admin.actions.ts`, `OfferingForm.tsx` | IN PROGRESS | additive enum value |

**Data model:** one additive change — a new value `pending_review` ("Waiting for approval") in the PostgreSQL enum `offering_status`. Public queries list dates with an explicit `status IN ('planned','open','full')`, so a `pending_review` date is never public; an administrator approves it by setting the date's status (planned or open). No column, table or constraint is added or removed; existing rows are untouched.

**SCHEMA CHANGE APPROVED BY FOUNDER** — 2026-10-04: the founder's decision "When trainer is done creating new training and then schedule, both time email notification should go to admin, Admin should login and give approval", and his standing approval "Please go ahead, no need to show. You have my approval." for the database changes arising from these requests.

**Rollback:** revert the commit. PostgreSQL cannot drop an enum value; the unused value is harmless (the old release ignores it, and no row uses it until a Trainer schedules a date). If it must be removed, a founder-approved migration recreating the enum would be needed.
