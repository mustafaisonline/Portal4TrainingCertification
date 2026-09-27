import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { accountNavItems } from "../../src/shared/chrome/account-nav";
import { createAdminUser, createCertificateUser, createEndedOfferingFixture, createPaidRegistrationFixture, deleteTestOffering } from "../helpers/certificates-db";
import { completeProfileByEmail, deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Signed-in account shell — end to end through the real screens against the
 * test database. Milestone 13 (founder decisions 2026-09-27): the account
 * opens on Profile (first tab, Security folded in); every sidebar screen
 * resolves; the header menu lists the same screens in the same order with
 * no Dashboard item; the retired routes redirect; My Trainings splits paid
 * registrations into "Yet to attend" (Cancel, no Transfer) and "Attended"
 * (the date has passed), whose detail page shows the certificate ID once
 * issued; the profile form persists a real change; no WCAG 2.2 AA
 * violations on the main screens.
 */

test.describe.configure({ mode: "serial" });

const emails: string[] = [];
function newEmail(prefix: string) {
  const e = uniqueEmail(prefix);
  emails.push(e);
  return e;
}
const offerings: string[] = [];

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  for (const id of offerings) await deleteTestOffering(id);
  for (const e of emails) await deleteTestUser(e);
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

async function registerViaUi(page: Page, email: string, name = "Ada Test") {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
  await expect(page.getByText("Your account has been created.")).toBeVisible();
}

async function signInViaUi(page: Page, email: string, password = STRONG_PASSWORD) {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // /account (the landing) opens Profile, the first tab (N2 a).
  await expect(page).toHaveURL(/\/account\/profile$/);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("every sidebar screen is served with an h1; the retired routes redirect; Security lives on Profile", async ({ page }) => {
  const email = newEmail("e2e-acct-nav");
  await registerViaUi(page, email);
  await signInViaUi(page, email);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your profile");
  await expect(page.getByTestId("profile-security")).toContainText("Change password");

  for (const item of accountNavItems) {
    const res = await page.goto(item.href);
    expect(res?.status(), item.href).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${item.href}$`)); // hrefs are plain /a/b paths
    await expect(page.getByRole("heading", { level: 1 }), item.href).toBeVisible();
    // Every item — including the public /reviews, framed for signed-in
    // visitors since M13 — marks itself current in the sidebar.
    await expect(page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: item.label, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }

  // Retired routes (bookmarks, emails already sent) keep resolving.
  await page.goto("/account/programmes");
  await expect(page).toHaveURL(/\/account\/trainings$/);
  await page.goto("/account/certificate");
  await expect(page).toHaveURL(/\/account\/certifications$/);
  await page.goto("/account/security");
  await expect(page).toHaveURL(/\/account\/profile$/);
  await page.goto("/account/programme");
  await expect(page).toHaveURL(/\/programs$/);
});

test("the header menu opens and lists the account screens in the sidebar's order, no Dashboard item, then Sign out", async ({ page }) => {
  const email = newEmail("e2e-acct-menu");
  await registerViaUi(page, email, "Grace Hopper");
  await signInViaUi(page, email);

  const trigger = page.getByTestId("header-account");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toContainText("GH");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const menu = page.getByTestId("account-menu");
  await expect(menu).toContainText("Grace Hopper");
  await expect(menu).toContainText(email);
  const labels = await menu.getByRole("link").allTextContents();
  expect(labels.map((l) => l.trim())).toEqual([...accountNavItems.map((i) => i.label), "Sign out"]);
  expect(labels).not.toContain("Dashboard");
  for (const item of accountNavItems) {
    await expect(menu.getByRole("link", { name: item.label, exact: true })).toHaveAttribute("href", item.href);
  }
  await expect(menu.getByRole("link", { name: "Sign out" })).toHaveAttribute("href", "/sign-out");
  // A participant sees no admin entry.
  await expect(menu.getByRole("link", { name: "Admin dashboard" })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("account-menu")).toHaveCount(0);
});

test("My Trainings: honest empty state; Yet to attend with Cancel and no Transfer; Attended once the date has passed, with the detail page and the certificate ID", async ({ page }) => {
  const upcoming = await createEndedOfferingFixture({ endsOnDaysAgo: -20, status: "open", durationDays: 1 }); // starts in 19 days → the 100 % tier
  const past = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
  offerings.push(upcoming.id, past.id);

  const email = newEmail("e2e-acct-trainings");
  await registerViaUi(page, email, "Tara Trainings");
  await signInViaUi(page, email);
  await page.goto("/account/trainings");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your trainings");
  await expect(page.getByTestId("trainings-empty")).toContainText("You have not registered for a training yet");
  await expect(page.getByRole("link", { name: "See dates and register" })).toHaveAttribute("href", "/schedule");
  await expectNoAxeViolations(page);

  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const user = (await findUserByEmail(email))!;
  await completeProfileByEmail(email, { legalName: "Tara Trainings" });
  await createPaidRegistrationFixture(user.id, upcoming.id);
  const regPast = await createPaidRegistrationFixture(user.id, past.id);

  await page.reload();
  const yet = page.locator('[data-testid="training-card"][data-section="upcoming"]');
  const attended = page.locator('[data-testid="training-card"][data-section="attended"]');
  await expect(yet).toHaveCount(1);
  await expect(attended).toHaveCount(1);
  await expect(yet.getByTestId("refund-now")).toContainText("100 % refund");
  await expect(yet.getByRole("button", { name: /Cancel/ })).toBeVisible();
  await expect(yet.getByRole("button", { name: /Transfer/ })).toHaveCount(0); // N1
  await expect(attended.getByTestId("training-attendance")).toHaveText("Attendance not recorded");
  await expect(attended.getByTestId("training-certificate-status")).toContainText("not yet issued");

  // The detail page for the attended training: facts, no certificate yet (N4).
  await attended.getByTestId("training-detail-link").click();
  await expect(page).toHaveURL(new RegExp(`/account/trainings/${regPast.registrationId}$`));
  await expect(page.getByTestId("training-title")).toBeVisible();
  await expect(page.getByTestId("training-attendance")).toHaveText("Attendance not recorded");
  await expect(page.getByTestId("training-no-certificate")).toContainText("Not yet issued");
  await expectNoAxeViolations(page);

  // Once issued (the real completion service), the unique ID is shown,
  // copyable, and links to the public page; without a review the DOCUMENT
  // is gated, the ID is not (N4).
  const { recordCompletion } = await import("../../src/modules/certificates/issuance.service");
  const admin = await createAdminUser("e2e-acct-admin");
  emails.push(admin.email);
  const issued = await recordCompletion({ registrationId: regPast.registrationId, completedOn: past.endsOn, adminUserId: admin.id });
  await page.reload();
  await expect(page.getByTestId("training-certificate")).toBeVisible();
  await expect(page.getByTestId("certificate-id-link")).toHaveText(issued.certificate.certificateId);
  await expect(page.getByTestId("certificate-id-link")).toHaveAttribute("href", `/verify/${issued.certificate.certificateId}`);
  await expect(page.getByTestId("copy-certificate-id")).toBeVisible();
  await expect(page.getByTestId("certificate-gate")).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByTestId("certificate-id-link").click();
  await expect(page).toHaveURL(new RegExp(`/verify/${issued.certificate.certificateId}$`));
  await expect(page.getByTestId("verify-holder")).toContainText("Tara Trainings");
  await expect(page.getByTestId("verify-certificate-id")).toHaveText(issued.certificate.certificateId);

  // Another person's registration is a 404.
  const other = await createCertificateUser({ prefix: "e2e-acct-other" });
  emails.push(other.email);
  const otherReg = await createPaidRegistrationFixture(other.id, past.id);
  const res = await page.goto(`/account/trainings/${otherReg.registrationId}`);
  expect(res?.status()).toBe(404);
});

test("profile: name and country are saved, audited and persist after reload; the account opens on Profile", async ({ page }) => {
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const { getPrisma } = await import("../../src/db/prisma");

  const email = newEmail("e2e-acct-profile");
  await registerViaUi(page, email, "Before Rename");
  await signInViaUi(page, email);

  // M5a: the profile page (tests/e2e/profile.spec.ts covers every section);
  // here only the name/country round trip the account shell depends on.
  await expectNoAxeViolations(page);
  const fullName = page.getByLabel("Full name (as on your ID)");
  await expect(fullName).toHaveValue("Before Rename");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);
  await expect(page.getByLabel("Country", { exact: true })).toHaveValue("MY");

  // A validation error keeps what was typed and writes nothing.
  await fullName.fill("A");
  await page.getByTestId("profile-save").click();
  await expect(page.getByText("Please enter your full name as it appears on your ID.")).toBeVisible();
  await expect(fullName).toHaveValue("A");

  await fullName.fill("After Rename");
  await page.getByLabel("Country", { exact: true }).selectOption("SG");
  await page.getByTestId("profile-save").click();
  await expect(page.getByText(/Your changes have been saved\./)).toBeVisible();

  await page.reload();
  await expect(fullName).toHaveValue("After Rename");
  await expect(page.getByLabel("Country", { exact: true })).toHaveValue("SG");
  // The sidebar and the header menu read the same row.
  await expect(page.getByRole("navigation", { name: "Account" })).toContainText("After Rename");
  await expect(page.getByTestId("header-account")).toHaveAttribute("aria-label", "Account menu for After Rename");
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/profile$/);

  // Persisted in OUR rows (the country NAME on users, the code on the
  // profile), audited by field name, and mirrored to the provider's record.
  const user = await findUserByEmail(email);
  expect(user?.name).toBe("After Rename");
  expect(user?.country).toBe("Singapore");
  const profile = await getPrisma().userProfile.findUnique({ where: { userId: user!.id }, select: { legalName: true, countryCode: true } });
  expect(profile).toEqual({ legalName: "After Rename", countryCode: "SG" });
  const audit = (await listAuditForEntity(getPrisma(), "user", user!.id)).filter((a) => a.action === "profile.updated");
  expect(audit).toHaveLength(1);
  expect((audit[0]!.after as { changed: string[] }).changed).toEqual(expect.arrayContaining(["legalName", "countryCode"]));
  const authUser = await getPrisma().authUser.findUnique({ where: { email }, select: { name: true } });
  expect(authUser?.name).toBe("After Rename");
});
