import { PrismaPg } from "@prisma/adapter-pg";
// Relative, with the .ts extension, deliberately: this module is also loaded
// by plain `node` (prisma/seed.ts), which resolves neither the `@/` alias nor
// extensionless TypeScript specifiers. Next.js, Vitest and Playwright all
// accept this form too.
import { PrismaClient } from "../generated/prisma/client.ts";

/*
 * The one PrismaClient for the process (ADR-005: single PostgreSQL, sole
 * source of truth). Prisma 7 connects through a driver adapter; PrismaPg
 * wraps node-postgres (`pg`) and owns the connection pool.
 *
 * Constructed lazily on first use, not at import time, so that:
 *  - tests can point DATABASE_URL at the test database before anything
 *    connects (tests/setup-env.ts), and
 *  - `next build` can import modules that import this file without needing a
 *    live database.
 *
 * In development the instance is cached on `globalThis` so Next.js hot
 * reloading does not open a new pool on every edit.
 */
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function connectionString(): string {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local (see that file).",
    );
  }
  return url;
}

function create(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: connectionString() });
  return new PrismaClient({
    adapter,
    log: process.env["NODE_ENV"] === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getPrisma(): PrismaClient {
  if (process.env["NODE_ENV"] === "production") {
    return (globalForPrisma.__prisma ??= create());
  }
  return (globalForPrisma.__prisma ??= create());
}

/** Close the pool — used by seeds and test teardown, never by request code. */
export async function disconnectPrisma(): Promise<void> {
  if (globalForPrisma.__prisma) {
    await globalForPrisma.__prisma.$disconnect();
    globalForPrisma.__prisma = undefined;
  }
}
