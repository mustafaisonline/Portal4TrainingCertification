import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { adminNavItems, isAdminItemActive } from "@/shared/chrome/admin-nav";

/*
 * The admin navigation contract (src/shared/chrome/admin-nav.ts) — one list
 * behind the sub-navigation bar. Unlike the site nav, whose routes are
 * asserted end to end, every admin href is checked here against the file
 * system: a link in the bar with no page under app/admin is a defect.
 *
 * Milestone 8 is built by two agents at once: /admin/users and /admin/audit
 * (plan §2 items 4–5) may land after this file. For those two the test
 * SKIPS with a message when the page is not there yet instead of failing;
 * the orchestrator re-runs the suite once both parts are in.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..", "..", "app");
const PENDING_FROM_PART_2 = new Set(["/admin/users", "/admin/audit"]);

describe("admin navigation", () => {
  it("every href is under /admin with no trailing slash; no duplicate hrefs or labels", () => {
    for (const item of adminNavItems) {
      expect(item.href, item.label).toMatch(/^\/admin(?:\/[A-Za-z0-9-]+)*$/);
    }
    expect(new Set(adminNavItems.map((i) => i.href)).size).toBe(adminNavItems.length);
    expect(new Set(adminNavItems.map((i) => i.label)).size).toBe(adminNavItems.length);
  });

  it("lists every screen the milestone delivers, overview first", () => {
    expect(adminNavItems.map((i) => i.label)).toEqual(["Overview", "Offerings", "Orders", "Enquiries", "Reviews", "Certificates", "Users", "Audit log", "Reports"]);
    expect(adminNavItems[0]!.href).toBe("/admin");
  });

  for (const { href, label } of adminNavItems) {
    it(`${href} (${label}) has a page under app/`, (ctx) => {
      const pagePath = path.join(APP_DIR, ...href.split("/").filter(Boolean), "page.tsx");
      if (!existsSync(pagePath) && PENDING_FROM_PART_2.has(href)) {
        ctx.skip(`${href}: page not present yet — delivered by Milestone 8 part 2 (users, audit); re-run once merged`);
      }
      expect(existsSync(pagePath), `${href} → ${path.relative(APP_DIR, pagePath)}`).toBe(true);
    });
  }

  it("isAdminItemActive: exact for the overview, nested otherwise, trailing slashes normalised", () => {
    expect(isAdminItemActive("/admin", "/admin")).toBe(true);
    expect(isAdminItemActive("/admin/", "/admin")).toBe(true);
    expect(isAdminItemActive("/admin/orders", "/admin")).toBe(false);
    expect(isAdminItemActive("/admin/orders", "/admin/orders")).toBe(true);
    expect(isAdminItemActive("/admin/orders/abc", "/admin/orders")).toBe(true);
    expect(isAdminItemActive("/admin/orders/", "/admin/orders")).toBe(true);
    expect(isAdminItemActive("/admin/reports/revenue-by-month/csv", "/admin/reports")).toBe(true);
    expect(isAdminItemActive("/admin/reviews", "/admin/reports")).toBe(false);
    expect(isAdminItemActive("/admin/certificates/fee", "/admin/certificates")).toBe(true);
    expect(isAdminItemActive("/account/orders", "/admin/orders")).toBe(false);
  });
});
