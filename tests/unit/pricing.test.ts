import { describe, expect, it } from "vitest";
import { CommerceError } from "@/modules/commerce/errors";
import { normaliseCountry, priceForUser, regionForCountry } from "@/modules/commerce/pricing";
import { cardPaymentAvailable, PRICE_CARD_ORDER, PRICE_REGIONS, priceCardMeta, pricesForCard, type ProgrammeRecord } from "@/modules/catalogue/programmes/types";

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
      // M12 WP1: the HRD Corp row is display-only and must never be the one charged.
      { region: "malaysia_hrdcorp", currency: "MYR", listAmountMinor: 999_800, offerAmountMinor: 999_800, offerLabel: "Full fee", offerName: "HRD Corp", minParticipants: 25, note: null },
      { region: "malaysia", currency: "MYR", listAmountMinor: 999_800, offerAmountMinor: 499_900, offerLabel: "50%", offerName: "Launch", minParticipants: 25, note: null },
      { region: "international", currency: "USD", listAmountMinor: 562_200, offerAmountMinor: 281_100, offerLabel: "50%", offerName: "Launch", minParticipants: null, note: null },
    ],
  } as unknown as ProgrammeRecord;

  it("picks the published price for the person's region", () => {
    expect(priceForUser(programme, { country: "Malaysia" }).currency).toBe("MYR");
    expect(priceForUser(programme, { country: null }).currency).toBe("USD");
    expect(priceForUser(programme, { country: "France" }).offerAmountMinor).toBe(281_100);
  });

  it("a Malaysian participant is charged the NOT-via-HRD-Corp row, never the HRD Corp figure (L5/L6)", () => {
    const price = priceForUser(programme, { country: "Malaysia" });
    expect(price.region).toBe("malaysia");
    expect(price.offerAmountMinor).toBe(499_900);
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
  it("Malaysia and Rest of the world pay by card; Pakistan through the local partner; HRD Corp is claimed, never charged", () => {
    expect(cardPaymentAvailable("malaysia")).toBe(true);
    expect(cardPaymentAvailable("international")).toBe(true);
    expect(cardPaymentAvailable("pakistan")).toBe(false);
    expect(cardPaymentAvailable("malaysia_hrdcorp")).toBe(false);
    // The founder's fee-row order (M12 WP1).
    expect(PRICE_REGIONS.map((r) => [r.key, r.payment])).toEqual([
      ["malaysia_hrdcorp", "hrd_corp"],
      ["malaysia", "card"],
      ["pakistan", "local_partner"],
      ["international", "card"],
    ]);
  });

  it("the presentation no longer says 'Save up to 50%' or 'Regional scholarship'; 'International' is now 'Rest of the world' (L12)", () => {
    for (const r of PRICE_REGIONS) {
      expect(r.subtitle + r.badge).not.toMatch(/scholarship|save up to 50/i);
      if (r.payment !== "hrd_corp") expect(r.badge).toBe("75% launch discount");
    }
    expect(PRICE_REGIONS.map((r) => r.label)).toEqual(["Malaysia — via HRD Corp", "Malaysia", "Pakistan", "Rest of the world"]);
    expect(PRICE_REGIONS.map((r) => r.label).join(" ")).not.toMatch(/\bInternational\b/);
  });

  it("both Malaysian rows sit on the Malaysia card; regionForCountry never yields the HRD Corp row", () => {
    expect(PRICE_REGIONS.filter((r) => r.card === "malaysia").map((r) => r.optionLabel)).toEqual(["Via HRD Corp", "Without HRD Corp"]);
    expect(PRICE_CARD_ORDER).toEqual(["international", "malaysia", "pakistan"]);
    expect(priceCardMeta("international").label).toBe("Rest of the world");
    const rows = [
      { region: "international", currency: "USD", listAmountMinor: 1, offerAmountMinor: 1, offerLabel: "", offerName: "", minParticipants: null, note: null },
      { region: "malaysia", currency: "MYR", listAmountMinor: 1, offerAmountMinor: 1, offerLabel: "", offerName: "", minParticipants: null, note: null },
      { region: "malaysia_hrdcorp", currency: "MYR", listAmountMinor: 1, offerAmountMinor: 1, offerLabel: "", offerName: "", minParticipants: null, note: null },
    ] as const;
    expect(pricesForCard([...rows], "malaysia").map((p) => p.region)).toEqual(["malaysia_hrdcorp", "malaysia"]);
    expect(pricesForCard([...rows], "pakistan")).toEqual([]);
    for (const c of ["Malaysia", "Pakistan", "France", "", null]) expect(regionForCountry(c)).not.toBe("malaysia_hrdcorp");
  });
});
