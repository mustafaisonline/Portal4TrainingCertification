import { describe, expect, it } from "vitest";
import { footerExplore, footerLegal, isActive, primaryNav, siteSearch, verifyLink } from "@/shared/chrome/site-nav";

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
    // 2026-09-26: the "Trainings" item is current on the hub and every training page.
    expect(isActive("/programs", "/programs")).toBe(true);
    expect(isActive("/programs/learn-vibe-coding", "/programs")).toBe(true);
    expect(isActive("/programmes-other", "/programs")).toBe(false);
    expect(isActive("/about-us", "/trainers")).toBe(false);
  });

  it("the header is exactly the founder's five items (2026-09-28: Knowledge Hub / Assessment (was Free Certifications) / Professional Trainings, in that order); About Us is footer-only; the search bar targets /search", () => {
    // Founder, 2026-09-28 (three renames the same day): "Free Trainings" →
    // "Free Knowledge Hub" → "Knowledge Hub"; "Paid Trainings" →
    // "Professional Trainings", moved next to Free Certifications. URLs
    // unchanged.
    // CR-2026-10-04-0110 (founder, 2026-10-04): "Professional Trainings" is now "Trainings"; Agentic AI and Subscription joined.
    expect(primaryNav.map((i) => i.label)).toEqual(["Home", "Knowledge Hub", "Assessment", "Trainings", "Agentic AI", "Subscription", "Reviews"]);
    expect(primaryNav).toContainEqual({ href: "/programs", label: "Trainings" });
    expect(primaryNav).toContainEqual({ href: "/free-trainings", label: "Knowledge Hub" });
    expect(primaryNav).toContainEqual({ href: "/assessment", label: "Assessment" });
    expect(primaryNav.map((i) => i.href)).not.toContain("/trainers");
    expect(primaryNav.map((i) => i.href)).not.toContain("/for-organisations");
    expect(primaryNav.map((i) => i.href)).not.toContain("/about-us");
    expect(footerExplore).toContainEqual({ href: "/about-us", label: "About Us" });
    expect(footerExplore).toContainEqual({ href: "/free-trainings", label: "Knowledge Hub" });
    expect(footerExplore).toContainEqual({ href: "/assessment", label: "Assessment" });
    expect(footerExplore).toContainEqual({ href: "/programs", label: "Trainings" });
    // Founder, 2026-09-30 (M7): the trainer's dedicated page is removed, so the
    // footer has no "Trainer" item and nothing in the navigation (or therefore
    // the sitemap, which is built from it) points at a trainer page.
    expect(footerExplore.map((i) => i.label)).not.toContain("Trainer");
    expect(footerExplore.map((i) => i.href)).not.toContain("/mustafa-qizilbash");
    expect(footerExplore.map((i) => i.href)).not.toContain("/trainers");
    for (const item of [...primaryNav, ...footerExplore, ...footerLegal]) {
      expect(item.href, item.label).not.toMatch(/^\/(mustafa-qizilbash|trainers)/);
    }
    expect(footerExplore.map((i) => i.href)).not.toContain("/for-organisations"); // merged into the trainings page, not a page any more
    expect(siteSearch.action).toBe("/search");
    expect(siteSearch.placeholder).toBe("Search Candidates or Training");
    for (const item of [...primaryNav, ...footerExplore]) {
      expect(item.label, item.href).not.toMatch(/^(Programme|Courses|HRD Corp|Free Diagnostic|Search Candidate)$/);
      expect(item.href).not.toMatch(/DataBlueprint-AIVibeCoding|^\/courses|^\/hrd-corp|^\/diagnostic|^\/free-learning$/);
    }
  });

  it("the desktop header bar is Home · Product ▾ · Reviews · About Us, and every Product-panel link is a plain site path (route existence is proved by the e2e product-menu spec) (CR-2026-10-04-0110)", async () => {
    const { headerBarLinks, productMenuLearning, productMenuAgentic, productMenuMore } = await import("@/shared/chrome/site-nav");
    expect([headerBarLinks.before.label, ...headerBarLinks.after.map((i) => i.label)]).toEqual(["Home", "Reviews", "About Us"]);
    const sections = [productMenuLearning, productMenuAgentic, productMenuMore];
    expect(sections.map((s) => s.title)).toEqual(["Learning", "Agentic AI", "More"]);
    const assessment = productMenuLearning.links.find((l) => l.label === "Assessment")!;
    expect(assessment.children?.map((c) => c.label)).toEqual(["Assess your Data Foundation", "Prepare for Interview"]);
    expect(productMenuAgentic.links.map((l) => l.label)).toEqual(["Overview", "Agents", "Skills", "Subscription"]);
    for (const l of sections.flatMap((s) => s.links.flatMap((l) => [l, ...(l.children ?? [])]))) expect(l.href, l.label).toMatch(/^\/[a-z0-9/#-]*$/);
  });
});
