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

  it("isAccountItemActive: exact for the dashboard and for /account/programme, nested otherwise", () => {
    expect(isAccountItemActive("/account", "/account")).toBe(true);
    expect(isAccountItemActive("/account/", "/account")).toBe(true);
    expect(isAccountItemActive("/account/orders", "/account")).toBe(false);
    expect(isAccountItemActive("/account/programme", "/account/programme")).toBe(true);
    expect(isAccountItemActive("/account/programmes", "/account/programme")).toBe(false);
    expect(isAccountItemActive("/account/programmes", "/account/programmes")).toBe(true);
    expect(isAccountItemActive("/account/programmes/abc", "/account/programmes")).toBe(true);
    expect(isAccountItemActive("/account/orders/123", "/account/orders")).toBe(true);
    expect(isAccountItemActive("/account/security", "/account/profile")).toBe(false);
  });
});
