import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";

/*
 * Regression guard for a defect found on 2026-09-21 while verifying the
 * first real Stripe payment: every timestamp the application wrote landed
 * EIGHT HOURS early. The Prisma pg adapter sends timestamps without a zone,
 * and PostgreSQL interprets those in its session `timezone` — which was
 * Asia/Kuala_Lumpur on the founder's Homebrew instance. Stripe's own event
 * time (12:40:34 UTC) versus our `received_at` (04:40:37) made it visible.
 *
 * The fix is operational: the database's session timezone must be UTC
 * (`ALTER DATABASE … SET timezone TO 'UTC'`; compose init does it; production
 * must too). This test fails loudly on any database where that is not so.
 */
afterAll(async () => {
  await disconnectPrisma();
});

describe("database timestamps", () => {
  it("the session timezone is UTC", async () => {
    const rows = await getPrisma().$queryRaw<{ TimeZone: string }[]>`SHOW timezone`;
    expect(rows[0]?.TimeZone).toBe("UTC");
  });

  it("a Prisma-written timestamp equals the database clock (no zone skew)", async () => {
    const prisma = getPrisma();
    const row = await prisma.enquiry.create({
      data: { kind: "general", name: "tz probe", email: "tz-probe@example.test", message: "timezone probe row", sourcePath: "/test" },
    });
    try {
      const rows = await prisma.$queryRaw<{ skew: number }[]>`
        select extract(epoch from (now() - ${row.createdAt}::timestamptz)) as skew`;
      const skew = Number(rows[0]?.skew);
      expect(Math.abs(skew), `skew of ${skew}s between DB now() and created_at`).toBeLessThan(60);
      // And the JavaScript clock agrees with what was stored.
      expect(Math.abs(row.createdAt.getTime() - Date.now())).toBeLessThan(60_000);
    } finally {
      await prisma.enquiry.delete({ where: { id: row.id } });
    }
  });
});
