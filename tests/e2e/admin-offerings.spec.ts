import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Admin offerings — end to end through the real screens against the test
 * database (M4 plan §2 item 2; §7 criterion 2). An administrator creates a
 * real date for the flagship through the form; it appears in the admin list
 * and on the public /schedule with its dates; setting it to cancelled removes
 * it from /schedule. Everything created here is removed in afterAll so the
 * "no invented dates" state is restored.
 */

test.describe.configure({ mode: "serial" });

const email = uniqueEmail("e2e-admin-offerings");
// A unique note lets cleanup find exactly the rows this run created.
const marker = `e2e-offering-${email.split("@")[0]}`;

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const rows = await prisma.scheduledOffering.findMany({ where: { scheduleNote: marker }, select: { id: true } });
  const ids = rows.map((r) => r.id);
  if (ids.length) {
    await prisma.auditLog.deleteMany({ where: { entityType: "offering", entityId: { in: ids } } });
    await prisma.scheduledOffering.deleteMany({ where: { id: { in: ids } } });
  }
  await deleteTestUser(email);
  await disconnectPrisma();
});

async function registerViaUi(page: Page, address: string, name = "Olive Operations") {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(address);
  await page.getByLabel(/^Country/).selectOption("MY");
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
  await expect(page).toHaveURL(/\/account$/);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

/** Dates safely in the future so the offering is "upcoming" whenever the suite runs. */
function futureDate(monthsAhead: number, day: number): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + monthsAhead, day));
}
const startsOn = futureDate(4, 6);
const endsOn = futureDate(4, 10);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const enGb = (d: Date) => d.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

test("an administrator creates an open offering; it is listed and published on /schedule; cancelling withdraws it", async ({ page }) => {
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const flagship = await findFlagshipProgramme();
  expect(flagship, "seeded flagship").not.toBeNull();
  const format = flagship!.deliveryFormats[0]!;

  await registerViaUi(page, email);
  await grantRoleByEmail(email, "platform_admin");
  await signInViaUi(page, email);

  // Landing → offerings list (reachable from the admin landing card).
  await page.goto("/admin");
  await page.getByTestId("admin-offerings-link").click();
  await expect(page).toHaveURL(/\/admin\/offerings$/);
  await expect(page.getByTestId("offerings-title")).toHaveText("Scheduled offerings");
  await expectNoAxeViolations(page);

  // The form.
  await page.getByRole("link", { name: "New offering" }).first().click();
  await expect(page).toHaveURL(/\/admin\/offerings\/new$/);
  const form = page.getByRole("form", { name: "New offering" });
  await expect(form).toBeVisible(); // page fully rendered before axe scans it
  await expectNoAxeViolations(page);

  await form.getByLabel("Programme", { exact: true }).selectOption({ label: flagship!.title });
  await form.getByLabel("Format", { exact: true }).selectOption({ label: format.name });
  await form.getByLabel("Delivery").selectOption("live_online");
  await form.getByLabel("First day").fill(iso(startsOn));
  await form.getByLabel("Last day").fill(iso(endsOn));
  await form.getByLabel("Status").selectOption("open");
  await form.getByLabel(/^Capacity/).fill("12");
  await form.getByLabel(/^Schedule note/).fill(marker);

  // A validation error is shown in place and keeps what was typed.
  await form.getByLabel(/^Capacity/).fill("0");
  await page.getByTestId("offering-save").click();
  await expect(page.getByText(/Capacity must be a whole number/)).toBeVisible();
  await expect(form.getByLabel("First day")).toHaveValue(iso(startsOn));
  await form.getByLabel(/^Capacity/).fill("12");
  await page.getByTestId("offering-save").click();
  await expect(page.getByTestId("offering-created")).toBeVisible();

  // Listed for the administrator with its dates, counts and status.
  await page.goto("/admin/offerings");
  const row = page.getByTestId("offering-row").filter({ hasText: enGb(startsOn) });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(flagship!.title);
  await expect(row).toContainText(format.name);
  await expect(row).toContainText(`${enGb(startsOn)} – ${enGb(endsOn)}`);
  await expect(row).toContainText("Open");
  await expectNoAxeViolations(page);

  // Published on the public schedule with the same dates.
  await page.goto("/schedule");
  await expect(page.getByText(format.name).first()).toBeVisible();
  await expect(page.getByText(new RegExp(`${enGb(endsOn)}`))).toBeVisible();
  await expect(page.getByText("Capacity 12")).toBeVisible();

  // Edit → cancelled → gone from /schedule, still in the admin list.
  await page.goto("/admin/offerings");
  await row.getByRole("link", { name: /^Edit/ }).click();
  await expect(page).toHaveURL(/\/admin\/offerings\/[0-9a-f-]{36}$/);
  await expectNoAxeViolations(page);
  const edit = page.getByRole("form", { name: "Edit offering" });
  await expect(edit.getByLabel("Status")).toHaveValue("open");
  await expect(edit.getByLabel(/^Capacity/)).toHaveValue("12");
  await edit.getByLabel("Status").selectOption("cancelled");
  await page.getByTestId("offering-save").click();
  await expect(page.getByText("Your changes have been saved.")).toBeVisible();

  await page.goto("/schedule");
  await expect(page.getByText(new RegExp(`${enGb(endsOn)}`))).toHaveCount(0);
  await page.goto("/admin/offerings");
  await expect(row).toContainText("Cancelled");

  // Audit trail: created, then updated with the status change.
  const { getPrisma } = await import("../../src/db/prisma");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const prisma = getPrisma();
  const offering = await prisma.scheduledOffering.findFirst({ where: { scheduleNote: marker } });
  expect(offering).not.toBeNull();
  const audit = await listAuditForEntity(prisma, "offering", offering!.id);
  expect(audit.map((a) => a.action)).toEqual(["offering.created", "offering.updated"]);
  expect(audit[1]!.after).toEqual({ status: "cancelled" });
});

test("a participant without the role cannot reach the offerings screens", async ({ page }) => {
  const participant = uniqueEmail("e2e-offerings-participant");
  try {
    await registerViaUi(page, participant, "Pat Participant");
    await signInViaUi(page, participant);
    for (const path of ["/admin/offerings", "/admin/offerings/new"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(403);
    }
  } finally {
    await deleteTestUser(participant);
  }
});
