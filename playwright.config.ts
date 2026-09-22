import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

/*
 * Playwright — end-to-end and accessibility layers (ADR-025, ADR-038).
 * Starts the application against the TEST database so e2e runs never touch
 * development data, and so a run is reproducible from `prisma migrate reset`.
 */
const envFile = path.resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const testDb = process.env.DATABASE_URL_TEST;
if (!testDb) {
  throw new Error("DATABASE_URL_TEST is not set — see .env.example.");
}

// The TEST process itself (helpers that read outbound_emails, grant roles,
// clean up) must also talk to the TEST database — workers inherit this env.
process.env.DATABASE_URL = testDb;

const port = 3101;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  // One worker: every spec shares one test database and one client IP, and
  // the auth endpoints are rate-limited per IP (3 sign-ups / minute). Two
  // workers registering accounts at once trip that limit intermittently.
  workers: 1,
  retries: 0,
  // Several specs are one long journey (register → grant a role → fill a
  // multi-section form → check public pages) against a DEV server that
  // compiles routes on first hit; 30 s (the default) is borderline cold.
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Next 16 allows ONE `next dev` per directory. When another dev server
    // holds the lock (a second Claude session, a founder terminal), run the
    // suite against a production build instead:
    //   npx next build && PLAYWRIGHT_SERVER=start npm run test:e2e
    command: process.env["PLAYWRIGHT_SERVER"] === "start" ? `npx next start -p ${port}` : `npx next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDb,
      APP_BASE_URL: baseURL,
      // A production build under test is validated as "test", not refused
      // for its blank Stripe keys and http base URL (instrumentation.ts).
      APP_ENV: "test",
      // Identity & access (M2): tests register accounts, so the consent gate
      // sees test-only "published" versions; email never leaves the DB row.
      LEGAL_DOCUMENT_VERSIONS: '{"terms":"test","privacy":"test"}',
      EMAIL_TRANSPORT: "log",
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "test-only-secret-not-for-any-real-environment-0123456789",
      // Registration & payment (M4): e2e never reaches Stripe. With the keys
      // blank the checkout screen shows "payments are not configured" and no
      // order is created (M4 plan §7 criterion 10; §6 commitment 6).
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
      // User profile (M5a): a fixed test-only key for the ID-number column.
      PROFILE_ENCRYPTION_KEY: process.env.PROFILE_ENCRYPTION_KEY ?? Buffer.alloc(32, 42).toString("base64"),
      // Renewal reminders (M7): the e2e spec calls the job endpoint with this
      // test-only bearer token (tests/e2e/certificate-reminders.spec.ts).
      JOBS_SECRET: "e2e-jobs-secret",
    },
  },
});
