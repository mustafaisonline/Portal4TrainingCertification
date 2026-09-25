import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/*
 * Trainings hub and training pages — end to end (founder request 2026-09-26:
 * "/DataBlueprint-AIVibeCoding → /programs", "Programme → Trainings", the
 * Learn Vibe Coding training). Expected values are read from the database
 * through the repository, never typed here, except the three founder-given
 * Learn Vibe Coding prices, which are asserted literally because the request
 * fixed them.
 */

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("/programs lists exactly the published trainings in order, Learn Vibe Coding first, each linked", async ({ page }) => {
  const { listPublishedProgrammes } = await import("../../src/modules/catalogue/programmes/repository");
  const published = await listPublishedProgrammes();
  expect(published.map((p) => p.slug)).toEqual(["learn-vibe-coding", "data-blueprint-ai-vibe-coding"]);

  await page.goto("/programs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trainings");
  const items = page.getByTestId("trainings-list").getByRole("listitem");
  await expect(items).toHaveCount(published.length);
  for (const [i, p] of published.entries()) {
    const item = items.nth(i);
    await expect(item.getByRole("heading", { level: 3 })).toHaveText(p.title);
    await expect(item.getByRole("link", { name: /details/i })).toHaveAttribute("href", `/programs/${p.slug}`);
  }
  // No unlisted programme is offered.
  const { getPrisma } = await import("../../src/db/prisma");
  const unlisted = await getPrisma().programme.findMany({ where: { status: "unlisted" }, select: { title: true } });
  const body = await page.locator("body").innerText();
  for (const u of unlisted) expect(body, u.title).not.toContain(u.title);

  // Closing CTA row.
  await expect(page.getByRole("link", { name: "Take the free diagnostic" })).toHaveAttribute("href", "/diagnostic");
  await expect(page.getByRole("link", { name: "Training for a team?" })).toHaveAttribute("href", "/for-organisations");

  // Header nav: "Trainings" is present and current here.
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  await expect(nav.getByRole("link", { name: "Trainings" })).toHaveAttribute("href", "/programs");
  await expect(nav.getByRole("link", { name: "Trainings" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Programme" })).toHaveCount(0);
  await expectNoAxeViolations(page);
});

test("/programs/learn-vibe-coding renders the training with its new sections and undiscounted prices", async ({ page }) => {
  const { findPublishedProgrammeBySlug } = await import("../../src/modules/catalogue/programmes/repository");
  const training = await findPublishedProgrammeBySlug("learn-vibe-coding");
  expect(training, "seeded Learn Vibe Coding").not.toBeNull();

  const res = await page.goto("/programs/learn-vibe-coding");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(training!.title);
  await expect(page.getByTestId("relationship-note")).toHaveText(training!.content.relationshipNote!);
  await expect(page.getByRole("heading", { name: "Why you need this training" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start freelancing straight after the session" })).toBeVisible();

  // Header CTAs.
  const hero = page.locator("section").first();
  await expect(hero.getByRole("link", { name: "Register your interest" })).toHaveAttribute(
    "href",
    "/contact-us?kind=programme_interest&programme=learn-vibe-coding",
  );
  await expect(hero.getByRole("link", { name: "See upcoming dates" })).toHaveAttribute("href", "/schedule");
  // The "Trainings" nav item is current on a training page too.
  await expect(page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Trainings" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Six curriculum modules, each a disclosure; the first point of Part 1.
  expect(training!.modules).toHaveLength(6);
  const curriculum = page.locator("#curriculum");
  await expect(curriculum).toContainText("6 modules");
  for (const m of training!.modules) await expect(curriculum.getByText(m.title, { exact: true })).toBeVisible();
  await curriculum.getByText(training!.modules[0]!.title, { exact: true }).click();
  await expect(curriculum.getByText(training!.modules[0]!.points![0]!)).toBeVisible();

  // FAQ as native <details>.
  const faq = page.locator("#faq");
  expect(training!.content.faq!.length).toBeGreaterThanOrEqual(4);
  await expect(faq.locator("details")).toHaveCount(training!.content.faq!.length);
  await faq.getByText(training!.content.faq![0]!.q, { exact: true }).click();
  await expect(faq.getByText(training!.content.faq![0]!.a)).toBeVisible();

  // Investment: the founder's figures, one per region tab, no strike-through,
  // no "you save".
  const investment = page.locator("#investment");
  await expect(investment.getByRole("heading", { name: "Course investment" })).toBeVisible();
  const expected: [string, string][] = [
    ["Malaysia", "RM 100"],
    ["Pakistan", "Rs. 5,000"],
    ["International", "USD 1,000"],
  ];
  for (const [tab, figure] of expected) {
    await investment.getByRole("tab", { name: tab }).click();
    await expect(investment.getByText(figure, { exact: true })).toBeVisible();
    await expect(investment.locator(".line-through")).toHaveCount(0);
    await expect(investment.getByText(/you save/i)).toHaveCount(0);
    await expect(investment.getByText("Launch price", { exact: true }).first()).toBeVisible();
  }
  await expectNoAxeViolations(page);
});

test("/programs/data-blueprint-ai-vibe-coding serves the flagship's bespoke landing", async ({ page }) => {
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const flagship = await findFlagshipProgramme();
  expect(flagship).not.toBeNull();
  expect(flagship!.slug).toBe("data-blueprint-ai-vibe-coding");

  const res = await page.goto(`/programs/${flagship!.slug}`);
  expect(res?.status()).toBe(200);
  // The landing's own headline, not the generic template's title h1.
  await expect(page.getByRole("heading", { level: 1 })).toContainText("It’s a method");
  await expect(page.locator("#the-method")).toBeVisible();
  await expect(page.locator("#investment")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("the retired URLs redirect permanently to the /programs paths", async ({ request }) => {
  const old = await request.get("/DataBlueprint-AIVibeCoding", { maxRedirects: 0 });
  expect(old.status()).toBeGreaterThanOrEqual(300);
  expect(old.status()).toBeLessThan(400);
  expect(old.headers()["location"]).toMatch(/\/programs\/data-blueprint-ai-vibe-coding$/);

  const course = await request.get("/courses/learn-vibe-coding", { maxRedirects: 0 });
  expect(course.status()).toBeGreaterThanOrEqual(300);
  expect(course.status()).toBeLessThan(400);
  expect(course.headers()["location"]).toMatch(/\/programs\/learn-vibe-coding$/);

  const index = await request.get("/courses", { maxRedirects: 0 });
  expect(index.headers()["location"]).toMatch(/\/programs$/);

  // Followed, they land on 200 pages.
  expect((await request.get("/DataBlueprint-AIVibeCoding")).status()).toBe(200);
  expect((await request.get("/courses/learn-vibe-coding")).status()).toBe(200);
});

test.afterAll(async () => {
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});
