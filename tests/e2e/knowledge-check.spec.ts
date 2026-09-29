import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * The Knowledge Check through the screens (Milestone 14 Phase 4): signed-in
 * only; the start page states the bank and disables sizes it cannot serve;
 * a 50-question check runs ten a page with answers saved between pages;
 * Finish shows the score, pass and a KC id; the id resolves on /verify and
 * from the header search; the result is listed under Certifications as a
 * result, not a certificate. Sixty reviewed questions come from a fixture
 * topic and are removed afterwards.
 */

test.describe.configure({ mode: "serial" });

const SLUG = `e2e-kc-${Date.now().toString(36)}`;
const email = uniqueEmail("e2e-kc");
let topicId = "";
let publicId = "";

test.beforeAll(async () => {
  const { withTransaction } = await import("../../src/db/prisma");
  const { replaceTopicFromImport } = await import("../../src/modules/free-learning/book.repository");
  const { importDraftQuestions, setAllQuestionsStatus } = await import("../../src/modules/free-learning/quiz.repository");
  const { createAdminUser } = await import("../helpers/certificates-db");
  const admin = await createAdminUser("e2e-kc-admin");
  const r = await withTransaction((tx) =>
    replaceTopicFromImport(tx, { position: 82001, slug: SLUG, title: "E2E KC Topic", sourceHeading: "E2E KC Topic", bodyHtml: "<p>x</p>", bodyText: "x", wordCount: 1, images: [], publish: true, importedAt: new Date() }, (id) => id),
  );
  topicId = r.id;
  await withTransaction((tx) =>
    importDraftQuestions(tx, { topicId, replaceDrafts: false, questions: Array.from({ length: 60 }, (_, i) => ({ stem: `E2E KC question ${i + 1}: choose option A?`, options: ["Alpha", "Bravo", "Charlie", "Delta", "Echo"], correct: 0, explanation: null })) }),
  );
  await withTransaction((tx) => setAllQuestionsStatus(tx, { topicId, status: "reviewed", actorUserId: admin.id }));
  await deleteTestUser(admin.email);
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  if (user) {
    const attempts = await prisma.knowledgeCheckAttempt.findMany({ where: { userId: user.id }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: "knowledge_check_attempt", entityId: { in: attempts.map((a) => a.id) } } });
    await prisma.knowledgeCheckAttempt.deleteMany({ where: { userId: user.id } });
  }
  const ids = (await prisma.topicQuestion.findMany({ where: { topicId }, select: { id: true } })).map((x) => x.id);
  await prisma.auditLog.deleteMany({ where: { entityType: "topic_question", entityId: { in: ids } } });
  await prisma.bookTopic.deleteMany({ where: { slug: SLUG } });
  await deleteTestUser(email);
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("signed out: /free-certifications shows the bank and a sign-in button; signed in, it states the bank and disables the sizes it cannot serve", async ({ page }) => {
  // Founder, 2026-09-28 ("New more change"): the Knowledge Check start screen
  // merged into /free-certifications — public page, sign-in offered on it;
  // the old URL redirects here.
  await page.goto("/free-learning/knowledge-check");
  await expect(page).toHaveURL(/\/free-certifications$/);
  await expect(page.getByTestId("kc-signed-out")).toBeVisible();
  await expect(page.getByTestId("start-knowledge-check")).toHaveAttribute("href", "/sign-in?return-to=%2Ffree-certifications");

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Kay Checker");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
  await page.goto("/sign-in?return-to=%2Ffree-certifications");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/free-certifications$/);

  await expect(page.getByTestId("kc-title")).toHaveText("The free Knowledge Check");
  await expect(page.getByTestId("kc-bank")).toContainText("reviewed questions are in the bank");
  await expect(page.getByTestId("kc-start-50")).toBeEnabled();
  // The test bank is 60 + whatever else is reviewed in the test database — never 200.
  await expect(page.getByTestId("kc-start-200")).toBeDisabled();
  await expectNoAxeViolations(page);
});

test("a 50-question check: ten a page, answers kept across pages, finish → score, pass, KC id; verify and search resolve it; listed under Certifications", async ({ page }) => {
  // Each test has its own browser context: sign in again.
  await page.goto("/sign-in?return-to=%2Ffree-certifications");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/free-certifications$/);
  await page.getByTestId("kc-start-50").click();
  await expect(page).toHaveURL(/\/free-learning\/knowledge-check\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("attempt-title")).toHaveText("Questions 1–10 of 50");
  await expect(page.getByTestId("attempt-question")).toHaveCount(10);
  expect(await page.content()).not.toContain("isCorrect");
  await expectNoAxeViolations(page);

  // Pages 1–4: answer every question A (correct). Page 5: answer 5 of 10 with A, leave the rest.
  for (let p = 1; p <= 4; p += 1) {
    const questions = page.getByTestId("attempt-question");
    for (let i = 0; i < 10; i += 1) await questions.nth(i).getByRole("radio").nth(0).check();
    await page.getByTestId("attempt-next").click();
    await expect(page.getByTestId("attempt-title")).toHaveText(`Questions ${p * 10 + 1}–${p * 10 + 10} of 50`);
    await expect(page.getByTestId("attempt-progress")).toContainText(`${p * 10} of 50 answered`);
  }
  // Going back keeps the saved answers.
  await page.getByTestId("attempt-previous").click();
  await expect(page.getByTestId("attempt-title")).toHaveText("Questions 31–40 of 50");
  await expect(page.getByTestId("attempt-question").first().getByRole("radio").nth(0)).toBeChecked();
  await page.getByTestId("attempt-next").click();
  await expect(page.getByTestId("attempt-title")).toHaveText("Questions 41–50 of 50");
  const last = page.getByTestId("attempt-question");
  for (let i = 0; i < 5; i += 1) await last.nth(i).getByRole("radio").nth(0).check();
  // UX review 2026-09-27 D2: five questions are unanswered, so Finish asks first.
  await page.getByTestId("attempt-finish").click();
  await expect(page.getByTestId("attempt-finish-confirm")).toContainText("5 of 50 questions are unanswered");
  await page.getByTestId("attempt-keep-answering").click();
  await expect(page.getByTestId("attempt-finish-confirm")).toHaveCount(0);
  await page.getByTestId("attempt-finish").click();
  await page.getByTestId("attempt-finish-anyway").click();

  await expect(page).toHaveURL(/\/free-learning\/knowledge-check\/[0-9a-f-]{36}\/result$/);
  await expect(page.getByTestId("result-title")).toHaveText("Passed — 45 of 50 (90 %)");
  await expect(page.getByTestId("result-holder")).toHaveText("Kay Checker");
  publicId = (await page.getByTestId("result-public-id").innerText()).trim();
  expect(publicId).toMatch(/^KC-\d{4}-[23456789A-HJKMNP-Z]{4}-[23456789A-HJKMNP-Z]{4}$/);
  await expect(page.getByTestId("copy-kc-id")).toBeVisible();
  // Phase 5: the result document sits behind the review + unlock gate (tests/e2e/knowledge-check-unlock.spec.ts).
  await expect(page.getByTestId("result-gate-review")).toHaveAttribute("data-satisfied", "no");
  await expect(page.getByTestId("result-gate-fee")).toHaveAttribute("data-fee", "required");
  await expectNoAxeViolations(page);

  // The finished attempt cannot be reopened for answering.
  await page.goto(page.url().replace(/\/result$/, ""));
  await expect(page).toHaveURL(/\/result$/);

  await page.goto(`/verify/${publicId}`);
  await expect(page.getByTestId("verify-holder")).toHaveText("Kay Checker");
  await expect(page.getByTestId("verify-status-sentence")).toContainText("45 of 50");
  await expect(page.getByTestId("verify-not-credential")).toContainText("not a Certificate of Completion");
  await expect(page.getByTestId("certificate-status")).toHaveText("Valid");
  await expect(page.getByTestId("certificate-status")).toHaveAttribute("data-status", "valid");
  await expect(page.getByTestId("verify-issuer")).toHaveText("Your Partner Technologies");
  const kcDetails = page.getByTestId("verify-details");
  for (const term of ["Type", "Questions", "Score", "Time taken", "Taken on", "Valid until", "Knowledge Check ID", "Issued by"]) {
    await expect(kcDetails.getByRole("term").filter({ hasText: new RegExp(`^${term}$`, "i") })).toHaveCount(1);
  }
  await expectNoAxeViolations(page);
  // An administrator's revocation shows on the very next look, in words.
  const { getPrisma } = await import("../../src/db/prisma");
  await getPrisma().knowledgeCheckAttempt.update({ where: { publicId }, data: { revokedAt: new Date(), revocationReason: "e2e revocation" } });
  await page.goto(`/verify/${publicId}`);
  await expect(page.getByTestId("certificate-status")).toHaveText("Revoked");
  await expect(page.getByTestId("verify-status-sentence")).toContainText("revoked");
  await expect(page.locator("body")).not.toContainText("e2e revocation");
  await page.goto(`/search?q=${publicId.toLowerCase()}`);
  await expect(page).toHaveURL(new RegExp(`/verify/${publicId}$`));
  await page.goto(`/verify?q=${publicId}`);
  await expect(page).toHaveURL(new RegExp(`/verify/${publicId}$`));

  await page.goto("/account/certifications");
  const row = page.getByTestId("knowledge-check-row");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Passed");
  await expect(row).toContainText("45 of 50");
  await expect(row.getByRole("link", { name: publicId })).toHaveAttribute("href", `/verify/${publicId}`);
  await expect(page.getByTestId("certificate-none")).toBeVisible(); // still no Certificate of Completion

  // The old start URL redirects to the merged page, where the finished
  // result is listed and (signed in) the size buttons render inline.
  await page.goto("/free-learning/knowledge-check");
  await expect(page).toHaveURL(/\/free-certifications$/);
  await expect(page.getByTestId("kc-result-row")).toHaveCount(1);
  await expect(page.getByTestId("kc-start-50")).toBeVisible();
  await expect(page.getByTestId("start-knowledge-check")).toHaveCount(0);

  // Founder, 2026-09-28: the row carries the full stats (45 correct of the
  // 45 answered; 5 were left unanswered), and the person can delete their
  // own result behind a confirmation — the verify link then stops working.
  await expect(page.getByTestId("kc-result-stats")).toHaveText("Questions 50 · Answered 45 · Correct 45 · Wrong 0 · Unanswered 5");
  await page.getByTestId("kc-result-select").check();
  // The portal's own dialog (founder, 2026-09-28) — never window.confirm.
  await page.getByTestId("kc-delete-selected").click();
  await expect(page.getByTestId("confirm-dialog")).toBeVisible();
  await expect(page.getByTestId("confirm-dialog")).toContainText("Delete this result?");
  await page.getByTestId("confirm-dialog-confirm").click();
  await expect(page.getByTestId("kc-delete-status")).toContainText("1 result deleted.");
  await expect(page.getByTestId("kc-result-row")).toHaveCount(0);
  await page.goto(`/verify/${publicId}`);
  await expect(page.getByTestId("verify-holder")).toHaveCount(0);

  // Founder, 2026-09-28: a running check carries a Cancel button — custom
  // dialog, then the attempt is deleted and the person is back on Free
  // Certifications with nothing unfinished.
  await page.goto("/free-certifications");
  await page.getByTestId("kc-start-50").click();
  await expect(page).toHaveURL(/\/free-learning\/knowledge-check\/[0-9a-f-]{36}$/);
  await page.getByTestId("kc-cancel").click();
  await expect(page.getByTestId("confirm-dialog")).toContainText("Cancel this check?");
  await page.getByTestId("confirm-dialog-cancel").click(); // "Keep going" keeps the attempt
  await expect(page.getByTestId("attempt-title")).toBeVisible();
  await page.getByTestId("kc-cancel").click();
  await page.getByTestId("confirm-dialog-confirm").click();
  await expect(page).toHaveURL(/\/free-certifications$/);
  await expect(page.getByTestId("kc-unfinished")).toHaveCount(0);
});
