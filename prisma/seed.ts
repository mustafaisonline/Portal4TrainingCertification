/*
 * Seed — reference data that the application reads and never hardcodes
 * (ADR-023 / BR-5: "the pilot domain is data, never a constant").
 *
 * Seeds live here, never in migrations (ADR-029), and are idempotent: running
 * the seed twice leaves the database exactly as it was after the first run.
 * That property is what Milestone 1's restart proof B relies on — a volume
 * destroyed and rebuilt from migrate + seed must reproduce the state exactly.
 *
 * Milestone 1 seeds exactly ONE domain (MILESTONE_1_EXECUTION_PLAN.md §2
 * item 4, criterion 3). The value is the first entry of the mockup's
 * capability-area list (project-artifacts/mockup/data/domains.ts, ported
 * 2026-09-21 — ADR-045 PORT list: content files become seed data). The other
 * four areas are seeded by a later milestone's plan, not this one.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { disconnectPrisma, getPrisma } from "../src/db/prisma.ts";

// Run directly by `node` (not through the Prisma CLI), so load .env.local
// here when the environment doesn't already provide DATABASE_URL — same
// guard as prisma.config.ts. CI/hosting set the variable and skip the file.
const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["DATABASE_URL"] && existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

type DomainSeed = {
  code: string;
  name: string;
  slug: string;
  description: string;
};

const domains: DomainSeed[] = [
  {
    code: "DF",
    name: "Data Foundations",
    slug: "data-foundations",
    description: "Modelling, quality, and the language of data work",
  },
];

async function main() {
  const prisma = getPrisma();
  for (const d of domains) {
    await prisma.domain.upsert({
      where: { code: d.code },
      create: d,
      update: { name: d.name, slug: d.slug, description: d.description },
    });
  }
  const count = await prisma.domain.count();
  console.log(`seed: ${domains.length} domain(s) upserted; ${count} row(s) in domains`);
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
