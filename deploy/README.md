# `deploy/` — the governed deployment framework

> **Status: BUILT 2026-09-26 (Milestone 11, Phase A) — rehearsed in `--dry-run` only. No server exists yet.** Phase B (provisioning the DigitalOcean Droplet and Managed PostgreSQL) is the founder's, step by step, per [`docs/execution/MILESTONE_11_EXECUTION_PLAN.md`](../docs/execution/MILESTONE_11_EXECUTION_PLAN.md) §2. Decisions K1–K16 were approved 2026-09-26 (ADR-046).

This is the portal's equivalent of eCard's `Deployement-Steps/`: the same **controls** — clean-git gate, release gate, signed deployment token, root-owned server wrapper, backup before every promotion, migration sandbox, post-deploy validation, governed rollback, read-only audit, per-step reports, timeouts on every task, no bypass flags — on the portal's own **runtime model**: an immutable container image built by CI, a managed PostgreSQL, Caddy for TLS. Section 6 says what differs from eCard and why.

## 1. The shape

```
LAPTOP (deploy/start.sh)                                   SERVER (one Droplet)
┌────────────────────────────────────────────┐             ┌──────────────────────────────────────────────┐
│ 00 discovery (read-only)                    │             │ /usr/local/bin/p4tc-deploy  (root, sudo-only) │
│ git gate: clean tree · tag at HEAD · on main│             │   promote --env E --tag T --governance-dir D  │
│ 04 release gate: tsc → vitest → build →     │             │     ├ verify HMAC token + manifest            │
│    playwright (prod build) · npm audit      │             │     ├ 01 backup  (pg_dump, sha256, retention) │
│ CI gate: release.yml built the tag          │   bundle    │     ├ docker pull  app + migrate images       │
│ issue signed token + manifest ─────────────────scp──────▶ │     ├ 03 sandbox (restore dump → migrate)     │
│ 05 deploy: sync deploy/, upload bundle,     │   ssh sudo  │     ├ prisma migrate deploy (real DB)         │
│    p4tc-deploy promote ──────────────────────────────────▶│     ├ compose up app:T  → wait /api/health    │
│ 06 validate (markers, health, pages,        │             │     │   (unhealthy → switch back to previous)  │
│    headers, webhook 400, container, disk)   │             │     └ markers, prune, remove bundle           │
│ 07 rollback [--restore-db]  (signed token)  │             │   rollback --env E --tag T [--restore-db F]   │
│ 09 audit  → GO / NO-GO                       │             │                                              │
└────────────────────────────────────────────┘             │ Caddy :443 → app :3000 (prod) / :3001 (staging)│
        ▲ images are never built here                       │ /etc/p4tc/*.env  root:deploy 0640 (values     │
GITHUB ACTIONS release.yml (on tag v*)                      │   typed on the server, never transmitted)     │
  verify (ci.yml) → build runtime + migrate images →        │ /opt/p4tc/{deploy,backups,staging,markers}    │
  PROVE (migrate a throwaway PG, boot in production mode,   │ systemd: reminders 01:00 UTC · backup 02:00   │
  /api/health 200) → push to registry                       └──────────────────────────────────────────────┘
                                                             DO Managed PostgreSQL (same VPC): p4tc_production,
                                                             p4tc_staging, p4tc_migration (sandbox), PITR on
```

## 2. Files

| File | Runs on | Purpose |
|---|---|---|
| `config.env` | — | Names and addresses only (host, domain, registry, paths, timeouts, retention, approved destructive migrations). `<placeholders>` until Phase B. **Never a secret.** |
| `config.local.env` | — | *gitignored* per-machine overrides (same names). A throwaway one makes `--dry-run` possible with no server |
| `lib/common.sh` | both | Logging with captured PASS/WARN/FAIL, three-line errors, `die`/`soft_fail`, `run_blocking`/`run_advisory` with a watchdog timeout (Bash 3.2-safe — no `timeout`(1)), lock, SSH helpers, git gates, reports |
| `lib/governance.sh` | laptop | Bypass rejection, deployment id, HMAC-signed token (openssl) with TTL, manifest, bundle upload, the one privileged call |
| `lib/server-promote.sh` | server (root) | What the wrapper executes: token verification with the server's own key copy, lock, backup → pull → sandbox → migrate → switch → health → auto-rollback → markers; and `rollback` |
| `start.sh` | laptop | **The entry point.** `--audit`, `--dry-run`, `--auto-approve`, `--env`, `--tag`; `--no-gate` only with `--dry-run` |
| `00-discovery.sh` | laptop | Read-only: toolchain, config sanity, repo state, SSH, server bootstrap state |
| `01-backup-serverscript.sh` | server | `pg_dump -Fc` + sha256 + meta, `pg_restore --list` check, retention `BACKUP_KEEP`; nightly via systemd; **always** before a promotion or restore |
| `03-migration-sandbox-serverscript.sh` | server | Restore the newest dump into `p4tc_migration`, list pending migrations from the tag's image, refuse unapproved destructive DDL, `migrate deploy` there, confirm up to date |
| `04-release-gate.sh` | laptop | `RELEASE_GATE.md` as code (K11): tsc, Vitest, build, Playwright **against the production build**, `npm audit` advisory |
| `05-deploy.sh` | laptop | Only under `start.sh`: verify server governance state, sync `deploy/`, upload bundle, `p4tc-deploy promote`, external health |
| `06-validate.sh` | laptop | Traceability markers, `/api/health` (200 · db up · newest migration), `/`, `/verify`, `/programs`, security headers, webhook refuses unsigned POST, container state, disk/memory, app log scan |
| `07-rollback.sh` | laptop | Governed rollback to the previous tag (marker) or `--tag`; `--restore-db <dump>` after a safety snapshot and an explicit confirmation |
| `09-audit.sh` | laptop | Read-only GO/NO-GO across laptop, source, server and framework; exit 0/2 |
| `10-server-bootstrap-serverscript.sh` | server (root, once) | Packages, `deploy` user, layout, HMAC key, names-only env templates, wrapper + sudoers, Caddy, timers, ufw, unattended upgrades, registry login, verification |
| `compose.production.yaml` | server | The app service for one environment; driven by the release file the wrapper writes |
| `Caddyfile.example` | server | apex → :3000, `www` → apex, `staging.` → :3001 with `X-Robots-Tag: noindex` |
| `systemd/` | server | `p4tc-reminders.{service,timer}` (K12) and `p4tc-backup.{service,timer}` |
| `logs/`, `reports/` | laptop | *gitignored* run output; one Markdown report per script run, `deployment-summary.md`, `deployment-manifest.json` |
| `.governance-hmac.key` | laptop | *gitignored*; copied once from `/etc/p4tc/governance-hmac.key` after bootstrap |

## 3. First-time setup (Phase B — each step is a RED action the founder takes)

1. **DigitalOcean**: Droplet (Ubuntu 24.04, 2 GiB / 2 vCPU, SGP1 — K4/K5), Managed PostgreSQL 16 (Basic, same VPC — K3), a Container Registry (starter — D5). On the cluster create `p4tc_production`, `p4tc_staging`, `p4tc_migration` and set each to UTC: `ALTER DATABASE p4tc_production SET timezone TO 'UTC';` (and the other two). Add the Droplet to the cluster's trusted sources.
2. **DNS (K13)**: `A` records for the apex, `www` and `staging` → the Droplet's IP.
3. **Fill `deploy/config.env`** (`SERVER_HOST`, `DOMAIN`, `REGISTRY`) — names only — commit it.
4. **Bootstrap** (as root, once):
   ```bash
   rsync -az deploy/ root@<droplet>:/opt/p4tc/deploy/
   ssh root@<droplet> 'bash /opt/p4tc/deploy/10-server-bootstrap-serverscript.sh --domain <apex>'
   ```
   It asks for a registry-read API token at the prompt (not stored by the script). Then on the laptop:
   ```bash
   ssh root@<droplet> cat /etc/p4tc/governance-hmac.key > deploy/.governance-hmac.key && chmod 600 deploy/.governance-hmac.key
   ```
5. **Type the env files on the server** — `nano /etc/p4tc/staging.env`, then `production.env` (templates were written with every name; see `.env.example` for each rule). Staging gets **test-mode** Stripe keys and the test-mode webhook secret; production gets the **live restricted key** with exactly the §1.2 permissions and the live endpoint's secret (`DEPLOYMENT_RUNBOOK.md` §6). Values never travel through this framework.
6. **GitHub**: repository variable `P4TC_REGISTRY` = `registry.digitalocean.com/<name>`; secret `DIGITALOCEAN_ACCESS_TOKEN` (registry read/write). `gh auth login` on the laptop.
7. **Seed reference data** once per environment (idempotent; never test users), using the tools image on the server:
   ```bash
   ssh deploy@<droplet> 'docker run --rm --env-file /etc/p4tc/staging.env <registry>/p4tc-portal-migrate:<tag> npm run db:seed'
   ```
   (the promote step runs the migrations first; run this after the first successful promotion.)
8. `deploy/start.sh --audit --env staging` must say **GO**.

## 4. Every deploy

```bash
git checkout main && git pull                       # only main deploys (config DEPLOY_GIT_REMOTE_BRANCH)
git tag v2026.10.03 && git push origin v2026.10.03  # release.yml builds, proves and pushes the images
deploy/start.sh --audit --env staging --tag v2026.10.03          # GO?
deploy/start.sh --env staging --tag v2026.10.03                  # staging first — always
#   … exercise staging (test-mode checkout + refund on Stripe's hosted page) …
deploy/start.sh --env production --tag v2026.10.03
```

What the pipeline refuses, by design: a dirty tree · a tag not at HEAD or not on `origin/main` · a tag the release workflow has not built · a failing gate · a failing backup · a sandbox that cannot apply the pending migrations · destructive DDL not listed in `DESTRUCTIVE_MIGRATIONS_APPROVED` · `05-deploy.sh` called directly · any `FORCE_DEPLOY`/`SKIP_*`-style variable or flag. Every refusal prints what / why / fix.

If the new tag does not become healthy within `HEALTH_WAIT_TIMEOUT_SEC`, the wrapper switches the container back to the previous tag on its own and exits non-zero. Migrations already applied stay applied (ADR-029: forward-only, written to be compatible with the previous code).

## 5. Rollback and restore

```bash
deploy/start.sh --audit --env production
deploy/07-rollback.sh --env production                     # → the tag recorded in .deployed-previous-tag
deploy/07-rollback.sh --env production --tag v2026.09.30   # → a specific tag (must exist in the registry)
deploy/07-rollback.sh --env production --restore-db p4tc-production-20261003T020000Z.dump
```

`--restore-db` is the only way to undo a migration. It takes a safety snapshot, stops the app, `pg_restore --clean`s the chosen dump into the live database, then switches the tag. Every row written after that dump is lost — the script says so and asks. Dumps live in `/opt/p4tc/backups` on the server (and the managed cluster keeps its own daily backups + PITR — the primary control, K10).

## 6. What differs from eCard's framework, and why

| eCard | Here | Because |
|---|---|---|
| rsync the source to a staging tree; `npm install` on the server; PM2 restarts Node | CI builds two images per tag (`runtime`, `migrate`); the server only pulls | A Next.js build wants more RAM than a small Droplet; an image tag is exact, reproducible and the perfect rollback unit (K6) |
| PostgreSQL on the same box | DigitalOcean Managed PostgreSQL in the VPC | Backups + PITR are the real restore control (BACKUP_AND_RESTORE §3.1); the box is disposable (K3) |
| nginx + certbot | Caddy | Automatic TLS, 25 lines of config (K8) |
| python3 verifies the HMAC on the server | openssl on both sides | One fewer runtime on the box; same primitive |
| `GOVERNED_MIGRATION_MAX` numeric ceiling | Prisma's own ledger + a sandbox that lists *pending* migrations from the tag's image | The migrations travel with the image, so the sandbox is exact |
| Destructive DDL: scanned, warned | Scanned, **refused** unless named in `DESTRUCTIVE_MIGRATIONS_APPROVED` (committed) | ADR-029 makes destructive migrations a RED gate; the approval is recorded in git |
| No staging (dry-run instead) | Staging container + database on the same Droplet under `staging.<domain>` | ADR-029 requires it; payments and issuance are exercised on test-mode keys first (K7) |
| Rollback restores code + DB from one tarball | Rollback = previous image tag; DB restore is separate, explicit and confirmed | Code rollback is instant and safe; data rollback is destructive and must be a deliberate act |
| `.env` backed up in the package | Not backed up by the framework | The env file holds live keys; it is root-owned on the server and re-typable from the Stripe/DO dashboards. Backing it up would put secrets in a tarball |

Kept as-is from eCard: production data never leaves the server · no bypass flags or variables · the deploy user cannot write anything the app runs · a signed, expiring, single-use token per deploy · a report per step · a timeout on every task · `--dry-run` everywhere · GO/NO-GO audit.

## 7. Rehearsing without a server (what Phase A verified — V2)

```bash
cat > deploy/config.local.env <<'EOF'
SERVER_HOST="dryrun.invalid"
DOMAIN="portal-dryrun.invalid"
PRODUCTION_URL="https://portal-dryrun.invalid"
STAGING_URL="https://staging.portal-dryrun.invalid"
REGISTRY="registry.digitalocean.com/p4tc-dryrun"
SSH_OPTS="-o ConnectTimeout=3 -o BatchMode=yes"
EOF
git tag v0.0.0-dryrun
deploy/00-discovery.sh --dry-run
deploy/start.sh --audit --env production --tag v0.0.0-dryrun --dry-run      # NO-GO, listing exactly why
deploy/start.sh --dry-run --no-gate --env staging --tag v0.0.0-dryrun       # whole pipeline, nothing changed
deploy/06-validate.sh --env staging --dry-run
deploy/07-rollback.sh --env staging --dry-run --yes
deploy/04-release-gate.sh                                                    # runs for real (~10 min)
git tag -d v0.0.0-dryrun; rm deploy/config.local.env
```

Under `--dry-run` an unreachable server is a warning and every remote step is listed instead of performed; the release gate still runs for real, because a rehearsal that fakes its tests is not a rehearsal.

## 8. Operating notes

- **Bash 3.2 (macOS) on the laptop, Bash 5 on the server.** No `timeout`, `flock` (laptop) or arrays-of-arrays are used on the laptop side; the server side uses `flock` and `sha256sum`, which Ubuntu has.
- **Reports never contain a value** from an env file: scripts compare variable *names* against `.env.example`'s required list, nothing more.
- **`gh` must be signed in** for a real deploy: it is how the laptop confirms the release workflow built the tag. Without it the audit is NO-GO and `start.sh` refuses (dry-run: a warning).
- **Trust model:** as in eCard, `lib/server-promote.sh` is synced from the laptop and executed by root. The wrapper protects against *ungoverned* paths (no token, expired token, wrong environment/tag, altered manifest, direct calls), not against a hostile deploy user — the deploy user is the founder.
- The framework never runs `git add .`, never pushes, never touches `project-artifacts/`.
