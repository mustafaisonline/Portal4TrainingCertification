import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createAdminUser, createCertificateUser, deleteCertificateChain, deleteTestOffering, issueTestCertificate, type IssuedCertificateFixture } from "../helpers/certificates-db";
import { deleteTestUser, resetRateLimits } from "../helpers/identity-db";

/*
 * The header search bar and /search (Milestone 14 Phase 1, founder decision
 * P17): one input, "Search Candidates or Training"; results in two groups —
 * published trainings by words in their title/summary, and certificates by
 * exact ID or listed holder name with /verify's rules. The five-item header
 * (P15–P17) and the retired-route redirects are asserted here too.
 */

let issued: IssuedCertificateFixture;
let admin: { id: string; email: string };
let holder: { id: string; email: string; name: string };

test.beforeAll(async () => {
  admin = await createAdminUser("e2e-search-admin");
  holder = await createCertificateUser({ prefix: "e2e-search-holder", legalName: "Selina Searchable" });
  issued = await issueTestCertificate({ adminUserId: admin.id, userId: holder.id, listed: true });
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  await deleteCertificateChain([issued.certificate.id]);
  await deleteTestOffering(issued.offeringId);
  await deleteTestUser(holder.email);
  await deleteTestUser(admin.email);
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("the header has the four items beside the logo (which is Home) and a search bar; the retired routes redirect", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  // UX review 2026-09-27 D1: "Home" is the logo on the desktop bar; the phone menu keeps the item.
  expect(await nav.getByRole("link").allTextContents()).toEqual(["Trainings & HRD Corp", "Free Training & Certification", "Trainers", "Reviews"]);
  const search = page.getByTestId("site-search").getByRole("searchbox");
  await expect(search).toHaveAttribute("placeholder", "Search Candidates or Training");
  await search.fill("vibe");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=vibe$/);

  for (const [from, to] of [
    ["/hrd-corp", /\/programs(#hrd-corp)?$/],
    ["/diagnostic", /\/free-learning$/],
    ["/diagnostic/result", /\/free-learning\/diagnostic\/result$/],
  ] as const) {
    await page.goto(from);
    await expect(page).toHaveURL(to);
  }
});

test("/search: a training by a word in its title; a certificate by ID and by listed name; honest empty states; no WCAG violations", async ({ page }) => {
  await page.goto("/search?q=vibe");
  await expect(page.getByTestId("search-title")).toHaveText("Results for “vibe”");
  await expect(page.locator('[data-testid="search-training"][data-slug="learn-vibe-coding"]')).toContainText("Learn Vibe Coding");
  await expect(page.getByTestId("search-certificates-none")).toBeVisible(); // "vibe" is a name search with no listed match
  await expectNoAxeViolations(page);

  await page.goto(`/search?q=${issued.certificate.certificateId}`);
  const cert = page.getByTestId("search-certificate");
  await expect(cert).toHaveCount(1);
  await expect(cert.getByTestId("search-certificate-name")).toHaveText("Selina Searchable");
  await expect(cert.getByRole("link", { name: issued.certificate.certificateId })).toHaveAttribute("href", `/verify/${issued.certificate.certificateId}`);
  await expect(page.getByTestId("search-trainings-none")).toBeVisible();

  await page.goto("/search?q=Selina%20Searchable");
  await expect(page.getByTestId("search-certificate")).toHaveCount(1);

  await page.goto("/search?q=zzqx-nothing-here");
  await expect(page.getByTestId("search-trainings-none")).toBeVisible();
  await expect(page.getByTestId("search-certificates-none")).toBeVisible();

  await page.goto("/search");
  await expect(page.getByTestId("search-hint")).toBeVisible();
});

test("Trainings & HRD Corp is one page; Free Training & Certification lists its two items; the diagnostic says nothing is saved", async ({ page }) => {
  await page.goto("/programs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trainings");
  await expect(page.getByTestId("hrd-corp-sections")).toContainText("What HRD Corp is");
  await expectNoAxeViolations(page);

  await page.goto("/free-learning");
  await expect(page.getByTestId("free-learning-title")).toBeVisible();
  await expect(page.getByTestId("learn-free")).toContainText("I Am Datapedia!");
  await expect(page.getByTestId("datapedia-amazon")).toHaveAttribute("href", /amazon\.com\/dp\/B0F1NT87CL/);
  await expect(page.getByTestId("free-test")).toContainText("50, 100 or 200 questions");
  // Founder, 2026-09-27: "Take away" removed from this page — the trainer's other books stay off it.
  await expect(page.getByTestId("free-learning-take-away")).toHaveCount(0);
  await expectNoAxeViolations(page);

  await page.goto("/free-learning/diagnostic");
  await expect(page.getByTestId("diagnostic-not-saved")).toContainText("we do not save your diagnostic results");
  await page.goto("/");
  await expect(page.getByTestId("diagnostic-not-saved")).toContainText("we do not save your diagnostic results");

  // Founder, 2026-09-27: the books stay on Free Training & Certification; the trainer card no longer lists them, and no empty "position open" card sits beside the trainer.
  await page.goto("/trainers");
  await expect(page.getByTestId("trainer-take-away")).toHaveCount(0);
  await expect(page.getByRole("note", { name: /open trainer position/i })).toHaveCount(0);
});
