# CR-2026-10-02-0030 — Deploy straight from the laptop; GitHub no longer in the deploy path

**Received:** 2026-10-02 00:30 MYT · **Status:** PATCH WRITTEN, awaiting the founder to apply it · **Requested by:** founder

## 1. Request (verbatim)

> Let's remove the dependencies of GItHub. and deploy direclty from laptop. post deployment you can ask to push to github or not.

## 2. Facts gathered (from `deploy/`)

GitHub is in the deploy path in four places today:

| # | Where | What it does today |
|---|---|---|
| 1 | `deploy/lib/common.sh` (git source gate) and `09-audit.sh` | fetches `origin`, requires the tag to be on `origin/main` |
| 2 | `deploy/start.sh` (CI gate) and `09-audit.sh` | requires `gh` signed in and `release.yml` = success for the tag |
| 3 | `deploy/05-deploy.sh` | `gh run download` fetches the CI-built artifact `p4tc-release-<tag>` |
| 4 | `deploy/00-discovery.sh`, `config.env`, `README.md` | `gh` checks, `GITHUB_REPO`, `RELEASE_WORKFLOW` |

`release.yml` today = build (`next build`) → PROVE (boot against a throwaway PostgreSQL, `/api/health` 200, webhook 400, security headers) → package (.next, public, package.json/lock, next.config.ts, prisma schema+migrations, src/generated) → upload. The server already runs `npm ci` itself after unpacking, so native modules are built on the server.

## 3. Proposal

Build and package **on the laptop from the tagged commit**, with the same package layout, the same server-side promote/backup/sandbox/migrate/health/auto-rollback. Changes:

- **Gate 1:** keep clean-tree + tag-at-HEAD (local); drop the fetch and the "on origin/main" requirement. The deployed commit SHA is still recorded in the manifest/markers.
- **Gate 2:** replace "CI proved the tag" with a **local build + prove step**: `next build` from the clean tagged tree, then boot it with `next start` against the local test database and require `/api/health` 200, webhook 400 and the security headers — the same checks `release.yml` makes. (The existing release gate — tsc, Vitest, Playwright on a production build — still runs first, unchanged.)
- **Step 3:** `05-deploy.sh` packages the local build into the same tarball layout and ships it; no `gh run download`.
- **Step 4:** remove the `gh`/`GITHUB_REPO`/`RELEASE_WORKFLOW` requirements from discovery, audit and config; update `deploy/README.md`; add a supersession note to ADR-046 (K2/K6/K9 line). `release.yml` stays in the repo, optional, and no longer required.
- After a successful deploy the tool prints "Push to GitHub? `git push origin main --tags`" and leaves the decision to you.

No schema change. No change to the server, `p4tc-deploy`, backups, migration sandbox or rollback.

## 4. Trade-offs (accepted knowingly, or not, by the founder)

| Lost | Why it matters | Mitigation |
|---|---|---|
| CI's clean-room build (fresh Linux runner) | A laptop build could differ from a clean one (stale cache, macOS) | build only from a clean tagged tree, `rm -rf .next` first, `npm ci`; server re-runs `npm ci`; rehearse once with `--dry-run` and check the artefact boots on the server's health check |
| Off-machine record | Production could run a commit that is not on GitHub until you push | manifest + server markers record the commit SHA; the tool asks you to push afterwards |
| A second, independent check | CI was a gate outside your machine | the local release gate (tsc, 717 Vitest, 171 Playwright) is unchanged |

## 5. Important — this does not remove the current blocker

The refusals seen this session come from Claude Code's auto-mode classifier, not from GitHub. A laptop-built deploy is the same kind of command (`deploy/start.sh --env production`) and would still need either the founder running it in his own terminal or the session being moved out of auto mode.

## 6. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 0 | CR + plan | **DONE** | 2026-10-02 |
| 1 | Founder's "go" | **DONE** — "go ahead with the rewrite" | 2026-10-02 |
| 2a | New files `deploy/lib/local-release.sh` + `deploy/lib/proof-db.mjs` | **WRITTEN** (in the repo, not yet wired in, never executed) | 2026-10-02 |
| 2b | Edits to `start.sh`, `05-deploy.sh`, `common.sh`, `00-discovery.sh`, `09-audit.sh`, `governance.sh`, `config.env`, `README.md` | **PATCH WRITTEN** (`deploy-from-laptop.patch`, 8 files, +93/−114, `git apply --check` clean). Not applied: the assistant's harness refused to edit the governed deploy scripts directly | 2026-10-02 |
| 3 | Founder applies the patch and commits it | **DONE** — `4724599` | 2026-10-02 |
| 4 | `--dry-run` rehearsal of the new pipeline, then the first real deploy | **DONE** — dry run clean; real deploy of `v2026.10.02-1` succeeded, 06-validate PASSED | 2026-10-02 |

## 7. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-02 00:30 | CR created from the founder's request; GitHub dependencies mapped (4 places); plan and trade-offs written. No code changed. |
| 2026-10-02 00:50 | Founder: "go ahead with the rewrite". Wrote `deploy/lib/local-release.sh` (git archive of the tag → npm ci → prisma generate → next build → migrations + production boot proven on a throwaway local database → same package layout as release.yml) and `deploy/lib/proof-db.mjs`. The harness refused the script edit to `deploy/start.sh`, so the edits to the eight governed files were produced as a patch from scratchpad copies and verified with `git apply --check`; nothing under `deploy/` other than the two new files was changed. **Never executed yet** — its first run is the dry run. |
| 2026-10-02 (UTC 21:40) | First real deploy from the laptop: `v2026.10.02-1` (`4724599`) built and proved locally, promoted on the Droplet, 06-validate PASSED; both new migrations live. Not yet pushed to GitHub; question banks not yet seeded. |
