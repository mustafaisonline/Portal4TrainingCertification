# script — grant-admin

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/grant-admin.ts |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | MILESTONE_2_EXECUTION_PLAN.md §2 item 13 and AD-D1 (named in the script); npm script admin:grant |

## Purpose
Bootstrap for the first administrator: grants the `platform_admin` role to an existing, registered user. There is no admin UI for roles until M8, and an administrator cannot be created by registration.

## Description
- **Arguments:** `<email>` (required; no email prints usage and exits 2).
- **Environment variables:** `DATABASE_URL` (if unset, loads `.env.local` from the current directory).
- **Outputs:** `granted platform_admin to <email> (<id>)`, or `<email> already holds platform_admin`. Unknown user: message that the person must register first, exit 1.
- **Database tables:** reads `users`; writes `user_roles` and its audit row in `audit_log` in one transaction (actor is the system, grantedByUserId null, reason "bootstrap via scripts/grant-admin.ts").
- **External services:** none.
- **Side effects:** the user gains administrator rights. Per the script comment the person must still enrol MFA before `/admin` serves anything (plan §6.8).
- **Idempotent / destructive:** idempotent; adds access, deletes nothing. Does not revoke.
- **How to run:** `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; npm run admin:grant -- someone@example.com`.
- **Safety notes:** this is an authorization change; run only for the intended person and against the intended database (`DATABASE_URL`). Anyone with shell access to the environment can run it.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
