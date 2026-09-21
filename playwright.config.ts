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

const port = 3101;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: testDb, APP_BASE_URL: baseURL },
  },
});
