import { afterAll, describe, expect, it } from "vitest";
import { GET } from "@app/api/health/route";
import { HEALTH_TIMEOUT_MS, healthCheck, type HealthDb } from "@/config/health";
import { disconnectPrisma } from "@/db/prisma";
import pkg from "../../package.json";

/*
 * /api/health (M9 plan §2 item 1; §5 criterion 1). The 200 path runs against
 * the REAL test database; the 503 path injects a client whose `$queryRaw`
 * fails, so no database has to be taken down.
 */
afterAll(async () => {
  await disconnectPrisma();
});

describe("GET /api/health", () => {
  it("answers 200, no-store, with the newest applied migration and the package version", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: "ok", db: "up", version: pkg.version });
    expect(typeof body["migration"]).toBe("string");
    expect(body["migration"]).toMatch(/^\d{14}_/);
    expect(new Date(body["time"] as string).toISOString()).toBe(body["time"]);
    // Nothing beyond the five documented fields — no connection details.
    expect(Object.keys(body).sort()).toEqual(["db", "migration", "status", "time", "version"]);
  });

  it("reports degraded when the database probe throws", async () => {
    const broken: HealthDb = {
      async $queryRaw() {
        throw new Error("connection refused");
      },
    };
    const report = await healthCheck(broken);
    expect(report).toMatchObject({ status: "degraded", db: "down", migration: null, version: pkg.version });
  });

  it("reports degraded when the database never answers (timeout)", async () => {
    const hung: HealthDb = {
      $queryRaw() {
        return new Promise(() => {});
      },
    };
    const started = Date.now();
    const report = await healthCheck(hung);
    expect(report.status).toBe("degraded");
    expect(Date.now() - started).toBeGreaterThanOrEqual(HEALTH_TIMEOUT_MS - 50);
  }, HEALTH_TIMEOUT_MS + 5_000);
});
