import { PrismaPg } from "@prisma/adapter-pg";
// Relative, with the .ts extension, deliberately: this module is also loaded
// by plain `node` (prisma/seed.ts), which resolves neither the `@/` alias nor
// extensionless TypeScript specifiers. Next.js, Vitest and Playwright all
// accept this form too.
import { Prisma, PrismaClient } from "../generated/prisma/client.ts";

/** A client bound to an open transaction — what repositories accept so that a
 *  business change and its audit row commit together (ADR-022). */
export type Tx = Prisma.TransactionClient;
/** Either the process client or a transaction client. */
export type Db = PrismaClient | Tx;
/** A value storable in a `Json` column — re-exported so modules that write
 *  JSON (e.g. the stored Stripe event payload) need not import the generated
 *  client themselves. */
export type JsonInput = Prisma.InputJsonValue;
/** A JSON object for a `Json` column (Milestone 12: `programmes.content`). */
export type JsonObjectInput = Prisma.InputJsonObject;
/** SQL NULL for a nullable `Json` column. Prisma distinguishes it from JSON
 *  `null`, and `undefined` would mean "leave the stored value alone" — so a
 *  module that must CLEAR a column (M12: a module's points) uses this. */
export const JSON_NULL = Prisma.DbNull;

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

/** Run `fn` inside one database transaction. Anything thrown rolls it back. */
export function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getPrisma().$transaction((tx) => fn(tx));
}

/** Close the pool — used by seeds and test teardown, never by request code. */
export async function disconnectPrisma(): Promise<void> {
  if (globalForPrisma.__prisma) {
    await globalForPrisma.__prisma.$disconnect();
    globalForPrisma.__prisma = undefined;
  }
}
