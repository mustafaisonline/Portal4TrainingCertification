import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";
import { createOrganisationFixture, createSharedRole, deleteRoleFixtures, uniqueSlug } from "../helpers/assessment-roles-db";
import { footerExplore, footerLegal, primaryNav, verifyLink } from "../../src/shared/chrome/site-nav";

/*
 * CR-2026-10-01-2136 (founder, 2026-10-01): the avatar menu carries every header
 * and footer item; "Open" became "Edit" on the Users and Orders lists; Admin →
 * Interview roles has Edit and Delete (delete only while nobody has taken a test
 * on the role) and the administrator can add a question on an organisation's behalf.
 */
test.describe.configure({ mode: "serial" });

const adminEmail = uniqueEmail("e2e-cr2136-admin");
const personEmail = uniqueEmail("e2e-cr2136-person");
let deletableRoleId = "";
let attemptRoleId = "";
let orgRoleId = "";
let orgId = "";
const roleIds: string[] = [];

test.beforeEach(async () => {
  await resetRateLimits();
});
test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  await getPrisma().roleTestAttempt.deleteMany({ where: { roleId: { in: roleIds } } });
  await deleteRoleFixtures({ roleIds, organisationIds: orgId ? [orgId] : [] });
  await getPrisma().auditLog.deleteMany({ where: { action: "assessment_role.deleted", entityId: deletableRoleId } });
  await deleteTestUser(adminEmail);
  await deleteTestUser(personEmail);
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
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}
async function expectNoAxeViolations(page: Page, scope?: string) {
  const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  const results = await (scope ? builder.include(scope) : builder).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("setup: an administrator, a participant, and the role fixtures", async ({ page }) => {
  await register(page, adminEmail, "Cleo Cr Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await register(page, personEmail, "Pia Cr Person");
  const deletable = await createSharedRole({ slugPrefix: "t-cr-del", reviewed: 3 });
  const withAttempt = await createSharedRole({ slugPrefix: "t-cr-att", reviewed: 3 });
  const forOrg = await createSharedRole({ slugPrefix: "t-cr-org", reviewed: 2 });
  deletableRoleId = deletable.roleId;
  attemptRoleId = withAttempt.roleId;
  orgRoleId = forOrg.roleId;
  roleIds.push(deletableRoleId, attemptRoleId, orgRoleId);
  const org = await createOrganisationFixture({ slugPrefix: "t-cr-orgco", roleIds: [orgRoleId] });
  orgId = org.organisationId;
  // One test attempt on the second role, so it cannot be deleted.
  const { getPrisma } = await import("../../src/db/prisma");
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const person = (await findUserByEmail(personEmail))!;
  await getPrisma().roleTestAttempt.create({ data: { userId: person.id, roleId: attemptRoleId, size: 3, questionIds: withAttempt.reviewedIds, answers: {} } });
});

test("the avatar menu carries every header and footer item, grouped, and each link closes it", async ({ page }) => {
  await signIn(page, personEmail);
  await page.goto("/");
  await page.getByRole("button", { name: /Account menu for/ }).click();
  const menu = page.getByTestId("account-menu-links");
  await expect(menu).toBeVisible();
  const hrefs = await menu.getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  for (const l of [...primaryNav, ...footerExplore, ...footerLegal, verifyLink]) expect(hrefs, l.label).toContain(l.href);
  expect(hrefs).not.toContain("/credential-integrity-policy"); // unpublished, not linked (CR-2026-10-02-0627)
  for (const label of ["Home", "Knowledge Hub", "Assessment", "Professional Trainings", "Reviews", "About Us", "Schedule", "FAQ", "Contact Us", "Search completion certificates", "Terms of service", "Privacy policy", "Refund & cancellation policy"]) {
    await expect(menu.getByRole("link", { name: label, exact: true }), label).toBeVisible();
  }
  // The dashboards stay at the top of the menu.
  await expect(page.getByTestId("account-menu").getByRole("link", { name: "User Dashboard" })).toBeVisible();
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expectNoAxeViolations(page, '[data-testid="account-menu"]');
  }
  await menu.getByRole("link", { name: "FAQ", exact: true }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.getByTestId("account-menu")).toHaveCount(0);
});

test("the signed-in header shows the first name (CR-2012) and the avatar on a phone, with the menu on screen (CR-2013)", async ({ page }) => {
  await signIn(page, personEmail);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  // CR-2012: the first name replaces the word "Account"; the full name stays in the accessible name.
  await expect(page.getByTestId("header-account-name")).toHaveText("Pia");
  await expect(page.getByTestId("header-account")).toHaveAttribute("aria-label", "Account menu for Pia Cr Person");
  await expect(page.getByTestId("header-account")).not.toContainText("Account");
  // CR-2013: the avatar is in the header on phones, and the opened menu stays inside the screen.
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/");
    const avatar = page.getByTestId("header-avatar");
    await expect(avatar, `${width}px`).toBeVisible();
    await page.getByTestId("header-account").click();
    const menu = page.getByTestId("account-menu");
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box!.x, `${width}px left edge`).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, `${width}px right edge`).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.keyboard.press("Escape");
  }
});

test("Users and Orders lists say Edit, not Open", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.goto("/admin/users");
  const rows = page.locator("table tbody tr");
  await expect(rows.first()).toBeVisible();
  const edit = page.getByRole("link", { name: "Edit Pia Cr Person" });
  await expect(edit).toHaveText("Edit");
  await expect(edit).toHaveAttribute("href", /\/admin\/users\/[0-9a-f-]{36}$/);
  await expect(page.locator("table").getByRole("link", { name: /^Open / })).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(/Open a person/);
  await page.goto("/admin/orders");
  await expect(page.locator("table").getByRole("link", { name: /^Open / })).toHaveCount(0);
  const open = page.getByTestId("order-open");
  if ((await open.count()) > 0) await expect(open.first()).toHaveText("Edit");
});

test("Interview roles: Edit opens the role; Delete asks first and removes a role nobody has tested; a role with attempts cannot be deleted", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.goto("/admin/interview");
  const rowOf = (id: string) => page.locator(`[data-testid="interview-role-row"][data-role-id="${id}"]`);
  // Edit → the role's page (details + question bank).
  await expect(rowOf(deletableRoleId).getByTestId("interview-role-edit")).toHaveText("Edit");
  await expect(rowOf(deletableRoleId).getByTestId("interview-role-edit")).toHaveAttribute("href", `/admin/interview/${deletableRoleId}`);
  // A role with a test attempt: no Delete, an honest note.
  await expect(rowOf(attemptRoleId).getByTestId("role-delete")).toHaveCount(0);
  await expect(rowOf(attemptRoleId).getByTestId("role-delete-blocked")).toContainText("1 attempt");
  // The deletable role: Delete → the portal's own confirmation (not the browser's) → gone.
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expectNoAxeViolations(page);
  }
  await rowOf(deletableRoleId).getByTestId("role-delete").click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toContainText("3 questions");
  await dialog.getByTestId("confirm-dialog-cancel").click();
  await expect(rowOf(deletableRoleId)).toHaveCount(1); // "Keep it" keeps it
  await rowOf(deletableRoleId).getByTestId("role-delete").click();
  await page.locator("dialog[open]").getByTestId("confirm-dialog-confirm").click();
  await expect(rowOf(deletableRoleId)).toHaveCount(0);
  const { getPrisma } = await import("../../src/db/prisma");
  expect(await getPrisma().assessmentRole.count({ where: { id: deletableRoleId } })).toBe(0);
  expect(await getPrisma().roleQuestion.count({ where: { roleId: deletableRoleId } })).toBe(0);
  expect(await getPrisma().auditLog.count({ where: { action: "assessment_role.deleted", entityId: deletableRoleId } })).toBe(1);
  // The role with the attempt is untouched.
  expect(await getPrisma().assessmentRole.count({ where: { id: attemptRoleId } })).toBe(1);
});

test("the administrator adds a question on an organisation's behalf; it is that organisation's own question, not the shared bank's", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.goto(`/admin/interview/${orgRoleId}`);
  const sharedBefore = await page.getByTestId("bank-question").count();
  const form = page.getByTestId("qf-create");
  await expect(form.getByTestId("qf-organisation")).toBeVisible();
  const stem = `CR2136 org question ${uniqueSlug("q")}`;
  await form.getByTestId("qf-organisation").selectOption(orgId);
  await expect(form.getByTestId("qf-status")).toContainText("Pending approval");
  await form.getByTestId("qf-category").fill("Pipelines");
  await form.getByTestId("qf-stem").fill(stem);
  for (let i = 0; i < 5; i += 1) await form.getByTestId(`qf-option-${i}`).fill(`CR2136 option ${i}`);
  await form.getByTestId("qf-correct-2").check();
  await form.getByTestId("qf-model-answer").fill("A model answer written on the organisation's behalf: I would explain the principle first, then the trade-off, then a concrete example from a real pipeline.");
  await form.getByTestId("qf-status").selectOption("reviewed");
  await form.getByTestId("qf-submit").click();
  await expect(form.getByTestId("qf-message")).toContainText("organisation's questions and approved");
  const { getPrisma } = await import("../../src/db/prisma");
  const q = await getPrisma().roleQuestion.findFirst({ where: { stem }, select: { organisationId: true, roleId: true, status: true } });
  expect(q).toEqual({ organisationId: orgId, roleId: orgRoleId, status: "reviewed" });
  // Not in the shared bank listing.
  await page.goto(`/admin/interview/${orgRoleId}`);
  expect(await page.getByTestId("bank-question").count()).toBe(sharedBefore);
  await expect(page.locator("main")).not.toContainText(stem);
});
