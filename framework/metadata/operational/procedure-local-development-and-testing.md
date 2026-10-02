# procedure — Local development and testing

| Field | Value |
|---|---|
| Category | operational |
| Kind | procedure |
| Source of truth | `package.json` scripts, `.env.example`, `playwright.config.ts`, `deploy/README.md` (this file describes it; it does not replace it) |
| Owner | founder |
| Version / date | 2026-10-02 |
| Status | approved |
| Related | CLAUDE.md; [procedure-release-gate.md](procedure-release-gate.md); [procedure-governed-deploy.md](procedure-governed-deploy.md) |

## Purpose
Run the app and the test suites on the founder's Mac without breaking the shared database or the dev-server lock.

## Description
- **Node 24:** prefix every npm, npx or node command for the root app with `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` (the machine default is older; Prisma 7 refuses it).
- **Env names (`.env.local`, values not recorded here):** DATABASE_URL (dev database), DATABASE_URL_TEST (test database; Vitest and Playwright refuse to run without it), APP_BASE_URL, BETTER_AUTH_SECRET, EMAIL_TRANSPORT, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PROFILE_ENCRYPTION_KEY, JOBS_SECRET. PostgreSQL 16 is local (Homebrew); its session timezone must be UTC.
- **Ports:** dev server `npm run dev` on 3100 (`npm start` also 3100); Playwright uses 3101; the deploy local proof needs 3102 free; the release gate needs 3101 free.
- **One `next dev` per project directory** (Next 16 lock): stop any running preview before `npm run test:e2e`, then restart it.
- **Commands (package.json):** `npm run dev`; `npm run build`; `npm run typecheck` (stale cache can show phantom Prisma type errors: use `npx tsc --noEmit --incremental false`); `npm test` (Vitest run; `npm run test:watch` for watch); `npm run test:e2e` (Playwright; `PLAYWRIGHT_SERVER=start` runs it against a production build); `npm run db:generate`, `db:migrate` (migrate dev), `db:deploy` (migrate deploy), `db:seed`, `db:reset` (destructive reset; dev only); `admin:grant`; `stripe:check` (read-only); learning import scripts.
- **Test database setup:** apply migrations to the test database with `DATABASE_URL="$DATABASE_URL_TEST" npx prisma migrate deploy` and re-seed it (from the founder's environment notes; not documented in the repository sources read).

## Preconditions
Homebrew Node 24 and PostgreSQL 16; `.env.local` present.

## Safety notes
Never point DATABASE_URL at production for local work; never set DATABASE_URL_TEST in production. `db:reset` wipes the target database. A schema change needs approval (CLAUDE.md rule 1).

## Change history
- 2026-10-02 — created from `package.json`, `.env.example`, `playwright.config.ts` and the project's environment notes.
