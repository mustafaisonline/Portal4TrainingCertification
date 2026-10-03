import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { plusCount } from "../../src/shared/marketing/plus-count";

/*
 * Home page — "HOW THIS PORTAL WORKS" (Milestone 15, Requirement 1; founder,
 * 2026-09-29): three equal cards directly below YOUR LEARNING JOURNEY —
 * Knowledge Hub → Assessment → Professional Training. The figures
 * are read from the database, so the expectations are computed from the same
 * repositories through the same formatter — never typed here.
 */

async function expectNoAxeViolations(page: Page, scope?: string) {
  const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  const results = await (scope ? builder.include(scope) : builder).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.afterAll(async () => {
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

test("the section sits directly below the learning journey, with the founder's intro and three cards in journey order", async ({ page }) => {
  await page.goto("/");
  const section = page.getByTestId("how-portal-works");
  await expect(section.getByRole("heading", { level: 2, name: "HOW THIS PORTAL WORKS" })).toBeVisible();
  await expect(page.getByTestId("how-portal-works-intro")).toContainText("Learn, test your knowledge, and build your professional capabilities — all in one place.");
  await expect(page.getByTestId("how-portal-works-intro")).toContainText("or take a professional training program to deepen your skills.");

  // Placement: YOUR LEARNING JOURNEY → this section → (the diagnostic band, when present).
  const journey = await page.getByText("YOUR LEARNING JOURNEY", { exact: true }).boundingBox();
  const mine = await section.boundingBox();
  expect(journey!.y).toBeLessThan(mine!.y);
  const diagnostic = page.locator("#free-skill-diagnostic");
  if ((await diagnostic.count()) > 0) expect((await diagnostic.boundingBox())!.y).toBeGreaterThan(mine!.y);

  // Three cards, in order, each a list item of one ordered list.
  const cards = section.locator("ol > li");
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0).getByRole("heading", { level: 3 })).toHaveText("Knowledge Hub");
  await expect(cards.nth(1).getByRole("heading", { level: 3 })).toHaveText("Assessment");
  await expect(cards.nth(2).getByRole("heading", { level: 3 })).toHaveText("Professional Training");
  await expect(cards.nth(0)).toContainText("Step 1");
  await expect(cards.nth(1)).toContainText("Step 2");
  await expect(cards.nth(2)).toContainText("Step 3");
});

test("card copy and links: the Knowledge Hub, Assessment and Professional Training cards", async ({ page }) => {
  const { countPublishedTopics } = await import("../../src/modules/free-learning/book.repository");
  const { bankSize } = await import("../../src/modules/free-learning/knowledge-check.repository");
  const { listPublishedExperts } = await import("../../src/modules/catalogue/experts/repository");
  const topics = plusCount(await countPublishedTopics(), 10);
  const questions = plusCount(await bankSize(), 100);
  const { enabledUnlockSetting } = await import("../../src/modules/commerce/unlock.repository");
  const { formatMoney } = await import("../../src/modules/catalogue/programmes/types");
  const fee = await enabledUnlockSetting();
  const bookUrl = (await listPublishedExperts()).flatMap((e) => e.profile.books ?? []).find((b) => /datapedia/i.test(b.title))?.url ?? null;

  await page.goto("/");

  // Card 1 — Knowledge Hub.
  const hub = page.getByTestId("portal-card-knowledge");
  await expect(hub).toContainText("available free of charge. Learn concepts, frameworks, technologies and practical ideas at your own pace.");
  await expect(hub).toContainText("Content inspired by I Am Datapedia.");
  await expect(hub).toContainText("Free");
  if (topics) {
    await expect(page.getByTestId("portal-stat-knowledge")).toContainText(`${topics}`);
    await expect(page.getByTestId("portal-stat-knowledge")).toContainText("Topics");
    await expect(hub).toContainText(`Explore ${topics} Data & AI topics`);
  }
  await expect(page.getByTestId("portal-cta-knowledge")).toHaveText(/Explore Knowledge Hub\s→/);
  await expect(page.getByTestId("portal-cta-knowledge")).toHaveAttribute("href", "/free-trainings");
  // The Amazon link is the URL already on the trainer's record — or absent, never invented.
  if (bookUrl) {
    await expect(page.getByTestId("portal-amazon")).toHaveAttribute("href", bookUrl);
    await expect(page.getByTestId("portal-amazon")).toHaveAttribute("rel", /noopener/);
    await expect(page.getByTestId("portal-amazon")).toContainText("I Am Datapedia — on Amazon");
  } else {
    await expect(page.getByTestId("portal-amazon")).toHaveCount(0);
  }

  // Card 2 — Assessment. No passing percentage is written anywhere (it is one configurable constant).
  const cert = page.getByTestId("portal-card-certification");
  // Founder, 2026-09-30: the card names "The Free Assessment Check" (200 questions, 3 hours) and a graded certificate.
  await expect(cert).toContainText("Test your Data & AI knowledge with The Free Assessment Check — 200 questions in 3 hours, drawn from our growing question bank of");
  await expect(cert).toContainText("earn a graded certificate when you achieve the required passing score.");
  await expect(cert).not.toContainText(/\d\s?%/);
  const certHighlights = page.getByTestId("portal-highlights-certification");
  await expect(certHighlights.locator("li")).toHaveCount(3);
  if (questions) await expect(certHighlights).toContainText(`${questions} Questions`);
  await expect(certHighlights).toContainText("The Free Assessment Check");
  await expect(certHighlights).toContainText("Graded Certificate on Passing");
  // Founder, 2026-09-29: the free attempt, but a paid certificate document — the fee line is read from the admin setting.
  if (fee) await expect(page.getByTestId("portal-note-certification")).toHaveText(`Certificate document: ${formatMoney(fee.amountMinor, fee.currency)}`);
  else await expect(page.getByTestId("portal-note-certification")).toHaveCount(0);
  await expect(page.getByTestId("portal-cta-certification")).toHaveText(/Start an Assessment\s→/);
  await expect(page.getByTestId("portal-cta-certification")).toHaveAttribute("href", "/assessment");

  // Card 3 — Professional Training, on the existing route.
  const training = page.getByTestId("portal-card-training");
  await expect(training).toContainText("Build practical Data & AI capabilities through structured professional training designed for practitioners, professionals and organizations.");
  const trainingHighlights = page.getByTestId("portal-highlights-training");
  await expect(trainingHighlights).toContainText("Expert-led Training");
  await expect(trainingHighlights).toContainText("Practical Learning");
  await expect(trainingHighlights).toContainText("Certificate of Completion");
  await expect(page.getByTestId("portal-cta-training")).toHaveText(/Explore Professional Training\s→/);
  await expect(page.getByTestId("portal-cta-training")).toHaveAttribute("href", "/programs");
  // Only the two free cards carry the Free badge.
  await expect(training.getByText("Free", { exact: true })).toHaveCount(0);
});

test("the three links land on real pages", async ({ page, request }) => {
  await page.goto("/");
  for (const id of ["knowledge", "certification", "training"]) {
    const href = (await page.getByTestId(`portal-cta-${id}`).getAttribute("href"))!;
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test("responsive: three across on desktop, 2 + 1 on tablet, one column on mobile — never a horizontal overflow", async ({ page }) => {
  const layout = async () => {
    const boxes = await Promise.all(["knowledge", "certification", "training"].map((k) => page.getByTestId(`portal-card-${k}`).boundingBox()));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    return { boxes: boxes.map((b) => b!), overflow };
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  let { boxes, overflow } = await layout();
  expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThan(2); // one row
  expect(Math.abs(boxes[1]!.y - boxes[2]!.y)).toBeLessThan(2);
  expect(Math.abs(boxes[0]!.height - boxes[1]!.height)).toBeLessThan(2); // equal weight
  expect(Math.abs(boxes[1]!.height - boxes[2]!.height)).toBeLessThan(2);
  expect(overflow).toBe(false);

  await page.setViewportSize({ width: 800, height: 1000 });
  await page.goto("/");
  ({ boxes, overflow } = await layout());
  expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThan(2); // two across…
  expect(boxes[2]!.y).toBeGreaterThan(boxes[0]!.y + boxes[0]!.height - 2); // …then one below
  expect(overflow).toBe(false);

  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  ({ boxes, overflow } = await layout());
  expect(Math.abs(boxes[0]!.x - boxes[1]!.x)).toBeLessThan(2); // a single column
  expect(Math.abs(boxes[1]!.x - boxes[2]!.x)).toBeLessThan(2);
  expect(boxes[1]!.y).toBeGreaterThan(boxes[0]!.y);
  expect(boxes[2]!.y).toBeGreaterThan(boxes[1]!.y);
  expect(overflow).toBe(false);
});

test("the home page has no WCAG 2.2 AA violations with the new section (light and dark)", async ({ page }) => {
  await page.goto("/");
  await expectNoAxeViolations(page);
  // Dark mode: scoped to the new section, so an unrelated part of the page
  // cannot mask (or be blamed for) this section's contrast.
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expectNoAxeViolations(page, "[data-testid=how-portal-works]");
});

test("hero: a Free Diagnostic button sits next to Explore trainings and opens the diagnostic (founder, 2026-09-30)", async ({ page }) => {
  await page.goto("/");
  const explore = page.getByRole("link", { name: /^Explore trainings/ }).first();
  const diagnostic = page.getByTestId("hero-free-diagnostic");
  await expect(diagnostic).toHaveText("Free Diagnostic");
  await expect(diagnostic).toHaveAttribute("href", "/free-learning/diagnostic");
  // Next to it: the same row, the diagnostic to the right of the primary button.
  const a = (await explore.boundingBox())!;
  const b = (await diagnostic.boundingBox())!;
  expect(Math.abs(a.y - b.y), "same row").toBeLessThan(6);
  expect(b.x, "to the right of Explore trainings").toBeGreaterThan(a.x + a.width - 1);
  await diagnostic.click();
  await expect(page).toHaveURL(/\/free-learning\/diagnostic$/);
  // Contrast in both themes (transitions off: axe would sample a blended colour).
  await page.goto("/");
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expectNoAxeViolations(page, '[data-testid="hero-free-diagnostic"]');
  }
});
