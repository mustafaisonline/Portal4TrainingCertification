import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Admin → Email (CR-2026-10-03-1225 slice 2): the log shows the recipient, template, status and reason but NEVER the
 * body; a failed email can be retried; an address can be added to and removed from the do-not-send list; anyone who is
 * not a platform admin gets 403.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const adminEmail = uniqueEmail("e2e-email-admin");
const memberEmail = uniqueEmail("e2e-email-member");
const failedTo = `e2e-email-failed-${run}@example.test`;
const blockedTo = `e2e-email-blocked-${run}@example.test`;
const SECRET_BODY = `SECRET-ONE-TIME-LINK-${run}`;

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  await prisma.outboundEmail.deleteMany({ where: { toEmail: { in: [failedTo, blockedTo] } } });
  await prisma.emailSuppression.deleteMany({ where: { email: { in: [blockedTo] } } });
  await prisma.auditLog.deleteMany({ where: { action: { startsWith: "email." }, createdAt: { gte: new Date(Date.now() - 3600_000) }, entityId: { in: [blockedTo] } } });
  await deleteTestUser(adminEmail);
  await deleteTestUser(memberEmail);
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
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
}

async function signIn(page: Page, address: string, landing: RegExp) {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(landing);
}

test("a signed-in member who is not an administrator gets 403 on /admin/email", async ({ page }) => {
  await register(page, memberEmail, "Mina Member");
  await signIn(page, memberEmail, /\/account\/profile$/);
  const res = await page.goto("/admin/email");
  expect(res?.status()).toBe(403);
});

test("the administrator reads the log (no bodies), retries a failed email and manages the do-not-send list", async ({ page }) => {
  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  await register(page, adminEmail, "Amira Email Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signIn(page, adminEmail, /\/admin$/);

  const failed = await prisma.outboundEmail.create({ data: { toEmail: failedTo, templateKey: "test.failed", subject: `Failed ${run}`, textBody: SECRET_BODY, status: "failed", attempts: 4, lastError: "Error: connect ETIMEDOUT" } });

  await page.goto(`/admin/email?q=${encodeURIComponent(failedTo)}`);
  await expect(page.getByTestId("admin-email-title")).toHaveText("Email");
  const row = page.getByTestId("email-row").filter({ hasText: failedTo });
  await expect(row).toHaveCount(1);
  await expect(row.getByTestId("email-row-status")).toHaveText("Failed");
  await expect(row).toContainText("connect ETIMEDOUT");
  expect(await page.content()).not.toContain(SECRET_BODY); // the body is never shown

  await row.getByTestId("email-retry").click();
  // On success the row turns Sent and the Retry form (and its message) goes away with it.
  await expect(row.getByTestId("email-row-status")).toHaveText("Sent");
  await expect.poll(async () => (await prisma.outboundEmail.findUniqueOrThrow({ where: { id: failed.id } })).status).toBe("sent");
  await page.reload();
  await expect(page.getByTestId("email-row").filter({ hasText: failedTo }).getByTestId("email-row-status")).toHaveText("Sent");

  // The do-not-send list: add (case-insensitive), see it, send to it → failed with the reason, remove.
  await page.getByTestId("suppression-email").fill(blockedTo.toUpperCase());
  await page.getByTestId("suppression-reason").fill("bounced — e2e");
  await page.getByTestId("suppression-add").click();
  await expect(page.getByText(`${blockedTo} will no longer be sent any email.`)).toBeVisible();
  const srow = page.getByTestId("suppression-row").filter({ hasText: blockedTo });
  await expect(srow).toHaveCount(1);
  await expect(srow).toContainText("bounced — e2e");

  const { sendEmail } = await import("../../src/modules/notifications/email");
  expect((await sendEmail({ to: blockedTo, templateKey: "test.blocked", subject: "x", text: "x" })).status).toBe("failed");

  await page.getByTestId("suppression-email").fill("a@b"); // passes the browser's own check, not ours
  await page.getByTestId("suppression-add").click();
  await expect(page.getByText("Enter one plain email address")).toBeVisible();

  await srow.getByTestId("suppression-remove").click();
  await expect(srow).toHaveCount(0); // the entry — and the form that removed it — is gone
  await page.reload();
  await expect(page.getByTestId("suppression-row").filter({ hasText: blockedTo })).toHaveCount(0);

  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expect.poll(async () => (await page.title()).trim().length, { timeout: 10_000 }).toBeGreaterThan(0);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).include("main").analyze();
    expect(results.violations, `${scheme}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
  }
});
