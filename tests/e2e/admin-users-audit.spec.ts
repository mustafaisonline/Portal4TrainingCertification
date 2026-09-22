import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { completeProfileByEmail, deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Users, roles, audit log and the data export — end to end through the real
 * screens against the test database (MILESTONE_8_EXECUTION_PLAN.md §2 items
 * 4, 5, 7; §4 criteria 1, 2, 6, 7, 8). An administrator finds a participant
 * on /admin/users, sees the ID number only as its last four, grants and then
 * revokes platform administrator; /admin/audit lists the grant with its
 * detail JSON; the participant is refused at both screens; the participant
 * downloads their own data (own email inside, ID masked, attachment
 * headers) and a guest gets 401; every new screen is axe-clean.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const adminEmail = uniqueEmail("e2e-m8-admin");
const participantEmail = uniqueEmail("e2e-m8-person");
const PARTICIPANT_NAME = `Pia Person ${run}`;
const NRIC = "910203045678";
const MASKED = "••••5678";

let participantId = "";

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await deleteTestUser(participantEmail);
  await deleteTestUser(adminEmail);
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

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("setup: an administrator and a participant with a completed profile", async ({ page }) => {
  await registerViaUi(page, adminEmail, "Ada Administrator");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await registerViaUi(page, participantEmail, PARTICIPANT_NAME);
  const view = await completeProfileByEmail(participantEmail, { legalName: PARTICIPANT_NAME, idType: "nric", idNumber: NRIC });
  participantId = view.userId;
  expect(view.idNumberMasked).toBe(MASKED);
});

test("an administrator finds the participant, sees the masked ID, grants and revokes administrator access", async ({ page }) => {
  await signInViaUi(page, adminEmail);

  // List, searched by email.
  await page.goto(`/admin/users?q=${encodeURIComponent(participantEmail)}`);
  await expect(page.getByTestId("admin-users-title")).toHaveText("Users");
  const row = page.getByTestId("user-row").filter({ hasText: participantEmail });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(PARTICIPANT_NAME);
  await expect(row.getByTestId("user-row-roles")).toContainText("Participant");
  await expect(row.getByTestId("user-row-roles")).not.toContainText("Platform administrator");
  await expectNoAxeViolations(page);

  // Detail: masked ID only.
  await row.getByRole("link", { name: `Open ${PARTICIPANT_NAME}` }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/users/${participantId}$`));
  await expect(page.getByTestId("user-detail")).toBeVisible();
  await expect(page.getByTestId("admin-user-email")).toHaveText(participantEmail);
  await expect(page.getByTestId("admin-user-id-masked")).toContainText(MASKED);
  expect(await page.content()).not.toContain(NRIC);
  await expect(page.getByTestId("admin-user-registrations")).toContainText("No registrations.");
  await expectNoAxeViolations(page);

  // Grant.
  const grantForm = page.getByTestId("grant-admin-form");
  await expect(grantForm).toBeVisible();
  await grantForm.getByTestId("grant-admin-submit").click();
  // The page re-renders from the database after the action: the grant form
  // is replaced by the revoke form — that swap IS the confirmation.
  await expect(page.getByTestId("revoke-admin-form")).toBeVisible();
  await expect(page.getByTestId("grant-admin-form")).toHaveCount(0);

  await page.goto(`/admin/users?q=${encodeURIComponent(participantEmail)}`);
  await expect(page.getByTestId("user-row").filter({ hasText: participantEmail }).getByTestId("user-row-roles")).toContainText("Platform administrator");
  await page.goto(`/admin/users?q=${encodeURIComponent(participantEmail)}&role=platform_admin`);
  await expect(page.getByTestId("user-row")).toHaveCount(1);

  // Revoke needs the confirmation ticked.
  await page.goto(`/admin/users/${participantId}`);
  await expect(page.getByTestId("admin-user-roles")).toContainText("Platform administrator");
  const revokeForm = page.getByTestId("revoke-admin-form");
  await expect(revokeForm).toBeVisible();
  await expect(revokeForm.getByTestId("revoke-admin-submit")).toBeDisabled();
  await revokeForm.getByTestId("revoke-admin-confirm").check();
  await revokeForm.getByTestId("revoke-admin-submit").click();
  await expect(page.getByTestId("grant-admin-form")).toBeVisible();
  await expect(page.getByTestId("revoke-admin-form")).toHaveCount(0);

  await page.goto(`/admin/users/${participantId}`);
  await expect(page.getByTestId("grant-admin-form")).toBeVisible();
  await expect(page.getByTestId("admin-user-role-history").getByTestId("admin-user-role-event")).toHaveCount(2);
  await expect(page.getByTestId("admin-user-role-history")).toContainText(adminEmail);

  // The administrator cannot revoke themselves — no form is offered.
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const admin = await findUserByEmail(adminEmail);
  await page.goto(`/admin/users/${admin!.id}`);
  await expect(page.getByTestId("revoke-admin-self")).toBeVisible();
  await expect(page.getByTestId("revoke-admin-form")).toHaveCount(0);
});

test("the audit log lists the grant with the administrator as actor and shows the JSON on its detail", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/audit?action=role.granted&entityType=user&entityId=${participantId}`);
  await expect(page.getByTestId("admin-audit-title")).toHaveText("Audit log");
  const rows = page.getByTestId("audit-row");
  await expect(rows).toHaveCount(1);
  await expect(rows.first().getByTestId("audit-row-actor")).toHaveText(adminEmail);
  await expect(rows.first()).toContainText("role.granted");
  await expect(rows.first()).toContainText(participantId);
  await expect(page.getByTestId("admin-audit-count")).toHaveText("1 row");
  // No form on the page posts anywhere: the only form is the GET filter.
  const methods = await page.locator("form").evaluateAll((forms) => forms.map((f) => (f as HTMLFormElement).method.toLowerCase()));
  expect(methods.every((m) => m === "get")).toBe(true);
  await expectNoAxeViolations(page);

  // Actor filter by email; then by "system" excludes it.
  await page.goto(`/admin/audit?entityId=${participantId}&actor=${encodeURIComponent(adminEmail)}`);
  await expect(page.getByTestId("audit-row")).toHaveCount(2); // granted + revoked
  await page.goto(`/admin/audit?entityId=${participantId}&actor=system`);
  await expect(page.getByTestId("admin-audit-count")).toHaveText("0 rows");

  await page.goto(`/admin/audit?action=role.granted&entityType=user&entityId=${participantId}`);
  await page.getByTestId("audit-row").first().getByRole("link", { name: /Open audit row/ }).click();
  await expect(page).toHaveURL(/\/admin\/audit\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("audit-detail")).toBeVisible();
  await expect(page.getByTestId("admin-audit-action")).toHaveText("role.granted");
  await expect(page.getByTestId("admin-audit-actor")).toContainText(adminEmail);
  const after = page.getByTestId("admin-audit-after");
  await expect(after).toContainText('"role": "platform_admin"');
  await expect(after).toContainText('"scopeType": "platform"');
  await expect(page.getByTestId("admin-audit-before")).toHaveText("—");
  await expectNoAxeViolations(page);
});

test("a participant is refused at /admin/users and /admin/audit, and downloads their own data", async ({ page, request }) => {
  await signInViaUi(page, participantEmail);
  await page.goto("/admin/users");
  await expect(page.getByTestId("forbidden-title")).toBeVisible();
  await page.goto("/admin/audit");
  await expect(page.getByTestId("forbidden-title")).toBeVisible();
  await page.goto(`/admin/users/${participantId}`);
  await expect(page.getByTestId("forbidden-title")).toBeVisible();

  // The profile page offers the download.
  await page.goto("/account/profile");
  const link = page.getByTestId("download-my-data");
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/api/me/export");

  // The route, with the browser's session cookies.
  const res = await page.request.get("/api/me/export?userId=someone-else");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/json");
  expect(res.headers()["content-disposition"]).toMatch(/^attachment; filename="my-data-\d{4}-\d{2}-\d{2}\.json"$/);
  expect(res.headers()["cache-control"]).toBe("no-store");
  const body = (await res.json()) as { account: { email: string }; profile: { idNumberMasked: string; legalName: string }; consents: unknown[] };
  expect(body.account.email).toBe(participantEmail);
  expect(body.profile.legalName).toBe(PARTICIPANT_NAME);
  expect(body.profile.idNumberMasked).toBe(MASKED);
  const text = JSON.stringify(body);
  expect(text).not.toContain(NRIC);
  expect(text).not.toContain(adminEmail);
  expect(body.consents.length).toBeGreaterThanOrEqual(2); // terms + privacy accepted at registration

  const { getPrisma } = await import("../../src/db/prisma");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const audit = (await listAuditForEntity(getPrisma(), "user", participantId)).filter((a) => a.action === "profile.exported");
  expect(audit).toHaveLength(1);
  expect(audit[0]!.actorUserId).toBe(participantId);

  // A guest gets 401 from a context with no session.
  const guest = await request.get("/api/me/export");
  expect(guest.status()).toBe(401);
});
