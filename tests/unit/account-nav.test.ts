import { describe, expect, it } from "vitest";
import { accountNavItems, isAccountItemActive } from "@/shared/chrome/account-nav";

/*
 * The signed-in navigation contract (src/shared/chrome/account-nav.ts) —
 * one list behind the sidebar and the header menu. Route existence is
 * asserted by tests/e2e/account.spec.ts.
 */
describe("account navigation", () => {
  it("every href is under /account (or the public /reviews screen, M5b) with no trailing slash, and no duplicates", () => {
    for (const item of accountNavItems) {
      expect(item.href, item.label).toMatch(/^(?:\/account(?:\/[A-Za-z0-9-]+)*|\/reviews)$/);
    }
    expect(accountNavItems.map((i) => i.href)).toContain("/reviews");
    expect(new Set(accountNavItems.map((i) => i.href)).size).toBe(accountNavItems.length);
    expect(new Set(accountNavItems.map((i) => i.label)).size).toBe(accountNavItems.length);
  });

  it("lists the tabs in the founder's order (Milestone 13, decisions 5–7): Profile first, no Dashboard, no catalogue tab", () => {
    expect(accountNavItems.map((i) => i.label)).toEqual(["Profile", "My Trainings", "Certifications", "Reviews", "Orders & receipts", "My Agentic AI", "Skills profile", "Notifications", "Help"]);
    expect(accountNavItems[0]!.href).toBe("/account/profile");
    expect(accountNavItems.map((i) => i.href)).not.toContain("/account");
    expect(accountNavItems.map((i) => i.href)).not.toContain("/account/programme");
  });

  it("isAccountItemActive: exact or nested, trailing slashes normalised", () => {
    expect(isAccountItemActive("/account/profile", "/account/profile")).toBe(true);
    expect(isAccountItemActive("/account/profile/", "/account/profile")).toBe(true);
    expect(isAccountItemActive("/account/trainings", "/account/trainings")).toBe(true);
    expect(isAccountItemActive("/account/trainings/abc", "/account/trainings")).toBe(true);
    expect(isAccountItemActive("/account/orders/123", "/account/orders")).toBe(true);
    expect(isAccountItemActive("/account/orders", "/account/profile")).toBe(false);
    expect(isAccountItemActive("/reviews", "/reviews")).toBe(true);
  });
});
