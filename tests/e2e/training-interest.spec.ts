import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { completeProfileByEmail, deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * "Register your interest" and the Formats / Users Interest tabs through the
 * screens (CR-2026-10-01-2138). Stripe keys are blank in the Playwright
 * environment, so a card payer is told payments are not configured (nothing is
 * charged, nothing is recorded) — the paid path is covered end to end by
 * tests/integration/training-interest.test.ts with a fake gateway and the
 * signed webhook; here the confirmed row for the card payer is written
 * directly, to exercise what the Trainer and the administrator then see. A
 * participant in Pakistan registers through the real form without the fee.
 */
test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const adminEmail = uniqueEmail("e2e-int-admin");
const trainerEmail = uniqueEmail("e2e-int-trainer");
const strangerEmail = uniqueEmail("e2e-int-stranger");
const cardEmail = uniqueEmail("e2e-int-card");
const pkEmail = uniqueEmail("e2e-int-pk");
const plainEmail = uniqueEmail("e2e-int-plain");
let slug = "";
let programmeId = "";
let formatId = "";
let formatCode = "";
const formatName = `Interest E2E ${run}`;
const expertIds: string[] = [];
const offeringIds: string[] = [];

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const interestIds = (await prisma.trainingInterest.findMany({ where: { deliveryFormatId: formatId || undefined }, select: { id: true } })).map((i) => i.id);
  await prisma.auditLog.deleteMany({ where: { entityType: "training_interest", entityId: { in: interestIds } } });
  await prisma.trainingInterest.deleteMany({ where: { id: { in: interestIds } } });
  await prisma.scheduledOffering.deleteMany({ where: { id: { in: offeringIds } } });
  if (formatId) await prisma.deliveryFormat.deleteMany({ where: { id: formatId } });
  await prisma.programmeExpert.deleteMany({ where: { expertId: { in: expertIds } } });
  await prisma.expert.deleteMany({ where: { id: { in: expertIds } } });
  for (const e of [adminEmail, trainerEmail, strangerEmail, cardEmail, pkEmail, plainEmail]) await deleteTestUser(e);
  await disconnectPrisma();
});

async function register(page: Page, address: string, name: string) {
  await resetRateLimits(); // one test registers six people from one address
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/, { timeout: 30_000 });
}
async function signIn(page: Page, address: string) {
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}
async function noAxeViolations(page: Page, scope: string) {
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expect.poll(async () => (await page.title()).trim().length, { timeout: 10_000 }).toBeGreaterThan(0); // the streamed <title> must be present first
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).include(scope).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
}
const formatCard = (page: Page) => page.getByTestId(`interest-${formatId}`);

test("setup: a format with no date on a published training, an administrator, a linked Trainer, an unlinked Trainer and three participants", async ({ page }) => {
  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const programme = await prisma.programme.findFirstOrThrow({ where: { status: "published" }, orderBy: { sortOrder: "asc" }, select: { id: true, slug: true } });
  programmeId = programme.id;
  slug = programme.slug;
  formatCode = `e2e-int-${run}`;
  const format = await prisma.deliveryFormat.create({ data: { programmeId, code: formatCode, name: formatName, badge: "Bootcamp", durationLabel: "1 week", scheduleLabel: "2 hours a day", totalTimeLabel: "10 hours", bestFor: ["Busy professionals"], position: 950 } });
  formatId = format.id;

  await register(page, adminEmail, "Ada Interest Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  for (const [address, who] of [[trainerEmail, "Tess Interest Trainer"], [strangerEmail, "Sam Unlinked Trainer"]] as const) {
    await register(page, address, who);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: address.toLowerCase() }, select: { id: true } });
    const expert = await prisma.expert.create({
      data: { userId: user.id, slug: `e2e-int-expert-${randomUUID().slice(0, 6)}`, name: who, roleTitle: "Trainer", location: "Kuala Lumpur", headline: "x", experienceLine: "x", summary: "x", photoPath: "/x.png", expertise: [], profile: {}, published: false },
    });
    expertIds.push(expert.id);
    await grantRoleByEmail(address, "expert");
    if (address === trainerEmail) await prisma.programmeExpert.create({ data: { programmeId, expertId: expert.id } });
  }
  await register(page, cardEmail, "Cara Card Payer");
  await completeProfileByEmail(cardEmail, { legalName: "Cara Card Payer" });
  await register(page, pkEmail, "Parveen Karachi");
  await completeProfileByEmail(pkEmail, { legalName: "Parveen Karachi", countryCode: "PK", nationalityCode: "PK" });
  await register(page, plainEmail, "Plain Participant");
});

test("signed out: the format says no date is scheduled and offers to sign in; the heading and non-refundable fee are plain", async ({ page }) => {
  await page.goto(`/programs/${slug}`);
  const signin = page.getByTestId(`interest-signin-${formatCode}`);
  await expect(signin).toContainText("No date is scheduled yet");
  await expect(signin.getByTestId("interest-signin")).toContainText("USD 2, non-refundable");
  await expect(signin.getByTestId("interest-signin")).toHaveAttribute("href", new RegExp(`/sign-in\\?return-to=.*${slug}`));
});

test("the hero \"Register your interest\" button leads where the format's \"Sign in to register your interest\" link does; signed in, it lands on the formats (CR-2026-10-02-0721)", async ({ page }) => {
  await page.goto(`/programs/${slug}`);
  const hero = page.getByTestId("hero-interest");
  await expect(hero).toContainText("Register your interest");
  // Same destination as the link under the format — not the old mailto.
  const formatLink = await page.getByTestId(`interest-signin-${formatCode}`).getByTestId("interest-signin").getAttribute("href");
  await expect(hero).toHaveAttribute("href", formatLink!);
  await expect(hero).not.toHaveAttribute("href", /^mailto:/);

  await hero.click();
  await expect(page).toHaveURL(new RegExp(`/sign-in\\?return-to=.*${slug}`));
  await page.getByLabel("Email", { exact: true }).fill(cardEmail);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  // After signing in the person is back on the training, at the formats, where the form is.
  await expect(page).toHaveURL(new RegExp(`/programs/${slug}#formats$`), { timeout: 30_000 });
  await expect(formatCard(page).getByTestId("interest-open")).toBeVisible();
  // Signed in, the button goes straight to the formats on the same page.
  await expect(page.getByTestId("hero-interest")).toHaveAttribute("href", "#formats");
});

test("the schedule's \"Register interest\" for a training with no dates leads to the interest flow: sign-in signed out, the formats signed in; never Stripe (CR-2026-10-02-2010)", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto(`/schedule?training=${slug}`);
  await expect(page.getByTestId("schedule-training-empty")).toBeVisible();
  const button = page.getByTestId("schedule-register-interest");
  await expect(button).toContainText("Register interest");
  // Same destination as the training page's own "Sign in to register your interest" link — not the old mailto.
  const formatLink = await (async () => {
    await page.goto(`/programs/${slug}`);
    return page.getByTestId(`interest-signin-${formatCode}`).getByTestId("interest-signin").getAttribute("href");
  })();
  await page.goto(`/schedule?training=${slug}`);
  await expect(button).toHaveAttribute("href", formatLink!);
  await expect(button).not.toHaveAttribute("href", /^mailto:/);
  await button.click();
  await expect(page).toHaveURL(new RegExp(`/sign-in\\?return-to=.*${slug}`));
  // Signed in: the same button lands on the training's formats, where the form is.
  await signIn(page, cardEmail);
  await page.goto(`/schedule?training=${slug}`);
  await expect(page.getByTestId("schedule-register-interest")).toHaveAttribute("href", `/programs/${slug}#formats`);
  await page.getByTestId("schedule-register-interest").click();
  await expect(page).toHaveURL(new RegExp(`/programs/${slug}#formats$`));
  await expect(page.getByTestId("interest-open").first()).toBeVisible();
});

test("a card payer: the form states the fee is non-refundable, validates, and with Stripe not configured charges and records nothing", async ({ page }) => {
  await signIn(page, cardEmail);
  await page.goto(`/programs/${slug}`);
  const card = formatCard(page);
  await card.getByTestId("interest-open").click();
  await expect(card.getByTestId("interest-open")).toContainText("USD 2 (non-refundable)");
  await expect(card).toContainText("non-refundable");
  await expect(card).toContainText("does not reserve a seat");
  await expect(card.getByLabel("Email")).toHaveValue(cardEmail);
  await noAxeViolations(page, `[data-testid="interest-${formatId}"]`);

  // No consent tick → the field says so; nothing is saved.
  await card.getByTestId("interest-submit").click();
  await expect(card.getByText("Please tick the box so the trainer may contact you")).toBeVisible();
  // A bad email is refused before anything else.
  await card.getByLabel("Email").fill("not-an-email");
  await card.getByRole("checkbox").check();
  await card.getByTestId("interest-submit").click();
  await expect(card.getByText("Enter a valid email address.")).toBeVisible();
  // A good form, with Stripe keys blank: told so; nothing charged, nothing recorded.
  await card.getByLabel("Email").fill(cardEmail);
  await card.getByTestId("interest-submit").click();
  await expect(card.getByText(/Online payments are not configured/).first()).toBeVisible();
  const { getPrisma } = await import("../../src/db/prisma");
  expect(await getPrisma().trainingInterest.count({ where: { deliveryFormatId: formatId } })).toBe(0);
});

test("a participant in Pakistan registers through the real form without the fee; the training page and My Trainings then show it", async ({ page }) => {
  await signIn(page, pkEmail);
  await page.goto(`/programs/${slug}`);
  const card = formatCard(page);
  await card.getByTestId("interest-open").click();
  await expect(card.getByTestId("interest-open")).toContainText("free for you");
  await expect(card).toContainText("No fee applies to participants in Pakistan");
  await card.getByLabel("Full name").fill("Parveen Karachi");
  await card.getByLabel("Mobile number").fill("+92 300 1234567");
  await card.getByLabel("Date of birth").fill("1992-04-05");
  await card.getByRole("checkbox").check();
  await card.getByTestId("interest-submit").click();
  // The action refreshes the page, which now shows the format as registered (the form's own
  // "no fee applies to you" confirmation shows only if the page is not refreshed first).
  await expect(page.getByTestId(`interest-done-${formatCode}`).or(card.getByTestId("interest-registered"))).toContainText(/Your interest is registered|no fee applies to you/);

  const { getPrisma } = await import("../../src/db/prisma");
  const row = await getPrisma().trainingInterest.findFirstOrThrow({ where: { deliveryFormatId: formatId } });
  expect(row).toMatchObject({ status: "confirmed", feeWaived: true, orderId: null, mobile: "+92 300 1234567", email: pkEmail.toLowerCase(), consent: true });
  expect(await getPrisma().order.count({ where: { user: { email: pkEmail.toLowerCase() } } })).toBe(0);

  await page.reload();
  await expect(page.getByTestId(`interest-done-${formatCode}`)).toContainText("Your interest is registered");
  await page.goto("/account/trainings");
  const mine = page.getByTestId("trainings-interests").getByTestId("interest-card");
  await expect(mine).toHaveCount(1);
  await expect(mine).toContainText(formatName);
  await expect(mine).toContainText("No fee");
  await expect(mine.getByTestId("interest-state")).toContainText("No date is scheduled yet");
  await noAxeViolations(page, '[data-testid="trainings-interests"]');
});

test("the Trainer's Formats card, Formats tab and Users Interest tab show their own training's interest — with the person's details, a BCC draft, CSV and Mark as notified", async ({ page }) => {
  // The card payer's payment is confirmed (the webhook's work, written directly here).
  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const card = await prisma.user.findUniqueOrThrow({ where: { email: cardEmail.toLowerCase() }, select: { id: true } });
  await prisma.trainingInterest.create({ data: { programmeId, deliveryFormatId: formatId, userId: card.id, email: cardEmail.toLowerCase(), fullName: "Cara Card Payer", mobile: "+60 12 345 6789", dateOfBirth: new Date(Date.UTC(1991, 1, 3)), consent: true, status: "confirmed", confirmedAt: new Date() } });

  await signIn(page, trainerEmail);
  await page.goto("/admin");
  await expect(page.getByTestId("admin-card-formats")).toBeVisible();
  await expect(page.getByTestId("admin-formats-interest")).toContainText("people are interested");
  // The tabs.
  const nav = page.getByRole("navigation", { name: /Admin sections|Admin/ });
  await expect(page.getByRole("link", { name: "Formats", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Users Interest", exact: true }).first()).toBeVisible();
  void nav;

  await page.goto("/admin/formats");
  await expect(page.getByTestId("formats-title")).toBeVisible();
  const row = page.locator(`[data-testid="formats-row"][data-format="${formatId}"]`);
  await expect(row).toContainText(formatName);
  await expect(row.getByTestId("formats-dates")).toContainText("No open date");
  await expect(row.getByTestId("formats-interest")).toContainText("2 (2 not yet told)");
  await expect(row.getByRole("link", { name: new RegExp(`Schedule .* — ${formatName}`) })).toHaveAttribute("href", `/admin/trainings/${programmeId}/dates`);
  await noAxeViolations(page, "main");

  await page.goto(`/admin/interest?format=${formatId}`);
  await expect(page.getByTestId("interest-title")).toBeVisible();
  const rows = page.getByTestId("interest-row");
  await expect(rows).toHaveCount(2);
  await expect(page.getByTestId("interest-table")).toContainText("1991-02-03"); // date of birth shown to the training's trainer
  await expect(page.getByTestId("interest-table")).toContainText("1992-04-05");
  await expect(page.getByTestId("interest-table")).toContainText("Fee waived");
  // Copy, BCC draft, CSV.
  await expect(page.getByTestId("interest-copy-emails")).toBeVisible();
  const mailto = await page.getByTestId("interest-mailto").getAttribute("href");
  expect(mailto).toMatch(/^mailto:\?bcc=/);
  expect(decodeURIComponent(mailto!)).toContain(cardEmail.toLowerCase());
  expect(decodeURIComponent(mailto!)).toContain(pkEmail.toLowerCase());
  await expect(page.getByTestId("interest-draft")).toContainText(`You registered your interest in`);
  await expect(page.getByTestId("interest-draft")).toContainText(`/programs/${slug}`);
  const csv = await page.request.get(`/admin/interest/export.csv?format=${formatId}`);
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(csv.headers()["content-disposition"]).toContain("users-interest");
  const body = await csv.text();
  expect(body.split("\n")[0]).toContain("Date of birth");
  expect(body).toContain(cardEmail.toLowerCase());
  expect(body).toContain(pkEmail.toLowerCase());
  await noAxeViolations(page, "main");

  // Mark one person as notified.
  await rows.filter({ hasText: cardEmail.toLowerCase() }).getByRole("checkbox").check();
  await page.getByTestId("interest-mark-notified").click();
  await expect(page.getByTestId("interest-mark-status")).toContainText("Marked 1 person as notified");
  await page.reload();
  await expect(rows.filter({ hasText: cardEmail.toLowerCase() }).getByTestId("interest-notified")).not.toHaveText("Not yet");
  await expect(rows.filter({ hasText: pkEmail.toLowerCase() }).getByTestId("interest-notified")).toHaveText("Not yet");
  // The filter "not yet told" now lists one.
  await page.goto(`/admin/interest?format=${formatId}&notified=no`);
  await expect(page.getByTestId("interest-row")).toHaveCount(1);
});

test("another Trainer (not linked to this training) sees none of it; a plain participant is refused, page and CSV", async ({ page }) => {
  await signIn(page, strangerEmail);
  await page.goto(`/admin/interest?format=${formatId}`);
  await expect(page.getByTestId("interest-empty")).toBeVisible();
  const csv = await page.request.get(`/admin/interest/export.csv?format=${formatId}`);
  expect(csv.status()).toBe(200);
  expect(await csv.text()).not.toContain(pkEmail.toLowerCase());
  await page.goto("/admin/formats");
  await expect(page.locator(`[data-testid="formats-row"][data-format="${formatId}"]`)).toHaveCount(0);

  await signIn(page, plainEmail);
  const res = await page.goto("/admin/interest");
  expect(res?.status()).toBe(403);
  expect((await page.request.get("/admin/interest/export.csv")).status()).toBe(403);
  expect((await page.goto("/admin/formats"))?.status()).toBe(403);
});

test("the administrator sees every interest, the Formats card, and the fee setting (USD 2.00, linked from Orders)", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.goto("/admin");
  await expect(page.getByTestId("admin-card-formats")).toBeVisible();
  await page.goto(`/admin/interest?format=${formatId}`);
  await expect(page.getByTestId("interest-row")).toHaveCount(2);
  await page.goto("/admin/orders");
  await page.getByTestId("admin-interest-setting-link").click();
  await expect(page).toHaveURL(/\/admin\/orders\/interest$/);
  await expect(page.getByTestId("interest-setting-amount")).toContainText("USD 2.00");
  await expect(page.getByTestId("interest-setting-form")).toBeVisible();
  await noAxeViolations(page, "main");
});

test("once a date is scheduled for the format, interest closes: the training page points to the dates and My Trainings says a date is open", async ({ page }) => {
  const { getPrisma } = await import("../../src/db/prisma");
  const start = new Date(Date.now() + 20 * 86_400_000);
  const offering = await getPrisma().scheduledOffering.create({ data: { programmeId, deliveryFormatId: formatId, modality: "live_online", timezone: "Asia/Kuala_Lumpur", startsOn: start, endsOn: new Date(start.getTime() + 4 * 86_400_000), status: "open" } });
  offeringIds.push(offering.id);
  await signIn(page, pkEmail);
  await page.goto(`/programs/${slug}`);
  await expect(page.getByTestId(`interest-dates-${formatCode}`)).toContainText("Dates are open for this format");
  await expect(page.getByTestId(`interest-${formatId}`)).toHaveCount(0);
  await page.goto("/account/trainings");
  await expect(page.getByTestId("interest-card").getByTestId("interest-state")).toContainText("A date is now open");
});
