import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Milestone 12 WP2 — a training LAUNCHED entirely from the portal, end to
 * end through the real screens against the test database (plan §7 V2):
 * an administrator creates a draft, writes its sections, adds a module,
 * sets the four fee rows, schedules an open date (the offering form is
 * pre-selected with the training), publishes it — and the public site
 * shows it on /programs, renders its page with the four-row Investment
 * cards, and offers Register on /schedule. Every new screen is axe-clean.
 * Everything created here is removed in afterAll.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const email = uniqueEmail("e2e-trainings-admin");
const title = `E2E Training ${run}`;
const slug = `e2e-training-${run}`;
const marker = `e2e-training-date-${run}`;

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const programme = await prisma.programme.findUnique({ where: { slug }, select: { id: true } });
  if (programme) {
    const offerings = await prisma.scheduledOffering.findMany({ where: { programmeId: programme.id }, select: { id: true } });
    const ids = offerings.map((o) => o.id);
    if (ids.length) {
      await prisma.auditLog.deleteMany({ where: { entityType: "offering", entityId: { in: ids } } });
      await prisma.scheduledOffering.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.auditLog.deleteMany({ where: { entityType: "programme", entityId: programme.id } });
    await prisma.programme.delete({ where: { id: programme.id } });
  }
  await deleteTestUser(email);
  await disconnectPrisma();
});

async function registerViaUi(page: Page, address: string, name = "Tara Trainings") {
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
  await page.getByLabel("Email").fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

function futureDate(monthsAhead: number, day: number): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + monthsAhead, day));
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

test("an administrator launches a training from the portal: draft → sections → curriculum → fees → date → publish → public", async ({ page }) => {
  await registerViaUi(page, email);
  await grantRoleByEmail(email, "platform_admin");
  await signInViaUi(page, email);

  // The admin bar has the new entry; the list is reachable and empty of ours.
  await page.goto("/admin");
  await page.getByTestId("admin-nav").getByRole("link", { name: "Trainings" }).click();
  await expect(page).toHaveURL(/\/admin\/trainings$/);
  await expect(page.getByTestId("trainings-title")).toHaveText("Trainings");
  await expect(page.getByTestId("training-row").filter({ hasText: title })).toHaveCount(0);
  await expectNoAxeViolations(page);

  // 1. Details → draft. The slug is generated from the title.
  await page.getByTestId("new-training").click();
  await expect(page).toHaveURL(/\/admin\/trainings\/new$/);
  const form = page.getByRole("form", { name: "New training" });
  await expect(form).toBeVisible();
  await expectNoAxeViolations(page);
  await form.getByLabel("Title", { exact: true }).fill(title);
  await form.getByLabel("Subtitle").fill("Launched from the portal");
  await form.getByLabel("Duration").fill("1 day");
  await form.getByLabel(/^Audience summary/).fill("People launching trainings");
  await form.getByLabel(/^Summary/).fill("A training created through /admin/trainings.");
  await form.getByLabel(/^Value proposition/).fill("Proves the launch flow.");
  await form.getByLabel(/^Prerequisites/).fill("None.");
  // A validation error keeps what was typed.
  await form.getByLabel(/^Delivery labels/).fill("");
  await page.getByTestId("training-save").click();
  await expect(page.getByText(/List at least one delivery label/)).toBeVisible();
  await expect(form.getByLabel("Title", { exact: true })).toHaveValue(title);
  await form.getByLabel(/^Delivery labels/).fill("Live online");
  await page.getByTestId("training-save").click();
  await expect(page.getByTestId("training-created")).toBeVisible();
  await expect(page.getByTestId("training-created")).toContainText(`/programs/${slug}`);

  // Not public while a draft.
  const draft = await page.request.get(`/programs/${slug}`);
  expect(draft.status()).toBe(404);

  // 2. Sections.
  await page.getByTestId("training-created-content").click();
  await expect(page).toHaveURL(/\/admin\/trainings\/[0-9a-f-]+\/content$/);
  const trainingUrl = page.url().replace(/\/content$/, "");
  await expect(page.getByTestId("training-title")).toHaveText(title);
  await expect(page.getByTestId("training-tabs").getByRole("link", { name: "Content" })).toHaveAttribute("aria-current", "page");
  await expectNoAxeViolations(page);
  const content = page.getByRole("form", { name: "Edit training sections" });
  await content.getByLabel(/^Highlights/).fill("Hands-on\nOne day");
  await content.getByLabel(/^Who should attend — introduction/).fill("Anyone who launches trainings.");
  await content.getByLabel(/^Who should attend — roles/).fill("Trainers\nAdministrators");
  await content.getByLabel(/^Why this training — heading/).fill("Why launch here");
  await content.getByLabel(/^Why this training — paragraphs/).fill("Because the portal is the truth.");
  await content.getByLabel(/^Questions and answers/).fill("Q: Is it real?\nA: Yes.");
  await page.getByTestId("training-content-save").click();
  await expect(content.getByText("Your changes have been saved.")).toBeVisible();

  // 3. Curriculum — one module with a grouped point list.
  await page.getByTestId("training-tab-curriculum").click();
  await expect(page).toHaveURL(/\/modules$/);
  await expectNoAxeViolations(page);
  const modules = page.getByRole("form", { name: "Edit curriculum" });
  await modules.getByLabel("Title", { exact: true }).first().fill("Module 1: Launch");
  await modules.getByLabel(/^Points/).first().fill("Create the draft\n## Publish\n> the last step\nTick, publish");
  await page.getByTestId("training-modules-save").click();
  await expect(modules.getByText("Your changes have been saved.")).toBeVisible();

  // 4. The four fee rows.
  await page.getByTestId("training-tab-fees").click();
  await expect(page).toHaveURL(/\/fees$/);
  await expect(page.getByTestId("fees-summary")).toContainText("0 of 4 fee rows set");
  await expectNoAxeViolations(page);
  const fees: [string, string, string, string][] = [
    ["malaysia_hrdcorp", "5000", "5000", "Full fee"],
    ["malaysia", "5000", "2500", "50% OFF"],
    ["pakistan", "200000", "100000", "50% OFF"],
    ["international", "4000", "1000", "75% OFF"],
  ];
  for (const [region, list, offer, label] of fees) {
    const row = page.getByTestId(`fee-row-${region}`);
    await row.getByLabel(/^Full price/).fill(list);
    await row.getByLabel(/^Today's price/).fill(offer);
    await row.getByLabel(/^Label beside the price/).fill(label);
    if (region.startsWith("malaysia")) await row.getByLabel(/^Minimum participants/).fill("25");
    await page.getByTestId(`fee-save-${region}`).click();
    await expect(row.getByText("Saved.")).toBeVisible();
  }
  await page.reload();
  await expect(page.getByTestId("fees-summary")).toContainText("4 of 4 fee rows set");
  // Today's price above the full price is refused in place.
  const my = page.getByTestId("fee-row-malaysia");
  await my.getByLabel(/^Today's price/).fill("9999");
  await page.getByTestId("fee-save-malaysia").click();
  await expect(my.getByText(/cannot be higher than the full price/)).toBeVisible();

  // 5. A date — the offering form is pre-selected with this training.
  await page.getByTestId("training-tab-dates").click();
  await expect(page.getByTestId("training-dates-empty")).toBeVisible();
  await page.getByTestId("training-add-date").click();
  await expect(page).toHaveURL(/\/admin\/offerings\/new\?programmeId=/);
  const offering = page.getByRole("form", { name: "New offering" });
  await expect(offering.getByLabel("Programme", { exact: true })).toHaveValue(trainingUrl.split("/").pop()!);
  await offering.getByLabel("Delivery").selectOption("live_online");
  await offering.getByLabel("First day").fill(iso(futureDate(3, 6)));
  await offering.getByLabel("Last day").fill(iso(futureDate(3, 6)));
  await offering.getByLabel("Status").selectOption("open");
  await offering.getByLabel(/^Capacity/).fill("10");
  await offering.getByLabel(/^Schedule note/).fill(marker);
  await page.getByTestId("offering-save").click();
  await expect(page.getByTestId("offering-created")).toBeVisible();
  await page.goto(`${trainingUrl}/dates`);
  await expect(page.getByTestId("training-date-row")).toHaveCount(1);
  await expect(page.getByTestId("training-date-row")).toContainText("Open");

  // 6. Publish (administrators only; readiness satisfied).
  await page.goto(trainingUrl);
  await expect(page.getByTestId("training-tabs").getByRole("link", { name: "Details" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("training-not-ready")).toHaveCount(0);
  await page.getByTestId("training-status-confirm").check();
  await page.getByTestId("training-status-submit").click();
  await expect(page.getByText("Visibility changed.")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("training-public-link")).toHaveAttribute("href", `/programs/${slug}`);
  await expect(page.getByTestId("training-workspace")).toContainText("Published");
  // The address is locked once published.
  await expect(page.getByRole("form", { name: "Edit training details" }).getByLabel(/^Public address/)).toBeDisabled();

  // 7. Public: listed, rendered with the four-row Investment cards, bookable.
  await page.goto("/programs");
  const card = page.getByTestId("trainings-list").locator("> li").filter({ hasText: title });
  await expect(card).toHaveCount(1);
  await expect(card.getByTestId("card-price-row-malaysia_hrdcorp")).toContainText("RM 5,000");
  await expect(card.getByTestId("card-price-row-malaysia")).toContainText("RM 2,500");
  await expect(card.getByTestId("card-price-international")).toContainText("Rest of the world");
  await page.goto(`/programs/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
  await expect(page.getByText("Hands-on", { exact: true })).toBeVisible();
  await expect(page.getByText("Module 1: Launch")).toBeVisible();
  const investment = page.locator("#investment");
  await expect(investment.getByTestId("price-row-malaysia_hrdcorp")).toContainText("RM 5,000");
  await expect(investment.getByTestId("price-row-malaysia")).toContainText("RM 2,500");
  await expect(investment.getByTestId("price-card-international")).toContainText("USD 1,000");
  await expectNoAxeViolations(page);
  // Bookable from its own page (M12 L11) and from the grouped /schedule.
  await page.goto(`/programs/${slug}`);
  await expect(page.getByTestId("hero-register")).toHaveAttribute("href", "#dates");
  const dates = page.getByTestId("programme-dates");
  await expect(dates.getByTestId("offering-card")).toHaveCount(1);
  await expect(dates.getByTestId("register")).toHaveAttribute("href", /^\/checkout\/[0-9a-f-]+$/);
  await page.goto("/schedule");
  const group = page.getByTestId("schedule-group").filter({ has: page.locator(`[data-slug="${slug}"]`) }).or(page.locator(`[data-testid="schedule-group"][data-slug="${slug}"]`));
  await expect(group.first()).toBeVisible();
  await expect(group.first().getByRole("heading", { name: title })).toBeVisible();
  await expect(group.first().getByTestId("register")).toHaveAttribute("href", /^\/checkout\//);
  await expect(group.first()).toContainText(marker);

  // The audit trail records the launch.
  const { getPrisma } = await import("../../src/db/prisma");
  const programme = await getPrisma().programme.findUnique({ where: { slug }, select: { id: true } });
  const actions = (await getPrisma().auditLog.findMany({ where: { entityType: "programme", entityId: programme!.id }, orderBy: { createdAt: "asc" }, select: { action: true } })).map((a) => a.action);
  expect(actions[0]).toBe("programme.created");
  expect(actions).toEqual(expect.arrayContaining(["programme.content_updated", "programme.modules_updated", "programme.fee_updated", "programme.status_changed"]));
  expect(actions.filter((a) => a === "programme.fee_updated")).toHaveLength(4);
});

test("a Trainer sees only the Trainings area, creates their own draft, cannot publish, and is refused everywhere else (WP3; L2, L3, L7)", async ({ page }) => {
  const trainerEmail = uniqueEmail("e2e-trainer");
  const trainerTitle = `E2E Trainer Draft ${run}`;
  const trainerSlug = `e2e-trainer-draft-${run}`;
  await registerViaUi(page, trainerEmail, "Tess Trainer");
  // The administrator grants Trainer from the person's page (creates the profile).
  await signInViaUi(page, email);
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const trainerUser = (await findUserByEmail(trainerEmail))!;
  await page.goto(`/admin/users/${trainerUser.id}`);
  await page.getByTestId("grant-trainer-submit").click();
  // The action revalidates the page: the grant form gives way to the revoke form.
  await expect(page.getByTestId("revoke-trainer-form")).toBeVisible();
  await expect(page.getByTestId("grant-trainer-form")).toHaveCount(0);
  await expect(page.getByTestId("admin-user-roles")).toContainText("Trainer");
  // Sign out by clearing the session cookie, then in as the trainer.
  await page.context().clearCookies();
  await signInViaUi(page, trainerEmail);

  // Reduced dashboard and bar.
  await page.goto("/admin");
  await expect(page.getByTestId("trainer-dashboard")).toBeVisible();
  await expect(page.getByTestId("admin-nav").getByRole("link")).toHaveCount(2);
  await expect(page.getByTestId("admin-card-trainings")).toContainText("No trainings yet");
  await expect(page.getByTestId("admin-card-reviews")).toHaveCount(0);
  // Every other screen is a 403 — and the flagship's workspace a 404 (not theirs).
  for (const path of ["/admin/orders", "/admin/users", "/admin/audit", "/admin/reports", "/admin/enquiries", "/admin/certificates"]) {
    const res = await page.request.get(path);
    expect(res.status(), path).toBe(403);
  }
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const flagship = (await findFlagshipProgramme())!;
  expect((await page.request.get(`/admin/trainings/${flagship.id}`)).status()).toBe(404);
  expect((await page.request.get(`/admin/offerings/${flagship.id}/participants`)).status()).toBe(403);

  // Creates their own draft — linked to them, visible only to them; no publish control.
  await page.goto("/admin/trainings/new");
  const form = page.getByRole("form", { name: "New training" });
  await form.getByLabel("Title", { exact: true }).fill(trainerTitle);
  await form.getByLabel("Subtitle").fill("A trainer's draft");
  await form.getByLabel("Duration").fill("Half a day");
  await form.getByLabel(/^Audience summary/).fill("Trainers");
  await form.getByLabel(/^Summary/).fill("Created by a trainer.");
  await form.getByLabel(/^Value proposition/).fill("Trainer-made.");
  await form.getByLabel(/^Prerequisites/).fill("None.");
  await page.getByTestId("training-save").click();
  await expect(page.getByTestId("training-created")).toContainText(`/programs/${trainerSlug}`);
  await page.goto("/admin/trainings");
  await expect(page.getByTestId("trainings-title")).toHaveText("My trainings");
  await expect(page.getByTestId("training-row")).toHaveCount(1);
  await page.getByTestId("training-row").getByRole("link", { name: /Edit/ }).click();
  await expect(page.getByTestId("training-status-readonly")).toBeVisible();
  await expect(page.getByTestId("training-status-form")).toHaveCount(0);
  // The offering form offers only their training.
  await page.getByTestId("training-tab-dates").click();
  await page.getByTestId("training-add-date").click();
  const offering = page.getByRole("form", { name: "New offering" });
  await expect(offering.getByLabel("Programme", { exact: true }).locator("option")).toHaveCount(1);

  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const mine = await prisma.programme.findUnique({ where: { slug: trainerSlug }, select: { id: true } });
  if (mine) {
    await prisma.auditLog.deleteMany({ where: { entityType: "programme", entityId: mine.id } });
    await prisma.programme.delete({ where: { id: mine.id } });
  }
  await prisma.expert.deleteMany({ where: { userId: trainerUser.id } });
  await deleteTestUser(trainerEmail);
});
