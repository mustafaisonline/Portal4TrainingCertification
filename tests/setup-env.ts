/*
 * Loads .env.local (no dotenv dependency — Node ≥ 21 has process.loadEnvFile)
 * and points DATABASE_URL at the TEST database for the duration of the run.
 *
 * Safety rule: tests never touch the development database. If
 * DATABASE_URL_TEST is missing, or equals DATABASE_URL, the run aborts.
 */
import { existsSync } from "node:fs";
import path from "node:path";

const envFile = path.resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const dev = process.env.DATABASE_URL;
const test = process.env.DATABASE_URL_TEST;

if (!test) {
  throw new Error(
    "DATABASE_URL_TEST is not set. Tests run only against a dedicated test database (see .env.example).",
  );
}
if (dev && dev === test) {
  throw new Error(
    "DATABASE_URL_TEST must differ from DATABASE_URL — tests must never run against the development database.",
  );
}

process.env.DATABASE_URL = test;

// Identity & access (Milestone 2). Tests exercise registration, so the consent
// gate must see published documents; the values are test-only. The secret is
// whatever .env.local provides, or a fixed test value when absent (CI sets its
// own). EMAIL_TRANSPORT is forced to "log" so no test can reach a provider.
process.env.LEGAL_DOCUMENT_VERSIONS ??= '{"terms":"test","privacy":"test"}';
process.env.BETTER_AUTH_SECRET ??= "test-only-secret-not-for-any-real-environment-0123456789";
process.env.EMAIL_TRANSPORT = "log";
process.env.APP_BASE_URL ??= "http://localhost:3101";
// User profile (M5a): ID numbers are encrypted; tests use a fixed key.
process.env.PROFILE_ENCRYPTION_KEY ??= Buffer.alloc(32, 42).toString("base64");
