import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * The header's Product panel (CR-2026-10-04-0110; founder, 2026-10-04): Home · Product ▾ · Reviews · About Us on a laptop; the
 * panel opens over the page in categories (Learning with Assessment's two sub-items, Trainings — the first published ones plus
 * a link on, Dashboard by role, Agentic AI with Subscription, More); it never overflows the screen; Esc / outside click / a
 * link closes it; the burger is on every width — compact on a laptop, the full navigation on a phone.
 */

test.describe.configure({ mode: "serial" });
const email = uniqueEmail(`e2e-product-${randomUUID().slice(0, 6)}`);

test.beforeEach(async () => {
  await resetRateLimits();
});
test.afterAll(async () => {
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await deleteTestUser(email);
  await disconnectPrisma();
});

async function insideScreen(page: Page, testId: string, width: number, what: string) {
  const box = (await page.getByTestId(testId).boundingBox())!;
  expect(box.x, `${what} left edge at ${width}px`).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, `${what} right edge at ${width}px`).toBeLessThanOrEqual(width + 0.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `no sideways scroll at ${width}px`).toBe(true);
}

test("laptop header: Home · Product · Reviews · About Us; the Product panel lists the categories and closes with Esc, outside click or a link", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  expect(await nav.getByRole("link").allTextContents()).toEqual(["Home", "Reviews", "About Us"]);
  const button = page.getByTestId("product-menu-button");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  const panel = page.getByTestId("product-menu");
  await expect(panel).toBeVisible();
  for (const id of ["learning", "trainings", "dashboard", "agentic-ai", "more"]) await expect(page.getByTestId(`product-section-${id}`)).toBeVisible();
  // Learning, with Assessment's two sub-items.
  const learning = page.getByTestId("product-section-learning");
  await expect(learning.getByRole("link", { name: "Knowledge Hub", exact: true })).toHaveAttribute("href", "/free-trainings");
  await expect(learning.getByRole("link", { name: "Assess your Data Foundation" })).toHaveAttribute("href", "/assessment#data-foundation");
  await expect(learning.getByRole("link", { name: "Prepare for Interview" })).toHaveAttribute("href", "/assessment/interview");
  // Trainings: the published ones (five at most) and a link on to the full list.
  const trainings = page.getByTestId("product-training-link");
  expect(await trainings.count()).toBeGreaterThan(0);
  expect(await trainings.count()).toBeLessThanOrEqual(5);
  await expect(page.getByTestId("product-all-trainings")).toHaveAttribute("href", "/programs");
  // Agentic AI with Subscription; signed out, the Dashboard offers sign-in.
  const agentic = page.getByTestId("product-section-agentic-ai");
  for (const [name, href] of [["Agents", "/agentic-ai/agents"], ["Skills", "/agentic-ai/skills"], ["Subscription", "/subscription"]] as const) await expect(agentic.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  await expect(page.getByTestId("product-section-dashboard").getByRole("link", { name: "Sign in" })).toBeVisible();
  await insideScreen(page, "product-menu", 1280, "panel");

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(button).toBeFocused();
  await button.click();
  await expect(panel).toBeVisible();
  await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))); // a press anywhere outside the panel
  await expect(panel).toBeHidden();
  await button.click();
  await page.getByTestId("product-section-agentic-ai").getByRole("link", { name: "Agents", exact: true }).click();
  await expect(page).toHaveURL(/\/agentic-ai\/agents$/);
  await expect(panel).toBeHidden();
});

test("the panel stays inside the screen at 1024, 1280 and 1536 px and scrolls inside itself on a short screen; it is accessible", async ({ page }) => {
  for (const width of [1024, 1280, 1536]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await page.getByTestId("product-menu-button").click();
    await insideScreen(page, "product-menu", width, "panel");
    await insideScreen(page, "product-section-more", width, "last column");
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1024, height: 420 });
  await page.goto("/");
  await page.getByTestId("product-menu-button").click();
  const panel = page.getByTestId("product-menu");
  const { client, scroll } = await panel.evaluate((el) => ({ client: el.clientHeight, scroll: el.scrollHeight }));
  expect(client).toBeLessThanOrEqual(420);
  expect(scroll).toBeGreaterThanOrEqual(client); // taller than the screen: it scrolls inside itself, never past the viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByTestId("product-menu-button").click();
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const r = await new AxeBuilder({ page }).include("#product-menu").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(r.violations, `${scheme}: ${JSON.stringify(r.violations, null, 2)}`).toEqual([]);
  }
});

test("signed in, the Dashboard category lists what the person can open", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Dina Dashboard");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/, { timeout: 30_000 });
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account\/profile$/);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByTestId("product-menu-button").click();
  const dashboard = page.getByTestId("product-section-dashboard");
  for (const name of ["User Dashboard", "My Trainings", "My Agentic AI", "Notifications"]) await expect(dashboard.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(dashboard.getByRole("link", { name: "Admin Dashboard" })).toHaveCount(0); // not an administrator
  await expect(dashboard.getByRole("link", { name: "Sign in" })).toHaveCount(0);
});

test("the burger is on every width: compact on a laptop (no duplicate navigation), the full navigation on a phone — where there is no Product panel", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const panel = page.getByTestId("menu-panel");
  await expect(panel).toBeVisible();
  await expect(page.getByTestId("theme-toggle-menu")).toBeVisible();
  await expect(panel.getByRole("navigation", { name: "Primary, mobile" })).toBeHidden(); // the bar and the Product panel already carry it
  await expect(panel.getByRole("link", { name: "Terms of service" })).toBeVisible();
  await insideScreen(page, "menu-panel", 1280, "burger panel");
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/");
  await expect(page.getByTestId("product-menu-button")).toBeHidden();
  await page.getByRole("button", { name: "Open menu" }).click();
  const phone = page.getByRole("navigation", { name: "Primary, mobile" });
  for (const [name, href] of [["Knowledge Hub", "/free-trainings"], ["Assessment", "/assessment"], ["Trainings", "/programs"], ["Agentic AI", "/agentic-ai"], ["Subscription", "/subscription"], ["Reviews", "/reviews"]] as const) {
    await expect(phone.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
});
