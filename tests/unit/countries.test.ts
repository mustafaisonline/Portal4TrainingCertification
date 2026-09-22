import { describe, expect, it } from "vitest";
import { COUNTRIES, countryCodeFor, countryName, DIAL_CODES, isCountryCode, isDialCode } from "@/content/countries";

describe("ISO 3166-1 country list (M5a)", () => {
  it("has the full alpha-2 set, unique codes, sorted by name", () => {
    expect(COUNTRIES.length).toBe(249);
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const c of COUNTRIES) expect(c.code, c.name).toMatch(/^[A-Z]{2}$/);
    const names = COUNTRIES.map((c) => c.name);
    const collator = new Intl.Collator("en");
    expect([...names].sort(collator.compare)).toEqual(names);
  });

  it("includes the two priced regions and their neighbours", () => {
    expect(countryName("MY")).toBe("Malaysia");
    expect(countryName("PK")).toBe("Pakistan");
    expect(countryName("SG")).toBe("Singapore");
    expect(countryName("my")).toBe("Malaysia");
    expect(countryName("XX")).toBeNull();
    expect(countryName(null)).toBeNull();
    expect(isCountryCode("MY")).toBe(true);
    expect(isCountryCode("Malaysia")).toBe(false);
  });

  it("maps a legacy free-text country back to its code", () => {
    expect(countryCodeFor("Malaysia")).toBe("MY");
    expect(countryCodeFor("pakistan.")).toBe("PK");
    expect(countryCodeFor("pk")).toBe("PK");
    expect(countryCodeFor("Nowhere")).toBeNull();
    expect(countryCodeFor(null)).toBeNull();
  });

  it("dial codes are E.164-shaped, refer to listed countries and cover the home markets", () => {
    for (const d of DIAL_CODES) {
      expect(d.dial).toMatch(/^\+\d{1,3}$/);
      expect(isCountryCode(d.code), d.code).toBe(true);
    }
    const byCode = Object.fromEntries(DIAL_CODES.map((d) => [d.code, d.dial]));
    expect(byCode["MY"]).toBe("+60");
    expect(byCode["PK"]).toBe("+92");
    expect(byCode["SG"]).toBe("+65");
    expect(byCode["GB"]).toBe("+44");
    expect(isDialCode("+60")).toBe(true);
    expect(isDialCode("+999")).toBe(false);
  });
});
