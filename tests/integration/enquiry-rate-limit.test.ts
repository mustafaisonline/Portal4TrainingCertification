import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { enquiryOverLimit } from "@/modules/catalogue/enquiries/rate-limit";

/*
 * The Contact Us limiter against the REAL test database (security review M1):
 * the count is ONE atomic statement, so a parallel burst cannot read "below the
 * limit" together. Keys are unique per run and removed afterwards.
 */

const run = Math.random().toString(36).slice(2, 8);
const keys = new Set<string>();
const scope = `t${run}`;

afterAll(async () => {
  await getPrisma().authRateLimit.deleteMany({ where: { key: { startsWith: `enquiry:${scope}:` } } });
  await disconnectPrisma();
});

function track(client: string) {
  keys.add(client);
  return client;
}

describe("enquiryOverLimit", () => {
  it("lets exactly `max` requests through under a parallel burst of 60", async () => {
    const client = track("burst");
    const results = await Promise.all(Array.from({ length: 60 }, () => enquiryOverLimit(scope, client, 60_000, 5)));
    expect(results.filter((over) => !over)).toHaveLength(5);
    expect(results.filter((over) => over)).toHaveLength(55);
  });

  it("counts sequentially too: the sixth is over, the fifth is not", async () => {
    const client = track("sequence");
    const seen: boolean[] = [];
    for (let i = 0; i < 7; i++) seen.push(await enquiryOverLimit(scope, client, 60_000, 5));
    expect(seen).toEqual([false, false, false, false, false, true, true]);
  });

  it("keeps clients apart", async () => {
    const a = track("client-a");
    const b = track("client-b");
    for (let i = 0; i < 6; i++) await enquiryOverLimit(scope, a, 60_000, 5);
    expect(await enquiryOverLimit(scope, a, 60_000, 5)).toBe(true);
    expect(await enquiryOverLimit(scope, b, 60_000, 5)).toBe(false);
  });

  it("starts a fresh window once the old one has passed", async () => {
    const client = track("window");
    const t0 = 1_000_000;
    for (let i = 0; i < 6; i++) await enquiryOverLimit(scope, client, 1_000, 3, t0);
    expect(await enquiryOverLimit(scope, client, 1_000, 3, t0 + 500)).toBe(true); // same window
    expect(await enquiryOverLimit(scope, client, 1_000, 3, t0 + 1_500)).toBe(false); // window over → counted again from 1
  });
});
