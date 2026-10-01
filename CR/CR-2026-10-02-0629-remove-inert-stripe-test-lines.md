# CR-2026-10-02-0629 — Remove the inert Stripe test lines from the server env file

**Received:** 2026-10-02 06:29 MYT · **Status:** READY — one root command for the founder · **Requested by:** founder

## 1. Request (verbatim)

> Smaller items: … Env file: the inert `sk_test_` line is still in the server's env file. … Response: Please fix these as per best practices

## 2. Facts gathered

- `/etc/p4tc/production.env` (root:deploy 0640) holds TWO pairs (read-only, values masked 2026-10-02): lines 13–14 `STRIPE_SECRET_KEY=sk_test_…` + `STRIPE_WEBHOOK_SECRET=whsec_U9i…`; lines 18–19 `STRIPE_SECRET_KEY=rk_live_…` + `STRIPE_WEBHOOK_SECRET=whsec_hGN…`. `run.sh` sources the file, so the later line wins.
- Proof the live pair is the one in use: `stripe:check` reports "Key mode: LIVE"; the Dashboard's test webhook returned 200 against the app, which verifies with the effective (later) secret.
- The assistant cannot edit the file (root-owned) and never handles key values.

## 3. Decisions & assumptions

- Best practice: remove dead credentials; keep a backup. Delete only the test pair by exact pattern; leave the live pair untouched.

## 4. Plan

Founder runs the command in the CR's progress log as root, then the assistant re-runs `stripe:check` and a webhook probe.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Root command given | **DONE** | 2026-10-02 |
| 2 | Founder runs it | **DONE** — backup `production.env.bak-*` on the server | 2026-10-02 |
| 3 | Verify: one `STRIPE_SECRET_KEY` (rk_live_), one `STRIPE_WEBHOOK_SECRET`, `stripe:check` LIVE, health OK | **DONE** | 2026-10-02 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 06:29 | CR created. Command: `cp -p /etc/p4tc/production.env /etc/p4tc/production.env.bak-$(date +%Y%m%d%H%M) && sed -i -e '/^STRIPE_SECRET_KEY=sk_test_/d' -e '/^STRIPE_WEBHOOK_SECRET=whsec_U9i/d' /etc/p4tc/production.env && grep -nE '^STRIPE_' /etc/p4tc/production.env \| cut -c1-24 && sudo -u deploy -H pm2 reload p4tc-production` — expected: exactly two lines remain (`rk_live_`, `whsec_hGN`). |
| 2026-10-02 06:45 | Founder ran the command as root. Verified from the laptop: env now has exactly `STRIPE_SECRET_KEY=rk_live_…` (line 16) and `STRIPE_WEBHOOK_SECRET=whsec_hGN…` (line 17); `/api/health` ok after the PM2 reload; unsigned webhook POST → 400; `stripe:check` → "Key mode: LIVE (restricted key)", no blocking problem (the account/endpoint reads still WARN: a restricted key cannot read them — same as before the clean-up). |
