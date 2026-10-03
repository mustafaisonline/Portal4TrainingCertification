import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createAssessmentBank, deleteAssessmentBank } from "../helpers/assessment-bank";

/*
 * CR-2026-10-02-2014 (founder, 2026-10-02, option B): the free diagnostic's result
 * page shows the total score and a bar per learning area, computed in the browser.
 */

const STORAGE_KEY = "p4tc:diagnostic:completed";

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

function record(withCorrect: boolean) {
  // Two learning areas, five questions each: area A 4 of 5 correct, area B 3 of 5 correct → 7 of 10.
  const answers = Array.from({ length: 10 }, (_, i) => {
    const area = i < 5 ? { code: "area-a", name: "Data foundations" } : { code: "area-b", name: "Data governance" };
    const correctOption = `Right ${i}`;
    const rightIdx = i < 5 ? [0, 1, 2, 3] : [5, 6, 7];
    const isRight = rightIdx.includes(i);
    return {
      code: `q${i}`,
      domainCode: area.code,
      domainName: area.name,
      scenario: `Question ${i}`,
      selected: isRight ? correctOption : "Wrong",
      ...(withCorrect ? { correct: correctOption } : {}),
    };
  });
  return { completedAt: new Date().toISOString(), answers };
}

test("a completed record with correct options shows the total score, a bar per area and where to focus", async ({ page }) => {
  await page.goto("/free-learning/diagnostic");
  await page.evaluate(([k, v]) => window.localStorage.setItem(k!, v!), [STORAGE_KEY, JSON.stringify(record(true))]);
  await page.goto("/free-learning/diagnostic/result");
  await expect(page.getByTestId("diagnostic-score-total")).toHaveText("7 of 10");
  await expect(page.getByTestId("diagnostic-score-percent")).toContainText("70%");
  await expect(page.getByTestId("diagnostic-area-bar")).toHaveCount(2);
  await expect(page.getByText("4 of 5 correct")).toBeVisible();
  await expect(page.getByText("3 of 5 correct")).toBeVisible();
  // The weaker area is named as the place to focus; the stronger one is not.
  await expect(page.getByTestId("diagnostic-focus")).toContainText("Data governance");
  await expect(page.getByTestId("diagnostic-outcome")).toContainText("not a certificate");
  await expectNoAxeViolations(page);
  for (const width of [320, 375, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/free-learning/diagnostic/result");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width}px`).toBeLessThanOrEqual(1);
  }
});

test("a record without correct options (older attempt, homepage walkthrough) keeps the counts and points to the full diagnostic; no score is invented", async ({ page }) => {
  await page.goto("/free-learning/diagnostic");
  await page.evaluate(([k, v]) => window.localStorage.setItem(k!, v!), [STORAGE_KEY, JSON.stringify(record(false))]);
  await page.goto("/free-learning/diagnostic/result");
  await expect(page.getByTestId("diagnostic-score")).toHaveCount(0);
  await expect(page.getByText("Your answers by capability area")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start the free diagnostic" }).first()).toBeVisible();
});

test("the homepage band and card say the diagnostic gives a score, and the band's button opens the scored diagnostic (CR-2026-10-03-0815)", async ({ page }) => {
  await page.goto("/");
  const band = page.locator("#free-skill-diagnostic");
  await expect(band).toContainText("shows your score for each");
  await expect(band).not.toContainText(/not a score/i);
  await expect(band.getByRole("link", { name: /Free Diagnostic/ })).toHaveAttribute("href", "/free-learning/diagnostic");
  await expect(page.locator("body")).not.toContainText(/not a score/i);
  await expect(page.getByText("A score by learning area")).toBeVisible();
  await expect(page.getByText(/you get a score for each learning area/)).toBeVisible();
});

const BANK_SLUGS = ["t-diag-score-a", "t-diag-score-b"];

test.describe("the real flow", () => {
  test.beforeAll(async () => {
    // Two published topics of reviewed questions (the correct option is "Option A"), so a draw spans learning areas.
    await createAssessmentBank({ slug: BANK_SLUGS[0]!, position: 9990, title: "Fixture area one", count: 10 });
    await createAssessmentBank({ slug: BANK_SLUGS[1]!, position: 9991, title: "Fixture area two", count: 10 });
  });
  test.afterAll(async () => {
    for (const slug of BANK_SLUGS) await deleteAssessmentBank(slug);
    const { disconnectPrisma } = await import("../../src/db/prisma");
    await disconnectPrisma();
  });

  test("ten drawn questions: the score shown equals the answers matching their correct option, with a bar per area; no answer is sent to the server", async ({ page }) => {
    const posts: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(`${r.url()} ${r.postData() ?? ""}`);
    });
    await page.goto("/free-learning/diagnostic");
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; animation: none !important; }" });
    await page.getByRole("button", { name: /Start free diagnostic/ }).click();
    let answeredCount = 0;
    for (let step = 0; step < 16 && !/\/result$/.test(page.url()); step += 1) {
      // A question (radio group) or, after question 5, the insight card (only a Continue button).
      const hasQuestion = await page.getByRole("radiogroup").waitFor({ state: "visible", timeout: 4_000 }).then(() => true).catch(() => false);
      if (hasQuestion) {
        // Answer the first option of every question; what is right is read back from the completed record below,
        // so the test does not depend on what else is in the question bank.
        await page.getByRole("radio").first().click();
        answeredCount += 1;
      }
      await page.getByRole("button", { name: "Continue", exact: true }).click({ timeout: 10_000 });
      if (answeredCount >= 10) break; // the last Continue navigates to the result page
    }
    await expect(page).toHaveURL(/\/free-learning\/diagnostic\/result$/);
    // The score shown equals the number of answers that match their question's correct option in the browser's own record.
    const record = await page.evaluate(() => JSON.parse(window.localStorage.getItem("p4tc:diagnostic:completed") ?? "null") as { answers: { selected: string | null; correct?: string | null }[] });
    expect(record.answers).toHaveLength(10);
    for (const a of record.answers) expect(typeof a.correct).toBe("string");
    const right = record.answers.filter((a) => a.selected === a.correct).length;
    await expect(page.getByTestId("diagnostic-score-total")).toHaveText(`${right} of 10`);
    await expect(page.getByTestId("diagnostic-score-percent")).toContainText(`${right * 10}%`);
    expect(await page.getByTestId("diagnostic-area-bar").count()).toBeGreaterThanOrEqual(1);
    // Only the question draw (a server action POST, with no answers) may have gone out.
    expect(posts.filter((p) => /Option [AB]|selected|answers/i.test(p)), JSON.stringify(posts)).toEqual([]);
  });
});
