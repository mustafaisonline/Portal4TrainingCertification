import { describe, expect, it } from "vitest";
import { plusCount } from "@/shared/marketing/plus-count";

/*
 * Milestone 15, Req 1 (founder, 2026-09-29): the home page says "380+ topics"
 * and "3,800+ questions" — read from the database and rounded DOWN so the
 * claim is always true.
 */
describe("plusCount", () => {
  it("rounds down to the step and adds a plus: the founder's own examples", () => {
    expect(plusCount(383, 10)).toBe("380+");
    expect(plusCount(3830, 100)).toBe("3,800+");
  });

  it("never rounds up — a headline number must be true", () => {
    expect(plusCount(399, 10)).toBe("390+");
    expect(plusCount(3899, 100)).toBe("3,800+");
    expect(plusCount(10_999, 100)).toBe("10,900+");
  });

  it("an exact multiple is stated exactly; below one step it is the exact count", () => {
    expect(plusCount(380, 10)).toBe("380");
    expect(plusCount(3800, 100)).toBe("3,800");
    expect(plusCount(7, 10)).toBe("7");
    expect(plusCount(99, 100)).toBe("99");
  });

  it("nothing to claim → null, so the caller omits the figure", () => {
    expect(plusCount(0, 10)).toBeNull();
    expect(plusCount(-4, 10)).toBeNull();
    expect(plusCount(Number.NaN, 10)).toBeNull();
  });
});
