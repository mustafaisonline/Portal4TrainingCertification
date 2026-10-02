import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";
import { footerExplore, footerLegal, primaryNav, verifyLink } from "../../src/shared/chrome/site-nav";

/*
 * Assessment — CR-2026-10-01-1711, phases P0 and P1 (founder, 2026-10-01):
 * "Free Certifications" is now "Assessment" everywhere (the address too, the old
 * one redirects); the page is a gateway of three persona cards; every footer link
 * is also in the burger menu; an Organisation Dashboard item appears for people
 * holding the Organisation role.
 */
test.describe.configure({ mode: "serial" });

const orgEmail = uniqueEmail("e2e-org");
const memberEmail = uniqueEmail("e2e-orgmember");

test.beforeEach(async () => {
  await resetRateLimits();
});
test.afterAll(async () => {
  await deleteTestUser(orgEmail);
  await deleteTestUser(memberEmail);
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page, scope?: string) {
  const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  const results = await (scope ? builder.include(scope) : builder).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}
async function register(page: Page, address: string, name: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
}
async function signIn(page: Page, address: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}

test("the old addresses redirect to /assessment, and nothing on the page still says Free Certifications", async ({ page, request }) => {
  for (const old of ["/free-certifications", "/free-learning/knowledge-check"]) {
    const res = await request.get(old, { maxRedirects: 0 });
    expect(res.status(), old).toBe(308);
    expect(new URL(res.headers()["location"]!, "http://x").pathname, old).toBe("/assessment");
  }
  expect(primaryNav.map((i) => i.label)).toContain("Free Assessment");
  for (const href of ["/", "/assessment", "/free-trainings", "/programs"]) {
    await page.goto(href);
    await expect(page.locator("body"), href).not.toContainText(/Free Certification/i);
  }
  // The header and the footer link to /assessment, labelled Assessment.
  await page.goto("/assessment");
  await expect(page.getByRole("navigation", { name: /primary/i }).getByRole("link", { name: "Free Assessment", exact: true }).first()).toHaveAttribute("href", "/assessment");
});

test("the page is a gateway of three persona cards: Assess your Data Foundation (live), Prepare for Interview and Organisations (both live)", async ({ page }) => {
  await page.goto("/assessment");
  await expect(page.getByTestId("assessment-title")).toHaveText("Test yourself. Prepare. Screen.");
  await expect(page).toHaveTitle(/^Free Assessment/);
  // Count the CARDS (card 1 now holds the grade list's own <li>s, so "every li" would over-count).
  const cards = page.getByTestId("persona-cards").locator('[data-testid^="persona-card-"]');
  await expect(cards).toHaveCount(3);
  const titles = await cards.getByRole("heading", { level: 3 }).allTextContents();
  expect(titles).toEqual(["Assess your Data Foundation", "Prepare for Interview", "Organisations — Interview Screening"]);

  const one = page.getByTestId("persona-card-data-foundation");
  await expect(one).toHaveAttribute("data-live", "yes");
  await expect(one).toContainText("The Free Assessment Check");
  await expect(one).toContainText("Score 60 % or more"); // founder's wording, 2026-10-01 23:50 / 23:58
  // CR-2026-10-01-2246 (23:12): card 1 IS the check — no link out to a section.
  await expect(page.getByTestId("persona-cta-data-foundation")).toHaveCount(0);

  // P2/P4: cards 2 and 3 are live — each has a button to its own page, and no "Coming soon" remains.
  for (const [id, href] of [
    ["interview", "/assessment/interview"],
    ["organisations", "/assessment/organisations"],
  ] as const) {
    const card = page.getByTestId(`persona-card-${id}`);
    await expect(card).toHaveAttribute("data-live", "yes");
    await expect(page.getByTestId(`persona-soon-${id}`)).toHaveCount(0);
    await expect(card).not.toContainText("Coming soon");
    await expect(page.getByTestId(`persona-cta-${id}`)).toHaveAttribute("href", href);
  }
  await expect(page.getByTestId("persona-card-interview")).toContainText("100 questions");

  // CR-2026-10-01-2246 (founder, 23:12: "there need to [be] 3 cards"): the page is EXACTLY the
  // three cards — the check lives inside card 1 (start / sign-in and results), no section below.
  await expect(page.getByTestId("persona-card-data-foundation").getByTestId("kc-title")).toHaveText("Assess your Data Foundation");
  await expect(page.getByTestId("persona-card-data-foundation").getByTestId("kc-grades")).toBeVisible(); // the bands, in the same facts-list shape as cards 2 and 3
  await expect(page.getByTestId("persona-card-data-foundation").getByTestId("start-knowledge-check")).toBeVisible(); // signed out here
  await expect(page.getByRole("heading", { name: "Assess your Data Foundation" })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "The Free Assessment Check" })).toHaveCount(0);
});

test("the Assessment page has no WCAG 2.2 AA violations (light and dark) and no horizontal overflow on a phone", async ({ page }) => {
  await page.goto("/assessment");
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expectNoAxeViolations(page);
  }
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/assessment");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width}px`).toBeLessThanOrEqual(1);
  }
});

test("the burger menu scrolls inside itself on a short phone screen (CR-2026-10-02-2016)", async ({ page }) => {
  for (const size of [{ width: 320, height: 568 }, { width: 375, height: 600 }]) {
    await page.setViewportSize(size);
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const panel = page.locator("#mobile-nav");
    await expect(panel).toBeVisible();
    const m = await panel.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight, overflowY: getComputedStyle(el).overflowY }));
    expect(m.overflowY, `${size.width}x${size.height}`).toBe("auto");
    expect(m.scroll, "content is taller than the panel, so it must scroll").toBeGreaterThan(m.client);
    // The panel plus the header bar fits in the viewport.
    const bottom = await panel.evaluate((el) => el.getBoundingClientRect().bottom);
    expect(bottom).toBeLessThanOrEqual(size.height);
    // The last item is reachable by scrolling the panel and is clickable.
    const last = panel.getByRole("link", { name: "Refund & cancellation policy" });
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
    await last.click();
    await expect(page).toHaveURL(/\/refund-policy/);
  }
});

test("the burger menu carries every footer link (P1), and each one closes the menu", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const more = page.getByTestId("mobile-footer-links");
  await expect(more).toBeVisible();
  const hrefs = await more.getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  const expected = [...footerExplore.map((l) => l.href), ...footerLegal.map((l) => l.href), verifyLink.href];
  // Every footer link is reachable from the burger menu: either in the primary list above it or in "More".
  const primary = await page.getByRole("navigation", { name: "Primary, mobile" }).getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  for (const href of expected) expect([...primary, ...hrefs], href).toContain(href);
  // An unpublished policy is not linked (CR-2026-10-02-0627).
  expect([...primary, ...hrefs]).not.toContain("/credential-integrity-policy");
  for (const label of ["About Us", "Schedule", "FAQ", "Contact Us", "Terms of service", "Privacy policy", "Refund & cancellation policy", "Search completion certificates"]) {
    await expect(more.getByRole("link", { name: label })).toBeVisible();
  }
  await expectNoAxeViolations(page, "#mobile-nav");
  await more.getByRole("link", { name: "FAQ" }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.locator("#mobile-nav")).toHaveCount(0);
});

test("Organisation Dashboard: in the account menu only for the Organisation role; /organisation is role-gated", async ({ page }) => {
  // Signed out → sign-in.
  await page.goto("/organisation");
  await expect(page).toHaveURL(/\/sign-in/);

  // A participant: no menu item, and the page is a 403.
  await register(page, memberEmail, "Mia Member");
  await signIn(page, memberEmail);
  await page.goto("/");
  await page.getByRole("button", { name: /Account menu for/ }).click();
  await expect(page.getByRole("link", { name: "User Dashboard" })).toBeVisible();
  await expect(page.getByTestId("menu-organisation-dashboard")).toHaveCount(0);
  expect((await page.goto("/organisation"))?.status()).toBe(403);
  await page.goto("/sign-out");
  await page.context().clearCookies();

  // An Organisation user: the item shows (desktop menu and phone menu) and the dashboard opens.
  await register(page, orgEmail, "Olu Org");
  await grantRoleByEmail(orgEmail, "org_admin");
  await signIn(page, orgEmail);
  await page.goto("/");
  await page.getByRole("button", { name: /Account menu for/ }).click();
  const item = page.getByTestId("menu-organisation-dashboard");
  await expect(item).toHaveText("Organisation Dashboard");
  await expect(item).toHaveAttribute("href", "/organisation");
  await item.click();
  await expect(page).toHaveURL(/\/organisation$/);
  await expect(page.getByTestId("organisation-title")).toHaveText("Organisation Dashboard");
  // Holding the role without an organisation record: a friendly note, not a crash (the dashboard itself is in organisation-dashboard.spec.ts).
  await expect(page.getByTestId("organisation-no-record")).toContainText("isn’t set up yet");
  await expectNoAxeViolations(page);
  // No Admin or Trainer item for this person.
  await page.getByRole("button", { name: /Account menu for/ }).click();
  await expect(page.getByRole("link", { name: "Admin Dashboard" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Trainer Dashboard" })).toHaveCount(0);

  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByTestId("mobile-organisation-dashboard")).toHaveAttribute("href", "/organisation");
});
