import { getPrisma } from "@/db/prisma";
import pkg from "../../package.json";

/*
 * Health check (MILESTONE_9_EXECUTION_PLAN.md §2 item 1; default H1). The
 * uptime-monitor target. Reveals only: up/down, the name of the newest
 * applied migration, the application version and the time — no secrets, no
 * user data, no connection details.
 *
 * Separated from the route handler so a test can inject a client whose
 * `$queryRaw` fails and prove the 503 path without breaking a real database.
 */

export type HealthReport = {
  status: "ok" | "degraded";
  db: "up" | "down";
  /** Newest applied migration (`_prisma_migrations.migration_name`), or null. */
  migration: string | null;
  version: string;
  /** ISO-8601 UTC. */
  time: string;
};

/** The one method the check needs — PrismaClient satisfies it. */
export type HealthDb = {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
};

export const HEALTH_TIMEOUT_MS = 3_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`health check timed out after ${ms} ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

export async function healthCheck(db: HealthDb = getPrisma(), now = new Date()): Promise<HealthReport> {
  const base = { version: pkg.version, time: now.toISOString() };
  try {
    const probe = (async () => {
      await db.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
      const rows = await db.$queryRaw<{ migration_name: string }[]>`
        SELECT migration_name FROM _prisma_migrations
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
        ORDER BY finished_at DESC LIMIT 1`;
      return rows[0]?.migration_name ?? null;
    })();
    const migration = await withTimeout(probe, HEALTH_TIMEOUT_MS);
    return { status: "ok", db: "up", migration, ...base };
  } catch (err) {
    // The reason is logged server-side only; the response says "down".
    console.error("[health] database probe failed:", err instanceof Error ? err.message : String(err));
    return { status: "degraded", db: "down", migration: null, ...base };
  }
}
