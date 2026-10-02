# script — deploy/10-server-bootstrap-serverscript.sh

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/10-server-bootstrap-serverscript.sh` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-ecosystem-production-config-js.md; script-deploy-Caddyfile-example.md; script-deploy-systemd-p4tc-backup-service.md, script-deploy-systemd-p4tc-backup-timer.md, script-deploy-systemd-p4tc-reminders-service.md, script-deploy-systemd-p4tc-reminders-timer.md |

## Purpose
Turn a fresh Ubuntu 24.04 Droplet into the governed production host (one-off setup, re-runnable).

## Description
- **Runs on:** server, as root (`must run as root`), once, from `/opt/p4tc/deploy` synced from the laptop.
- **Pipeline position:** step 10 / Phase B provisioning, before the first audit or deploy.
- **Invocation:** `bash /opt/p4tc/deploy/10-server-bootstrap-serverscript.sh --domain <apex>` (the only argument; falls back to config.env DOMAIN and refuses a placeholder or empty value).
- **Nine stages:** (1) packages: ca-certificates, curl, gnupg, openssl, ufw, unattended-upgrades, postgresql-16, Node (NODE_MAJOR, via NodeSource), PM2, Caddy; (2) `deploy` user with SSH key copied from root, removed from sudo; (3) PostgreSQL role `p4tc` with a generated password stored root-only in `/etc/p4tc/.pg-password`, databases `p4tc_production` and the sandbox DB, both UTC; (4) layout under `/etc/p4tc` and `/opt/p4tc` with ownership and modes, generated HMAC key `/etc/p4tc/governance-hmac.key`, a names-only `production.env` template (variables DATABASE_URL pre-filled, BETTER_AUTH_SECRET, APP_BASE_URL, PROFILE_ENCRYPTION_KEY, EMAIL_TRANSPORT=log, JOBS_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, optional LEGAL_DOCUMENT_VERSIONS and ENQUIRY_NOTIFY_EMAIL) — values other than DATABASE_URL are typed by the founder on the server; (5) the wrapper `/usr/local/bin/p4tc-deploy` and `/etc/sudoers.d/p4tc-deploy` (deploy may sudo only `promote` and `rollback`); (6) `pm2 startup` for deploy; (7) Caddyfile rendered from `Caddyfile.example` and validated; (8) systemd service and timer units, ufw (22, 80, 443; deny other incoming), unattended upgrades; (9) verification checks (permissions, wrapper refuses bare and unsigned calls, pm2, caddy, DB connection, localhost-only listen).
- **Outputs:** console log; exits 1 if verification fails; prints next steps (copy HMAC key to laptop, fill the env file, run the audit).
- **What it changes:** the whole server configuration (RED-level provisioning, founder-run). **Idempotent:** yes by design (checks before creating; the role password is re-applied). **Destructive:** no data deletion; it does rewrite `/etc/caddy/Caddyfile`, systemd units and the wrapper.
- **Safety notes:** secrets are generated on the server and never transmitted; the env template is only written if absent.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
