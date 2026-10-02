# script — approve-interview-questions

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/approve-interview-questions.ts |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | CR-2026-10-01-1711 (named in the script); scripts/bulk-review-questions.ts (the Knowledge Check equivalent); npm script interview:approve-all |

## Purpose
Bulk-approves DRAFT interview questions of the shared (platform-owned) role banks to REVIEWED, on the founder's explicit instruction to approve a bank without reading each question. Candidates only see reviewed questions. It is never run automatically.

## Description
- **Arguments:** `<admin email>` (required) and optional `[role-slug]`. With a slug only that shared role's bank is touched; without one, every shared role (organisationId null). No email: prints usage and exits 2.
- **Environment variables:** `DATABASE_URL` (if unset, loads `.env.local` from the current directory).
- **Outputs:** one line per role (`<slug>: N draft question(s) approved`) and a total line with the actor's email. Errors print `interview:approve-all failed: …` and set exit code 1. The core function `approveAllDraftInterviewQuestions` is also exported and called in-process by an integration test.
- **Database tables:** reads `users`, `user_roles` (must hold `platform_admin`), `assessment_roles` (via listRolesForAdmin, with draft counts); writes `role_questions` (status draft to reviewed) through `bulkSetStatus`, which per the script comment writes one summary audit row per role (`audit_log`) against the administrator's account. Organisation-owned questions are never touched.
- **External services:** none.
- **Side effects:** status change on questions, one transaction per role.
- **Idempotent / destructive:** idempotent (only drafts move; a second run changes nothing). Not destructive of data, but it is a business-significant approval that skips per-question review; reversing it needs an administrator to change statuses back through the admin screen (not determined from the script whether a bulk revert exists).
- **How to run:** `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; npm run interview:approve-all -- <admin email> [role-slug]` (npm runs `node --experimental-transform-types --import ./scripts/register-alias.mjs scripts/approve-interview-questions.ts`).
- **Safety notes:** refuses an email that is not a platform administrator or does not exist; refuses an unknown role slug. Runs against whichever database `DATABASE_URL` points to, so check the target (local, UAT or production) first. Entry point runs only when invoked as a script.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
