import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Topic self-check through the screens (Milestone 14 Phase 3): a topic with
 * drafts shows no quiz; the administrator reviews the questions (one, then
 * all); the reader then sees ten questions a page, answers, submits and is
 * told which were right or wrong with the correct answer — the page HTML
 * never carried the answers. Nothing about the reader is stored.
 */

test.describe.configure({ mode: "serial" });

const SLUG = `e2e-quiz-${Date.now().toString(36)}`;
const adminEmail = uniqueEmail("e2e-quiz-admin");
let topicId = "";

test.beforeAll(async () => {
  const { withTransaction } = await import("../../src/db/prisma");
  const { replaceTopicFromImport } = await import("../../src/modules/free-learning/book.repository");
  const { importDraftQuestions } = await import("../../src/modules/free-learning/quiz.repository");
  const r = await withTransaction((tx) =>
    replaceTopicFromImport(tx, { position: 81001, slug: SLUG, title: "E2E Quiz Topic", sourceHeading: "E2E Quiz Topic", bodyHtml: "<p>Read me.</p>", bodyText: "Read me.", wordCount: 2, images: [], publish: true, importedAt: new Date() }, (id) => id),
  );
  topicId = r.id;
  await withTransaction((tx) =>
    importDraftQuestions(tx, {
      topicId,
      replaceDrafts: false,
      questions: Array.from({ length: 12 }, (_, i) => ({ stem: `E2E question ${i + 1}: which option is marked correct?`, options: ["Alpha", "Bravo", "Charlie", "Delta", "Echo"], correct: i % 5, explanation: `Option ${i % 5} is the one.` })),
    }),
  );
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const ids = (await getPrisma().topicQuestion.findMany({ where: { topicId }, select: { id: true } })).map((x) => x.id);
  await getPrisma().auditLog.deleteMany({ where: { entityType: "topic_question", entityId: { in: ids } } });
  await getPrisma().bookTopic.deleteMany({ where: { slug: SLUG } });
  await deleteTestUser(adminEmail);
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("drafts are invisible to readers; the administrator reviews one question, then all", async ({ page }) => {
  await page.goto(`/free-learning/topics/${SLUG}?tab=questions`);
  await expect(page.getByTestId("topic-quiz-coming")).toBeVisible();
  await expect(page.getByTestId("topic-quiz")).toHaveCount(0);

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Quinn Reviewer");
  await page.getByLabel("Email", { exact: true }).fill(adminEmail);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
  await grantRoleByEmail(adminEmail, "platform_admin");
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/free-learning");
  const row = page.locator(`[data-testid="free-learning-admin-row"][data-slug="${SLUG}"]`);
  await expect(row.getByTestId("free-learning-admin-questions")).toContainText("0 of 12 reviewed");
  await row.getByTestId("free-learning-admin-questions").getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/admin/free-learning/${topicId}/questions$`));
  await expect(page.getByTestId("questions-title")).toHaveText("E2E Quiz Topic");
  await expect(page.getByTestId("review-question")).toHaveCount(12);
  await expect(page.getByTestId("review-question").first().getByTestId("review-correct")).toContainText("Alpha");
  await expectNoAxeViolations(page);

  const first = page.locator('[data-testid="review-question"][data-position="1"]');
  await first.getByTestId("review-toggle").click();
  await expect(first).toHaveAttribute("data-status", "reviewed");
  await expect(page.getByTestId("questions-summary")).toContainText("1 reviewed");

  await page.getByTestId("questions-review-all").click();
  await expect(page.getByTestId("questions-summary")).toContainText("12 reviewed");
  await expect(page.locator('[data-testid="review-question"][data-status="draft"]')).toHaveCount(0);
});

test("a topic has two tabs — Topic and Questions — and the questions are one click from the top (founder, 2026-09-29)", async ({ page }) => {
  await page.goto(`/free-learning/topics/${SLUG}`);
  const tabs = page.getByTestId("topic-tabs");
  await expect(tabs.getByTestId("topic-tab-topic")).toHaveAttribute("aria-current", "page");
  await expect(tabs.getByTestId("topic-tab-questions")).toHaveText("Questions (12)");
  await expect(tabs.getByTestId("topic-tab-questions")).not.toHaveAttribute("aria-current", /.+/);
  // The Topic tab is the reading; the questions are not below it.
  await expect(page.getByTestId("topic-body")).toBeVisible();
  await expect(page.getByTestId("topic-quiz")).toHaveCount(0);
  await expect(page.getByTestId("topic-to-questions-link")).toHaveAttribute("href", `/free-learning/topics/${SLUG}?tab=questions`);
  await expectNoAxeViolations(page);

  // One click to the questions — and the reading is out of the way.
  await tabs.getByTestId("topic-tab-questions").click();
  await expect(page).toHaveURL(new RegExp(`/free-learning/topics/${SLUG}\\?tab=questions$`));
  await expect(page.getByTestId("topic-tab-questions")).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("topic-quiz")).toBeVisible();
  await expect(page.getByTestId("topic-body")).toHaveCount(0);
  await expect(page).toHaveTitle(/.+/); // metadata streams in after a client-side switch
  // The questions start right under the tabs (no scrolling past the topic).
  const tabsBox = (await tabs.boundingBox())!;
  const quizBox = (await page.getByTestId("topic-quiz").boundingBox())!;
  expect(quizBox.y - (tabsBox.y + tabsBox.height)).toBeLessThan(120);
  await expectNoAxeViolations(page);

  // A quiz pagination link (?page=N) always lands on the Questions tab, and back to the Topic tab reads the topic.
  await page.goto(`/free-learning/topics/${SLUG}?page=2`);
  await expect(page.getByTestId("topic-tab-questions")).toHaveAttribute("aria-current", "page");
  await page.getByTestId("topic-tab-topic").click();
  await expect(page.getByTestId("topic-body")).toBeVisible();
  await expect(page.getByTestId("topic-quiz")).toHaveCount(0);
});

test("the reader answers ten questions, submits, sees right and wrong with the correct answers, and moves to the next page", async ({ page }) => {
  await page.goto(`/free-learning/topics/${SLUG}?tab=questions`);
  const quiz = page.getByTestId("topic-quiz");
  await expect(quiz).toBeVisible();
  await expect(page.getByTestId("quiz-range")).toHaveText("Questions 1–10 of 12");
  const questions = page.getByTestId("quiz-question");
  await expect(questions).toHaveCount(10);
  // The answers are not in the page.
  expect(await page.content()).not.toContain("isCorrect");
  await expectNoAxeViolations(page);

  // Q1 correct is Alpha (index 0); Q2 correct is Bravo (index 1). Answer Q1 right, Q2 wrong, leave Q3 blank.
  await questions.nth(0).getByRole("radio").nth(0).check();
  await questions.nth(1).getByRole("radio").nth(0).check();
  await page.getByTestId("quiz-submit").click();
  await expect(page.getByTestId("quiz-score")).toHaveText("You got 1 of 10 right on this page.");
  await expect(questions.nth(0)).toHaveAttribute("data-result", "correct");
  await expect(questions.nth(0).getByTestId("quiz-verdict")).toContainText("Correct.");
  await expect(questions.nth(1)).toHaveAttribute("data-result", "wrong");
  await expect(questions.nth(1).getByTestId("quiz-verdict")).toContainText("Wrong — the correct answer is B.");
  await expect(questions.nth(2).getByTestId("quiz-verdict")).toContainText("Not answered — the correct answer is C.");
  await expect(questions.nth(0).getByTestId("quiz-verdict")).toContainText("Option 0 is the one.");

  await page.getByTestId("quiz-next").click();
  await expect(page).toHaveURL(new RegExp(`/free-learning/topics/${SLUG}\\?page=2`));
  await expect(page.getByTestId("quiz-range")).toHaveText("Questions 11–12 of 12");
  await expect(page.getByTestId("quiz-question")).toHaveCount(2);
  await expect(page.getByTestId("quiz-prev")).toBeVisible();
  await expect(page.getByTestId("quiz-next")).toHaveCount(0);
});
