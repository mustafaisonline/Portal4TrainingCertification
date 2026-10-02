# script — deploy/lib/proof-db.mjs

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | `deploy/lib/proof-db.mjs` |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | deploy/README.md; procedure-governed-deploy.md; CR-2026-10-02-0030; script-deploy-lib-local-release-sh.md |

## Purpose
Create and drop the throwaway PostgreSQL database used by the local release proof.

## Description
- **Runs on:** laptop, with Node, from the repository root (it resolves `pg` from the repo's `package.json`; no new dependency).
- **Invocation:** `node deploy/lib/proof-db.mjs create <adminUrl> <dbName>` (prints the new database's URL on stdout) and `node deploy/lib/proof-db.mjs drop <adminUrl> <dbName>`.
- **Inputs:** `adminUrl` — a connection URL on the local PostgreSQL whose role may CREATE DATABASE (DATABASE_URL_TEST qualifies); `dbName` limited to `a-z 0-9 _` (anything else exits 2).
- **Behaviour:** `create` does DROP DATABASE IF EXISTS (WITH FORCE), CREATE DATABASE, sets timezone UTC, prints the URL with the database path substituted and query removed. `drop` does DROP DATABASE IF EXISTS (WITH FORCE).
- **What it changes:** the named local database only. **Idempotent:** yes. **Destructive:** yes, but only of the database named by the caller (a throwaway name `p4tc_release_proof_<pid>`).
- **Prerequisites:** local PostgreSQL running; `pg` installed with the app.

## Change history
- 2026-10-02 — metadata file created from a full read of the source (no behaviour change).
