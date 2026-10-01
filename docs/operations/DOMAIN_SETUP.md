# Connecting a domain to the portal (DigitalOcean) — dataainexus.com

**Status:** guide written 2026-10-01 (CR-2026-10-01-2136). **Nothing here has been done on the server or at the registrar** — these are the steps, in order. The code does not hard-code the host name: every link, QR code, sitemap and email address is built from `APP_BASE_URL`, so the cut-over is configuration, not a code change.

## What was found on 2026-10-01 (read-only DNS lookups)

| Fact | Value |
|---|---|
| Registrar | Network Solutions, LLC (domain created 2026-10-01, expires 2027-10-01) |
| Nameservers today | `hgns1.hostgator.com`, `hgns2.hostgator.com` (HostGator) |
| `dataainexus.com` and `www` today | A record → `208.91.197.15` (a HostGator parking address — **not** your server) |
| Mail (MX) records | **none** — so moving DNS will not break any email |
| Your server | DigitalOcean Droplet `198.199.67.177`, served today at `https://198-199-67-177.sslip.io` |

## Step 1 — Point the domain at your Droplet (you, ~10 minutes, then wait)

Choose **ONE** of the two routes.

**Route A (recommended — you only need your Network Solutions login):** make DigitalOcean the DNS host.
1. Sign in at **DigitalOcean → Networking → Domains → Add Domain**, enter `dataainexus.com`, choose your project.
2. In that domain, create records (leave the defaults `NS` records DigitalOcean adds):
   - **A** — hostname `@` → select the Droplet `trainingportal-production` (or enter `198.199.67.177`)
   - **A** — hostname `www` → the same Droplet / `198.199.67.177`
3. At **Network Solutions → My Domain Names → dataainexus.com → Manage → Change where domain points / Nameservers → "Use custom nameservers"**, replace the HostGator nameservers with:
   `ns1.digitalocean.com`, `ns2.digitalocean.com`, `ns3.digitalocean.com`
4. Save. Propagation is usually minutes to a few hours (it can take up to 48 h).

**Route B (only if you have the DNS login where the nameservers point, i.e. HostGator):** keep the nameservers; in HostGator's DNS zone editor change the **A** records for `@` and `www` from `208.91.197.15` to `198.199.67.177` (delete the parking record). Done.

**Check it worked** (from any terminal):
```bash
dig +short dataainexus.com        # must print 198.199.67.177
dig +short www.dataainexus.com    # must print 198.199.67.177 (or dataainexus.com. then the IP)
```
Do not continue until both answer with your Droplet's IP.

## Step 2 — Tell Caddy about the new name (server, as root; Caddy then gets the HTTPS certificate by itself)

```bash
ssh root@198.199.67.177
nano /etc/caddy/Caddyfile
```
Replace the file's contents with (the old `sslip.io` name stays as a permanent redirect, so every certificate QR code and link already printed or shared with the old address keeps working):
```
dataainexus.com {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000
	log {
		output file /var/log/caddy/production.log {
			roll_size 20mb
			roll_keep 5
		}
	}
}

www.dataainexus.com {
	redir https://dataainexus.com{uri} permanent
}

198-199-67-177.sslip.io {
	redir https://dataainexus.com{uri} permanent
}
```
> Keep the **port** your current Caddyfile already uses in `reverse_proxy 127.0.0.1:<port>` (the app logs show it listening on 3000; if your file says something else, keep that number). Then:
```bash
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
journalctl -u caddy -n 30 --no-pager      # look for "certificate obtained successfully" for dataainexus.com
curl -sI https://dataainexus.com | head -3   # HTTP/2 200
```

## Step 3 — Tell the portal its new address (server, as root)

```bash
nano /etc/p4tc/production.env
```
Change the one line: `APP_BASE_URL=https://dataainexus.com` (no trailing slash). Save, then:
```bash
sudo -u deploy -H pm2 reload p4tc-production
curl -s https://dataainexus.com/api/health
```
Effects: verification links and QR codes on **new** certificates use the new address; emails, the sitemap and `robots.txt` use it; everyone is **signed out once** (the session cookie belongs to the old host name). Certificates printed earlier still verify because the old address redirects (Step 2).

## Step 4 — Stripe (you, in the Dashboard, live mode)

Developers → Webhooks → your endpoint → **edit the URL** to `https://dataainexus.com/api/stripe/webhook` (the signing secret stays the same when you only edit the URL). Then **Send test webhook** → expect 200.

## Step 5 — Deploy tooling and records (this assistant, after Steps 1–4 are confirmed)

- `deploy/config.env`: `DOMAIN="dataainexus.com"` (so the deploy pipeline's health checks and validation use the new address) — **only after the new address answers**, or the next deploy's validation would fail and roll back.
- `deploy/Caddyfile.example` gains the legacy-host redirect block (so a rebuilt server gets it too); docs and `PROJECT_STATUS.md` updated; then one governed deploy to prove the pipeline validates `https://dataainexus.com`.

## Later (not required for launch)
- **Business email on the domain** (e.g. `hello@dataainexus.com`) needs an email host and MX/SPF/DKIM records; none exists yet. Today the portal sends no real email (`EMAIL_TRANSPORT=log`).
- `robots`: the site is still deliberately **not indexed** (`app/layout.tsx`); lift that only at your public launch.
