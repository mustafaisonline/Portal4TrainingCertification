import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addQuestions, createOrganisationFixture, deleteRoleFixtures } from "../helpers/assessment-roles-db";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Admin → Interview roles, end to end through the real screens against the test
 * database (CR-2026-10-01-1711): a participant is refused (403); an administrator
 * creates a role, edits its details and publishes it; adds questions (draft and
 * approved), approves, rejects and returns one to draft, edits and deletes drafts,
 * sees a reviewed question cannot be edited, uses "Approve all drafts" (with its
 * confirmation), filters and pages the bank; works the approval queue (approve and
 * reject an organisation's questions with a reason); every change is in the audit
 * log; the screens are axe-clean in the light and the dark theme.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const adminEmail = uniqueEmail("e2e-iv-admin");
const personEmail = uniqueEmail("e2e-iv-person");
const ROLE_NAME = `E2E Role ${run}`;
const ROLE_SLUG = `e2e-role-${run}`;
const stemOf = (n: number) => `E2E ${run} question ${n}: which design keeps a retried load safe?`;

let roleId = "";
let organisationId = "";
const pendingIds: string[] = [];

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await deleteRoleFixtures({ roleIds: roleId ? [roleId] : [], organisationIds: organisationId ? [organisationId] : [] });
  await deleteTestUser(personEmail);
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

/** The portal's own confirmation box — one <dialog> per card sits on the page, only the open one counts. */
const confirmYes = (page: Page) => page.locator("dialog[open]").getByTestId("confirm-dialog-confirm");
const confirmNo = (page: Page) => page.locator("dialog[open]").getByTestId("confirm-dialog-cancel");
const card = (page: Page, n: number) => page.getByTestId("bank-question").filter({ hasText: stemOf(n) });

/** Fill the "Add a question" form and wait until the bank shows `total` questions. */
async function addQuestion(page: Page, n: number, status: "draft" | "reviewed", total: number) {
  const form = page.getByTestId("qf-create");
  await form.getByTestId("qf-category").fill("Pipelines");
  await form.getByTestId("qf-stem").fill(stemOf(n));
  for (let i = 0; i < 5; i += 1) await form.getByTestId(`qf-option-${i}`).fill(`E2E ${run} q${n} option ${i}`);
  await form.getByTestId("qf-correct-1").check();
  await form.getByTestId("qf-model-answer").fill(`E2E ${run} model answer ${n}: a retried load is safe when it is idempotent, so I key the writes naturally and prove it with a double run.`);
  await form.getByTestId("qf-status").selectOption(status);
  await form.getByTestId("qf-submit").click();
  await expect(page.getByTestId("bank-question")).toHaveCount(total);
}

test("setup: an administrator and a participant", async ({ page }) => {
  await registerViaUi(page, adminEmail, "Ivy Interview Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await registerViaUi(page, personEmail, "Pia Participant");
});

test("a participant is refused at the interview screens", async ({ page }) => {
  await signInViaUi(page, personEmail);
  for (const url of ["/admin/interview", "/admin/interview/approvals", "/admin/interview/00000000-0000-4000-8000-000000000000"]) {
    await page.goto(url);
    await expect(page.getByTestId("forbidden-title"), url).toBeVisible();
  }
});

test("an administrator creates a role; it starts unpublished with an empty bank and appears in the list", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto("/admin/interview");
  await expect(page.getByTestId("interview-admin-title")).toHaveText("Interview roles");
  await expect(page.getByTestId("admin-nav")).toContainText("Interview roles");
  await expect(page.getByTestId("admin-nav")).toContainText("Organisations");

  await page.getByTestId("role-name").fill(ROLE_NAME);
  await page.getByTestId("role-description").fill("A role created by the end-to-end test.");
  await page.getByTestId("role-create-submit").click();
  await expect(page.getByTestId("role-create-status")).toContainText("created");

  const row = page.getByTestId("interview-role-row").filter({ has: page.locator(`[data-testid="interview-role-link"]`, { hasText: ROLE_NAME }) });
  await expect(row).toHaveCount(1);
  await expect(row).toHaveAttribute("data-slug", ROLE_SLUG);
  await expect(row.getByTestId("interview-role-status")).toContainText("Unpublished");
  for (const s of ["draft", "pending", "reviewed", "rejected"]) await expect(row.getByTestId(`count-${s}`)).toHaveText("0");
  roleId = (await row.getAttribute("data-role-id"))!;

  // The same URL name is refused.
  await page.getByTestId("role-name").fill(ROLE_NAME);
  await page.getByTestId("role-create-submit").click();
  await expect(page.getByTestId("role-create-status")).toContainText("already used");

  await row.getByTestId("interview-role-link").click();
  await expect(page).toHaveURL(new RegExp(`/admin/interview/${roleId}$`));
  await expect(page.getByTestId("interview-role-title")).toHaveText(ROLE_NAME);
  await expect(page.getByTestId("bank-empty")).toBeVisible();
});

test("role details are edited and the role is published and unpublished", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/interview/${roleId}`);
  await page.getByTestId("role-edit-description").fill("Edited description from the end-to-end test.");
  await page.getByTestId("role-edit-submit").click();
  await expect(page.getByTestId("role-edit-status")).toContainText("saved");

  await expect(page.getByTestId("role-publish-toggle")).toHaveAccessibleName(/^Publish /);
  await page.getByTestId("role-publish-toggle").click();
  await expect(page.getByTestId("role-publish-toggle")).toHaveAccessibleName(/^Unpublish /);
  await page.getByTestId("role-publish-toggle").click();
  await expect(page.getByTestId("role-publish-toggle")).toHaveAccessibleName(/^Publish /);
  await page.reload();
  await expect(page.getByTestId("role-edit-description")).toHaveValue("Edited description from the end-to-end test.");
});

test("questions are added, approved, rejected, returned to draft, edited and deleted; a reviewed one is locked", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/interview/${roleId}`);

  // Needs exactly five options and one correct: no correct option → the server says so (the form keeps its values).
  const form = page.getByTestId("qf-create");
  await form.getByTestId("qf-category").fill("Pipelines");
  await form.getByTestId("qf-stem").fill(stemOf(0));
  for (let i = 0; i < 5; i += 1) await form.getByTestId(`qf-option-${i}`).fill(`E2E ${run} q0 option ${i}`);
  await form.getByTestId("qf-model-answer").fill(`E2E ${run} model answer 0: long enough to be accepted by the validator.`);
  await form.getByTestId("qf-submit").click();
  await expect(form.getByTestId("qf-message")).toContainText(/exactly one option must be correct/i);
  await expect(form.getByTestId("qf-stem")).toHaveValue(stemOf(0));
  await form.getByTestId("qf-correct-2").check();
  await form.getByTestId("qf-submit").click();
  await expect(page.getByTestId("bank-question")).toHaveCount(1);
  await expect(card(page, 0)).toHaveAttribute("data-status", "draft");
  // Remove it again so the numbers below are exact.
  await card(page, 0).getByTestId("question-delete").click();
  await confirmYes(page).click();
  await expect(page.getByTestId("bank-empty")).toBeVisible();

  await addQuestion(page, 1, "reviewed", 1);
  await addQuestion(page, 2, "draft", 2);
  await addQuestion(page, 3, "draft", 3);
  await addQuestion(page, 4, "draft", 4);
  await addQuestion(page, 5, "draft", 5);
  await expect(page.getByTestId("interview-role-summary")).toContainText("5 questions");
  await expect(page.getByTestId("interview-role-summary")).toContainText("1 reviewed");
  await expect(page.getByTestId("interview-role-summary")).toContainText("4 draft");
  await expect(card(page, 1)).toHaveAttribute("data-status", "reviewed");
  await expect(card(page, 1).getByTestId("question-correct")).toContainText("q1 option 1");
  // The correct option is the one chosen (option B) and the model answer is on the card.
  await expect(card(page, 2).getByTestId("question-correct")).toContainText(`q2 option 1`);
  await expect(card(page, 2).getByTestId("question-model-answer")).toContainText("model answer 2");

  // Approve one, reject one.
  await card(page, 2).getByTestId("question-approve").click();
  await expect(card(page, 2)).toHaveAttribute("data-status", "reviewed");
  await card(page, 3).getByTestId("question-reject").click();
  await expect(card(page, 3)).toHaveAttribute("data-status", "rejected");

  // A reviewed question is locked: no Edit, no Delete — only "Back to draft".
  await expect(card(page, 2).getByTestId("question-edit")).toHaveCount(0);
  await expect(card(page, 2).getByTestId("question-delete")).toHaveCount(0);
  await expect(card(page, 2).getByTestId("question-to-draft")).toBeVisible();

  // Approve all drafts — it asks first; "Not yet" changes nothing.
  await expect(page.getByTestId("approve-all-drafts")).toHaveText("Approve all 2 drafts");
  await page.getByTestId("approve-all-drafts").click();
  await confirmNo(page).click();
  await expect(card(page, 4)).toHaveAttribute("data-status", "draft");
  await page.getByTestId("approve-all-drafts").click();
  await confirmYes(page).click();
  await expect(page.getByTestId("approve-all-status")).toContainText("2 drafts approved");
  await expect(card(page, 4)).toHaveAttribute("data-status", "reviewed");
  await expect(card(page, 5)).toHaveAttribute("data-status", "reviewed");
  await expect(page.getByTestId("approve-all-none")).toBeVisible();
  await expect(page.getByTestId("interview-role-summary")).toContainText("4 reviewed");

  // Filter by status.
  await page.getByTestId("status-filter-rejected").click();
  await expect(page).toHaveURL(/status=rejected/);
  await expect(page.getByTestId("bank-question")).toHaveCount(1);
  await expect(card(page, 3)).toBeVisible();

  // Rejected → back to draft (it leaves the rejected filter), then edit and delete it.
  await card(page, 3).getByTestId("question-to-draft").click();
  await expect(page.getByTestId("bank-empty")).toBeVisible();
  await page.getByTestId("status-filter-draft").click();
  await expect(page.getByTestId("bank-question")).toHaveCount(1);
  // While editing, the stem lives in a field, so hold the card by its id.
  const q3 = page.locator(`[data-testid="bank-question"][data-question-id="${await card(page, 3).getAttribute("data-question-id")}"]`);
  await q3.getByTestId("question-edit").click();
  const edit = q3.getByTestId("qf-edit");
  await expect(edit.getByTestId("qf-correct-1")).toBeChecked();
  const edited = `${stemOf(3)} (edited)`;
  await edit.getByTestId("qf-stem").fill(edited);
  await edit.getByTestId("qf-submit").click();
  await expect(page.getByTestId("bank-question").filter({ hasText: edited })).toHaveCount(1);
  await page.getByTestId("bank-question").filter({ hasText: edited }).getByTestId("question-delete").click();
  await confirmYes(page).click();
  await expect(page.getByTestId("bank-empty")).toBeVisible();
  await expect(page.getByTestId("interview-role-summary")).toContainText("4 questions");
});

test("the bank is paginated, and a role's counts show in the list", async ({ page }) => {
  await addQuestions({ roleId, count: 25, status: "reviewed", tag: `pg${run}` });
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/interview/${roleId}`);
  await expect(page.getByTestId("bank-pagination")).toBeVisible();
  await expect(page.getByTestId("bank-page-label")).toContainText("Page 1 of 2");
  await expect(page.getByTestId("bank-question")).toHaveCount(20);
  await page.getByTestId("bank-next").click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByTestId("bank-page-label")).toContainText("Page 2 of 2");
  await expect(page.getByTestId("bank-question")).toHaveCount(9);
  await page.getByTestId("bank-prev").click();
  await expect(page.getByTestId("bank-page-label")).toContainText("Page 1 of 2");

  await page.goto("/admin/interview");
  const row = page.getByTestId("interview-role-row").filter({ has: page.locator(`[data-testid="interview-role-link"]`, { hasText: ROLE_NAME }) });
  await expect(row.getByTestId("count-reviewed")).toHaveText("29");
  await expect(row.getByTestId("count-draft")).toHaveText("0");
});

test("the approval queue: an organisation's pending questions are approved or rejected, with a reason", async ({ page }) => {
  const org = await createOrganisationFixture({ slugPrefix: "e2e-iv-org", roleIds: [roleId] });
  organisationId = org.organisationId;
  pendingIds.push(...(await addQuestions({ roleId, organisationId, count: 2, status: "pending", tag: `ap${run}` })));

  await signInViaUi(page, adminEmail);
  await page.goto("/admin/interview");
  await expect(page.getByTestId("interview-approvals-link")).toBeVisible();
  await expect(page.getByTestId("interview-pending-count")).not.toHaveText("0");

  await page.goto(`/admin/interview/approvals?organisation=${organisationId}`);
  await expect(page.getByTestId("approvals-title")).toHaveText("Approval queue");
  await expect(page.getByTestId("approvals-summary")).toContainText("2 questions are waiting");
  const cards = page.getByTestId("approval-question");
  await expect(cards).toHaveCount(2);
  // Organisation, role, the options with the correct one marked, and the model answer.
  await expect(cards.first()).toContainText(`Test organisation ${org.slug}`);
  await expect(cards.first().getByTestId("approval-role")).toHaveText(ROLE_NAME);
  await expect(cards.first().getByTestId("question-correct")).toHaveCount(1);
  await expect(cards.first().getByTestId("question-model-answer")).toContainText("Fixture model answer");
  await expectNoAxeViolations(page);

  await cards.first().getByTestId("question-reason").fill("Looks right");
  await cards.first().getByTestId("question-approve").click();
  await expect(cards).toHaveCount(1);
  await cards.first().getByTestId("question-reason").fill("Ambiguous wording");
  await cards.first().getByTestId("question-reject").click();
  await expect(page.getByTestId("approvals-empty")).toBeVisible();

  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const rows = await prisma.roleQuestion.findMany({ where: { id: { in: pendingIds } }, select: { status: true } });
  expect(rows.map((r) => r.status).sort()).toEqual(["rejected", "reviewed"]);
});

test("every change is in the audit log", async () => {
  const { getPrisma } = await import("../../src/db/prisma");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const prisma = getPrisma();
  const role = (await listAuditForEntity(prisma, "assessment_role", roleId)).map((a) => a.action);
  expect(role).toEqual(expect.arrayContaining(["assessment_role.created", "assessment_role.updated", "assessment_role.published_changed", "role_question.bulk_status_changed"]));
  expect(role.filter((a) => a === "assessment_role.published_changed")).toHaveLength(2);

  const questions = await prisma.roleQuestion.findMany({ where: { roleId, organisationId: null, stem: { contains: `E2E ${run} question` } }, select: { id: true } });
  const actions: string[] = [];
  for (const q of questions) actions.push(...(await listAuditForEntity(prisma, "role_question", q.id)).map((a) => a.action));
  expect(actions).toEqual(expect.arrayContaining(["role_question.created", "role_question.status_changed"]));

  // The queue's decisions carry their reasons.
  const reasons: (string | null)[] = [];
  for (const id of pendingIds) for (const a of await listAuditForEntity(prisma, "role_question", id)) if (a.action === "role_question.status_changed") reasons.push(a.reason);
  expect(reasons.sort()).toEqual(["Ambiguous wording", "Looks right"]);
});

test("the interview screens have no WCAG 2.2 AA violations in the light and the dark theme", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const url of ["/admin/interview", `/admin/interview/${roleId}`, `/admin/interview/approvals`]) {
      await page.goto(url);
      await expect(page.getByTestId("admin-nav")).toBeVisible();
      await expectNoAxeViolations(page);
    }
  }
});
