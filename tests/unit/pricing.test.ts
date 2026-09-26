import { describe, expect, it } from "vitest";
import { CommerceError } from "@/modules/commerce/errors";
import { normaliseCountry, priceForUser, regionForCountry } from "@/modules/commerce/pricing";
import { cardPaymentAvailable, PRICE_REGIONS, type ProgrammeRecord } from "@/modules/catalogue/programmes/types";

/*
 * Server-side pricing by profile country (M4 plan §3 D3, §6.3). The free-text
 * country field is matched forgivingly; the amount always comes from the
 * programme's published prices, never from the caller.
 */

describe("regionForCountry", () => {
  it.each([
    ["Malaysia", "malaysia"],
    [" MALAYSIA ", "malaysia"],
    ["my", "malaysia"],
    ["MY", "malaysia"],
    ["Malaysia.", "malaysia"],
    ["Kuala Lumpur, Malaysia", "malaysia"],
    ["Pakistan", "pakistan"],
    ["pk", "pakistan"],
    ["Islamic Republic of Pakistan", "pakistan"],
    ["Singapore", "international"],
    ["United Kingdom", "international"],
    ["Myanmar", "international"],
    ["", "international"],
    [null, "international"],
    [undefined, "international"],
  ] as const)("%j → %s", (country, region) => {
    expect(regionForCountry(country)).toBe(region);
  });

  it("normalises by trimming, lower-casing and removing punctuation", () => {
    expect(normaliseCountry("  Pakistan!! ")).toBe("pakistan");
    expect(normaliseCountry("U.S.A.")).toBe("u s a");
  });
});

describe("priceForUser", () => {
  const programme = {
    slug: "test",
    prices: [
      { region: "malaysia", currency: "MYR", listAmountMinor: 999_800, offerAmountMinor: 499_900, offerLabel: "50%", offerName: "Launch" },
      { region: "international", currency: "USD", listAmountMinor: 562_200, offerAmountMinor: 281_100, offerLabel: "50%", offerName: "Launch" },
    ],
  } as unknown as ProgrammeRecord;

  it("picks the published price for the person's region", () => {
    expect(priceForUser(programme, { country: "Malaysia" }).currency).toBe("MYR");
    expect(priceForUser(programme, { country: null }).currency).toBe("USD");
    expect(priceForUser(programme, { country: "France" }).offerAmountMinor).toBe(281_100);
  });

  it("throws rather than substituting another region's price", () => {
    expect(() => priceForUser(programme, { country: "Pakistan" })).toThrowError(CommerceError);
    try {
      priceForUser(programme, { country: "Pakistan" });
    } catch (err) {
      expect((err as CommerceError).code).toBe("no_price_for_region");
    }
  });
});

describe("cardPaymentAvailable (founder rule 2026-09-26)", () => {
  it("Malaysia and International pay by card; Pakistan pays through the local partner", () => {
    expect(cardPaymentAvailable("malaysia")).toBe(true);
    expect(cardPaymentAvailable("international")).toBe(true);
    expect(cardPaymentAvailable("pakistan")).toBe(false);
    expect(PRICE_REGIONS.map((r) => [r.key, r.payment])).toEqual([
      ["malaysia", "card"],
      ["pakistan", "local_partner"],
      ["international", "card"],
    ]);
  });

  it("the presentation no longer says 'Save up to 50%' or 'Regional scholarship'", () => {
    for (const r of PRICE_REGIONS) {
      expect(r.subtitle + r.badge).not.toMatch(/scholarship|save up to 50/i);
      expect(r.badge).toBe("75% launch discount");
    }
  });
});
