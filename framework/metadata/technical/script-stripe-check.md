# script — stripe-check

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/stripe-check.ts |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | Milestone 15 Requirement 7 (named in the script); npm script stripe:check; src/modules/commerce/stripe-check.ts |

## Purpose
Read-only Stripe readiness check: reports whether the configured key is live or test, whether the account can take charges, and which webhook events the endpoint for `APP_BASE_URL` subscribes to compared with the events the application handles.

## Description
- **Arguments:** none.
- **Environment variables read:** `STRIPE_SECRET_KEY` (if unset, loads `.env.local`), `STRIPE_WEBHOOK_SECRET` (only whether present), `APP_BASE_URL`. Secret values are never printed; the mode comes from the key prefix, and error text is scrubbed of key-shaped strings and truncated to 160 characters.
- **Outputs:** a formatted report (`[FAIL]` lines mark blocking problems). Exit codes: 0 no blocking problem, 1 a failure, 2 no key to check with.
- **Database tables:** none.
- **External services:** Stripe API, read-only calls `accounts.retrieveCurrent` and `webhookEndpoints.list` (limit 100). It creates and changes nothing in Stripe.
- **Side effects:** none besides console output (calls appear in the Stripe account's API logs).
- **Idempotent / destructive:** idempotent, read-only.
- **How to run:** locally `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; npm run stripe:check`. On the server the script header shows `set -a; . /etc/p4tc/production.env; set +a` first, then `npm run stripe:check`.
- **Safety notes:** which key is used depends on the environment loaded, so confirm whether you are checking test or live mode from the report's first lines. Do not paste the environment file into chat or documents.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
