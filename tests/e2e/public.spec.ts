import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { footerExplore, footerLegal, primaryNav, verifyLink } from "../../src/shared/chrome/site-nav";

/*
 * Public portal — end to end (M3 plan §8). Every navigation target resolves;
 * the programme page shows what the DATABASE holds (expected values read
 * through the repository, never typed here); unlisted programmes 404; the
 * schedule is honest about having no dates; the contact form persists.
 */

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

const navTargets = [...new Set([...primaryNav, ...footerExplore, ...footerLegal, verifyLink].map((i) => i.href))];

test("every header and footer link resolves with 200", async ({ request }) => {
  for (const href of navTargets) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

test("programme page renders the flagship from the database", async ({ page }) => {
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const { formatMoney } = await import("../../src/modules/catalogue/programmes/types");
  const flagship = await findFlagshipProgramme();
  expect(flagship, "seeded flagship").not.toBeNull();

  // 2026-09-26: the flagship renders through the shared training template
  // at its /programs page (its bespoke landing was retired that day); the
  // curriculum is two modules whose titles appear as the accordion summaries.
  await page.goto(`/programs/${flagship!.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const body = await page.locator("body").innerText();
  for (const m of flagship!.modules) expect(body, `module ${m.position}`).toContain(m.title);
  const my = flagship!.prices.find((p) => p.region === "malaysia")!;
  expect(body).toContain(formatMoney(my.offerAmountMinor, my.currency));
  for (const f of flagship!.deliveryFormats) expect(body, `format ${f.code}`).toContain(f.name);
  await expectNoAxeViolations(page);
});

test("an unlisted programme is a real 404; the published one is served", async ({ page }) => {
  const { findFlagshipProgramme, listPublishedProgrammes } = await import("../../src/modules/catalogue/programmes/repository");
  const { getPrisma } = await import("../../src/db/prisma");
  const unlisted = await getPrisma().programme.findFirst({ where: { status: "unlisted" }, select: { slug: true } });
  expect(unlisted).not.toBeNull();
  expect((await page.goto(`/programs/${unlisted!.slug}`))?.status()).toBe(404);

  const flagship = (await findFlagshipProgramme())!;
  expect((await page.goto(`/programs/${flagship.slug}`))?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Two trainings are published since 2026-09-26 (Learn Vibe Coding + the flagship).
  expect((await listPublishedProgrammes()).length).toBe(2);
});

test("schedule shows the honest no-dates state and a register-interest path", async ({ page }) => {
  await page.goto("/schedule");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const interest = page.getByRole("link", { name: /register interest/i }).first();
  await expect(interest).toBeVisible();
  await expect(interest).toHaveAttribute("href", /\/contact-us\?kind=programme_interest/);
  await expectNoAxeViolations(page);
});

test("contact form: validation errors leave no row; a valid message is persisted", async ({ page }) => {
  const { findEnquiriesByEmail } = await import("../../src/modules/catalogue/enquiries/repository");
  const { uniqueEmail } = await import("../helpers/identity-db");
  const email = uniqueEmail("e2e-enquiry");

  await page.goto("/contact-us");
  await expectNoAxeViolations(page);
  await page.getByLabel("Your name").fill("E2E Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("What do you need?").fill("short");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
  expect(await findEnquiriesByEmail(email)).toEqual([]);

  await page.getByLabel("What do you need?").fill("Hello — this is an end-to-end test enquiry, please ignore it.");
  await page.getByRole("button", { name: /send/i }).click();
  // The confirmation replaces the form; wait for its reference line, not a
  // phrase that page copy might already contain.
  await expect(page.getByText("Your reference is")).toBeVisible();
  const rows = await findEnquiriesByEmail(email);
  expect(rows).toHaveLength(1);
  expect(rows[0]!.message).toContain("end-to-end test enquiry");

  const { getPrisma } = await import("../../src/db/prisma");
  await getPrisma().enquiry.deleteMany({ where: { email: email.toLowerCase() } });
});

test("public pages have no WCAG 2.2 AA violations", async ({ page }) => {
  for (const href of ["/", "/trainers", "/hrd-corp", "/about-us", "/faq", "/for-organisations", "/diagnostic", "/verify"]) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 }), href).toBeVisible();
    await expectNoAxeViolations(page);
  }
});

test.afterAll(async () => {
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});
