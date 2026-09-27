import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createCertificateUser, createEndedOfferingFixture, createPaidRegistrationFixture, deleteTestOffering, type OfferingFixture } from "../helpers/certificates-db";
import { completeProfileByEmail, deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Attendance through the screens (Milestone 13 WP4, founder decision 9):
 * the administrator opens Admin → Attendance, sees today's date, opens the
 * sheet with name / email / date of birth / country, marks Yes and No, saves,
 * reloads and sees the saved answers with "Updated", changes one and saves
 * again. A participant marked No is refused a certificate on the roster with
 * the reason (N6). Axe on both screens.
 */

test.describe.configure({ mode: "serial" });

const adminEmail = uniqueEmail("e2e-att-admin");
let running: OfferingFixture;
let ended: OfferingFixture;
let present: { id: string; email: string; name: string };
let absent: { id: string; email: string; name: string };
let absentRegistrationId = "";

test.beforeAll(async () => {
  running = await createEndedOfferingFixture({ endsOnDaysAgo: 0, status: "open" }); // ends today → "Today"
  ended = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
  present = await createCertificateUser({ prefix: "e2e-att-present" });
  absent = await createCertificateUser({ prefix: "e2e-att-absent" });
  await completeProfileByEmail(present.email, { legalName: "Pat Present", dateOfBirth: "1991-03-04", countryCode: "MY" });
  await completeProfileByEmail(absent.email, { legalName: "Abe Absent", dateOfBirth: "1987-12-25", countryCode: "PK", nationalityCode: "PK" });
  await createPaidRegistrationFixture(present.id, running.id);
  await createPaidRegistrationFixture(absent.id, running.id);
  absentRegistrationId = (await createPaidRegistrationFixture(absent.id, ended.id)).registrationId;
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  await deleteTestOffering(running.id);
  await deleteTestOffering(ended.id);
  await deleteTestUser(present.email);
  await deleteTestUser(absent.email);
  await deleteTestUser(adminEmail);
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

async function registerViaUi(page: Page, address: string, name = "Ada Attendance") {
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
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("the administrator marks attendance on today's sheet, reloads, and changes an answer", async ({ page }) => {
  await registerViaUi(page, adminEmail);
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signInViaUi(page, adminEmail);

  await page.goto("/admin/attendance");
  await expect(page.getByTestId("attendance-title")).toHaveText("Attendance");
  const row = page.locator(`[data-testid="attendance-row"][data-offering="${running.id}"]`);
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Today");
  await expect(row.getByTestId("attendance-recorded")).toHaveText("0 of 2");
  await expectNoAxeViolations(page);
  await row.getByTestId("attendance-open").click();
  await expect(page).toHaveURL(new RegExp(`/admin/attendance/${running.id}$`));

  // The sheet: the government-ID fields, blank answers.
  const rows = page.getByTestId("sheet-row");
  await expect(rows).toHaveCount(2);
  const presentRow = rows.filter({ hasText: present.email });
  const absentRow = rows.filter({ hasText: absent.email });
  await expect(presentRow.getByTestId("sheet-name")).toHaveText("Pat Present");
  await expect(presentRow.getByTestId("sheet-dob")).toHaveText("1991-03-04");
  await expect(presentRow.getByTestId("sheet-country")).toHaveText("Malaysia");
  await expect(absentRow.getByTestId("sheet-country")).toHaveText("Pakistan");
  await expect(presentRow.getByTestId("sheet-attended")).toHaveValue("");
  await expect(presentRow.getByTestId("sheet-updated")).toHaveText("—");
  await expectNoAxeViolations(page);

  await presentRow.getByTestId("sheet-attended").selectOption("yes");
  await absentRow.getByTestId("sheet-attended").selectOption("no");
  await absentRow.getByTestId("sheet-note").fill("Did not arrive");
  await page.getByTestId("sheet-save").click();
  await expect(page.getByTestId("sheet-saved")).toContainText("Attendance saved — 2 entries updated.");

  // Reload: the saved answers, the note and "Updated … by <admin>" are there.
  await page.reload();
  await expect(page.getByTestId("sheet-summary")).toContainText("2 recorded");
  await expect(rows.filter({ hasText: present.email }).getByTestId("sheet-attended")).toHaveValue("yes");
  await expect(rows.filter({ hasText: absent.email }).getByTestId("sheet-attended")).toHaveValue("no");
  await expect(rows.filter({ hasText: absent.email }).getByTestId("sheet-note")).toHaveValue("Did not arrive");
  await expect(rows.filter({ hasText: present.email }).getByTestId("sheet-updated")).toContainText("by Ada Attendance");

  // Change one answer; the other is untouched ("Nothing changed" is honest too).
  await rows.filter({ hasText: absent.email }).getByTestId("sheet-attended").selectOption("yes");
  await page.getByTestId("sheet-save").click();
  await expect(page.getByTestId("sheet-saved")).toContainText("1 entry updated");
  // Reopen the sheet (fresh values from the database) and save it untouched:
  // an honest "Nothing changed", no audit rows written.
  await page.reload();
  await page.getByTestId("sheet-save").click();
  await expect(page.getByTestId("sheet-saved")).toContainText("Nothing changed");

  await page.goto("/admin/attendance");
  await expect(page.locator(`[data-testid="attendance-row"][data-offering="${running.id}"]`).getByTestId("attendance-recorded")).toHaveText("2 of 2");
});

test("a participant recorded as not attended is refused a certificate on the roster, with the reason (N6)", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/attendance/${ended.id}`);
  const row = page.getByTestId("sheet-row").filter({ hasText: absent.email });
  await row.getByTestId("sheet-attended").selectOption("no");
  await page.getByTestId("sheet-save").click();
  await expect(page.getByTestId("sheet-saved")).toContainText("1 entry updated");

  await page.goto(`/admin/offerings/${ended.id}/participants`);
  const roster = page.getByTestId("roster-row").filter({ hasText: absent.email });
  await expect(roster).toHaveCount(1);
  await expect(roster.getByTestId("completion-blocked")).toContainText("Recorded as not attended");
  await expect(roster.getByTestId("record-completion-form")).toHaveCount(0);
  expect(absentRegistrationId).toBeTruthy();
});
