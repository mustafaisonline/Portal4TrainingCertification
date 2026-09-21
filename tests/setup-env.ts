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
