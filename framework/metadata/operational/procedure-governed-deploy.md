# procedure — Governed deployment to production

| Field | Value |
|---|---|
| Category | operational |
| Kind | procedure |
| Source of truth | `deploy/README.md` and the scripts under `deploy/` (this file describes them; it does not replace them) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | CR-2026-10-02-0030; ADR-029, ADR-030, ADR-046; per-script files `framework/metadata/technical/script-deploy-*.md` |

## Purpose
Deploy a tagged release of the portal to the single production Droplet with every control intact (clean-git gate, release gate, local build and proof, signed token, backup, migration sandbox, health-checked switch with auto-rollback, validation), and recover through a governed rollback.

## Description
Only production exists (staging dropped 2026-09-27). The release is built and proven on the laptop from the tag and shipped by rsync; GitHub is not in the deploy path. There are no bypass flags or variables.

### 0. One-off provisioning (founder, Phase B)
Run `10-server-bootstrap-serverscript.sh` as root on the Droplet ([script-deploy-10-server-bootstrap-serverscript-sh.md](../technical/script-deploy-10-server-bootstrap-serverscript-sh.md)); copy the server's HMAC key to `deploy/.governance-hmac.key` (chmod 600); type the env file values on the server; seed reference data. A laptop needs Node 24 on PATH, `DATABASE_URL_TEST` in `.env.local` and port 3102 free.

### 1. Audit (read-only GO / NO-GO)
`git tag vX` at HEAD with a clean tree, then `deploy/start.sh --audit --env production --tag vX`. This runs [09-audit](../technical/script-deploy-09-audit-sh.md): laptop tools, source (clean tree, tag at HEAD), server state (wrapper, pm2, caddy, env file protection and required variable names, free space, backup age, DNS), and framework files. Exit 0 = GO, 2 = NO-GO. Proceed only on GO.

### 2. Dry-run (optional rehearsal)
`deploy/start.sh --dry-run --env production --tag vX` runs the whole pipeline with nothing changed on the server; the release gate and local build and proof still run for real. `--no-gate` is allowed only with `--dry-run`. `deploy/README.md` section 7 describes rehearsing with no server using a throwaway `config.local.env`.

### 3. Governed deploy
`deploy/start.sh --env production --tag vX` ([start.sh](../technical/script-deploy-start-sh.md); add `--auto-approve` for no prompts). Stages in order:
1. [00-discovery](../technical/script-deploy-00-discovery-sh.md).
2. Git source gate: clean tree, tag exists and is at HEAD.
3. [04-release-gate](../technical/script-deploy-04-release-gate-sh.md): tsc, Vitest, build, Playwright on the production build (all blocking), npm audit (advisory).
4. Local build and proof ([lib/local-release.sh](../technical/script-deploy-lib-local-release-sh.md), [proof-db.mjs](../technical/script-deploy-lib-proof-db-mjs.md)): `git archive` of the tag, `npm ci`, prisma generate, build, migrations on a throwaway database, production-mode boot with health, webhook-400 and header checks, then packaging.
5. Issue the signed, expiring token and manifest ([lib/governance.sh](../technical/script-deploy-lib-governance-sh.md)); confirmation prompt.
6. [05-deploy](../technical/script-deploy-05-deploy-sh.md): verify server governance state, sync `deploy/`, upload bundle and release payload (delta against the current release), call `sudo p4tc-deploy promote`, external health check.
7. On the server, [server-promote.sh](../technical/script-deploy-lib-server-promote-sh.md) promote: verify token and manifest; [01-backup](../technical/script-deploy-01-backup-serverscript-sh.md) (a failure refuses the promotion); unpack and install; [03-migration-sandbox](../technical/script-deploy-03-migration-sandbox-serverscript-sh.md) (refuses unapproved destructive DDL); `prisma migrate deploy`; switch the `current` symlink and PM2 reload; wait for health; write markers; prune releases. If the new tag is not healthy within HEALTH_WAIT_TIMEOUT_SEC it switches back to the previous release automatically (applied migrations stay applied; forward-only).
8. [06-validate](../technical/script-deploy-06-validate-sh.md): markers, health and migration, public pages, security headers, unsigned webhook refused, PM2 online, resources, app log scan.
9. Summary written to `deploy/reports/deployment-summary.md`; afterwards the founder is asked whether to push the branch and tag to GitHub (never automatic).

### 4. Incremental vs full
Every deploy runs all gates in full. Incremental means reusing unchanged work only: delta upload against `releases/current` (05), `node_modules` hardlink reuse when `package-lock.json` is byte-identical (server-promote), and skipping the sandbox restore when the real database already reports "up to date" (03). A first deploy, a changed lockfile or any doubt falls back to the full path. The unit shipped is always a whole proven release directory.

### 5. Validate (standalone)
`deploy/06-validate.sh --env production [--tag vX]` at any time, read-only.

### 6. Rollback
- Code only: `deploy/07-rollback.sh --env production` (to the `.deployed-previous-tag` marker) or `--tag vOLD`. The target must still be on disk (last RELEASES_KEEP, default 3); otherwise redeploy that tag first with start.sh. See [07-rollback](../technical/script-deploy-07-rollback-sh.md).
- With data: add `--restore-db <dump-file-name>`. This is the only way to undo a migration; it is a RED-gate destructive action: a safety snapshot is taken, the app is stopped, the dump is restored, every row written after that dump is lost, and the founder must confirm.
- Afterwards run 06-validate. Backups: nightly at 02:00 UTC via the [systemd backup timer](../technical/script-deploy-systemd-p4tc-backup-timer.md) plus before every promotion; they are the sole recovery layer and stay on the server.

### Controls and what is refused
A dirty tree; a tag not at HEAD; a failing local proof; a failing gate; a failing backup; a sandbox that cannot apply migrations; destructive DDL not listed in `DESTRUCTIVE_MIGRATIONS_APPROVED` ([config.env](../technical/script-deploy-config-env.md)); calling 05-deploy directly; any FORCE/SKIP/ALLOW-style flag or environment variable; an expired, altered or wrong-environment token.

### Related configuration
[ecosystem.production.config.js](../technical/script-deploy-ecosystem-production-config-js.md), [run.sh.template](../technical/script-deploy-run-sh-template.md), [Caddyfile.example](../technical/script-deploy-Caddyfile-example.md), [lib/common.sh](../technical/script-deploy-lib-common-sh.md), systemd units (reminders [service](../technical/script-deploy-systemd-p4tc-reminders-service.md) and [timer](../technical/script-deploy-systemd-p4tc-reminders-timer.md); backup [service](../technical/script-deploy-systemd-p4tc-backup-service.md)).

## Change history
- 2026-10-02 — created from `deploy/README.md` and a full read of the scripts.
