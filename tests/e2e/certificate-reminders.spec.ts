import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addDays } from "../../src/modules/certificates/dates";
import { certificateTodayIso, createAdminUser, deleteTestOffering, issueTestCertificate, type IssuedCertificateFixture } from "../helpers/certificates-db";
import { completeProfileByEmail, deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Renewal reminders — end to end against the test database
 * (MILESTONE_7_EXECUTION_PLAN.md §5 criteria 6 and 7). The job endpoint is
 * called the way a scheduler would (HTTP with the bearer token that
 * playwright.config.ts sets as JOBS_SECRET); the holder then sees the queued
 * reminder on /account/notifications and the administrator sees the last
 * run on /admin/certificates and the reminder on the certificate's detail.
 * Nothing is sent: the outbox row stays `queued` (default F3).
 */

test.describe.configure({ mode: "serial" });

const JOB_URL = "/api/jobs/certificate-reminders";
const JOBS_SECRET = "e2e-jobs-secret"; // playwright.config.ts webServer env
const run = randomUUID().slice(0, 6);
const holderEmail = uniqueEmail("e2e-rem-holder");
const adminEmail = uniqueEmail("e2e-rem-admin");
const HOLDER_NAME = `Rina Reminder ${run}`;

let issuer: { id: string; email: string };
let fixture: IssuedCertificateFixture;
const offeringIds: string[] = [];
const startedAt = new Date();

test.beforeAll(async () => {
  // A database-only administrator to ISSUE the certificate; the admin who
  // signs in through the UI is registered in the second test.
  issuer = await createAdminUser("e2e-rem-issuer");
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  for (const id of offeringIds) await deleteTestOffering(id);
  await deleteTestUser(holderEmail); // also removes the holder's outbox rows
  await deleteTestUser(adminEmail);
  if (issuer) await deleteTestUser(issuer.email);
  // job.run rows this spec produced (test-only hygiene; audit_log is insert-only in the product).
  await prisma.auditLog.deleteMany({ where: { entityType: "job", entityId: "certificate-reminders", createdAt: { gte: startedAt } } });
  await disconnectPrisma();
});

async function registerViaUi(page: Page, address: string, name: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
}

async function signInViaUi(page: Page, address: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

async function signOut(page: Page) {
  await page.goto("/sign-out");
  await page.context().clearCookies();
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("the job refuses a missing or wrong token, queues a 30-day reminder for a certificate expiring in 20 days, and the holder sees it queued in Notifications", async ({ page }) => {
  await registerViaUi(page, holderEmail, HOLDER_NAME);
  await completeProfileByEmail(holderEmail, { legalName: HOLDER_NAME });
  fixture = await issueTestCertificate({ adminUserId: issuer.id, userEmail: holderEmail, expiresOnIso: addDays(certificateTodayIso(), 20) });
  offeringIds.push(fixture.offeringId);
  const printedId = fixture.certificate.certificateId;

  // Authentication (plan §2.3): no token, wrong token, wrong method.
  expect((await page.request.post(JOB_URL)).status()).toBe(401);
  expect((await page.request.post(JOB_URL, { headers: { authorization: "Bearer not-the-secret" } })).status()).toBe(401);
  expect((await page.request.get(JOB_URL, { headers: { authorization: `Bearer ${JOBS_SECRET}` } })).status()).toBe(405);

  // The scheduler's call.
  const res = await page.request.post(JOB_URL, { headers: { authorization: `Bearer ${JOBS_SECRET}` } });
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { considered: number; queued: number; skipped: number; failed: number; byStage: Record<string, number> };
  expect(body.queued).toBeGreaterThanOrEqual(1);
  expect(body.byStage["before_30"]).toBeGreaterThanOrEqual(1);
  expect(body.failed).toBe(0);

  // Safe to repeat: the replay queues nothing.
  const replay = await page.request.post(JOB_URL, { headers: { authorization: `Bearer ${JOBS_SECRET}` } });
  expect(replay.status()).toBe(200);
  expect(((await replay.json()) as { queued: number }).queued).toBe(0);

  // The holder's notification centre.
  await signInViaUi(page, holderEmail);
  await page.goto("/account/notifications");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your notifications");
  const row = page.getByTestId("notification-row").filter({ hasText: printedId });
  await expect(row).toHaveCount(1);
  await expect(row.getByTestId("notification-subject")).toContainText(`Your certificate ${printedId} expires on`);
  await expect(row.getByTestId("notification-status")).toHaveText("Queued");
  await expect(row.getByTestId("notification-status")).toHaveAttribute("data-status", "queued");
  await expect(page.getByText("will be delivered once email sending is enabled")).toBeVisible();
  await expect(page.getByTestId("notifications-empty")).toHaveCount(0);
  // Subject and status only — never the body (it carries the renewal link).
  expect(await page.content()).not.toContain("Hello Rina Reminder");
  await expectNoAxeViolations(page);
  await signOut(page);
});

test("the administrator sees the last run on the certificates list and the reminder on the certificate's detail", async ({ page }) => {
  await registerViaUi(page, adminEmail, "Amira Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signInViaUi(page, adminEmail);

  await page.goto("/admin/certificates");
  const lastRun = page.getByTestId("reminders-last-run");
  await expect(lastRun).toContainText("Reminders: last run");
  await expect(lastRun).toContainText("MYT");
  await expect(lastRun).toContainText("considered");
  await expect(lastRun).toContainText("queued");
  await expect(lastRun).not.toContainText("failed");
  await expectNoAxeViolations(page);

  await page.goto(`/admin/certificates/${fixture.certificate.id}`);
  await expect(page.getByTestId("admin-certificate-title")).toHaveText(fixture.certificate.certificateId);
  await expect(page.getByRole("heading", { name: "Reminders" })).toBeVisible();
  const reminders = page.getByTestId("admin-certificate-reminder");
  await expect(reminders).toHaveCount(1);
  await expect(reminders.first()).toContainText("30 days before expiry");
  await expect(reminders.first()).toContainText("queued");
  await expect(page.getByTestId("admin-certificate-reminders-none")).toHaveCount(0);
  await expectNoAxeViolations(page);
  await signOut(page);
});
