/*
 * Next.js instrumentation hook — `register()` runs ONCE when a server
 * instance starts, before it accepts requests (node_modules/next/dist/docs/
 * 01-app/03-api-reference/03-file-conventions/instrumentation.md).
 *
 * Fail-fast configuration (MILESTONE_9_EXECUTION_PLAN.md §2 item 3): in
 * production a missing or malformed required variable REFUSES TO START the
 * server — a half-configured production instance that answers requests is
 * worse than one that does not come up. In every other mode the same check
 * prints one warning line naming what is missing (names only, never values).
 *
 * Node runtime only: the check reads process.env and Buffer; the Edge
 * runtime has neither in full, and nothing of ours runs there.
 */
import { describeValidation, validateEnv } from "./src/config/env";

export function register(): void {
  if (process.env["NEXT_RUNTIME"] !== "nodejs") return;

  // `next start` always sets NODE_ENV=production. A test run of the
  // production build (Playwright with PLAYWRIGHT_SERVER=start, deliberately
  // blank Stripe keys, http base URL) declares itself with APP_ENV=test and
  // is validated as such — warnings, never a refusal. Never set APP_ENV=test
  // on a real deployment; the runbook says so.
  const mode = process.env["APP_ENV"] === "test" ? "test" : process.env["NODE_ENV"];
  const result = validateEnv(process.env, mode);
  const summary = describeValidation(result);

  if (!result.ok && result.mode === "production") {
    throw new Error(`[config] refusing to start: ${summary}. See .env.example and docs/operations/DEPLOYMENT_RUNBOOK.md.`);
  }
  if (!result.ok || result.warnings.length > 0) {
    console.warn(`[config] (${result.mode}) ${summary}`);
  }
}
