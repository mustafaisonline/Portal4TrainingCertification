import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  deleteTestUser,
  firstLink,
  grantRoleByEmail,
  resetRateLimits,
  STRONG_PASSWORD,
  uniqueEmail,
  waitForEmail,
} from "../helpers/identity-db";

/*
 * Identity & access — end to end through the real screens against the test
 * database (MILESTONE_2_EXECUTION_PLAN.md §8). Verification and reset links
 * are read from `outbound_emails`, never from logs.
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
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/^Country/).fill("Malaysia");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  // Founder direction 2026-09-21: registration leads straight to sign-in
  // (no email provider exists to deliver a verification link).
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
  await expect(page.getByText("Your account has been created.")).toBeVisible();
}

/** Sign in right after registering — no verification step required. */
async function verifyViaEmail(page: Page, email: string) {
  await signInViaUi(page, email);
  await expect(page).toHaveURL(/\/account$/);
}

async function signInViaUi(page: Page, email: string, password = STRONG_PASSWORD) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("register → verify → signed-in account page shows OUR identity and role", async ({ page }) => {
  const email = newEmail("e2e-reg");
  await registerViaUi(page, email);
  await expectNoAxeViolations(page);
  await verifyViaEmail(page, email);

  await expect(page.getByTestId("welcome")).toHaveText("Welcome, Ada Test");
  await expect(page.getByTestId("account-email")).toHaveText(email);
  await expect(page.getByTestId("account-verified")).toContainText("Not verified");
  // The verification link is still recorded in the outbox and still works,
  // so the address can be confirmed once an email provider delivers it.
  const mail = await waitForEmail(email, "identity.verify-email");
  await page.goto(firstLink(mail.textBody));
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByTestId("account-verified")).toHaveText("Verified");
  await expect(page.getByTestId("account-roles")).toContainText("participant");
  await expect(page.getByTestId("header-account")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("sign-out revokes the session; /account then redirects to sign-in with a return path", async ({ page }) => {
  const email = newEmail("e2e-out");
  await registerViaUi(page, email);
  await verifyViaEmail(page, email);

  await page.goto("/sign-out");
  await expect(page.getByRole("heading", { name: "You have been signed out" })).toBeVisible();
  await expect(page.getByTestId("header-sign-in")).toBeVisible();

  await page.goto("/account");
  await expect(page).toHaveURL(/\/sign-in\?return-to=%2Faccount$/);
});

test("sign-in: neutral error on a wrong password; an off-site return-to is ignored", async ({ page }) => {
  const email = newEmail("e2e-in");
  await registerViaUi(page, email);
  await verifyViaEmail(page, email);
  await page.goto("/sign-out");
  await expect(page.getByTestId("header-sign-in")).toBeVisible();

  await signInViaUi(page, email, "not-the-password-at-all");
  // (Next's route announcer is also role="alert", so match on the text.)
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();

  await page.goto("/sign-in?return-to=https%3A%2F%2Fevil.example%2F");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test("password reset from the emailed link", async ({ page }) => {
  const email = newEmail("e2e-reset");
  await registerViaUi(page, email);
  await verifyViaEmail(page, email);
  await page.goto("/sign-out");
  await expect(page.getByTestId("header-sign-in")).toBeVisible();

  await page.goto("/forgot-password");
  await expectNoAxeViolations(page);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account exists");

  const mail = await waitForEmail(email, "identity.reset-password");
  await page.goto(firstLink(mail.textBody));
  await expect(page).toHaveURL(/\/reset-password\?token=/);
  const fresh = "a-brand-new-passphrase-2026";
  await page.getByLabel("New password", { exact: true }).fill(fresh);
  await page.getByLabel("Confirm new password").fill(fresh);
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page).toHaveURL(/\/sign-in\?reset=1$/);

  await signInViaUi(page, email, fresh);
  await expect(page).toHaveURL(/\/account$/);
});

test("admin gate: participant → 403; platform_admin → served (roles from user_roles)", async ({ page }) => {
  const email = newEmail("e2e-admin");
  await registerViaUi(page, email, "Grace Admin");
  await verifyViaEmail(page, email);

  const forbidden = await page.goto("/admin");
  expect(forbidden?.status()).toBe(403);
  await expect(page.getByTestId("forbidden-title")).toBeVisible();

  // MFA was removed for MVP 1 (founder, 2026-09-21): the role alone opens /admin.
  await grantRoleByEmail(email, "platform_admin");
  await page.goto("/admin");
  await expect(page.getByTestId("admin-title")).toHaveText("Operations");
  await expectNoAxeViolations(page);
});

test("a second registration with the same email is a clear error, and the password can be changed from Security", async ({ page }) => {
  const email = newEmail("e2e-dup");
  await registerViaUi(page, email);

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Someone Else");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("another-pass-1");
  await page.getByLabel("Confirm password").fill("another-pass-1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("An account with this email already exists")).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);

  await signInViaUi(page, email); // the original password still applies
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/account/security");
  await expectNoAxeViolations(page);
  await page.getByLabel("Current password").fill(STRONG_PASSWORD);
  await page.getByLabel("New password", { exact: true }).fill("my-new-password-8");
  await page.getByLabel("Confirm new password").fill("my-new-password-8");
  await page.getByTestId("change-password-submit").click();
  await expect(page.getByText("Your password has been changed")).toBeVisible();

  await page.goto("/sign-out");
  await expect(page.getByTestId("header-sign-in")).toBeVisible();
  await signInViaUi(page, email, "my-new-password-8");
  await expect(page).toHaveURL(/\/account$/);
});

test("register and sign-in screens have no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/sign-in");
  await expectNoAxeViolations(page);
  await page.goto("/register");
  await expectNoAxeViolations(page);
});
