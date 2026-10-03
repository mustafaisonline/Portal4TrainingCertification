import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * The notification centre and the header bell (CR-2026-10-03-1228) through the
 * screens: signed out there is no bell; a person's own unread count, latest
 * five, mark read / unread / all, the full page with filters and paging, the
 * 60-second poll (triggered here by a focus event), a new Contact Us message
 * reaching the administrator's bell, nobody seeing anyone else's, and the
 * header on a 320 px phone.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const personEmail = uniqueEmail(`e2e-bell-${run}`);
const adminEmail = uniqueEmail(`e2e-bell-admin-${run}`);
const contactName = `Bell Contact ${run}`;
let personId = "";

test.beforeEach(async () => {
  await resetRateLimits();
});
test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  await prisma.enquiry.deleteMany({ where: { name: contactName } });
  await prisma.outboundEmail.deleteMany({ where: { textBody: { contains: contactName } } });
  await deleteTestUser(personEmail);
  await deleteTestUser(adminEmail);
  await disconnectPrisma();
});

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
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/, { timeout: 30_000 });
}
async function signIn(page: Page, address: string) {
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}
async function notify(n: number, extra: { kind?: "registration" | "payment" | "certificate"; link?: string | null } = {}) {
  const { createNotification } = await import("../../src/modules/notifications/notifications.repository");
  for (let i = 1; i <= n; i++) {
    await createNotification({ userId: personId, kind: extra.kind ?? "registration", title: `E2E notice ${i}`, body: `Body ${i}.`, link: extra.link === undefined ? "/account/orders" : extra.link });
    await new Promise((r) => setTimeout(r, 5));
  }
}
async function clearNotes() {
  const { getPrisma } = await import("../../src/db/prisma");
  await getPrisma().notification.deleteMany({ where: { userId: personId } });
}
async function noAxe(page: Page, scope?: string) {
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expect.poll(async () => (await page.title()).trim().length, { timeout: 10_000 }).toBeGreaterThan(0);
    let b = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
    if (scope) b = b.include(scope);
    const r = await b.analyze();
    expect(r.violations, JSON.stringify(r.violations, null, 2)).toEqual([]);
  }
}

test("setup: a participant and an administrator; signed out there is no bell", async ({ page }) => {
  await register(page, personEmail, "Bella Bell");
  await register(page, adminEmail, "Amir Bell Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  personId = (await findUserByEmail(personEmail))!.id;
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByTestId("notification-bell")).toHaveCount(0);
});

test("a person with nothing new: the bell says so, the panel and the page have an empty state; accessible", async ({ page }) => {
  await signIn(page, personEmail);
  await expect(page.getByTestId("bell-button")).toHaveAttribute("aria-label", "Notifications, none unread");
  await expect(page.getByTestId("bell-badge")).toHaveCount(0);
  await page.getByTestId("bell-button").click();
  await expect(page.getByTestId("bell-empty")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("bell-panel")).toHaveCount(0);
  await page.goto("/account/notifications");
  await expect(page.getByTestId("notifications-title")).toHaveText("Your notifications");
  await expect(page.getByTestId("notifications-empty")).toBeVisible();
  await noAxe(page);
});

test("new notifications light the bell with the unread count; the panel shows the latest five, newest first; opening one marks it read and goes there", async ({ page }) => {
  await notify(7);
  await signIn(page, personEmail);
  await expect(page.getByTestId("bell-badge")).toHaveText("7");
  await expect(page.getByTestId("bell-button")).toHaveAttribute("aria-label", "Notifications, 7 unread");
  await page.getByTestId("bell-button").click();
  const items = page.getByTestId("bell-item");
  await expect(items).toHaveCount(5);
  await expect(items.first()).toContainText("E2E notice 7");
  await expect(items.first()).toHaveAttribute("data-read", "false");
  await noAxe(page, '[data-testid="notification-bell"]');
  await items.first().getByRole("link").click();
  await expect(page).toHaveURL(/\/account\/orders$/);
  await expect(page.getByTestId("bell-badge")).toHaveText("6"); // that one is read now
  await page.getByTestId("bell-button").click();
  await expect(page.getByTestId("bell-item").first()).toHaveAttribute("data-read", "true");
  await page.getByTestId("bell-mark-all").click();
  await expect(page.getByTestId("bell-badge")).toHaveCount(0);
  const { unreadCount } = await import("../../src/modules/notifications/notifications.repository");
  await expect.poll(() => unreadCount(personId)).toBe(0); // the database agrees — all of them, not only the five shown
});

test("the bell refreshes without a reload (the poll runs on focus too): a notification created while the page is open appears", async ({ page }) => {
  await signIn(page, personEmail);
  await expect(page.getByTestId("bell-badge")).toHaveCount(0);
  await notify(2, { kind: "payment" });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByTestId("bell-badge")).toHaveText("2");
  await expect(page.getByTestId("bell-live")).toHaveText("2 unread notifications");
});

test("the page: every notification, filters, paging, mark unread / read / all, deep links; accessible", async ({ page }) => {
  await clearNotes();
  await notify(22, { kind: "registration" });
  await notify(3, { kind: "certificate", link: "/account/certifications" });
  await signIn(page, personEmail);
  await page.goto("/account/notifications");
  await expect(page.getByTestId("notifications-summary")).toContainText("25 unread");
  await expect(page.getByTestId("notification-row")).toHaveCount(20); // a page is 20
  await expect(page.getByTestId("notification-pages")).toContainText("Page 1 of 2");
  await page.getByRole("link", { name: "Older →" }).click();
  await expect(page.getByTestId("notification-row")).toHaveCount(5);
  await page.getByRole("link", { name: "← Newer" }).click();

  // Filter by category.
  await page.getByTestId("notification-filters").getByRole("link", { name: "Certificates" }).click();
  await expect(page.getByTestId("notification-row")).toHaveCount(3);
  await expect(page.getByTestId("notification-open").first()).toHaveAttribute("href", "/account/certifications");

  // Mark one read, then unread again.
  await page.getByTestId("mark-read").first().click();
  await expect(page.getByTestId("notification-row").first()).toHaveAttribute("data-read", "true");
  await expect(page.getByTestId("mark-unread").first()).toBeVisible();
  await page.getByTestId("mark-unread").first().click();
  await expect(page.getByTestId("notification-row").first()).toHaveAttribute("data-read", "false");

  // Unread filter, then mark all as read.
  await page.getByTestId("notification-filters").getByRole("link", { name: /^Unread/ }).click();
  await page.getByTestId("mark-all-read").click();
  await expect(page.getByTestId("notifications-empty")).toContainText("all caught up");
  await expect(page.getByTestId("bell-badge")).toHaveCount(0);
  await page.goto("/account/notifications");
  await noAxe(page);
});

test("the administrator's bell announces a new Contact Us message and links to it", async ({ page, browser }) => {
  // An anonymous visitor writes to the team.
  const visitor = await browser.newContext({ extraHTTPHeaders: { "x-test-no-human-check": "1" } });
  const vp = await visitor.newPage();
  await vp.goto("/contact-us");
  await vp.getByLabel("Your name").fill(contactName);
  await vp.getByLabel("Email", { exact: true }).fill(uniqueEmail(`e2e-bell-visitor-${run}`));
  await vp.getByLabel("Your message").fill(`Hello team, this is ${contactName} asking about a date.`);
  await vp.getByTestId("enquiry-submit").click();
  await expect(vp.getByTestId("enquiry-sent")).toBeVisible();
  await visitor.close();

  await signIn(page, adminEmail);
  await expect(page.getByTestId("bell-badge")).toBeVisible();
  await page.getByTestId("bell-button").click();
  const item = page.getByTestId("bell-item").filter({ hasText: `New message from ${contactName}` });
  await expect(item).toHaveCount(1);
  await item.getByRole("link").click();
  await expect(page).toHaveURL(/\/admin\/enquiries\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("enquiry-title")).toContainText(contactName);
});

test("nobody sees anyone else's notifications; the endpoint needs a session", async ({ page, request }) => {
  await clearNotes();
  await notify(3);
  const anonymous = await request.get("/api/me/notifications");
  expect(anonymous.status()).toBe(401);
  await signIn(page, adminEmail);
  const res = await page.request.get("/api/me/notifications");
  const json = (await res.json()) as { latest: { title: string }[] };
  expect(json.latest.some((n) => n.title.startsWith("E2E notice"))).toBe(false); // the participant's are not the administrator's
  expect(res.headers()["cache-control"]).toContain("no-store");
});

test("on a 320 px phone there is no room for a bell: the header does not overflow and the count is a badge on the avatar; Notifications is in the account menu", async ({ page }) => {
  await clearNotes();
  await notify(120); // the badge caps at 99+
  await page.setViewportSize({ width: 320, height: 640 });
  await signIn(page, personEmail);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByTestId("bell-button")).toBeHidden(); // not in the header on a phone…
  await expect(page.getByTestId("mobile-unread-badge")).toContainText("99+"); // …the count rides on the avatar
  await expect(page.getByTestId("mobile-unread-badge")).toContainText("120 unread notifications"); // and is spoken in full
  await expect(page.getByTestId("header-account")).toBeVisible();
  await page.getByTestId("header-account").click();
  await page.getByTestId("menu-notifications").click();
  await expect(page).toHaveURL(/\/account\/notifications$/);
  await expect(page.getByTestId("notifications-summary")).toContainText("120 unread");
  // Wider than a phone, the bell button is back.
  await page.setViewportSize({ width: 800, height: 700 });
  await expect(page.getByTestId("bell-button")).toBeVisible();
  await expect(page.getByTestId("mobile-unread-badge")).toBeHidden();
});

/* CR-2026-10-03-2250 (founder): the light/dark switch left the header — the bell took its place — and now lives in the
   burger menu, the avatar menu and the footer. */

async function themeIs(page: Page, expected: "light" | "dark") {
  await expect(page.locator("html")).toHaveAttribute("data-theme", expected);
}

test("on a 375 px phone the bell is in the header beside the avatar and the burger, the theme icon is gone from the header, and the switch is in the burger menu and persists", async ({ page }) => {
  await clearNotes();
  await notify(3);
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 375, height: 700 });
  await signIn(page, personEmail);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByTestId("bell-button")).toBeVisible(); // the bell fits from 360 px
  await expect(page.getByTestId("mobile-unread-badge")).toBeHidden(); // so the avatar badge steps aside
  await expect(page.getByTestId("header-account")).toBeVisible();
  await expect(page.getByTestId("theme-toggle")).toHaveCount(0); // not in the header any more
  // The burger's right edge stays inside the screen.
  const burger = await page.getByRole("button", { name: "Open menu" }).boundingBox();
  expect(burger!.x + burger!.width).toBeLessThanOrEqual(375);

  await page.getByRole("button", { name: "Open menu" }).click();
  const row = page.getByTestId("theme-toggle-menu");
  await expect(row).toContainText("Switch to dark theme");
  await row.click();
  await themeIs(page, "dark");
  await expect(row).toContainText("Switch to light theme");
  await page.reload();
  await themeIs(page, "dark"); // remembered
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByTestId("theme-toggle-menu").click();
  await themeIs(page, "light");
});

test("on a laptop the theme switch is in the avatar menu and the footer — not in the header; signed out it is in the footer", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, personEmail);
  await expect(page.getByTestId("bell-button")).toBeVisible();
  await expect(page.getByTestId("theme-toggle")).toHaveCount(0);
  await page.getByTestId("header-account").click();
  await page.getByTestId("theme-toggle-account").click();
  await themeIs(page, "dark");
  await expect(page.getByTestId("theme-toggle-footer")).toContainText("Switch to light theme");
  await page.getByTestId("theme-toggle-footer").click();
  await themeIs(page, "light");

  // Signed out: no bell, no avatar menu — the footer switch is the way to choose.
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByTestId("theme-toggle")).toHaveCount(0);
  await expect(page.getByTestId("bell-button")).toHaveCount(0);
  await page.getByTestId("theme-toggle-footer").click();
  await themeIs(page, "dark");
  await page.getByTestId("theme-toggle-footer").click();
  await themeIs(page, "light");
});

test("the bell panel and the avatar menu stay fully inside the screen at 360, 375, 390 and 430 px (CR-2026-10-03-2250 review finding)", async ({ page }) => {
  await clearNotes();
  await notify(3);
  await signIn(page, personEmail);
  for (const width of [360, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/programs");
    await page.getByTestId("bell-button").click();
    const panel = page.getByTestId("bell-panel");
    await expect(panel).toBeVisible();
    const box = (await panel.boundingBox())!;
    expect(box.x, `bell panel left edge at ${width}px`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `bell panel right edge at ${width}px`).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await page.getByTestId("header-account").click();
    const menu = page.getByTestId("account-menu");
    await expect(menu).toBeVisible();
    const m = (await menu.boundingBox())!;
    expect(m.x, `account menu left edge at ${width}px`).toBeGreaterThanOrEqual(0);
    expect(m.x + m.width, `account menu right edge at ${width}px`).toBeLessThanOrEqual(width);
    expect(m.width, `account menu is usable at ${width}px`).toBeGreaterThan(200);
  }
});
