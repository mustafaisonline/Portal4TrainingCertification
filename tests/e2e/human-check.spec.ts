import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, firstLink, resetRateLimits, STRONG_PASSWORD, uniqueEmail, waitForEmail } from "../helpers/identity-db";

/*
 * Sign-up human check and email activation (CR-2026-10-03-1245), end to end.
 * The rest of the suite sends `x-test-no-human-check: 1` (playwright.config.ts) so
 * it can register people quickly; the first describe turns the check back ON by
 * sending "0" and plays the game for real.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const emails: string[] = [];
const fresh = (prefix: string) => {
  const e = uniqueEmail(`${prefix}-${run}`);
  emails.push(e);
  return e;
};

test.beforeEach(async () => {
  await resetRateLimits();
});
test.afterAll(async () => {
  for (const e of emails) await deleteTestUser(e);
});

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

async function fillRegistration(page: Page, address: string) {
  await page.getByLabel("Full name").fill("Human Checker");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
}

/** Plays the game the way a person does: read the prompt, tap the matching shapes. */
async function solveTiles(page: Page) {
  const prompt = (await page.getByTestId("human-check-prompt").textContent())!;
  const target = /Tap every (\w+)/.exec(prompt)![1]!;
  const tiles = page.locator('[data-testid^="human-tile-"]');
  for (let i = 0; i < (await tiles.count()); i++) if ((await tiles.nth(i).getAttribute("data-shape")) === target) await tiles.nth(i).click();
}
async function solveSum(page: Page) {
  const prompt = (await page.getByTestId("human-check-prompt").textContent())!;
  const m = /What is (\w+) plus (\w+)\?/.exec(prompt)!;
  await page.getByTestId("human-sum").fill(String(WORDS.indexOf(m[1]!) + WORDS.indexOf(m[2]!)));
}

test.describe("with the check ON", () => {
  test.use({ extraHTTPHeaders: { "x-test-no-human-check": "0" } });

  test("the register form shows the game: a prompt, nine labelled tiles and a text alternative; no accessibility violations", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByTestId("human-check")).toBeVisible();
    await expect(page.getByTestId("human-check-prompt")).toContainText(/^Tap every (circle|square|triangle|star)\.$/);
    await expect(page.locator('[data-testid^="human-tile-"]')).toHaveCount(9);
    await expect(page.getByTestId("human-tile-0")).toHaveAttribute("aria-label", /^(Blue|Orange|Green|Purple) (circle|square|triangle|star)$/);
    await expect(page.getByTestId("human-text-alt")).toBeVisible();
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" }); // axe must not read a mid-transition colour
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await expect.poll(async () => (await page.title()).trim().length, { timeout: 10_000 }).toBeGreaterThan(0);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    }
  });

  test("submitting without playing is refused in words, before anything is sent", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByTestId("human-check-prompt")).toBeVisible(); // the puzzle has loaded
    await fillRegistration(page, fresh("noplay"));
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Please complete the quick check to show you are a person.")).toBeVisible();
  });

  test("a wrong answer is refused by the SERVER, no account is made, and a fresh puzzle replaces the spent one", async ({ page }) => {
    const address = fresh("wrong");
    await page.goto("/register");
    await expect(page.getByTestId("human-check-prompt")).toBeVisible(); // the puzzle has loaded
    await fillRegistration(page, address);
    // Tap a tile that is NOT the target shape.
    const prompt = (await page.getByTestId("human-check-prompt").textContent())!;
    const target = /Tap every (\w+)/.exec(prompt)![1]!;
    const wrong = page.locator(`[data-testid^="human-tile-"]:not([data-shape="${target}"])`).first();
    await wrong.click();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Please complete the check to show you are a person, then try again.")).toBeVisible();
    await expect(page.getByTestId("human-check")).toBeVisible(); // a new puzzle
    const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
    expect(await findUserByEmail(address)).toBeNull();
  });

  test("solving the shapes creates the account", async ({ page }) => {
    const address = fresh("tiles");
    await page.goto("/register");
    await expect(page.getByTestId("human-check-prompt")).toBeVisible(); // the puzzle has loaded
    await fillRegistration(page, address);
    await solveTiles(page);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/sign-in\?registered=1$/, { timeout: 30_000 });
    const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
    expect(await findUserByEmail(address)).not.toBeNull();
  });

  test("the text alternative works for people who cannot use the shapes", async ({ page }) => {
    const address = fresh("sum");
    await page.goto("/register");
    await expect(page.getByTestId("human-check-prompt")).toBeVisible(); // the puzzle has loaded
    await fillRegistration(page, address);
    await page.getByTestId("human-text-alt").click();
    await expect(page.getByTestId("human-check-prompt")).toContainText(/^What is \w+ plus \w+\? Type the number\.$/);
    await solveSum(page);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/sign-in\?registered=1$/, { timeout: 30_000 });
  });

  const apiBody = (baseURL: string, email: string, extra: Record<string, unknown> = {}) => ({
    data: { name: "Script Bot", email, password: STRONG_PASSWORD, country: "MY", dateOfBirth: "1990-01-01", consent: true, ...extra },
    headers: { origin: baseURL, "x-test-no-human-check": "0" },
  });
  type Puzzle = { id: string; prompt: string; tiles: { shape: string }[] };
  const puzzle = async (request: import("@playwright/test").APIRequestContext) => (await (await request.get("/api/human-check", { headers: { "x-test-no-human-check": "0" } })).json()).challenge as Puzzle;
  const answerFor = (c: Puzzle) => {
    const target = /Tap every (\w+)/.exec(c.prompt)![1]!;
    return c.tiles.flatMap((t, i) => (t.shape === target ? [i] : [])).join(",");
  };

  test("a script calling the sign-up endpoint directly is refused: no answer, a wrong answer, a filled honeypot", async ({ request, baseURL }) => {
    // (Three sign-up calls: the endpoint's own limit is three a minute.)
    const none = await request.post("/api/auth/sign-up/email", apiBody(baseURL!, fresh("bot-none")));
    expect(none.status()).toBe(400);
    expect((await none.json()).code).toBe("HUMAN_CHECK_FAILED");

    const c1 = await puzzle(request);
    const wrong = await request.post("/api/auth/sign-up/email", apiBody(baseURL!, fresh("bot-wrong"), { humanChallengeId: c1.id, humanAnswer: "0,1,2,3,4,5,6,7,8" }));
    expect((await wrong.json()).code).toBe("HUMAN_CHECK_FAILED");

    const c2 = await puzzle(request);
    const trap = await request.post("/api/auth/sign-up/email", apiBody(baseURL!, fresh("bot-trap"), { humanChallengeId: c2.id, humanAnswer: answerFor(c2), hpCompany: "http://spam.example" }));
    expect((await trap.json()).code).toBe("HUMAN_CHECK_FAILED");
  });

  test("a correct answer works through the endpoint ONCE — the same challenge cannot be replayed for another account", async ({ request, baseURL }) => {
    const c = await puzzle(request);
    const good = await request.post("/api/auth/sign-up/email", apiBody(baseURL!, fresh("bot-good"), { humanChallengeId: c.id, humanAnswer: answerFor(c) }));
    expect(good.status(), await good.text()).toBe(200);
    const replay = await request.post("/api/auth/sign-up/email", apiBody(baseURL!, fresh("bot-replay"), { humanChallengeId: c.id, humanAnswer: answerFor(c) }));
    expect((await replay.json()).code).toBe("HUMAN_CHECK_FAILED");
  });

  test("the challenge endpoint never reveals an answer and is rate-limited per client", async ({ request }) => {
    const first = await request.get("/api/human-check", { headers: { "x-test-no-human-check": "0" } });
    expect(first.headers()["cache-control"]).toContain("no-store");
    const json = await first.json();
    expect(JSON.stringify(json).toLowerCase()).not.toMatch(/answer|hash/);
    let limited = false;
    for (let i = 0; i < 25 && !limited; i++) limited = (await request.get("/api/human-check", { headers: { "x-test-no-human-check": "0" } })).status() === 429;
    expect(limited).toBe(true);
  });
});

test("the activation link opens a confirmation page; signing in with your own password then shows the confirmation READ FROM THE DATABASE; a tampered link is refused kindly", async ({ page }) => {
  const address = fresh("activate");
  await page.goto("/register");
  await fillRegistration(page, address);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/, { timeout: 30_000 });

  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  expect((await findUserByEmail(address))!.emailVerifiedAt).toBeNull(); // not confirmed until the link is used

  const mail = await waitForEmail(address, "identity.verify-email");
  const link = firstLink(mail.textBody);
  await page.goto(link);
  // The link opens the confirmation page and does NOT sign anyone in (security review: auto sign-in could
  // log a victim into an attacker's pre-registered account) — so it is the neutral, signed-out view.
  await expect(page).toHaveURL(/\/email-confirmed$/);
  await expect(page.getByTestId("email-confirmed-signed-out")).toBeVisible();
  expect((await findUserByEmail(address))!.emailVerifiedAt).not.toBeNull(); // confirmed AT DATABASE LEVEL

  // Sign in with the person's OWN password: the page then shows the confirmation read back from the database.
  await page.getByTestId("email-confirmed-signed-out").getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/sign-in\?return-to=%2Femail-confirmed$/);
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/email-confirmed$/);
  await expect(page.getByTestId("email-confirmed")).toBeVisible();
  await expect(page.getByTestId("email-confirmed-address")).toHaveText(address.toLowerCase());
  await expect(page.getByTestId("email-confirmed-at")).not.toBeEmpty();

  // A tampered link is refused kindly, with a way to get a new one.
  await page.context().clearCookies();
  await page.goto(link.replace(/token=[^&]+/, "token=not-a-real-token"));
  await expect(page.getByTestId("email-link-invalid")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send a new link" })).toBeVisible();
});

test("opened signed out (e.g. on another device), the confirmation page is neutral and offers sign-in", async ({ page }) => {
  await page.goto("/email-confirmed");
  await expect(page.getByTestId("email-confirmed-signed-out")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
});
