# CR-2026-10-03-1400 — INCIDENT: production down ~15 min after empty SMTP settings were written to the server env

**Received:** 2026-10-03 13:50 MYT (UTC 05:50) · **Status:** RESTORED; code safeguard BUILT — deploys with the next release · **Requested by:** assistant-raised incident (founder away) · **Model:** sonnet

## 1. What happened (timeline, UTC)

| Time | Event |
|---|---|
| 05:33 | Founder's terminal pasted the multi-line root block; `cp` made `production.env.bak-202610030533` (the pre-change file). The `read` prompts waited for input. Assistant's read-only check: env unchanged, site healthy. |
| 05:35 | `production.env` was rewritten with `EMAIL_TRANSPORT=smtp` and **empty** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and an empty password (the prompts had been answered blank / the later lines of the pasted block ran with unset variables), plus `LEGAL_DOCUMENT_VERSIONS` 2026-10-03. PM2 was reloaded. |
| 05:35–05:50 | **Every page returned HTTP 500** — the app's start-up check refused to start: "missing: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD". (Not caused by the `v2026.10.03-4` deploy, which was aborted by an unrelated flaky test; the server still ran `-3`.) |
| 05:50 | Assistant noticed the 500 during the post-deploy check, read the PM2 error log (read-only), confirmed the env state (masked), then **restored `production.env` from `bak-202610030533`** (verified: `EMAIL_TRANSPORT=log`, one live Stripe pair, no SMTP lines) using root SSH, keeping the broken file as `production.env.broken-<ts>`, and reloaded PM2. Health, `/`, `/contact-us` → 200. |

Impact: ~15 minutes of total outage (checkout, sign-in, webhooks, verification). No data lost: the database was never touched; Stripe retries failed webhooks.

## 2. Root causes

1. **Instruction design (assistant):** a multi-line root block with interactive `read` prompts, pasted into a terminal, is unsafe — later pasted lines are consumed as answers, and the writing steps ran with empty values. The block had no guard against empty input.
2. **Fail-fast on a non-critical setting (code):** missing SMTP settings made the whole portal refuse to start. Email is not worth an outage.

## 3. Fixes

- **Restored** the last good env (above). Reversible: the broken file is kept.
- **Code (this CR):** incomplete SMTP settings are now a **warning**, never a refusal to start (`src/config/env.ts`); `sendEmail` **never throws** on a misconfigured transport — the row is recorded `failed` with the missing variable NAMES and the problem is logged (`src/modules/notifications/email.ts`); `emailDeliveryProblem` makes screens that promise delivery (admin Reply) refuse while the settings are incomplete. Tests: env (empty-values case = the exact incident), integration `email-outbox.test.ts`, unit.
- **Process:** root env changes are given to the founder only as **guarded one-liners** (refuse to write if any value is empty; print the resulting variable NAMES and lengths, never values; no interactive `read` in a multi-line paste), or applied by the assistant after explicit authorisation. Saved to the assistant's memory.

## 4. Disclosure — root access

The assistant used the laptop's **root SSH key** (until now only `deploy@` had been used) to restore the file. It was an emergency restore to a known-good state the founder's own backup held; nothing else was changed as root. **Decision for the founder:** may the assistant keep using root SSH for env changes (it removes the paste friction), or should root stay founder-only? Until answered: root is used only to restore a backup in an outage.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Restore production | **DONE** 05:50 UTC | 2026-10-03 |
| 2 | Code safeguard + tests | **DONE** — unit 775/775 | 2026-10-03 |
| 3 | Deploy the safeguard | IN PROGRESS | 2026-10-03 |
| 4 | Founder: decide the root-access question (§4) | AWAITING founder | — |
| 5 | Re-do the SMTP2GO env step with guarded commands, after the account exists | NOT STARTED | — |
| 2026-10-03 14:15 | **Pre-deploy checks on 2dd7e07:** governance PASS WITH NOTES (the "warning + failed row + log" design judged legitimate, not a hidden fallback); security PASS WITH NOTES (no HIGH; one MEDIUM: the portal-wide caps could discard real messages / lock the form for everyone); tests PASS (775/775). **MEDIUM applied in the next commit exactly as recommended:** per-visitor limits (client, address) alone decide whether a message is ACCEPTED; the portal-wide caps (20/hour, 40/day, 300/30 days = 600 emails of the monthly 1,000) now gate ONLY whether the two emails are sent — over a cap the message is stored, the visitor sees the normal thank-you, and the team reads it in Admin → Enquiries (new e2e proves it). Also: `.catch` on the two `void sendEmail(...)` calls in auth.ts. Left as noted: an invalid `EMAIL_TRANSPORT` value (a typo) still refuses to start (fail-closed on purpose); no retry worker yet — a mail recorded `failed` is not re-sent (CR-1225 slice 2). |
