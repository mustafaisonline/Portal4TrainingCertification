import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * The Free Assessment Check through the screens (Milestone 14 Phase 4,
 * reshaped by the founder on 2026-09-30): signed-in only; ONE test of 200
 * questions (no size buttons, no "unfinished" list, no cancel); ten a page with
 * answers saved between pages and a countdown to the SERVER's 3-hour deadline;
 * Finish shows the score, pass, GRADE and a KC id; the id resolves on /verify
 * and from the header search; the result is listed under Certifications as a
 * result, not a certificate; one running test per person; when the time is up
 * the test is scored as it stands (a late save, a visit, and the timer's own
 * auto-submit all end at the result). A 260-question reviewed bank comes from a
 * fixture topic and is removed afterwards.
 */

test.describe.configure({ mode: "serial" });

const SLUG = `e2e-kc-${Date.now().toString(36)}`;
const email = uniqueEmail("e2e-kc");
let publicId = "";

test.beforeAll(async () => {
  const { createAssessmentBank } = await import("../helpers/assessment-bank");
  await createAssessmentBank({ slug: SLUG, position: 82001, title: "E2E KC Topic" });
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
  await prisma.bookTopic.deleteMany({ where: { slug: SLUG } }); // the fixture bank (questions and options cascade)
  await deleteTestUser(email);
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page) {
  // The <title> streams in last; axe must not run before it (the same race fixed elsewhere — it failed the v2026.10.03-4 gate).
  await expect.poll(async () => (await page.title()).trim().length, { timeout: 10_000 }).toBeGreaterThan(0);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

async function signIn(page: Page) {
  await page.goto("/sign-in?return-to=%2Fassessment");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/assessment$/);
}

/** The signed-in person's user id. */
async function userId(): Promise<string> {
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  return (await findUserByEmail(email))!.id;
}

/** Save the first `right` served questions as correct answers (option A) straight through the repository. */
async function saveCorrect(attemptId: string, right: number) {
  const { withTransaction } = await import("../../src/db/prisma");
  const { getAttemptForUser, saveAnswers } = await import("../../src/modules/free-learning/knowledge-check.repository");
  const uid = await userId();
  const attempt = (await getAttemptForUser(attemptId, uid))!;
  await withTransaction((tx) => saveAnswers(tx, { attemptId, userId: uid, answers: Object.fromEntries(attempt.questionIds.slice(0, right).map((id) => [id, 1])) }));
}

/** Move an attempt's start back so its 3 hours end `endsInMs` from now (negative = already over). */
async function setDeadlineIn(attemptId: string, endsInMs: number) {
  const { getPrisma } = await import("../../src/db/prisma");
  await getPrisma().knowledgeCheckAttempt.update({ where: { id: attemptId }, data: { startedAt: new Date(Date.now() + endsInMs - 3 * 3_600_000) } });
}

test("signed out: /assessment shows the pitch and a sign-in button; signed in it offers ONE test — no sizes, no unfinished list, no time-limit-free wording", async ({ page }) => {
  // Founder, 2026-09-28 ("New more change"): the start screen lives on /assessment (renamed from /free-certifications 2026-10-01) — public page, sign-in offered on it;
  // the old URL redirects here.
  await page.goto("/free-learning/knowledge-check");
  await expect(page).toHaveURL(/\/assessment$/);
  await expect(page.getByTestId("kc-signed-out")).toBeVisible();
  await expect(page.getByTestId("start-knowledge-check")).toHaveAttribute("href", "/sign-in?return-to=%2Fassessment");
  await expect(page.getByTestId("start-knowledge-check")).toContainText("Free Assessment Check");
  // Founder, 2026-09-30: the hero and the wording.
  await expect(page.getByTestId("assessment-title")).toHaveText("Test yourself. Prepare. Screen.");
  await expect(page.getByTestId("persona-card-data-foundation")).toContainText("200 questions in 3 hours, drawn fresh from a bank of");
  await expect(page.getByTestId("persona-card-data-foundation")).toContainText("Alpha — 81–100 %");
  await expect(page.getByTestId("kc-title")).toHaveText("Assess your Data Foundation");
  await expect(page.getByTestId("free-test")).toContainText("200 questions");
  await expect(page.getByTestId("free-test")).toContainText("3 hours");
  // Founder, 2026-10-01 23:50/23:58: the founder's paragraph, then the bands as a facts list
  // in the same shape as the other two cards; bank count and not-a-credential line gone.
  await expect(page.getByTestId("free-test")).toContainText("thousands of questions");
  await expect(page.getByTestId("kc-grades")).toContainText("Charlie — 60–70 %");
  await expect(page.getByTestId("kc-grades")).toContainText("Bravo — 71–80 %");
  await expect(page.getByTestId("kc-grades")).toContainText("Alpha — 81–100 %");
  await expect(page.locator("main")).not.toContainText(/Knowledge Check|Give free test|no time limit|50, 100 or 200|Choose a size/i);

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
  await signIn(page);

  await expect(page.getByTestId("kc-title")).toHaveText("Assess your Data Foundation");
  await expect(page.getByTestId("kc-bank")).toHaveCount(0); // the bank count was removed from the card (founder, 2026-10-01 23:50)
  // ONE start button — the three size buttons and the Unfinished card are gone.
  await expect(page.getByTestId("kc-start")).toBeEnabled();
  await expect(page.getByTestId("kc-start")).toHaveText("Start the Free Assessment Check");
  for (const size of [50, 100, 200]) await expect(page.getByTestId(`kc-start-${size}`)).toHaveCount(0);
  await expect(page.getByTestId("kc-unfinished")).toHaveCount(0);
  await expect(page.getByTestId("kc-running")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(/Knowledge Check|Choose a size|Unfinished/);
  await expectNoAxeViolations(page);
});

test("a 200-question test: ten a page, a countdown, answers kept across pages, finish → score, pass, GRADE, KC id; verify and search resolve it; listed under Certifications; deletable", async ({ page }) => {
  // Each test has its own browser context: sign in again.
  await signIn(page);
  await page.getByTestId("kc-start").click();
  await expect(page).toHaveURL(/\/free-learning\/knowledge-check\/[0-9a-f-]{36}$/);
  const attemptUrl = page.url();
  const attemptId = attemptUrl.split("/").pop()!;
  await expect(page.getByTestId("attempt-title")).toHaveText("Questions 1–10 of 200");
  await expect(page.getByTestId("attempt-question")).toHaveCount(10);
  expect(await page.content()).not.toContain("isCorrect");
  // The countdown to the server's deadline: HH:MM:SS, just under three hours; no cancel button, no unfinished concept.
  await expect(page.getByTestId("attempt-timer")).toHaveText(/^0[0-2]:\d{2}:\d{2}$/);
  expect(Number(await page.getByTestId("attempt-timer").getAttribute("data-remaining-ms"))).toBeLessThanOrEqual(3 * 3_600_000);
  await expect(page.getByTestId("kc-cancel")).toHaveCount(0);
  await expectNoAxeViolations(page);

  // Page 1 answered A (correct) through the screen; "Save and continue" keeps them and moves on.
  const questions = page.getByTestId("attempt-question");
  for (let i = 0; i < 10; i += 1) await questions.nth(i).getByRole("radio").nth(0).check();
  await page.getByTestId("attempt-next").click();
  await expect(page.getByTestId("attempt-title")).toHaveText("Questions 11–20 of 200");
  await expect(page.getByTestId("attempt-progress")).toContainText("10 of 200 answered");
  // Going back keeps the saved answers.
  await page.getByTestId("attempt-previous").click();
  await expect(page.getByTestId("attempt-title")).toHaveText("Questions 1–10 of 200");
  await expect(page.getByTestId("attempt-question").first().getByRole("radio").nth(0)).toBeChecked();

  // The other pages' answers are saved through the repository (twenty pages by hand would prove nothing more):
  // the first 180 questions answered A, the last 20 left — then page 20 answers 5 of its 10.
  await saveCorrect(attemptId, 180);
  await page.goto(`${attemptUrl}?page=20`);
  await expect(page.getByTestId("attempt-title")).toHaveText("Questions 191–200 of 200");
  const last = page.getByTestId("attempt-question");
  for (let i = 0; i < 5; i += 1) await last.nth(i).getByRole("radio").nth(0).check();
  // UX review 2026-09-27 D2: fifteen questions are unanswered, so Finish asks first.
  await page.getByTestId("attempt-finish").click();
  await expect(page.getByTestId("attempt-finish-confirm")).toContainText("15 of 200 questions are unanswered");
  await page.getByTestId("attempt-keep-answering").click();
  await expect(page.getByTestId("attempt-finish-confirm")).toHaveCount(0);
  await page.getByTestId("attempt-finish").click();
  await page.getByTestId("attempt-finish-anyway").click();

  await expect(page).toHaveURL(/\/free-learning\/knowledge-check\/[0-9a-f-]{36}\/result$/);
  // 185 of 200 = 92.5 % → 92 % (rounded down) → Alpha (81–100 %); the pass mark is 60 %.
  await expect(page.getByTestId("result-title")).toHaveText("Passed — 185 of 200 (92 %)");
  await expect(page.getByTestId("result-grade")).toHaveAttribute("data-grade", "alpha");
  await expect(page.getByTestId("result-grade")).toContainText("Grade Alpha · 81–100 %");
  await expect(page.getByTestId("result-holder")).toHaveText("Kay Checker");
  publicId = (await page.getByTestId("result-public-id").innerText()).trim();
  expect(publicId).toMatch(/^KC-\d{4}-[23456789A-HJKMNP-Z]{4}-[23456789A-HJKMNP-Z]{4}$/);
  await expect(page.getByTestId("copy-kc-id")).toBeVisible();
  // Phase 5: the result document sits behind the review + unlock gate (tests/e2e/knowledge-check-unlock.spec.ts).
  await expect(page.getByTestId("result-gate-review")).toHaveAttribute("data-satisfied", "no");
  await expect(page.getByTestId("result-gate-fee")).toHaveAttribute("data-fee", "required");
  // Locked, the sample shown is of the person's own grade.
  await expect(page.getByTestId("result-sample").getByTestId("certificate-grade")).toHaveText("Grade: ALPHA · 81–100 %");
  await expectNoAxeViolations(page);

  // The finished attempt cannot be reopened for answering.
  await page.goto(page.url().replace(/\/result$/, ""));
  await expect(page).toHaveURL(/\/result$/);

  await page.goto(`/verify/${publicId}`);
  await expect(page.getByTestId("verify-holder")).toHaveText("Kay Checker");
  await expect(page.getByTestId("verify-status-sentence")).toContainText("185 of 200");
  await expect(page.getByTestId("verify-status-sentence")).toContainText("Grade Alpha (81–100 %)");
  await expect(page.getByTestId("verify-status-sentence")).toContainText("60 % mark");
  await expect(page.getByTestId("verify-not-credential")).toContainText("not a Certificate of Completion");
  await expect(page.getByTestId("certificate-status")).toHaveText("Valid");
  await expect(page.getByTestId("certificate-status")).toHaveAttribute("data-status", "valid");
  await expect(page.getByTestId("verify-issuer")).toHaveText("Your Partner Technologies");
  const kcDetails = page.getByTestId("verify-details");
  for (const term of ["Type", "Questions", "Score", "Grade", "Time taken", "Taken on", "Valid until", "Free Assessment Check ID", "Issued by"]) {
    await expect(kcDetails.getByRole("term").filter({ hasText: new RegExp(`^${term}$`, "i") })).toHaveCount(1);
  }
  await expect(kcDetails).toContainText("Alpha (81–100 %)");
  await expect(kcDetails).toContainText("Certificate of Achievement — Free Assessment Check");
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
  await expect(row).toContainText("185 of 200");
  await expect(row.getByRole("link", { name: publicId })).toHaveAttribute("href", `/verify/${publicId}`);
  await expect(page.getByTestId("certificate-none")).toBeVisible(); // still no Certificate of Completion

  // The old start URL redirects to the merged page, where the finished result is listed and the one start button renders.
  await page.goto("/free-learning/knowledge-check");
  await expect(page).toHaveURL(/\/assessment$/);
  await expect(page.getByTestId("kc-result-row")).toHaveCount(1);
  await expect(page.getByTestId("kc-start")).toBeVisible();
  await expect(page.getByTestId("start-knowledge-check")).toHaveCount(0);
  await expect(page.getByTestId("kc-result-grade")).toHaveText("Grade Alpha");

  // Founder, 2026-09-28: the row carries the full stats (185 correct of the 185 answered; 15 were left unanswered),
  // and the person can delete their own result behind a confirmation — the verify link then stops working.
  await expect(page.getByTestId("kc-result-stats")).toHaveText("Questions 200 · Answered 185 · Correct 185 · Wrong 0 · Unanswered 15");
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
});

test("one running test per person: starting again returns to it; a late save (after the server's deadline) is refused and the test is scored as it stands", async ({ page }) => {
  await signIn(page);
  await page.getByTestId("kc-start").click();
  await expect(page).toHaveURL(/\/free-learning\/knowledge-check\/[0-9a-f-]{36}$/);
  const attemptUrl = page.url();
  const attemptId = attemptUrl.split("/").pop()!;

  // Back on Assessment the test is shown as running, and the one button returns to the SAME test — no Unfinished list, no Continue/Cancel.
  await page.goto("/assessment");
  await expect(page.getByTestId("kc-running")).toContainText("It ends at");
  await expect(page.getByTestId("kc-start")).toHaveText("Return to my running test");
  await expect(page.getByTestId("kc-unfinished")).toHaveCount(0);
  await page.getByTestId("kc-start").click();
  await expect(page).toHaveURL(attemptUrl);

  // 130 answers were saved earlier (65 %). The 3 hours then run out while the page is open; the next save is refused by the server:
  // this page's ticks are NOT stored, the test is scored on what was saved, and the person lands on the result.
  await saveCorrect(attemptId, 130);
  await setDeadlineIn(attemptId, -60_000);
  const questions = page.getByTestId("attempt-question");
  for (let i = 0; i < 10; i += 1) await questions.nth(i).getByRole("radio").nth(1).check(); // ignored
  await page.getByTestId("attempt-next").click();
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.getByTestId("result-title")).toHaveText("Passed — 130 of 200 (65 %)");
  await expect(page.getByTestId("result-grade")).toHaveAttribute("data-grade", "charlie");
  await expect(page.getByTestId("result-grade")).toContainText("Grade Charlie · 60–70 %");
  await expect(page.getByTestId("result-time-taken")).toHaveText("03:00:00"); // exactly three hours, never more
  await expect(page).toHaveTitle(/.+/); // reached by client-side navigation: the title streams in last (same race as b7d3584; flaked once in the v2026.10.01-3 gate)
  await expectNoAxeViolations(page);

  // The test is over, so Assessment offers a fresh start again.
  await page.goto("/assessment");
  await expect(page.getByTestId("kc-running")).toHaveCount(0);
  await expect(page.getByTestId("kc-start")).toHaveText("Start the Free Assessment Check");
});

test("visiting a test after its 3 hours settles it (lazy expiry); the countdown's own auto-submit ends at the result too", async ({ page }) => {
  await signIn(page);
  await page.getByTestId("kc-start").click();
  await expect(page).toHaveURL(/\/free-learning\/knowledge-check\/[0-9a-f-]{36}$/);
  const attemptUrl = page.url();
  const attemptId = attemptUrl.split("/").pop()!;

  // Time already up when the page is opened: it is scored as it stands (nothing answered → 0) and shows the result.
  await setDeadlineIn(attemptId, -1000);
  await page.goto(attemptUrl);
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.getByTestId("result-title")).toHaveText("Not passed — 0 of 200 (0 %)");
  await expect(page.getByTestId("result-grade")).toHaveCount(0);
  await expect(page.getByTestId("result-time-taken")).toHaveText("03:00:00");
  await page.goto("/assessment");
  await expect(page.getByTestId("kc-result-row").first()).toContainText("Not passed");

  // The timer: a few seconds left when the page loads → it counts down and submits by itself → the result.
  await page.getByTestId("kc-start").click();
  await expect(page).toHaveURL(/\/free-learning\/knowledge-check\/[0-9a-f-]{36}$/);
  const secondUrl = page.url();
  const secondId = secondUrl.split("/").pop()!;
  await saveCorrect(secondId, 121); // 60.5 % → 60 % → Charlie, the lowest pass
  await setDeadlineIn(secondId, 9_000);
  await page.goto(secondUrl);
  await expect(page.getByTestId("attempt-timer")).toHaveText(/^00:00:0\d$/);
  await expect(page).toHaveURL(/\/result$/, { timeout: 30_000 });
  await expect(page.getByTestId("result-title")).toHaveText("Passed — 121 of 200 (60 %)");
  await expect(page.getByTestId("result-grade")).toHaveAttribute("data-grade", "charlie");
});
