import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { identityEmailAllowed } from "@/modules/identity/email-limits";

/*
 * The per-ADDRESS cap on verification / reset emails (security review,
 * CR-2026-10-03-1245) against the real test database: one every two minutes and
 * five a day, per kind, per address — so many IPs cannot email-bomb one person.
 */

const run = Math.random().toString(36).slice(2, 8);
const addr = (n: string) => `${n}-${run}@example.test`;
afterAll(async () => {
  await getPrisma().authRateLimit.deleteMany({ where: { key: { contains: `-${run}@example.test` } } });
  await disconnectPrisma();
});

describe("identityEmailAllowed", () => {
  it("allows the first, refuses a second within two minutes, allows again after", async () => {
    const a = addr("first");
    const t0 = 5_000_000_000;
    expect(await identityEmailAllowed("verify", a, t0)).toBe(true);
    expect(await identityEmailAllowed("verify", a, t0 + 60_000)).toBe(false);
    expect(await identityEmailAllowed("verify", a, t0 + 130_000)).toBe(true);
  });

  it("stops at five a day however spread out", async () => {
    const a = addr("daily");
    const t0 = 6_000_000_000;
    const results: boolean[] = [];
    for (let i = 0; i < 7; i++) results.push(await identityEmailAllowed("verify", a, t0 + i * 130_000));
    expect(results).toEqual([true, true, true, true, true, false, false]);
  });

  it("is per address and per kind, and ignores case and spaces", async () => {
    const a = addr("kinds");
    const t0 = 7_000_000_000;
    expect(await identityEmailAllowed("verify", a, t0)).toBe(true);
    expect(await identityEmailAllowed("reset", a, t0)).toBe(true); // another kind
    expect(await identityEmailAllowed("verify", addr("other"), t0)).toBe(true); // another address
    expect(await identityEmailAllowed("verify", `  ${a.toUpperCase()} `, t0 + 1000)).toBe(false); // same address, any spelling
  });

  it("holds under a parallel burst: exactly one gets through", async () => {
    const a = addr("burst");
    const t0 = 8_000_000_000;
    const results = await Promise.all(Array.from({ length: 20 }, () => identityEmailAllowed("reset", a, t0)));
    expect(results.filter(Boolean)).toHaveLength(1);
  });
});
