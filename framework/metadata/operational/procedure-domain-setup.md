# procedure — Connect a domain (dataainexus.com)

| Field | Value |
|---|---|
| Category | operational |
| Kind | procedure |
| Source of truth | `docs/operations/DOMAIN_SETUP.md` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | ADR-046; J4/K13; CR-2026-10-01-2136; `deploy/Caddyfile.example`; `deploy/config.env`; [checklist-stripe-go-live.md](checklist-stripe-go-live.md) |

## Purpose
Point a registered domain at the production Droplet, have Caddy obtain HTTPS, and tell the portal its new address. The code does not hard-code the host name; links, QR codes, sitemap and emails are built from APP_BASE_URL, so cut-over is configuration only.

## Description
**Status per the document:** guide written 2026-10-01 (CR-2026-10-01-2136). Steps 1 to 3 were executed 2026-10-02 (Route B at HostGator; Caddy and APP_BASE_URL on the Droplet; verified live). Step 4 (Stripe webhook URL) is the founder's and outstanding per the document. Step 5 repo changes are committed; the next governed deploy proves them. Whether step 4 has since been done is not determined from the source.

### Steps
1. **DNS (founder).** Route A: make DigitalOcean the DNS host (add domain, A records for `@` and `www`, change nameservers at the registrar). Route B: keep nameservers and edit the A records at the current DNS host. Check with `dig +short` for both names; do not continue until both return the Droplet IP.
2. **Caddy (server, root).** Edit `/etc/caddy/Caddyfile`: site block for the domain proxying to the app port, `www` and the old `sslip.io` host as permanent redirects (so earlier QR codes keep working); `caddy validate`, reload, check the journal for a certificate and `curl -sI`.
3. **Portal address (server, root).** Set APP_BASE_URL in `/etc/p4tc/production.env` (https, no trailing slash); `pm2 reload` as deploy; check `/api/health`. Effects: new links and QR codes use the new host; everyone is signed out once.
4. **Stripe (founder, live mode).** Edit the webhook endpoint URL to the new host; the signing secret does not change; Send test webhook, expect 200.
5. **Tooling and records.** Set `DOMAIN` in `deploy/config.env` only after the new address answers (otherwise validation would fail and roll back); add the legacy-host redirect to `deploy/Caddyfile.example`; update docs; one governed deploy to prove it.

Later and not required for launch: business email on the domain (needs MX, SPF, DKIM; none exists; `EMAIL_TRANSPORT=log`) and lifting the not-indexed setting only at public launch (the 2026-10-02 legal CR records noindex as lifted in code; see CR-2026-10-02-0610).

## Preconditions
Registrar or DNS-host login, SSH root access to the Droplet, Stripe Dashboard access.

## Safety notes
Do not set `DOMAIN` in `deploy/config.env` before the domain answers. Keep the app port already used in the existing Caddyfile. Production env file is edited on the server only.

## Change history
- 2026-10-02 — created from `docs/operations/DOMAIN_SETUP.md`.
