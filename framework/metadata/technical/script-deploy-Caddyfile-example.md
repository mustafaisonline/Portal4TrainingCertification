# config — deploy/Caddyfile.example

| Field | Value |
|---|---|
| Category | technical |
| Kind | config |
| Source of truth | `deploy/Caddyfile.example` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-10-server-bootstrap-serverscript-sh.md |

## Purpose
Caddy reverse-proxy and TLS template for the production host.

## Description
- **Runs on:** server. The bootstrap script renders it to `/etc/caddy/Caddyfile` by substituting `{{DOMAIN}}` and `{{PRODUCTION_PORT}}`, then validates and reloads Caddy.
- **Blocks:** `{{DOMAIN}}` — zstd/gzip encoding, reverse proxy to `127.0.0.1:{{PRODUCTION_PORT}}`, rolling access log `/var/log/caddy/production.log` (20 MB, keep 5); `www.{{DOMAIN}}` — permanent redirect to the apex; a legacy interim sslip.io host pair — permanent redirect to `{{DOMAIN}}` so previously issued certificate QR codes and links keep working (CR-2026-10-01-2136, cut over 2026-10-02). The sslip.io host name in the file is a hard-coded address, not substituted.
- **TLS:** automatic certificates by Caddy (K8). Security headers come from the application and pass through.
- **Inputs:** DOMAIN, PRODUCTION_PORT. **Secrets:** none. **Idempotent:** re-running bootstrap re-renders it. **Destructive:** overwrites `/etc/caddy/Caddyfile` when bootstrap runs.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
