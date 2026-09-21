import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * End-to-end + accessibility (ADR-038 layers 3 and Tier-4 a11y; Milestone 1
 * criteria 5 and 6). The app under test runs against the TEST database
 * (playwright.config.ts webServer env), which the test run seeds first — see
 * package.json "pretest:e2e" is deliberately NOT used; the run script in the
 * completion report shows the exact commands.
 *
 * The expected domain name is not a literal here: the test reads it from the
 * database through the same repository the page uses, so the assertion is
 * "the page shows what PostgreSQL holds", which is the point of the milestone.
 */
test.describe("domain page renders from the database", () => {
  test("index lists domains from the DB and a domain page shows the stored name", async ({ page }) => {
    process.env["DATABASE_URL"] = process.env["DATABASE_URL_TEST"];
    const { listDomains } = await import("../../src/modules/catalogue/domains/repository");
    const { disconnectPrisma } = await import("../../src/db/prisma");
    const domains = await listDomains();
    await disconnectPrisma();
    expect(domains.length, "test DB must be seeded before e2e").toBeGreaterThan(0);
    const expected = domains[0]!;

    await page.goto("/domains");
    const links = page.getByTestId("domain-link");
    await expect(links).toHaveCount(domains.length);
    await expect(links.first()).toHaveText(expected.name);

    await links.first().click();
    await expect(page).toHaveURL(new RegExp(`/domains/${expected.id}$`));
    await expect(page.getByTestId("domain-name")).toHaveText(expected.name);
    await expect(page.getByTestId("source")).toContainText(expected.id);
  });

  test("an unknown domain id is a real 404, not a fallback", async ({ page }) => {
    const res = await page.goto("/domains/00000000-0000-4000-8000-000000000000");
    expect(res?.status()).toBe(404);
  });

  test("a malformed id is a 404 rather than a database error", async ({ page }) => {
    const res = await page.goto("/domains/not-a-uuid");
    expect(res?.status()).toBe(404);
  });

  test("the domain page has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/domains");
    await page.getByTestId("domain-link").first().click();
    await expect(page.getByTestId("domain-name")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
