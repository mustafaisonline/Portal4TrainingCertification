# script — register-alias

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/register-alias.mjs |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | scripts/alias-loader.mjs |

## Purpose
Three-line bootstrap that registers `alias-loader.mjs` as a Node module hook, so it can be used with `node --import`.

## Description
- **Kind:** Node preload module; calls `register("./alias-loader.mjs", import.meta.url)` from `node:module`.
- **Inputs / arguments / environment variables:** none.
- **Outputs:** none; the effect is that later imports in the process go through `alias-loader.mjs`.
- **Database tables / external services:** none.
- **Side effects:** installs the resolution hook for the current Node process only.
- **Idempotent / destructive:** idempotent, harmless.
- **How to run:** only as a preload flag, e.g. `node --experimental-transform-types --import ./scripts/register-alias.mjs scripts/<name>.ts`, which is what the npm scripts `db:seed`, `admin:grant`, `learning:import`, `learning:import-questions`, `unlock:relabel`, `stripe:check`, `knowledge-check:approve-all` and `interview:approve-all` do. Node needs `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`.
- **Safety notes:** none beyond those of `alias-loader.mjs`.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
