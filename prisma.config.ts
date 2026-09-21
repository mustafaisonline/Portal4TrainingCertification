import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

/*
 * Prisma 7 configuration. Environment comes from .env.local via Node's own
 * process.loadEnvFile — no dotenv dependency (ADR-030: names in .env.example,
 * values only in the gitignored file). CI and hosting set DATABASE_URL in the
 * environment directly, so the file is optional.
 */
const envFile = path.resolve(process.cwd(), ".env.local");
if (existsSync(envFile) && !process.env["DATABASE_URL"]) {
  process.loadEnvFile(envFile);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Seed files, never migrations (ADR-023/029). Node 24 runs TypeScript
    // directly; --experimental-transform-types covers the enums the generated
    // client uses.
    seed: "node --experimental-transform-types prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
