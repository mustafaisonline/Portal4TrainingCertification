import { describe, expect, it } from "vitest";
import { formatMoney, levelLabel } from "@/modules/catalogue/programmes/types";

/* Prices are stored in minor units and must render exactly as the source
 * site published them (seed maps the published strings → minor units). */
describe("formatMoney", () => {
  it("reproduces the published figures", () => {
    expect(formatMoney(499900, "MYR")).toBe("RM 4,999");
    expect(formatMoney(999900, "MYR")).toBe("RM 9,999");
    expect(formatMoney(10283986, "PKR")).toBe("Rs. 102,839.86");
    expect(formatMoney(34279953, "PKR")).toBe("Rs. 342,799.53");
    expect(formatMoney(281100, "USD")).toBe("USD 2,811");
    expect(formatMoney(31300, "USD")).toBe("USD 313");
  });

  it("falls back to the ISO code for an unknown currency", () => {
    expect(formatMoney(100, "EUR")).toBe("EUR 1");
  });
});

describe("levelLabel", () => {
  it("is display only", () => {
    expect(levelLabel("builder")).toBe("Builder");
  });
});
