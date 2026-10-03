# CR-2026-10-03-2045 — Trainer sees who registered interest or who paid (replaces the trainer email CR)

**Received:** 2026-10-03 20:45 MYT · **Status:** DEPLOYED `v2026.10.03-10` · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> Trainer bulk and individual email. Response: Please remove this requirement as i can see it too much to ask in the portal. Lets show trainer who registered the interest or who paid. We will create trainer email on the DataAINexus email server which can use later to send email to candidate. So ignore this requirement, If already in progress, please revert back.

## 2. Facts gathered (read-only)

- **Interested people:** Admin → **Users Interest** (`/admin/interest`) already lists, for a Trainer, the people who registered interest in their OWN trainings (scope applied in the repository), with a CSV download, a copy-addresses button and a ready-made BCC message to open in the trainer's own mail program, and "Mark as notified".
- **People who paid:** Admin → **Attendance** (`/admin/attendance/[offeringId]`) lists, per scheduled date, the confirmed participants (a seat is confirmed only after payment) with name, email, date of birth and country — for a Trainer, their own dates only.
- Both are in the Trainer's navigation today. What does **not** exist: one place that shows a trainer, per training, **interested and paid side by side**, and a paid-people export/BCC like the interest page has.

## 3. Decisions and assumptions

- CR-1229 is cancelled (see its §8); the portal sends no email for trainers. Trainers use a DataAI Nexus mailbox later (founder, 2026-10-03).
- **Nothing is built under this CR yet** — the two lists exist, so the founder should say whether they are enough or what is missing (options: A. nothing more; B. add the same copy / CSV / BCC tools to the paid list on the Attendance sheet; C. a single "People" tab per training showing interested and paid together). Recommendation: B — smallest change, reuses the interest page's pattern; no schema change.

## 4. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder chooses A, B or C | **DONE — B** ("Go with option B") | 2026-10-03 |
| 2 | Build | **DONE** — participants tools on the Attendance sheet + `/admin/attendance/[offeringId]/export.csv` | 2026-10-03 |
| 3 | Verify / deploy | Verified (review PASS WITH NOTES, no HIGH/MEDIUM); deploy next | 2026-10-03 |

## 5. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 20:45 | CR created from the founder's message; existing Trainer screens inspected read-only; options recorded. |
| 2026-10-03 21:05 | **Founder chose option B:** add the interest page's copy-addresses / BCC message / CSV tools to the paid (confirmed) participants on the Attendance sheet. No schema change; trainers see only their own dates (scope already applied). Build waits for the slice-2 reviews to finish so the reviewed tree does not move. |

| 2026-10-03 22:25 | **Option B built.** On each Attendance sheet (a date's confirmed = paid participants) the trainer gets the Users-Interest tools: *Copy all emails*, *Open an email to all (BCC)* (a short editable draft, no invented policy; dropped above ~1800 characters, then "copy" is the way), *Download CSV* (Training, Dates, Full name, Email, Date of birth, Country, Attended — only what the sheet already shows). New: `src/modules/attendance/participants-tools.ts`, the CSV route (same gate as the interest export: signed out → sign-in, other roles 403, a Trainer sees only their own dates via `getAttendanceSheet(…, scope)`, non-UUID → 404, no-store/attachment/nosniff, formula guard), toolbar in the sheet page. The portal sends no email. No schema, dependency or payment change. Tests: unit (CSV, formula guard, de-dupe, mailto cap), e2e (tools, mailto BCC, CSV body and per-date isolation, 404, axe, signed-out redirect); Trainer scope is covered by `attendance.test.ts`. Review: PASS WITH NOTES (no HIGH/MEDIUM). **Rollback:** revert the commit (no data change). Users Interest already existed unchanged. |
| 2026-10-03 20:46 MYT (12:45 UTC) | **DEPLOYED `v2026.10.03-10` (`40388c2`).** Validation PASSED, 0 warnings; the new CSV route signed-out → sign-in; health OK. |
