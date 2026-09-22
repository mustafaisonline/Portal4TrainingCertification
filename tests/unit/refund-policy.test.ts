import { describe, expect, it } from "vitest";
import { daysUntilStart, describeRefundTiers, refundAmountMinor, refundPercentFor } from "@/modules/commerce/refund-policy";

/*
 * The founder's refund rule (M4 plan §3 D2) — boundaries of the ONE pure
 * function the UI, the service and the published policy share (§6.4).
 */

const START = new Date("2027-03-15T00:00:00Z"); // a `starts_on` value: UTC midnight

function daysBefore(n: number, time = "09:30:00"): Date {
  const d = new Date(START);
  d.setUTCDate(d.getUTCDate() - n);
  return new Date(`${d.toISOString().slice(0, 10)}T${time}Z`);
}

describe("refundPercentFor (calendar days before the start date, UTC)", () => {
  it.each([
    [30, 100],
    [14, 100],
    [13, 50],
    [7, 50],
    [6, 0],
    [1, 0],
    [0, 0],
    [-1, 0],
  ] as const)("%i days before → %i %", (days, percent) => {
    expect(refundPercentFor(START, daysBefore(days))).toBe(percent);
  });

  it("does not depend on the time of day", () => {
    expect(refundPercentFor(START, daysBefore(14, "23:59:59"))).toBe(100);
    expect(refundPercentFor(START, daysBefore(14, "00:00:00"))).toBe(100);
    expect(refundPercentFor(START, daysBefore(7, "23:59:59"))).toBe(50);
    expect(refundPercentFor(START, daysBefore(6, "00:00:01"))).toBe(0);
  });

  it("counts whole days", () => {
    expect(daysUntilStart(START, daysBefore(14))).toBe(14);
    expect(daysUntilStart(START, daysBefore(0))).toBe(0);
    expect(daysUntilStart(START, daysBefore(-3))).toBe(-3);
  });
});

describe("refundAmountMinor", () => {
  it("returns integer minor units, rounding half up", () => {
    expect(refundAmountMinor(499_900, 100)).toBe(499_900);
    expect(refundAmountMinor(499_900, 50)).toBe(249_950);
    expect(refundAmountMinor(10_283_986, 50)).toBe(5_141_993);
    expect(refundAmountMinor(101, 50)).toBe(51);
    expect(refundAmountMinor(499_900, 0)).toBe(0);
  });

  it("is net of the provider's processing fee (founder decision 2026-09-22)", () => {
    expect(refundAmountMinor(499_900, 100, 15_197)).toBe(484_703); // RM 4,999 − RM 151.97
    expect(refundAmountMinor(499_900, 50, 15_197)).toBe(234_753); // RM 2,499.50 − RM 151.97
    expect(refundAmountMinor(499_900, 0, 15_197)).toBe(0); // no refund → nothing to net
    expect(refundAmountMinor(1_000, 50, 5_000)).toBe(0); // never negative
    expect(refundAmountMinor(499_900, 100)).toBe(499_900); // unknown fee → absorbed
    expect(describeRefundTiers()[0]!.outcome).toContain("less the payment-processing fee");
  });
});

describe("describeRefundTiers", () => {
  it("states the three tiers and the free transfer, in policy order", () => {
    const tiers = describeRefundTiers();
    expect(tiers.map((t) => t.outcome)).toEqual([
      "100 % refund, less the payment-processing fee",
      "50 % refund, less the payment-processing fee",
      "No refund",
      "Free, once",
    ]);
  });
});
