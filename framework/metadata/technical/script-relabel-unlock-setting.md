# script — relabel-unlock-setting

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/relabel-unlock-setting.ts |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | Milestone 16 wording, founder 2026-09-30 (named in the script); npm script unlock:relabel; src/modules/commerce/unlock.repository.ts |

## Purpose
One-off operator script. The stored unlock-fee label, which is also the Stripe product name, still read "Knowledge Check result document". This appends one new setting row carrying the current default label (`UNLOCK_DEFAULT_LABEL`) with the same enabled flag, amount and currency as the setting in force. It is exactly what an administrator does at `/admin/orders/unlock`, audited against the founder's account.

## Description
- **Arguments:** `<admin email>` (required; else usage and exit 2).
- **Environment variables:** `DATABASE_URL` (if unset, loads `.env.local` from the current directory).
- **Outputs:** `unlock setting relabelled: "<old>" → "<new>" (<currency> <amount>, enabled/disabled)`; or `already labelled … nothing to do`; or an error with exit 1 (unknown user, not a platform administrator, or no unlock setting exists yet).
- **Database tables:** reads `users`, `user_roles`, `knowledge_check_unlock_settings` (current setting); writes one new row in `knowledge_check_unlock_settings` via `createUnlockSetting` (effectiveFrom now, note "Relabelled for the Free Assessment Check wording (Milestone 16)"), with the audit entry made by that repository function (inferred from the "audited" statement; not shown in the script).
- **External services:** none called directly by the script (the label is used as the Stripe product name elsewhere in the application).
- **Side effects:** the old row stays in the history; the new row becomes the setting in force, so future checkouts use the new label.
- **Idempotent / destructive:** idempotent (does nothing if the label already matches); append-only, deletes nothing.
- **How to run:** `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; npm run unlock:relabel -- <admin email>`.
- **Safety notes:** requires an existing platform administrator email. Changes a payment-facing label, so confirm the target database (`DATABASE_URL`) first. Amount and currency are copied unchanged.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
