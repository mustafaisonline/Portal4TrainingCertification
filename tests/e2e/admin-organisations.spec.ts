import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addQuestions, createSharedRole, deleteRoleFixtures } from "../helpers/assessment-roles-db";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Admin → Organisations and Organisation access, end to end through the real
 * screens against the test database (CR-2026-10-01-1711): a participant is
 * refused (403); an administrator registers an organisation, edits it and
 * publishes it; offers a shared role and removes it; sees and approves the
 * organisation's pending question; grants the Organisation role to a person from
 * Admin → Users (the role reads "Organisation"), revokes it there and from the
 * organisation's own page; every change is in the audit log; the screens are
 * axe-clean in the light and the dark theme.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const adminEmail = uniqueEmail("e2e-og-admin");
const memberEmail = uniqueEmail("e2e-og-member");
const ORG_NAME = `E2E Org ${run}`;
const ORG_SLUG = `e2e-org-${run}`;
const RENAMED = `E2E Org Renamed ${run}`;

let organisationId = "";
let memberId = "";
let sharedRoleId = "";
let sharedRoleName = "";
const pendingIds: string[] = [];

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await deleteRoleFixtures({ roleIds: sharedRoleId ? [sharedRoleId] : [], organisationIds: organisationId ? [organisationId] : [] });
  await deleteTestUser(memberEmail);
  await deleteTestUser(adminEmail);
  await disconnectPrisma();
});

async function registerViaUi(page: Page, address: string, name: string) {
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
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

/** The portal's own confirmation box — only the open <dialog> counts. */
const confirmYes = (page: Page) => page.locator("dialog[open]").getByTestId("confirm-dialog-confirm");

/** The organisation's row in the list, whatever it is called by then. */
const orgRow = (page: Page) => page.locator(`[data-testid="organisation-row"][data-organisation-id="${organisationId}"]`);
const orgRowByName = (page: Page) => page.getByTestId("organisation-row").filter({ has: page.locator(`[data-testid="organisation-link"]`, { hasText: ORG_NAME }) });

test("setup: an administrator, a future Organisation user (a participant for now); a published shared role", async ({ page }) => {
  await registerViaUi(page, adminEmail, "Olga Org Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await registerViaUi(page, memberEmail, "Mina Member");
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  memberId = (await findUserByEmail(memberEmail))!.id;
  const role = await createSharedRole({ slugPrefix: "e2e-og-role", reviewed: 12, name: `E2E Offered Role ${run}` });
  sharedRoleId = role.roleId;
  sharedRoleName = `E2E Offered Role ${run}`;
});

test("a participant is refused at the organisation screens", async ({ page }) => {
  await signInViaUi(page, memberEmail);
  for (const url of ["/admin/organisations", "/admin/organisations/00000000-0000-4000-8000-000000000000"]) {
    await page.goto(url);
    await expect(page.getByTestId("forbidden-title"), url).toBeVisible();
  }
});

test("an administrator registers an organisation (unpublished) and the same URL name is refused", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto("/admin/organisations");
  await expect(page.getByTestId("organisations-admin-title")).toHaveText("Organisations");

  await page.getByTestId("org-name").fill(ORG_NAME);
  await page.getByTestId("org-type").selectOption("education");
  await page.getByTestId("org-email").fill(`hr-${run}@example.test`);
  await page.getByTestId("org-logo").fill("/brand/ypt-logo.jpg");
  await page.getByTestId("org-create-submit").click();
  await expect(page.getByTestId("org-create-status")).toContainText("created");

  const row = orgRowByName(page);
  await expect(row).toHaveCount(1);
  await expect(row).toHaveAttribute("data-slug", ORG_SLUG);
  await expect(row.getByTestId("organisation-type")).toHaveText("Education sector");
  await expect(row.getByTestId("organisation-status")).toContainText("Unpublished");
  await expect(row.getByTestId("organisation-roles")).toHaveText("0");
  await expect(row.getByTestId("organisation-members")).toHaveText("0");
  await expect(row.getByTestId("organisation-pending")).toHaveText("0");
  organisationId = (await row.getAttribute("data-organisation-id"))!;

  await page.getByTestId("org-name").fill(ORG_NAME);
  await page.getByTestId("org-email").fill(`hr-${run}@example.test`);
  await page.getByTestId("org-create-submit").click();
  await expect(page.getByTestId("org-create-status")).toContainText("already used");
});

test("details are edited and the organisation is published and unpublished", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/organisations/${organisationId}`);
  await expect(page.getByTestId("organisation-title")).toHaveText(ORG_NAME);
  await expect(page.getByTestId("organisation-detail-status")).toContainText("Unpublished");

  await page.getByTestId("org-edit-name").fill(RENAMED);
  await page.getByTestId("org-type").selectOption("company");
  await page.getByTestId("org-edit-submit").click();
  await expect(page.getByTestId("org-edit-status")).toContainText("saved");
  await expect(page.getByTestId("organisation-title")).toHaveText(RENAMED);

  await page.getByTestId("org-publish-toggle").click();
  await expect(page.getByTestId("organisation-detail-status")).toContainText("Published");
  await page.getByTestId("org-publish-toggle").click();
  await expect(page.getByTestId("organisation-detail-status")).toContainText("Unpublished");
  await page.getByTestId("org-publish-toggle").click();
  await expect(page.getByTestId("organisation-detail-status")).toContainText("Published");

  await page.goto("/admin/organisations");
  const row = orgRow(page);
  await expect(row.getByTestId("organisation-link")).toHaveText(RENAMED);
  await expect(row.getByTestId("organisation-type")).toHaveText("Company");
  await expect(row.getByTestId("organisation-status")).toContainText("Published");
});

test("a shared role is offered and removed", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/organisations/${organisationId}`);
  await expect(page.getByTestId("organisation-roles-empty")).toBeVisible();

  await page.getByTestId("org-add-role-select").selectOption(sharedRoleId);
  await page.getByTestId("org-add-role-submit").click();
  await expect(page.getByTestId("organisation-role")).toHaveCount(1);
  await expect(page.getByTestId("organisation-role")).toHaveAttribute("data-role-id", sharedRoleId);
  await expect(page.getByTestId("organisation-role")).toContainText(sharedRoleName);
  await expect(page.getByTestId("organisation-role")).toContainText("Shared role · listed");

  await page.getByTestId("org-remove-role").click();
  await confirmYes(page).click();
  await expect(page.getByTestId("organisation-roles-empty")).toBeVisible();

  // Offer it again — it is the role the rest of the journey uses.
  await page.getByTestId("org-add-role-select").selectOption(sharedRoleId);
  await page.getByTestId("org-add-role-submit").click();
  await expect(page.getByTestId("organisation-role")).toHaveCount(1);
  await page.goto("/admin/organisations");
  await expect(orgRow(page).getByTestId("organisation-roles")).toHaveText("1");
});

test("the organisation's pending questions are listed on its page and approved there", async ({ page }) => {
  pendingIds.push(...(await addQuestions({ roleId: sharedRoleId, organisationId, count: 2, status: "pending", tag: `og${run}` })));
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/organisations/${organisationId}`);
  await expect(page.getByTestId("organisation-pending-count")).toHaveText("(2)");
  await expect(page.getByTestId("approval-question")).toHaveCount(2);

  await page.getByTestId("approval-question").first().getByTestId("question-approve").click();
  await expect(page.getByTestId("approval-question")).toHaveCount(1);
  await expect(page.getByTestId("organisation-pending-count")).toHaveText("(1)");

  await page.goto("/admin/organisations");
  await expect(orgRow(page).getByTestId("organisation-pending")).toHaveText("1");
  await page.goto(`/admin/interview/approvals?organisation=${organisationId}`);
  await expect(page.getByTestId("approval-question")).toHaveCount(1);
});

test("Admin → Users: Organisation access is granted and revoked, and the role reads Organisation", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/users/${memberId}`);
  await expect(page.getByTestId("admin-user-organisation-actions")).toBeVisible();
  await expect(page.getByTestId("revoke-org-form")).toHaveCount(0);
  await expect(page.getByTestId("admin-user-roles")).not.toContainText("Organisation");

  // Grant: choose the organisation, then the form is replaced by the revoke form for it.
  await page.getByTestId("grant-org-select").selectOption(organisationId);
  await page.getByTestId("grant-org-submit").click();
  const revokeForm = page.locator(`[data-testid="revoke-org-form"][data-organisation-id="${organisationId}"]`);
  await expect(revokeForm).toBeVisible();
  await expect(page.getByTestId("admin-user-roles")).toContainText("Organisation");
  await expect(page.getByTestId("admin-user-roles")).not.toContainText("Organisation administrator");
  await expect(page.getByTestId("admin-user-role-row").filter({ hasText: organisationId })).toHaveAttribute("data-active", "true");

  // The list filters by the role and labels it.
  await page.goto(`/admin/users?q=${encodeURIComponent(memberEmail)}&role=org_admin`);
  await expect(page.getByTestId("user-row")).toHaveCount(1);
  await expect(page.getByTestId("user-row-roles")).toContainText("Organisation");

  // The organisation's page and list count the member.
  await page.goto(`/admin/organisations/${organisationId}`);
  await expect(page.getByTestId("organisation-member")).toHaveCount(1);
  await expect(page.getByTestId("organisation-member")).toHaveAttribute("data-user-id", memberId);
  await page.goto("/admin/organisations");
  await expect(orgRow(page).getByTestId("organisation-members")).toHaveText("1");

  // Revoke needs the confirmation ticked.
  await page.goto(`/admin/users/${memberId}`);
  const form = page.locator(`[data-testid="revoke-org-form"][data-organisation-id="${organisationId}"]`);
  await expect(form.getByTestId("revoke-org-submit")).toBeDisabled();
  await form.getByTestId("revoke-org-confirm").check();
  await form.getByTestId("revoke-org-submit").click();
  await expect(page.getByTestId("revoke-org-form")).toHaveCount(0);
  await expect(page.getByTestId("admin-user-roles")).not.toContainText("Organisation");
  await expect(page.getByTestId("admin-user-role-row").filter({ hasText: organisationId })).toHaveAttribute("data-active", "false");
  await expect(page.getByTestId("admin-user-role-history")).toContainText("org_admin");

  // Grant again, then revoke from the organisation's own page.
  await page.getByTestId("grant-org-select").selectOption(organisationId);
  await page.getByTestId("grant-org-submit").click();
  await expect(page.getByTestId("revoke-org-form")).toHaveCount(1);
  await page.goto(`/admin/organisations/${organisationId}`);
  await expect(page.getByTestId("organisation-member")).toHaveCount(1);
  await page.getByTestId("org-revoke-member").click();
  await confirmYes(page).click();
  await expect(page.getByTestId("organisation-members-empty")).toBeVisible();
});

test("every change is in the audit log", async () => {
  const { getPrisma } = await import("../../src/db/prisma");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const prisma = getPrisma();
  const org = (await listAuditForEntity(prisma, "organisation", organisationId)).map((a) => a.action);
  expect(org).toEqual(
    expect.arrayContaining(["organisation.created", "organisation.updated", "organisation.published_changed", "organisation_role.added", "organisation_role.removed", "organisation_access.granted", "organisation_access.revoked"]),
  );
  expect(org.filter((a) => a === "organisation.published_changed")).toHaveLength(3);
  expect(org.filter((a) => a === "organisation_role.added")).toHaveLength(2);
  expect(org.filter((a) => a === "organisation_access.granted")).toHaveLength(2);
  expect(org.filter((a) => a === "organisation_access.revoked")).toHaveLength(2);

  // The person's own role history: granted and revoked, scoped to the organisation.
  const person = (await listAuditForEntity(prisma, "user", memberId)).filter((a) => (a.action === "role.granted" || a.action === "role.revoked") && (a.reason ?? "").startsWith("Organisation access"));
  expect(person.map((a) => a.action)).toEqual(["role.granted", "role.revoked", "role.granted", "role.revoked"]);
  expect(person[0]!.reason).toContain(RENAMED);

  // The approved question carries its status change.
  const approved = await prisma.roleQuestion.findMany({ where: { id: { in: pendingIds }, status: "reviewed" }, select: { id: true } });
  expect(approved).toHaveLength(1);
  expect((await listAuditForEntity(prisma, "role_question", approved[0]!.id)).map((a) => a.action)).toContain("role_question.status_changed");
});

test("the organisation screens and the user page have no WCAG 2.2 AA violations in the light and the dark theme", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const url of ["/admin/organisations", `/admin/organisations/${organisationId}`, `/admin/users/${memberId}`]) {
      await page.goto(url);
      await expect(page.getByTestId("admin-nav")).toBeVisible();
      await expectNoAxeViolations(page);
    }
  }
});
