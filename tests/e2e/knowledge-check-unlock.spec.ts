import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { completeProfileByEmail, deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * The Knowledge Check result DOCUMENT and its gate through the screens
 * (Milestone 14 Phase 5): a finished result shows both conditions open; a
 * Free Learning review satisfies the first; Pay explains that payments are
 * not configured (Stripe keys are blank in the Playwright environment — the
 * page tells the truth rather than pretending); a Pakistan profile is
 * exempt from the fee, so the document opens and prints; the administrator
 * sees and changes the unlock fee setting; a Malaysian profile pays.
 */

test.describe.configure({ mode: "serial" });

const SLUG = `e2e-unlock-${Date.now().toString(36)}`;
const email = uniqueEmail("e2e-unlock");
const adminEmail = uniqueEmail("e2e-unlock-admin");
let topicId = "";
let attemptId = "";

test.beforeAll(async () => {
  const { withTransaction } = await import("../../src/db/prisma");
  const { replaceTopicFromImport } = await import("../../src/modules/free-learning/book.repository");
  const { importDraftQuestions, setAllQuestionsStatus } = await import("../../src/modules/free-learning/quiz.repository");
  const { createAdminUser } = await import("../helpers/certificates-db");
  const reviewer = await createAdminUser("e2e-unlock-reviewer");
  const r = await withTransaction((tx) =>
    replaceTopicFromImport(tx, { position: 83001, slug: SLUG, title: "E2E Unlock Topic", sourceHeading: "E2E Unlock Topic", bodyHtml: "<p>x</p>", bodyText: "x", wordCount: 1, images: [], publish: true, importedAt: new Date() }, (id) => id),
  );
  topicId = r.id;
  await withTransaction((tx) =>
    importDraftQuestions(tx, { topicId, replaceDrafts: false, questions: Array.from({ length: 50 }, (_, i) => ({ stem: `E2E unlock question ${i + 1}: choose option A?`, options: ["Alpha", "Bravo", "Charlie", "Delta", "Echo"], correct: 0, explanation: null })) }),
  );
  await withTransaction((tx) => setAllQuestionsStatus(tx, { topicId, status: "reviewed", actorUserId: reviewer.id }));
  await deleteTestUser(reviewer.email);
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  if (user) {
    const orders = await prisma.order.findMany({ where: { userId: user.id }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: "order", entityId: { in: orders.map((o) => o.id) } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: orders.map((o) => o.id) } } });
    await prisma.order.deleteMany({ where: { userId: user.id } });
    const attempts = await prisma.knowledgeCheckAttempt.findMany({ where: { userId: user.id }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: "knowledge_check_attempt", entityId: { in: attempts.map((a) => a.id) } } });
    await prisma.knowledgeCheckAttempt.deleteMany({ where: { userId: user.id } });
    const reviews = await prisma.review.findMany({ where: { userId: user.id }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: "review", entityId: { in: reviews.map((x) => x.id) } } });
    await prisma.review.deleteMany({ where: { userId: user.id } });
  }
  const ids = (await prisma.topicQuestion.findMany({ where: { topicId }, select: { id: true } })).map((x) => x.id);
  await prisma.auditLog.deleteMany({ where: { entityType: "topic_question", entityId: { in: ids } } });
  await prisma.bookTopic.deleteMany({ where: { slug: SLUG } });
  const settings = await prisma.knowledgeCheckUnlockSetting.findMany({ where: { note: { contains: "e2e-unlock" } }, select: { id: true } });
  await prisma.auditLog.deleteMany({ where: { entityType: "knowledge_check_unlock_setting", entityId: { in: settings.map((s) => s.id) } } });
  await prisma.knowledgeCheckUnlockSetting.deleteMany({ where: { id: { in: settings.map((s) => s.id) } } });
  await deleteTestUser(email);
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
  await page.getByLabel("Email").fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("a finished result shows both gate conditions; a Free Learning review satisfies the first; Pay explains honestly; Pakistan is exempt and the document opens", async ({ page }) => {
  await registerViaUi(page, email, "Uma Unlock");
  await signInViaUi(page, email);
  const { withTransaction } = await import("../../src/db/prisma");
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const { startAttempt, finishAttempt, saveAnswers } = await import("../../src/modules/free-learning/knowledge-check.repository");
  const user = (await findUserByEmail(email))!;
  // UX review 2026-09-27 U5: the document is offered after a pass only — a fail shows the retake hint and no gate.
  const failed = await withTransaction((tx) => startAttempt(tx, { userId: user.id, size: 50 }));
  await withTransaction((tx) => finishAttempt(tx, { attemptId: failed.id, userId: user.id }));
  await page.goto(`/free-learning/knowledge-check/${failed.id}/result`);
  await expect(page.getByTestId("result-title")).toContainText("Not passed — 0 of 50");
  await expect(page.getByTestId("result-document")).toHaveCount(0);
  await expect(page.getByTestId("result-retake-hint")).toContainText("offered once you pass");
  await page.goto(`/free-learning/knowledge-check/${failed.id}/document`);
  await expect(page).toHaveURL(new RegExp(`/free-learning/knowledge-check/${failed.id}/result$`));

  const attempt = await withTransaction((tx) => startAttempt(tx, { userId: user.id, size: 50 }));
  attemptId = attempt.id;
  await withTransaction((tx) => saveAnswers(tx, { attemptId, userId: user.id, answers: Object.fromEntries(attempt.questionIds.map((id) => [id, 1])) }));
  await withTransaction((tx) => finishAttempt(tx, { attemptId, userId: user.id }));

  await page.goto(`/free-learning/knowledge-check/${attemptId}/result`);
  await expect(page.getByTestId("result-title")).toContainText("Passed — 50 of 50");
  await expect(page.getByTestId("result-gate-review")).toHaveAttribute("data-satisfied", "no");
  await expect(page.getByTestId("result-gate-fee")).toHaveAttribute("data-fee", "required");
  await expect(page.getByTestId("result-gate-fee")).toContainText("USD 10");
  await expect(page.getByTestId("result-gate-review-link")).toHaveAttribute("href", "/reviews#free-learning");
  await expectNoAxeViolations(page);
  // The document route refuses until the gate holds.
  await page.goto(`/free-learning/knowledge-check/${attemptId}/document`);
  await expect(page).toHaveURL(new RegExp(`/free-learning/knowledge-check/${attemptId}/result$`));

  // Pay: Stripe keys are blank here — the page says so, nothing is charged.
  await page.getByTestId("unlock-pay").click();
  await expect(page.getByText("not configured on this installation yet", { exact: false }).first()).toBeVisible();

  // The review (the reviews model's registration-free kind), through the repository.
  const { createReview } = await import("../../src/modules/reviews/repository");
  const { flagshipProgramme } = await import("../helpers/certificates-db");
  const flagship = await flagshipProgramme();
  await withTransaction((tx) =>
    createReview(tx, {
      userId: user.id,
      kind: "diagnostic",
      registrationId: null,
      programmeId: flagship.id,
      offeringId: null,
      body: "A review of Free Learning written by the e2e run. ".repeat(7),
      rating: 5,
      category: null,
      consentPublic: false,
      consentPhoto: false,
    }),
  );
  await page.reload();
  await expect(page.getByTestId("result-gate-review")).toHaveAttribute("data-satisfied", "yes");
  await expect(page.getByTestId("result-gate-fee")).toHaveAttribute("data-fee", "required");

  // Pakistan profile → exempt → unlocked → the document.
  await completeProfileByEmail(email, { legalName: "Uma Unlock", countryCode: "PK", nationalityCode: "PK" });
  await page.reload();
  await expect(page.getByTestId("result-document-unlocked")).toContainText("no fee applies to you");
  await page.getByTestId("result-document-link").click();
  await expect(page).toHaveURL(new RegExp(`/free-learning/knowledge-check/${attemptId}/document$`));
  await expect(page.getByTestId("kc-document")).toContainText("Knowledge Check result");
  await expect(page.getByTestId("kc-document-name")).toHaveText("Uma Unlock");
  await expect(page.getByTestId("kc-document")).toContainText("not a Certificate of Completion");
  await expectNoAxeViolations(page);
});

test("the administrator sees the unlock fee setting from Orders and can switch it off and on, audited", async ({ page }) => {
  await registerViaUi(page, adminEmail, "Ada Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signInViaUi(page, adminEmail);
  await page.goto("/admin/orders");
  await page.getByTestId("admin-unlock-setting-link").click();
  await expect(page).toHaveURL(/\/admin\/orders\/unlock$/);
  await expect(page.getByTestId("unlock-setting-amount")).toHaveText("USD 10.00");
  await expectNoAxeViolations(page);

  const form = page.getByTestId("unlock-setting-form");
  await form.getByTestId("unlock-setting-enabled").uncheck();
  await form.getByLabel("Note").fill("e2e-unlock off");
  await page.getByTestId("unlock-setting-submit").click();
  await expect(page.getByTestId("unlock-setting-saved")).toContainText("Disabled");
  await page.goto("/admin/orders/unlock");
  const again = page.getByTestId("unlock-setting-form");
  await again.getByTestId("unlock-setting-enabled").check();
  await again.getByLabel("Amount").fill("10.00");
  await again.getByLabel("Note").fill("e2e-unlock on");
  await page.getByTestId("unlock-setting-submit").click();
  await expect(page.getByTestId("unlock-setting-saved")).toContainText("Enabled");

  const { getPrisma } = await import("../../src/db/prisma");
  const rows = await getPrisma().auditLog.findMany({ where: { action: "knowledge_check_unlock.changed", reason: { contains: "e2e-unlock" } }, orderBy: { createdAt: "asc" } });
  expect(rows.map((r) => (r.after as { enabled: boolean }).enabled)).toEqual([false, true]);
});
