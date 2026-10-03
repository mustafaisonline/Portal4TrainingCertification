# CR-2026-10-03-2045 — Trainer sees who registered interest or who paid (replaces the trainer email CR)

**Received:** 2026-10-03 20:45 MYT · **Status:** DECIDED — option B approved; build after the slice-2 reviews · **Requested by:** founder · **Model:** sonnet

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
| 2 | Build | NOT STARTED | — |
| 3 | Verify / deploy | NOT STARTED | — |

## 5. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 20:45 | CR created from the founder's message; existing Trainer screens inspected read-only; options recorded. |
| 2026-10-03 21:05 | **Founder chose option B:** add the interest page's copy-addresses / BCC message / CSV tools to the paid (confirmed) participants on the Attendance sheet. No schema change; trainers see only their own dates (scope already applied). Build waits for the slice-2 reviews to finish so the reviewed tree does not move. |
