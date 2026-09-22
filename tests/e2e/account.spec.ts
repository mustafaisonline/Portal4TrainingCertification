import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { accountNavItems } from "../../src/shared/chrome/account-nav";
import { deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Signed-in account shell — end to end through the real screens against the
 * test database (account shell port, 2026-09-21). Every sidebar screen
 * resolves for a signed-in person; the header avatar menu lists the same
 * screens; the dashboard greets the person by OUR `users` name and shows the
 * flagship from the DATABASE (read through the repository, never typed
 * here); the profile form persists a real change; the main screens have no
 * WCAG 2.2 AA violations.
 */

test.describe.configure({ mode: "serial" });

const emails: string[] = [];
function newEmail(prefix: string) {
  const e = uniqueEmail(prefix);
  emails.push(e);
  return e;
}

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  for (const e of emails) await deleteTestUser(e);
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

async function registerViaUi(page: Page, email: string, name = "Ada Test") {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel(/^Country/).selectOption("MY");
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
  await expect(page).toHaveURL(/\/account$/);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("every sidebar screen is served to a signed-in person with an h1", async ({ page }) => {
  const email = newEmail("e2e-acct-nav");
  await registerViaUi(page, email);
  await signInViaUi(page, email);

  for (const item of accountNavItems) {
    const res = await page.goto(item.href);
    expect(res?.status(), item.href).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${item.href}$`)); // hrefs are plain /a/b paths
    await expect(page.getByRole("heading", { level: 1 }), item.href).toBeVisible();
    // The sidebar marks exactly this screen as current.
    await expect(page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: item.label, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});

test("the header avatar menu opens and lists the account screens and Sign out", async ({ page }) => {
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
  for (const item of accountNavItems) {
    await expect(menu.getByRole("link", { name: item.label, exact: true })).toHaveAttribute("href", item.href);
  }
  await expect(menu.getByRole("link", { name: "Sign out" })).toHaveAttribute("href", "/sign-out");
  // A participant sees no admin entry.
  await expect(menu.getByRole("link", { name: "Admin dashboard" })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("account-menu")).toHaveCount(0);
});

test("dashboard greets the person by name and shows the flagship from the database", async ({ page }) => {
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const flagship = await findFlagshipProgramme();
  expect(flagship, "seeded flagship").not.toBeNull();

  const email = newEmail("e2e-acct-dash");
  await registerViaUi(page, email, "Dana Dashboard");
  await signInViaUi(page, email);

  await expect(page.getByTestId("welcome")).toHaveText("Welcome, Dana Dashboard");
  await expect(page.getByTestId("flagship-title")).toHaveText(flagship!.title);
  await expect(page.getByRole("link", { name: "View the programme" })).toHaveAttribute("href", "/DataBlueprint-AIVibeCoding");
  await expect(page.getByRole("link", { name: "Register interest" })).toHaveAttribute(
    "href",
    `/contact-us?kind=programme_interest&programme=${flagship!.slug}`,
  );
  // Honest empty states — nothing is registered, ordered or issued yet.
  await expect(page.getByText("You are not registered for a programme yet.")).toBeVisible();
  await expect(page.getByText("No orders yet.")).toBeVisible();
  await expect(page.getByText("Issued when you complete the programme.")).toBeVisible();
  await expectNoAxeViolations(page);

  await page.goto("/account/programme");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(flagship!.title);
  const body = await page.locator("body").innerText();
  for (const f of flagship!.deliveryFormats) expect(body, `format ${f.code}`).toContain(f.name);
  await expectNoAxeViolations(page);
});

test("profile: name and country are saved, audited and persist after reload", async ({ page }) => {
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const { getPrisma } = await import("../../src/db/prisma");

  const email = newEmail("e2e-acct-profile");
  await registerViaUi(page, email, "Before Rename");
  await signInViaUi(page, email);

  // M5a: the profile page (tests/e2e/profile.spec.ts covers every section);
  // here only the name/country round trip the account shell depends on.
  await page.goto("/account/profile");
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
  // The sidebar, header menu and dashboard read the same row.
  await expect(page.getByRole("navigation", { name: "Account" })).toContainText("After Rename");
  await expect(page.getByTestId("header-account")).toHaveAttribute("aria-label", "Account menu for After Rename");
  await page.goto("/account");
  await expect(page.getByTestId("welcome")).toHaveText("Welcome, After Rename");

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
