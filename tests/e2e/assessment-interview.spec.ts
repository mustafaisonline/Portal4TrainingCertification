import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addQuestions, createSharedRole, deleteRoleFixtures } from "../helpers/assessment-roles-db";
import { deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Prepare for Interview through the screens (CR-2026-10-01-1711, P2): role cards
 * (a role with no reviewed questions is "Coming soon"; an unpublished one is not
 * shown); a role page; a running test — ten questions a page, answers kept
 * between pages, a countdown to the SERVER's 90-minute deadline, Finish asks
 * about unanswered questions; the result — score, percentage, time, a breakdown
 * by topic, EVERY question with the correct option and the model answer; "Take it
 * again"; one running test per person (resume); a late save is refused and the
 * test scored as it stands; lazy expiry and the timer's own auto-submit end at
 * the result; owner-only access; signed-out people are sent to sign in. The
 * fixtures are this spec's own roles (unique slugs; no assumption about seed
 * data or global counts) and are removed afterwards.
 */

test.describe.configure({ mode: "serial" });

const tag = Date.now().toString(36);
const email = uniqueEmail("e2e-int");
const otherEmail = uniqueEmail("e2e-int-other");
const QUESTIONS = 25; // three pages: 10 + 10 + 5

let role = { roleId: "", slug: "", reviewedIds: [] as string[] };
let emptyRole = { roleId: "", slug: "", reviewedIds: [] as string[] };
let hiddenRole = { roleId: "", slug: "", reviewedIds: [] as string[] };

test.beforeAll(async () => {
  role = await createSharedRole({ slugPrefix: "e2e-int", reviewed: QUESTIONS, name: `E2E Interview Role ${tag}` });
  emptyRole = await createSharedRole({ slugPrefix: "e2e-int-soon", reviewed: 0, name: `E2E Soon Role ${tag}` });
  hiddenRole = await createSharedRole({ slugPrefix: "e2e-int-hid", reviewed: 5, published: false, name: `E2E Hidden Role ${tag}` });
  // Draft questions never reach a test: this role's bank has 25 reviewed + 7 drafts.
  await addQuestions({ roleId: role.roleId, count: 7, status: "draft" });
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  // Fixtures first (they remove the attempts and their audit rows), then the people.
  await deleteRoleFixtures({ roleIds: [role.roleId, emptyRole.roleId, hiddenRole.roleId].filter(Boolean) });
  await deleteTestUser(email);
  await deleteTestUser(otherEmail);
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}
async function expectNoAxeViolationsBothThemes(page: Page) {
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expectNoAxeViolations(page);
  }
  await page.emulateMedia({ colorScheme: "light" });
}
async function expectNoOverflow(page: Page, path: string) {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${path} at ${width}px`).toBeLessThanOrEqual(1);
  }
}

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
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
}
async function signIn(page: Page, address: string, returnTo: string) {
  await page.goto(`/sign-in?return-to=${encodeURIComponent(returnTo)}`);
  await page.getByLabel("Email").fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL((url) => url.pathname === returnTo);
}

const rolePath = () => `/assessment/interview/${role.slug}`;

/** The attempt id at the end of a /test/ or /result/ address. */
const attemptIdOf = (url: string) => new URL(url).pathname.split("/").pop()!;

/** Save the first `right` served questions as option A (the fixtures' correct option) straight into the attempt. */
async function saveCorrect(attemptId: string, right: number) {
  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const attempt = await prisma.roleTestAttempt.findUniqueOrThrow({ where: { id: attemptId }, select: { questionIds: true } });
  const ids = attempt.questionIds as string[];
  await prisma.roleTestAttempt.update({ where: { id: attemptId }, data: { answers: Object.fromEntries(ids.slice(0, right).map((id) => [id, 1])) } });
}

/** Move an attempt's start back so its 90 minutes end `endsInMs` from now (negative = already over). */
async function setDeadlineIn(attemptId: string, endsInMs: number) {
  const { getPrisma } = await import("../../src/db/prisma");
  await getPrisma().roleTestAttempt.update({ where: { id: attemptId }, data: { startedAt: new Date(Date.now() + endsInMs - 90 * 60_000) } });
}

test("signed out: role cards (a role without reviewed questions is Coming soon, an unpublished one is hidden); the role page asks to sign in; the test is for account holders", async ({ page }) => {
  await page.goto("/assessment/interview");
  await expect(page).toHaveTitle(/^Prepare for Interview/);
  await expect(page.getByTestId("interview-title")).toHaveText("Prepare for Interview");

  const card = page.getByTestId(`role-card-${role.slug}`);
  await expect(card).toHaveAttribute("data-ready", "yes");
  await expect(card).toContainText(`E2E Interview Role ${tag}`);
  await expect(card).toContainText("A role fixture.");
  // 25 reviewed questions (the 7 drafts are never counted) · 90 minutes · model answers.
  await expect(page.getByTestId(`role-facts-${role.slug}`)).toHaveText(`${QUESTIONS} questions · 90 minutes · model answers`);
  await expect(page.getByTestId(`role-open-${role.slug}`)).toHaveAttribute("href", rolePath());

  const soon = page.getByTestId(`role-card-${emptyRole.slug}`);
  await expect(soon).toHaveAttribute("data-ready", "no");
  await expect(page.getByTestId(`role-soon-${emptyRole.slug}`)).toHaveText("Coming soon");
  await expect(soon.getByRole("link")).toHaveCount(0); // not a link
  await expect(page.getByTestId(`role-card-${hiddenRole.slug}`)).toHaveCount(0); // unpublished

  await expectNoAxeViolationsBothThemes(page);

  // The card opens the role page: signed out, a sign-in button that returns here.
  await page.getByTestId(`role-open-${role.slug}`).click();
  await expect(page).toHaveURL(new RegExp(`${rolePath()}$`));
  await expect(page.getByTestId("role-title")).toHaveText(`E2E Interview Role ${tag}`);
  await expect(page.getByTestId("role-expect")).toContainText(`${QUESTIONS} questions`);
  await expect(page.getByTestId("role-expect")).toContainText("90 minutes");
  await expect(page.getByTestId("role-expect")).toContainText("model answer");
  await expect(page.getByTestId("role-signed-out")).toBeVisible();
  await expect(page.getByTestId("role-signin")).toHaveAttribute("href", `/sign-in?return-to=${encodeURIComponent(rolePath())}`);
  await expect(page.getByTestId("role-start")).toHaveCount(0);
  await expect(page.getByTestId("role-history")).toHaveCount(0);
  await expectNoAxeViolationsBothThemes(page);

  // A role with no reviewed questions has a page that says so and offers no start; an unpublished or unknown role is a 404.
  await page.goto(`/assessment/interview/${emptyRole.slug}`);
  await expect(page.getByTestId("role-unavailable")).toContainText("Coming soon");
  expect((await page.goto(`/assessment/interview/${hiddenRole.slug}`))?.status()).toBe(404);
  expect((await page.goto("/assessment/interview/no-such-role-at-all"))?.status()).toBe(404);

  // The test itself needs an account: a signed-out visit goes to sign-in.
  await page.goto(`${rolePath()}/test/00000000-0000-4000-8000-000000000000`);
  await expect(page).toHaveURL(/\/sign-in\?return-to=/);
  await page.goto(`${rolePath()}/result/00000000-0000-4000-8000-000000000000`);
  await expect(page).toHaveURL(/\/sign-in\?return-to=/);

  // Create the accounts used by the rest of this spec.
  await register(page, email, "Ivy Interviewee");
  await resetRateLimits();
  await register(page, otherEmail, "Otto Other");
});

test("a test: ten a page, a countdown, answers kept across pages, Finish asks about unanswered ones → score, breakdown, every question with its model answer; Take it again; delete the result", async ({ page }) => {
  await signIn(page, email, rolePath());
  await expect(page.getByTestId("role-start-card")).toBeVisible();
  await expect(page.getByTestId("role-running")).toHaveCount(0);
  await expect(page.getByTestId("role-history")).toContainText("No finished test yet.");
  await expect(page.getByTestId("role-start")).toHaveText("Start the test");
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/test/[0-9a-f-]{36}$`));
  const testUrl = page.url();
  const firstId = attemptIdOf(testUrl);

  await expect(page.getByTestId("attempt-title")).toHaveText(`Questions 1–10 of ${QUESTIONS}`);
  await expect(page.getByTestId("attempt-question")).toHaveCount(10);
  await expect(page.getByTestId("attempt-category").first()).toBeVisible();
  // Five options a question, as radio buttons; the correct option and the model answer never reach the page.
  await expect(page.getByTestId("attempt-question").first().getByRole("radio")).toHaveCount(5);
  const html = await page.content();
  expect(html).not.toContain("isCorrect");
  expect(html).not.toContain("Fixture model answer");
  // The countdown to the server's deadline: HH:MM:SS, just under 90 minutes.
  await expect(page.getByTestId("attempt-timer")).toHaveText(/^01:\d{2}:\d{2}$/);
  await expect(page.getByRole("timer")).toBeVisible();
  expect(Number(await page.getByTestId("attempt-timer").getAttribute("data-remaining-ms"))).toBeLessThanOrEqual(90 * 60_000);
  await expectNoAxeViolationsBothThemes(page);

  // Page 1: all ten answered A (the correct option). Saving and continuing keeps them.
  const questions = page.getByTestId("attempt-question");
  for (let i = 0; i < 10; i += 1) await questions.nth(i).getByRole("radio").nth(0).check();
  await page.getByTestId("attempt-next").click();
  await expect(page.getByTestId("attempt-title")).toHaveText(`Questions 11–20 of ${QUESTIONS}`);
  await expect(page.getByTestId("attempt-progress")).toContainText(`10 of ${QUESTIONS} answered`);
  await page.getByTestId("attempt-previous").click();
  await expect(page.getByTestId("attempt-title")).toHaveText(`Questions 1–10 of ${QUESTIONS}`);
  await expect(page.getByTestId("attempt-question").first().getByRole("radio").nth(0)).toBeChecked();
  await page.getByTestId("attempt-next").click();

  // Page 2: five right (A), five wrong (B).
  await expect(page.getByTestId("attempt-title")).toHaveText(`Questions 11–20 of ${QUESTIONS}`);
  for (let i = 0; i < 10; i += 1) await questions.nth(i).getByRole("radio").nth(i < 5 ? 0 : 1).check();
  await page.getByTestId("attempt-next").click();

  // Page 3 (five questions): two answered A, three left. The last page has no "continue", and Finish asks first.
  await expect(page.getByTestId("attempt-title")).toHaveText(`Questions 21–${QUESTIONS} of ${QUESTIONS}`);
  await expect(page.getByTestId("attempt-next")).toHaveCount(0);
  for (let i = 0; i < 2; i += 1) await questions.nth(i).getByRole("radio").nth(0).check();
  await page.getByTestId("attempt-finish").click();
  await expect(page.getByTestId("attempt-finish-confirm")).toContainText(`3 of ${QUESTIONS} questions are unanswered`);
  await page.getByTestId("attempt-keep-answering").click();
  await expect(page.getByTestId("attempt-finish-confirm")).toHaveCount(0);
  await page.getByTestId("attempt-finish").click();
  await page.getByTestId("attempt-finish-anyway").click();

  // The result: 10 + 5 + 2 = 17 of 25 = 68 %.
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/result/${firstId}$`));
  await expect(page.getByTestId("result-title")).toHaveText(`17 of ${QUESTIONS} (68 %)`);
  await expect(page.getByTestId("result-score")).toHaveText(`17 of ${QUESTIONS}`);
  await expect(page.getByTestId("result-time-taken")).toHaveText(/^00:\d{2}:\d{2}$/);
  await expect(page.locator("main")).toContainText("no pass mark");
  // The per-topic breakdown: the fixtures use three categories, listed alphabetically.
  const rows = page.getByTestId("result-breakdown-row");
  await expect(rows).toHaveCount(3);
  expect(await rows.evaluateAll((els) => els.map((e) => e.getAttribute("data-category")))).toEqual(["Governance", "Modelling", "Pipelines"]);
  const totals = await rows.evaluateAll((els) => els.map((e) => Number(/of (\d+)/.exec(e.querySelector("td")?.textContent ?? "")?.[1] ?? 0)));
  expect(totals.reduce((a, b) => a + b, 0)).toBe(QUESTIONS);
  // EVERY question with the person's answer, the correct option and the model answer.
  await expect(page.getByTestId("result-question")).toHaveCount(QUESTIONS);
  await expect(page.getByTestId("result-model-answer")).toHaveCount(QUESTIONS);
  await expect(page.getByTestId("result-model-answer").first()).toContainText("Fixture model answer");
  await expect(page.locator('[data-testid="result-question"][data-outcome="correct"]')).toHaveCount(17);
  await expect(page.locator('[data-testid="result-question"][data-outcome="wrong"]')).toHaveCount(5);
  await expect(page.locator('[data-testid="result-question"][data-outcome="unanswered"]')).toHaveCount(3);
  await expect(page.locator('[data-testid="result-option"][data-correct="yes"]')).toHaveCount(QUESTIONS);
  await expect(page.locator('[data-testid="result-option"][data-chosen="yes"]')).toHaveCount(22);
  await expect(page.getByTestId("result-back")).toHaveAttribute("href", rolePath());
  await expectNoAxeViolationsBothThemes(page);

  // The finished attempt cannot be reopened for answering.
  await page.goto(testUrl);
  await expect(page).toHaveURL(new RegExp(`/result/${firstId}$`));

  // "Take it again" starts a NEW test with a fresh draw.
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/test/[0-9a-f-]{36}$`));
  expect(attemptIdOf(page.url())).not.toBe(firstId);

  // The role page lists the finished result (and the running test); the person may delete their own result.
  await page.goto(rolePath());
  await expect(page.getByTestId("role-running")).toContainText("It ends at");
  await expect(page.getByTestId("role-start")).toHaveText("Return to my running test");
  const history = page.getByTestId("role-result-row");
  await expect(history).toHaveCount(1);
  await expect(history).toContainText(`17 of ${QUESTIONS}`);
  await expect(history.getByTestId("role-result-link")).toHaveAttribute("href", `${rolePath()}/result/${firstId}`);
  await page.getByTestId("role-result-select").check();
  await page.getByTestId("role-delete-selected").click();
  await expect(page.getByTestId("confirm-dialog")).toBeVisible();
  await expect(page.getByTestId("confirm-dialog")).toContainText("Delete this result?");
  await page.getByTestId("confirm-dialog-confirm").click();
  await expect(page.getByTestId("role-delete-status")).toContainText("1 result deleted.");
  await expect(page.getByTestId("role-result-row")).toHaveCount(0);
  expect((await page.goto(`${rolePath()}/result/${firstId}`))?.status()).toBe(404);
});

test("one running test per person: the start button returns to it; only its owner can open it; a late save (after the server's deadline) is refused and the test is scored as it stands", async ({ page, browser, baseURL }) => {
  await signIn(page, email, rolePath());
  // The test started by "Take it again" is still running: the one button returns to it.
  await expect(page.getByTestId("role-start")).toHaveText("Return to my running test");
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/test/[0-9a-f-]{36}$`));
  const attemptUrl = page.url();
  const attemptId = attemptIdOf(attemptUrl);

  // The address must match the attempt's own role: another role's address is a 404.
  expect((await page.goto(`/assessment/interview/${emptyRole.slug}/test/${attemptId}`))?.status()).toBe(404);
  expect((await page.goto(`/assessment/interview/${emptyRole.slug}/result/${attemptId}`))?.status()).toBe(404);
  // A running test has no result page: it goes back to the test (no answer can leak).
  await page.goto(`${rolePath()}/result/${attemptId}`);
  await expect(page).toHaveURL(attemptUrl);

  // Another signed-in person gets a 404 for both addresses.
  const other = await browser.newContext({ baseURL });
  const otherPage = await other.newPage();
  await resetRateLimits();
  await signIn(otherPage, otherEmail, rolePath());
  expect((await otherPage.goto(attemptUrl))?.status()).toBe(404);
  expect((await otherPage.goto(`${rolePath()}/result/${attemptId}`))?.status()).toBe(404);
  await other.close();

  // 12 answers were saved earlier (48 %). The 90 minutes then run out while the page is open; the next save is refused by the server:
  // this page's ticks are NOT stored, the test is scored on what was saved, and the person lands on the result.
  await page.goto(attemptUrl);
  await saveCorrect(attemptId, 12);
  await setDeadlineIn(attemptId, -60_000);
  const questions = page.getByTestId("attempt-question");
  for (let i = 0; i < 10; i += 1) await questions.nth(i).getByRole("radio").nth(1).check(); // ignored
  await page.getByTestId("attempt-next").click();
  await expect(page).toHaveURL(new RegExp(`/result/${attemptId}$`));
  await expect(page.getByTestId("result-title")).toHaveText(`12 of ${QUESTIONS} (48 %)`);
  await expect(page.getByTestId("result-time-taken")).toHaveText("01:30:00"); // exactly 90 minutes, never more

  // The test is over: the role page offers a fresh start again.
  await page.goto(rolePath());
  await expect(page.getByTestId("role-running")).toHaveCount(0);
  await expect(page.getByTestId("role-start")).toHaveText("Start the test");
  await expect(page.getByTestId("role-result-row")).toHaveCount(1);
});

test("visiting a test after its 90 minutes settles it (lazy expiry); the countdown's own auto-submit ends at the result too", async ({ page }) => {
  await signIn(page, email, rolePath());
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/test/[0-9a-f-]{36}$`));
  const attemptUrl = page.url();
  const attemptId = attemptIdOf(attemptUrl);

  // Time already up when the page is opened: it is scored as it stands (nothing answered → 0) and shows the result.
  await setDeadlineIn(attemptId, -1000);
  await page.goto(attemptUrl);
  await expect(page).toHaveURL(/\/result\//);
  await expect(page.getByTestId("result-title")).toHaveText(`0 of ${QUESTIONS} (0 %)`);
  await expect(page.getByTestId("result-time-taken")).toHaveText("01:30:00");
  await expect(page.locator('[data-testid="result-question"][data-outcome="unanswered"]')).toHaveCount(QUESTIONS);

  // The timer: a few seconds left when the page loads → it counts down and submits by itself → the result.
  await page.goto(rolePath());
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/test/[0-9a-f-]{36}$`));
  const secondUrl = page.url();
  const secondId = attemptIdOf(secondUrl);
  await saveCorrect(secondId, 13); // 52 %
  await setDeadlineIn(secondId, 9_000);
  await page.goto(secondUrl);
  await expect(page.getByTestId("attempt-timer")).toHaveText(/^00:00:0\d$/);
  await expect(page).toHaveURL(/\/result\//, { timeout: 30_000 });
  await expect(page.getByTestId("result-title")).toHaveText(`13 of ${QUESTIONS} (52 %)`);
});

test("the role pages have no horizontal overflow at 375, 768 and 1280 px; the signed-in role page has no WCAG 2.2 AA violations", async ({ page }) => {
  await signIn(page, email, rolePath());
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/test/[0-9a-f-]{36}$`));
  const testPath = new URL(page.url()).pathname;
  const attemptId = attemptIdOf(page.url());
  await saveCorrect(attemptId, 13);

  await expectNoOverflow(page, "/assessment/interview");
  await expectNoOverflow(page, rolePath());
  await expectNoOverflow(page, testPath);

  // The signed-in role page: a running test and the person's results.
  await page.goto(rolePath());
  await expect(page.getByTestId("role-running")).toBeVisible();
  await expect(page.getByTestId("role-history")).toBeVisible();
  await expectNoAxeViolationsBothThemes(page);

  // Finish the test straight in the database to check the result page's layout (13 right).
  const { getPrisma } = await import("../../src/db/prisma");
  await getPrisma().roleTestAttempt.update({ where: { id: attemptId }, data: { score: 13, finishedAt: new Date() } });
  await expectNoOverflow(page, `${rolePath()}/result/${attemptId}`);
});
