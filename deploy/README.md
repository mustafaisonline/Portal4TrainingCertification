# `deploy/` — the governed deployment framework

> **Status: BUILT 2026-09-26 (Milestone 11, Phase A), REWRITTEN 2026-09-27/28 — rehearsed in `--dry-run` only. Droplet created 2026-09-27, not yet bootstrapped.** Phase B (provisioning) is the founder's, step by step, per [`docs/execution/MILESTONE_11_EXECUTION_PLAN.md`](../docs/execution/MILESTONE_11_EXECUTION_PLAN.md) §2. Decisions K1–K16 were approved 2026-09-26 (ADR-046); K2/K3/K6/K9 have since been reversed and K5 re-decided — see §1 below and the ADR's supersession notes.
>
> **⚠ Three decisions reversed since Phase A, all on the founder's explicit instruction, all explained in full before being confirmed:**
> 1. **2026-09-27 — Staging DROPPED** (ADR-029's supersession note). Only production is provisioned — no second container/process, no second database, no `staging.<domain>`.
> 2. **2026-09-27 — Docker and the Container Registry DROPPED** (ADR-046's K2/K6/K9 supersession note). CI still builds and PROVES every release exactly as before; the built output ships to the server via rsync instead of a Docker image, and runs under **PM2** instead of a container.
> 3. **2026-09-28 — Managed PostgreSQL DROPPED** (ADR-046's K3 supersession note, same file). PostgreSQL runs self-hosted on the Droplet itself, installed by the bootstrap step — no separate database resource, no VPC-matching, ~$15.15/mo cheaper. Trade-off accepted knowingly: no point-in-time recovery any more, so the nightly `pg_dump` (§5) is the **sole** recovery mechanism, and the Droplet is no longer disposable.
>
> 4. **2026-10-02 — GitHub removed from the deploy path** (CR-2026-10-02-0030, founder instruction: *"remove the dependencies of GitHub and deploy directly from laptop … post deployment you can ask to push to github or not"*). The release is now **built and PROVEN on the laptop from the tagged commit** (`lib/local-release.sh`: `git archive` of the tag → `npm ci` → `prisma generate` → `next build` → migrations + `next start` proven against a throwaway local database → packaged in the same layout) and shipped by `rsync` exactly as before. No `gh`, no CI artifact, no origin check; `start.sh` asks whether to push the deployed commit and tag **after** a successful deploy. Trade-off accepted: the clean-room Linux runner is replaced by a clean-room *export* of the tag on the laptop, and production can briefly run a commit GitHub has not seen yet (the commit SHA is recorded in the manifest and server markers). `.github/workflows/release.yml` stays in the repository but nothing requires it. Everything on the server (backup, sandbox, migrate, switch, health, auto-rollback) is unchanged.
>
> This document describes that design — the one that actually runs now, not the Phase A original. Where older sections below still say "GitHub Actions artifact" or `gh`, they describe the design before 2026-10-02.

This is the portal's equivalent of eCard's `Deployement-Steps/`: the same **controls** — clean-git gate, release gate, signed deployment token, root-owned server wrapper, backup before every promotion, migration sandbox, post-deploy validation, governed rollback, read-only audit, per-step reports, timeouts on every task, no bypass flags — and, since 2026-09-27, much closer to eCard's own **runtime model** too: the release is built and PROVEN by CI, then shipped by rsync and run under PM2, not packaged as a container image. Section 6 says what still differs from eCard and why.

## 1. The shape

```
LAPTOP (deploy/start.sh)                                    SERVER (one Droplet, Ubuntu 24.04)
┌─────────────────────────────────────────────┐             ┌───────────────────────────────────────────┐
│ 00 discovery · git gate · 04 release gate    │             │ /usr/local/bin/p4tc-deploy (root, sudo-only)│
│ CI gate: release.yml built+proved the tag    │             │   promote --tag T --governance-dir D        │
│ BUILD + PROVE the release from the tag, here │  (2026-10-02)│     ├ verify HMAC token + manifest          │
│   (lib/local-release.sh) — no GitHub         │             │     ├ 01 backup (pg_dump, retention)        │
│ issue signed token + manifest ──────────────────scp──────▶ │     ├ rsync release → /opt/p4tc/releases/T  │
│ 05 deploy: sync deploy/, upload bundle +     │  ssh sudo   │     ├ npm ci (root, in releases/T)          │
│   release tarball, p4tc-deploy promote ──────────────────▶ │     ├ 03 sandbox (restore dump → migrate)   │
│ 06 validate (markers, health, pages,         │             │     ├ prisma migrate deploy (real DB)       │
│   headers, webhook 400, disk)                │             │     ├ switch `current` symlink → T          │
│ 07 rollback [--restore-db] (signed token)    │             │     ├ sudo -u deploy -H pm2 startOrReload   │
│ 09 audit → GO / NO-GO                         │             │     │   → wait /api/health (unhealthy →     │
└─────────────────────────────────────────────┘             │     │      symlink back, reload again)       │
        ▲ nothing is built here                              │     └ markers, prune old releases           │
GITHUB ACTIONS release.yml (on tag v*)                        │   rollback --tag T [--restore-db F]         │
  verify (ci.yml) → npm ci, prisma generate, next build →     │     (symlink switch, no reinstall needed —  │
  PROVE (next start against a throwaway PG, /api/health 200,  │      recent releases kept on disk)          │
  webhook 400, security headers) → package the release        │                                             │
  (.next, public, package.json/lock, next.config.ts,          │ Caddy :443 → 127.0.0.1:<PORT> (PM2 app)     │
  prisma/schema+migrations, src/generated) → upload as a       │ /etc/p4tc/production.env  root:deploy 0640  │
  GitHub Actions artifact named p4tc-release-<tag>             │ /opt/p4tc/releases/{<tag>,current→<tag>}    │
                                                                │ /opt/p4tc/{backups,staging,markers,logs}    │
                                                                │ systemd: reminders 01:00 UTC · backup 02:00 │
                                                                │ pm2 startup (survives reboot)                │
                                                                └───────────────────────────────────────────┘
                                                                PostgreSQL 16, self-hosted on the same Droplet
                                                                (K3 reversed 2026-09-28): p4tc_production,
                                                                p4tc_migration (sandbox), localhost-only, UTC
```

No registry, no Docker anywhere in this diagram. `../Dockerfile` stays in the repository (useful for local container testing) but is not part of this pipeline.

## 2. Files

| File | Runs on | Purpose |
|---|---|---|
| `config.env` | — | Names and addresses only (host, domain, paths, timeouts, retention, approved destructive migrations). `<placeholders>` until Phase B. **Never a secret.** |
| `config.local.env` | — | *gitignored* per-machine overrides (same names). A throwaway one makes `--dry-run` possible with no server |
| `lib/common.sh` | both | Logging with captured PASS/WARN/FAIL, three-line errors, `die`/`soft_fail`, `run_blocking`/`run_advisory` with a watchdog timeout (Bash 3.2-safe — no `timeout`(1)), lock, SSH helpers, git gates, reports |
| `lib/governance.sh` | laptop | Bypass rejection, deployment id, HMAC-signed token (openssl) with TTL, manifest, bundle upload, the one privileged call |
| `lib/server-promote.sh` | server (root) | What the wrapper executes: token verification with the server's own key copy, lock, backup → unpack release + `npm ci` → sandbox → migrate → symlink switch → `pm2 startOrReload` → health → auto-rollback → markers; and `rollback` |
| `start.sh` | laptop | **The entry point.** `--audit`, `--dry-run`, `--auto-approve`, `--env production`, `--tag`; `--no-gate` only with `--dry-run` |
| `00-discovery.sh` | laptop | Read-only: toolchain, config sanity, repo state, SSH, server bootstrap state |
| `01-backup-serverscript.sh` | server | `pg_dump -Fc` + sha256 + meta, `pg_restore --list` check, retention `BACKUP_KEEP`; nightly via systemd; **always** before a promotion or restore |
| `03-migration-sandbox-serverscript.sh` | server | Restore the newest dump into `p4tc_migration`, list pending migrations and read their SQL directly from the unpacked release, refuse unapproved destructive DDL, `migrate deploy` there, confirm up to date |
| `04-release-gate.sh` | laptop | `RELEASE_GATE.md` as code (K11): tsc, Vitest, build, Playwright **against the production build**, `npm audit` advisory |
| `05-deploy.sh` | laptop | Only under `start.sh`: take the release `start.sh` built and proved locally from the tag, verify server governance state, sync `deploy/`, upload the governance bundle + release payload, `p4tc-deploy promote`, external health |
| `06-validate.sh` | laptop | Traceability markers, `/api/health` (200 · db up · newest migration), `/`, `/verify`, `/programs`, security headers, webhook refuses unsigned POST, PM2 process state, disk/memory, app log scan |
| `07-rollback.sh` | laptop | Governed rollback to the previous tag (marker) or `--tag`; `--restore-db <dump>` after a safety snapshot and an explicit confirmation |
| `09-audit.sh` | laptop | Read-only GO/NO-GO across laptop, source, server and framework; exit 0/2 |
| `10-server-bootstrap-serverscript.sh` | server (root, once) | Packages (Node, PM2, Caddy, postgresql-client), `deploy` user, layout (incl. `releases/`), HMAC key, names-only env template, wrapper + sudoers, Caddy, timers, `pm2 startup`, ufw, unattended upgrades, verification |
| `ecosystem.production.config.js` | server | The PM2 app definition; `cwd` is the `releases/current` symlink, so it never needs editing per release |
| `run.sh.template` | server | Rendered into each release directory as `run.sh` — sources the root-owned env file, then `exec`s `next start` (PM2's equivalent of Docker Compose's `env_file:`) |
| `Caddyfile.example` | server | apex → the app's port, `www` → apex |
| `systemd/` | server | `p4tc-reminders.{service,timer}` (K12) and `p4tc-backup.{service,timer}` |
| `logs/`, `reports/` | laptop | *gitignored* run output; one Markdown report per script run, `deployment-summary.md`, `deployment-manifest.json` |
| `.governance-hmac.key` | laptop | *gitignored*; copied once from `/etc/p4tc/governance-hmac.key` after bootstrap |

## 3. First-time setup (Phase B — each step is a RED action the founder takes)

1. **DigitalOcean**: Droplet (Ubuntu 24.04, ~~SGP1~~ **NYC1 — K5 re-decided 2026-09-27, founder's explicit choice while creating the Droplet**; **$12/mo, 2 GiB/1 vCPU — K4, re-decided 2026-09-27**). ~~Managed PostgreSQL 16 (Basic, same VPC/region as the Droplet)~~ — **no separate database resource: PostgreSQL 16 is installed on the Droplet itself (K3 reversed 2026-09-28) by the bootstrap step below**, which also creates `p4tc_production` and `p4tc_migration`, both UTC, and pre-fills `DATABASE_URL`. **No Container Registry either** (K6 reversed — nothing to push there any more). **Done 2026-09-27:** Droplet created — `198.199.67.177` (public), `10.116.0.3` (private), hostname `p4tc-production`.
2. **DNS (K13)**: `A` records for the apex and `www` → the Droplet's IP.
3. **Fill `deploy/config.env`** (`SERVER_HOST`, `DOMAIN`) — names only — commit it.
4. **Bootstrap** (as root, once):
   ```bash
   rsync -az deploy/ root@<droplet>:/opt/p4tc/deploy/
   ssh root@<droplet> 'bash /opt/p4tc/deploy/10-server-bootstrap-serverscript.sh --domain <apex>'
   ```
   Installs Node, PM2 (with `pm2 startup` so it survives a reboot), Caddy, **PostgreSQL 16** (creates the `p4tc` role and the `p4tc_production`/`p4tc_migration` databases, both UTC, localhost-only), the `deploy` user and the governed layout — no registry login prompt any more. Then on the laptop:
   ```bash
   ssh root@<droplet> cat /etc/p4tc/governance-hmac.key > deploy/.governance-hmac.key && chmod 600 deploy/.governance-hmac.key
   ```
5. **Type the rest of the env file on the server** — `nano /etc/p4tc/production.env` (template was written with every name, `DATABASE_URL` already filled in by the bootstrap step; see `.env.example` for each rule). Production gets the **live restricted key** with exactly the §1.2 permissions and the live endpoint's secret (`DEPLOYMENT_RUNBOOK.md` §6) — or, as the lighter substitute offered when staging was dropped, a test-mode key for the very first deploy's first registration + refund before switching to live. Values never travel through this framework.
6. ~~**GitHub**: `gh auth login` on the laptop~~ **No longer needed (2026-10-02)** — the release is built on the laptop. It does need Node 24 on `PATH` and `DATABASE_URL_TEST` in `.env.local` (the proof runs against a throwaway database on your local PostgreSQL).
7. **Seed reference data** once (idempotent; never test users), using the release already on the server after the first promotion:
   ```bash
   ssh deploy@<droplet> 'cd /opt/p4tc/releases/current && set -a; . /etc/p4tc/production.env; set +a; npm run db:seed'
   ```
   **Free Learning content (Milestone 14) is loaded the same way** — it carries the repository's scripts, the question files and the docx reader:
   ```bash
   # the book — the docx is NOT in the repository (Book/ is git-ignored); scp it once to the server, root-owned
   scp "Book/I Am Datapedia.docx" root@<droplet>:/opt/p4tc/book/datapedia.docx
   ssh deploy@<droplet> 'cd /opt/p4tc/releases/current && set -a; . /etc/p4tc/production.env; set +a; npm run learning:import -- /opt/p4tc/book/datapedia.docx'
   # the questions — JSON files in the repository, ten per topic; loaded as drafts, then reviewed in Admin → Free Learning
   ssh deploy@<droplet> 'cd /opt/p4tc/releases/current && set -a; . /etc/p4tc/production.env; set +a; npm run learning:import-questions -- prisma/seed-data/free-learning-questions'
   ```
   Both are idempotent per topic (a re-imported topic keeps its published/unpublished flag; a topic that already has questions is skipped). Neither is part of `db:seed`, so `db:reset` on a laptop never touches them and the book never enters the seed. Mark topics' questions reviewed in the admin (one click per topic, audited) — or, on the founder's explicit instruction, all at once.
8. `deploy/start.sh --audit --env production` must say **GO**.

## 4. Every deploy

```bash
git tag v2026.10.03                                 # on the commit at HEAD; the tree must be clean
deploy/start.sh --audit --env production --tag v2026.10.03      # GO?
deploy/start.sh --env production --tag v2026.10.03              # builds + proves locally, deploys, then asks: push to GitHub?
```

What the pipeline refuses, by design: a dirty tree · a tag not at HEAD · a release that fails the local proof (migrations on an empty database, production boot, health, webhook, headers) · a failing gate · a failing backup · a sandbox that cannot apply the pending migrations · destructive DDL not listed in `DESTRUCTIVE_MIGRATIONS_APPROVED` · `05-deploy.sh` called directly · any `FORCE_DEPLOY`/`SKIP_*`-style variable or flag. Every refusal prints what / why / fix.

If the new tag does not become healthy within `HEALTH_WAIT_TIMEOUT_SEC`, the wrapper switches the `current` symlink back to the previous release and reloads PM2 on its own, then exits non-zero. Migrations already applied stay applied (ADR-029: forward-only, written to be compatible with the previous code).

### Incremental deployment (2026-09-29)

Every stage now skips work whose inputs have not changed, without weakening any gate (the founder approved this scope 2026-09-29; the release gate itself is untouched — full tsc/Vitest/build/Playwright on every deploy):

| Stage | Skip condition | Mechanism |
|---|---|---|
| CI / release build | unchanged modules since the last build | `actions/cache` on `.next/cache` (ci.yml + release.yml) — `next build` becomes incremental; the cache is still deleted before packaging, so it never ships |
| Payload upload (05) | file byte-identical to the deployed release | `rsync --copy-dest=releases/current` — unchanged files are copied server-side instead of crossing the network; first deploy falls back to a full upload |
| Server `npm ci` | `package-lock.json` byte-identical (sha256) to the deployed release's | `unpack_release()` hardlinks the previous release's `node_modules` (`rsync --link-dest`); any doubt falls back to a full `npm ci` |
| Migration sandbox (03) | `prisma migrate status` against the **real** database reports up to date (read-only check) | dump restore + sandbox deploy only run when the release actually carries pending migrations |

Unchanged on every deploy, deliberately: the clean-git gate, release gate, CI build+PROVE, signed token, **backup**, `prisma migrate deploy`, health wait, auto-rollback, validation. The deployable unit is still a whole proven release directory — "incremental" means unchanged work is reused, never that unproven pieces ship.

## 5. Rollback and restore

```bash
deploy/start.sh --audit --env production
deploy/07-rollback.sh --env production                     # → the tag recorded in .deployed-previous-tag
deploy/07-rollback.sh --env production --tag v2026.09.30   # → a specific tag (must still be on disk — see below)
deploy/07-rollback.sh --env production --restore-db p4tc-production-20261003T020000Z.dump
```

Rolling back to one of the last `RELEASES_KEEP` (default 3) releases is instant — the directory is already on disk under `/opt/p4tc/releases/`, so it's just a symlink switch and a `pm2 reload`, no rebuild or reinstall. Rolling back further than that needs the tag redeployed first (`deploy/start.sh --env production --tag <old-tag>`, which re-fetches its GitHub Actions artifact) — a real trade-off of not keeping every release forever, stated here rather than discovered mid-incident.

`--restore-db` is the only way to undo a migration. It takes a safety snapshot, stops the app, `pg_restore --clean`s the chosen dump into the live database, then switches the release. Every row written after that dump is lost — the script says so and asks. Dumps live in `/opt/p4tc/backups` on the server — this is the **only** backup layer since K3's 2026-09-28 reversal (no Managed PostgreSQL, no PITR); RPO is bounded by how recently `01-backup-serverscript.sh` last ran.

## 6. What differs from eCard's framework, and why

| eCard | Here | Because |
|---|---|---|
| rsync the source to a staging tree; `npm install` on the server; PM2 restarts Node | **Same idea since 2026-09-27** — CI builds and PROVES the release first (eCard has no build step to prove; this app needs `next build`), then rsync ships the built output and the server runs `npm ci` + PM2, same as eCard | A Next.js build is heavier than eCard's plain Express/static stack, so it happens on CI's runners, never the Droplet; everything after that matches eCard directly |
| PostgreSQL on the same box | **Same, since 2026-09-28** — PostgreSQL self-hosted on the Droplet (K3 reversed), matching eCard exactly here too | Originally: DigitalOcean Managed PostgreSQL, for PITR and a disposable box (BACKUP_AND_RESTORE §3.1). Reversed on the founder's explicit instruction once that trade-off was explained; the nightly dump is now the sole recovery mechanism |
| nginx + certbot | Caddy | Automatic TLS, 25 lines of config (K8) |
| python3 verifies the HMAC on the server | openssl on both sides | One fewer runtime on the box; same primitive |
| `GOVERNED_MIGRATION_MAX` numeric ceiling | Prisma's own ledger + a sandbox that lists *pending* migrations, read straight from the unpacked release | The migrations travel with the release, so the sandbox is exact |
| Destructive DDL: scanned, warned | Scanned, **refused** unless named in `DESTRUCTIVE_MIGRATIONS_APPROVED` (committed) | ADR-029 makes destructive migrations a RED gate; the approval is recorded in git |
| No staging (dry-run instead) | **Same, since 2026-09-27** — no staging here either, dropped on the founder's explicit instruction after the risk was explained in full | ADR-029 originally required it: payments and issuance are exercised on test-mode keys first — risk now accepted rather than mitigated; see ADR-029's supersession note |
| Rollback restores code + DB from one tarball | Rollback = switch the `current` symlink to a release already on disk; DB restore is separate, explicit and confirmed | Code rollback is instant and safe; data rollback is destructive and must be a deliberate act |
| `.env` backed up in the package | Not backed up by the framework | The env file holds live keys; it is root-owned on the server and re-typable from the Stripe/DO dashboards. Backing it up would put secrets in a tarball |

Kept as-is from eCard: production data never leaves the server · no bypass flags or variables · the deploy user cannot write anything the app runs · a signed, expiring, single-use token per deploy · a report per step · a timeout on every task · `--dry-run` everywhere · GO/NO-GO audit · root installs, then hands the running process to an unprivileged user.

## 7. Rehearsing without a server (what Phase A verified — V2, re-verified 2026-09-27)

```bash
cat > deploy/config.local.env <<'EOF'
SERVER_HOST="dryrun.invalid"
DOMAIN="portal-dryrun.invalid"
PRODUCTION_URL="https://portal-dryrun.invalid"
SSH_OPTS="-o ConnectTimeout=3 -o BatchMode=yes"
EOF
git tag v0.0.0-dryrun
deploy/00-discovery.sh --dry-run
deploy/start.sh --audit --env production --tag v0.0.0-dryrun --dry-run      # NO-GO, listing exactly why
deploy/start.sh --dry-run --no-gate --env production --tag v0.0.0-dryrun   # whole pipeline, nothing changed
deploy/06-validate.sh --env production --dry-run
deploy/07-rollback.sh --env production --dry-run --yes
deploy/04-release-gate.sh                                                    # runs for real (~10 min)
git tag -d v0.0.0-dryrun; rm deploy/config.local.env
```

Under `--dry-run` an unreachable server is a warning and every remote step is listed instead of performed; the release gate still runs for real, because a rehearsal that fakes its tests is not a rehearsal.

## 8. Operating notes

- **Bash 3.2 (macOS) on the laptop, Bash 5 on the server.** No `timeout`, `flock` (laptop) or arrays-of-arrays are used on the laptop side; the server side uses `flock` and `sha256sum`, which Ubuntu has.
- **Reports never contain a value** from an env file: scripts compare variable *names* against `.env.example`'s required list, nothing more.
- **`gh` is not used** (2026-10-02). A real deploy needs Node 24 on `PATH`, `DATABASE_URL_TEST` (a throwaway database is created and dropped for the proof), port 3102 free, and a clean tree with the tag at HEAD.
- **Trust model:** as in eCard, `lib/server-promote.sh` is synced from the laptop and executed by root. The wrapper protects against *ungoverned* paths (no token, expired token, wrong environment/tag, altered manifest, direct calls), not against a hostile deploy user — the deploy user is the founder. The app process itself always runs as `deploy` (root drops privilege with `sudo -u deploy -H pm2 ...`), never as root.
- The framework never runs `git add .`, never pushes, never touches `project-artifacts/`.
