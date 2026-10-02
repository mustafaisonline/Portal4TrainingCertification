# script — bulk-review-questions

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/bulk-review-questions.ts |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | M14 Phase 3 (named in the script); scripts/approve-interview-questions.ts; npm script knowledge-check:approve-all |

## Purpose
Bulk-approves every DRAFT Knowledge Check (Free Learning) question, across every topic, to REVIEWED. The Knowledge Check draws only from reviewed questions of published topics. Done on the founder's explicit instruction of 2026-09-29, so the imported bank (3,830 questions at the time, per the script comment) could be tested without one-by-one review.

## Description
- **Arguments:** `<admin-email>` (required; no email prints usage and exits 2).
- **Environment variables:** `DATABASE_URL` (if unset, loads `.env.local` from the current directory).
- **Outputs:** `N topic(s) have draft questions (of M total)` and `approved N question(s) across M topic(s), actor <email>`. Unknown email: `no user with email …`, exit 1.
- **Database tables:** reads `users` and `topic_questions` (counts by topic); writes `topic_questions` status to reviewed via `setAllQuestionsStatus`, which per the script comment writes one audit row per question (`audit_log`) in one transaction per topic.
- **External services:** none.
- **Side effects:** questions become eligible to appear in the Knowledge Check.
- **Idempotent / destructive:** idempotent (only topics with remaining drafts are touched; safe to re-run after a fresh import). Not destructive of data; reversing needs statuses to be set back through the admin tooling (not determined from the script).
- **How to run:** `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; npm run knowledge-check:approve-all -- <admin-email>`.
- **Safety notes:** unlike the interview variant, this script only looks the user up and does NOT check that the email belongs to a platform administrator (verified in the script). It approves without human review of content, so use deliberately. Runs against whichever database `DATABASE_URL` points to.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
