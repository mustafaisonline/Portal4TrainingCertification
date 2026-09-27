import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * "Support the Academy" (founder decisions M1–M5, 2026-09-27) through the
 * real screens against the test database. Stripe keys are deliberately
 * blank in the Playwright environment, so pressing Pay must EXPLAIN rather
 * than pretend (the same honesty the renewal test asserts). The admin
 * switch hides the card everywhere and refuses the page; switching it back
 * restores it. Setting rows this run creates are removed in afterAll.
 */

test.describe.configure({ mode: "serial" });

const email = uniqueEmail("e2e-support-admin");
const marker = `e2e-support-${email.split("@")[0]}`;

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const rows = await prisma.supportPaymentSetting.findMany({ where: { note: { contains: marker } }, select: { id: true } });
  const ids = rows.map((r) => r.id);
  if (ids.length) {
    await prisma.auditLog.deleteMany({ where: { entityType: "support_payment_setting", entityId: { in: ids } } });
    await prisma.supportPaymentSetting.deleteMany({ where: { id: { in: ids } } });
  }
  await deleteTestUser(email);
  await disconnectPrisma();
});

async function registerViaUi(page: Page, address: string, name = "Sue Supporter") {
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

async function signInViaUi(page: Page, address: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/); // an administrator lands on /admin (2026-09-27)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("signed out → sign-in; signed in (no profile) → the RM 2.00 card; Pay explains that payments are not configured; the card is on the dashboard and the Trainings page", async ({ page }) => {
  await page.goto("/support");
  await expect(page).toHaveURL(/\/sign-in\?return-to=%2Fsupport$/);

  await registerViaUi(page, email);
  await signInViaUi(page, email);
  await page.goto("/support");
  await expect(page.getByTestId("support-title")).toHaveText("Support the Academy");
  await expect(page.getByTestId("support-amount")).toHaveText("RM 2");
  await expect(page.getByTestId("support-card")).toContainText("Secure card payment via Stripe");
  await expectNoAxeViolations(page);
  // No profile gate (M4): the button is here, and pressing it EXPLAINS.
  await page.getByTestId("support-pay").click();
  // The commerce module's own wording (PAYMENTS_NOT_CONFIGURED_MESSAGE), shown
  // both as the page's standing note and as the action's answer.
  await expect(page.getByText("not configured on this installation yet", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Nothing has been charged.", { exact: false }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/support$/);
  // An unknown order in the return URL is said to be unknown, never assumed paid.
  await page.goto("/support?order=00000000-0000-4000-8000-000000000000");
  await expect(page.getByTestId("support-order-missing")).toBeVisible();
  await page.goto("/support?cancelled=1");
  await expect(page.getByTestId("support-cancelled")).toBeVisible();

  await page.goto("/account");
  await expect(page.getByTestId("dash-support")).toContainText("Support the Academy");
  await expect(page.getByTestId("dash-support-link")).toHaveAttribute("href", "/support");
  await page.goto("/programs");
  await expect(page.getByTestId("programs-support")).toContainText("RM 2");
});

test("the administrator switches it off — page unavailable, cards gone — and back on; both changes are audited", async ({ page }) => {
  await grantRoleByEmail(email, "platform_admin");
  await signInViaUi(page, email);
  await page.goto("/admin/orders");
  await page.getByTestId("admin-support-setting-link").click();
  await expect(page).toHaveURL(/\/admin\/orders\/support$/);
  await expect(page.getByTestId("support-setting-amount")).toHaveText("MYR 2.00");
  await expectNoAxeViolations(page);

  const form = page.getByTestId("support-setting-form");
  await form.getByTestId("support-setting-enabled").uncheck();
  await form.getByLabel("Note").fill(`${marker} off`);
  await page.getByTestId("support-setting-submit").click();
  await expect(page.getByTestId("support-setting-saved")).toContainText("Disabled");

  await page.goto("/support");
  await expect(page.getByTestId("support-unavailable")).toBeVisible();
  await expect(page.getByTestId("support-pay")).toHaveCount(0);
  await page.goto("/account");
  await expect(page.getByTestId("dash-support")).toHaveCount(0);
  await page.goto("/programs");
  await expect(page.getByTestId("programs-support")).toHaveCount(0);

  await page.goto("/admin/orders/support");
  await expect(page.getByTestId("support-setting-current")).toContainText("Disabled");
  const again = page.getByTestId("support-setting-form");
  await again.getByTestId("support-setting-enabled").check();
  await again.getByLabel("Amount").fill("2.00");
  await again.getByLabel("Note").fill(`${marker} on`);
  await page.getByTestId("support-setting-submit").click();
  await expect(page.getByTestId("support-setting-saved")).toContainText("Enabled");
  await page.goto("/support");
  await expect(page.getByTestId("support-pay")).toBeVisible();

  const { getPrisma } = await import("../../src/db/prisma");
  const rows = await getPrisma().auditLog.findMany({ where: { action: "support_payment.changed", reason: { contains: marker } }, orderBy: { createdAt: "asc" } });
  expect(rows.map((r) => (r.after as { enabled: boolean }).enabled)).toEqual([false, true]);
});
