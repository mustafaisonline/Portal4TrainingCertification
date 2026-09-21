import { describe, expect, it } from "vitest";
import { footerExplore, footerLegal, isActive, primaryNav, verifyLink } from "@/shared/chrome/site-nav";

/*
 * The navigation contract (src/shared/chrome/site-nav.ts). Route existence is
 * asserted by tests/e2e/shell.spec.ts once PublicShell is mounted (plan §7
 * M3) — a 404 behind a header link is a defect there, not a lint warning.
 */
describe("site navigation", () => {
  const all = [...primaryNav, ...footerExplore, ...footerLegal, verifyLink];

  it("every href is an absolute site path with no trailing slash", () => {
    for (const item of all) {
      expect(item.href, item.label).toMatch(/^\/(?:[A-Za-z0-9-]+(?:\/[A-Za-z0-9-]+)*)?$/);
    }
  });

  it("primary nav has no duplicate destinations or labels", () => {
    expect(new Set(primaryNav.map((i) => i.href)).size).toBe(primaryNav.length);
    expect(new Set(primaryNav.map((i) => i.label)).size).toBe(primaryNav.length);
  });

  it("isActive matches exact and nested paths, normalising trailing slashes", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/trainers", "/")).toBe(false);
    expect(isActive("/trainers/", "/trainers")).toBe(true);
    expect(isActive("/trainers/jane", "/trainers")).toBe(true);
    expect(isActive("/courses/anything", "/DataBlueprint-AIVibeCoding")).toBe(true);
    expect(isActive("/about-us", "/trainers")).toBe(false);
  });
});
