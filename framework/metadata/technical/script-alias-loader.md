# script — alias-loader

| Field | Value |
|---|---|
| Category | technical |
| Kind | script |
| Source of truth | scripts/alias-loader.mjs |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | scripts/register-alias.mjs (registers it); every npm script that runs a scripts/*.ts file |

## Purpose
Lets the CLI scripts (`scripts/*.ts`) and `prisma/seed.ts` use the application's `@/…` import alias, and extensionless relative imports, under plain `node` (outside Next, Vitest, Playwright).

## Description
- **Kind:** Node module-resolution hook (exports `resolve`); not run directly.
- **Inputs:** import specifiers seen by Node. `@/x` is mapped to `<repo>/src/x`, trying extensions `""`, `.ts`, `.tsx`, `.mts`, `.js`, `/index.ts`. Relative imports (`./`, `../`) from files under `src/` that do not exist as written are retried with those extensions.
- **Outputs:** the resolved file URL; throws `alias-loader: cannot resolve @/… under <src>` when an alias cannot be resolved.
- **Environment variables / arguments:** none.
- **Database tables / external services:** none.
- **Side effects:** none (reads the file system with `existsSync` only).
- **Idempotent / destructive:** idempotent, read-only.
- **How to run:** never run on its own. It is loaded by `scripts/register-alias.mjs`, which is passed as `--import ./scripts/register-alias.mjs` by the npm scripts `db:seed`, `admin:grant`, `learning:import`, `learning:import-questions`, `unlock:relabel`, `stripe:check`, `knowledge-check:approve-all`, `interview:approve-all`. Node needs `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`.
- **Safety notes:** adds no dependency (uses Node's `module.register`, stated in the file as Node 20.6 or later). A wrong or missing alias target fails loudly rather than silently.

## Change history
- 2026-10-02 — metadata file created from the script as it stood in the repository.
