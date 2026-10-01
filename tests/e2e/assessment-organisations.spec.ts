import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addQuestions, createOrganisationFixture, createSharedRole, deleteRoleFixtures, uniqueSlug } from "../helpers/assessment-roles-db";
import { deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Organisation Interview Screening through the screens (CR-2026-10-01-1711, P4):
 * /assessment/organisations lists PUBLISHED organisations that have a listed role
 * (logo or an initial tile, a Company / Education sector chip, the number of
 * roles); an organisation's page lists its role cards; a role's page asks for the
 * REQUIRED acknowledgement that the result is shared with the organisation; the
 * test and the result are the same screens as Prepare for Interview, and the
 * organisation's own approved questions always appear (a pending question never
 * does). Fixtures are this spec's own organisations and roles (unique slugs; the
 * seed data is neither assumed nor counted) and are removed afterwards.
 */

test.describe.configure({ mode: "serial" });

const tag = Date.now().toString(36);
const email = uniqueEmail("e2e-orgs");
const otherEmail = uniqueEmail("e2e-orgs-other");
const SHARED_QUESTIONS = 30;
const OWN_QUESTIONS = 6;
const TEST_SIZE = SHARED_QUESTIONS + OWN_QUESTIONS; // 36 → four pages: 10 + 10 + 10 + 6
const PRIVATE_QUESTIONS = 12;

const LOGO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><rect width='56' height='56' fill='%23888'/></svg>";

let shared = { roleId: "", slug: "", reviewedIds: [] as string[] };
let org = { organisationId: "", slug: "" }; // company: shared role + 6 own questions + two private roles
let edu = { organisationId: "", slug: "" }; // education sector, with a logo, the shared role only
let empty = { organisationId: "", slug: "" }; // published, offers no role
let hidden = { organisationId: "", slug: "" }; // unpublished
let privateRole = { id: "", slug: "" }; // 12 approved questions → listed
let thinRole = { id: "", slug: "" }; // 3 approved questions → NOT listed (needs 10)

test.beforeAll(async () => {
  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  shared = await createSharedRole({ slugPrefix: "e2e-orgs", reviewed: SHARED_QUESTIONS, name: `E2E Org Shared Role ${tag}` });
  org = await createOrganisationFixture({ slugPrefix: "e2e-orga", type: "company", roleIds: [shared.roleId] });
  edu = await createOrganisationFixture({ slugPrefix: "e2e-orgb", type: "education", roleIds: [shared.roleId] });
  empty = await createOrganisationFixture({ slugPrefix: "e2e-orgc", roleIds: [] });
  hidden = await createOrganisationFixture({ slugPrefix: "e2e-orgd", published: false, roleIds: [shared.roleId] });
  await prisma.organisation.update({ where: { id: edu.organisationId }, data: { logoPath: LOGO } });
  // The organisation's own questions: six approved (always in its test), three still pending (never served).
  await addQuestions({ roleId: shared.roleId, organisationId: org.organisationId, count: OWN_QUESTIONS, status: "reviewed", tag: "ORGQ" });
  await addQuestions({ roleId: shared.roleId, organisationId: org.organisationId, count: 3, status: "pending", tag: "PENDQ" });
  // Its private roles: one with 12 approved questions (listed), one with 3 (below the minimum of 10, not listed).
  for (const [slugTail, count, set] of [
    ["e2e-private", PRIVATE_QUESTIONS, (r: { id: string; slug: string }) => (privateRole = r)],
    ["e2e-thin", 3, (r: { id: string; slug: string }) => (thinRole = r)],
  ] as const) {
    const slug = uniqueSlug(`${org.slug}-${slugTail}`);
    const created = await prisma.assessmentRole.create({
      data: { slug, name: `E2E ${slugTail} role ${tag}`, description: "A private role fixture.", published: true, position: 9100, organisationId: org.organisationId },
    });
    await prisma.organisationRole.create({ data: { organisationId: org.organisationId, roleId: created.id } });
    await addQuestions({ roleId: created.id, organisationId: org.organisationId, count, status: "reviewed", tag: slugTail });
    set({ id: created.id, slug });
  }
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  // Fixtures first (they remove the attempts, the private roles and their audit rows), then the people.
  await deleteRoleFixtures({
    roleIds: [shared.roleId].filter(Boolean),
    organisationIds: [org.organisationId, edu.organisationId, empty.organisationId, hidden.organisationId].filter(Boolean),
  });
  await deleteTestUser(email);
  await deleteTestUser(otherEmail);
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page) {
  // After a client-side navigation the page's <title> streams in a moment later; axe must not run before it.
  await expect.poll(async () => (await page.title()).trim().length, { timeout: 10_000 }).toBeGreaterThan(0);
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

const orgName = () => `Test organisation ${org.slug}`;
const orgPath = () => `/assessment/organisations/${org.slug}`;
const rolePath = () => `${orgPath()}/${shared.slug}`;
const privatePath = () => `${orgPath()}/${privateRole.slug}`;
const attemptIdOf = (url: string) => new URL(url).pathname.split("/").pop()!;

async function setDeadlineIn(attemptId: string, endsInMs: number) {
  const { getPrisma } = await import("../../src/db/prisma");
  await getPrisma().roleTestAttempt.update({ where: { id: attemptId }, data: { startedAt: new Date(Date.now() + endsInMs - 90 * 60_000) } });
}

test("the organisation list: published organisations with a listed role, as cards (logo or initial, type chip, role count); an organisation's role cards; unknown, unpublished and unlisted things are 404", async ({ page }) => {
  await page.goto("/assessment/organisations");
  await expect(page).toHaveTitle(/^Organisations — Interview Screening/);
  await expect(page.getByTestId("organisations-title")).toHaveText("Organisations — Interview Screening");

  // The company: an initial tile (no logo), the Company chip, and two LISTED roles (the shared one and the private one with 12 approved questions — not the one with 3).
  const card = page.getByTestId(`org-card-${org.slug}`);
  await expect(card).toContainText(orgName());
  await expect(page.getByTestId(`org-type-${org.slug}`)).toHaveText("Company");
  await expect(page.getByTestId(`org-initial-${org.slug}`)).toHaveText("T");
  await expect(page.getByTestId(`org-logo-${org.slug}`)).toHaveCount(0);
  await expect(page.getByTestId(`org-roles-${org.slug}`)).toHaveText("2 roles open for screening");
  await expect(page.getByTestId(`org-open-${org.slug}`)).toHaveAttribute("href", orgPath());

  // The education-sector organisation: its logo (a plain image with alt text) and the Education sector chip.
  await expect(page.getByTestId(`org-type-${edu.slug}`)).toHaveText("Education sector");
  await expect(page.getByTestId(`org-logo-${edu.slug}`)).toHaveAttribute("alt", `Test organisation ${edu.slug} logo`);
  await expect(page.getByTestId(`org-initial-${edu.slug}`)).toHaveCount(0);
  await expect(page.getByTestId(`org-roles-${edu.slug}`)).toHaveText("1 role open for screening");

  // Not listed: an organisation with no role, and an unpublished one.
  await expect(page.getByTestId(`org-card-${empty.slug}`)).toHaveCount(0);
  await expect(page.getByTestId(`org-card-${hidden.slug}`)).toHaveCount(0);
  await expectNoAxeViolationsBothThemes(page);

  // The organisation page: role cards, with the organisation's own questions in the count.
  await page.getByTestId(`org-open-${org.slug}`).click();
  await expect(page).toHaveURL(new RegExp(`${orgPath()}$`));
  await expect(page.getByTestId("org-title")).toHaveText(orgName());
  await expect(page.getByTestId("org-type")).toHaveText("Company");
  await expect(page.getByTestId("org-lead")).toContainText("shared with");
  await expect(page.getByTestId(`org-role-facts-${shared.slug}`)).toHaveText(`${TEST_SIZE} questions · 90 minutes · model answers`);
  await expect(page.getByTestId(`org-role-own-${shared.slug}`)).toContainText("own questions");
  await expect(page.getByTestId(`org-role-open-${shared.slug}`)).toHaveAttribute("href", rolePath());
  await expect(page.getByTestId(`org-role-facts-${privateRole.slug}`)).toHaveText(`${PRIVATE_QUESTIONS} questions · 90 minutes · model answers`);
  await expect(page.getByTestId(`org-role-card-${thinRole.slug}`)).toHaveCount(0); // below the minimum of 10 approved questions
  await expectNoAxeViolationsBothThemes(page);

  // The education organisation offers the shared role with no questions of its own: no "own questions" chip, 30 questions.
  await page.goto(`/assessment/organisations/${edu.slug}`);
  await expect(page.getByTestId(`org-role-facts-${shared.slug}`)).toHaveText(`${SHARED_QUESTIONS} questions · 90 minutes · model answers`);
  await expect(page.getByTestId(`org-role-own-${shared.slug}`)).toHaveCount(0);

  // A published organisation with no listed role has a page with a friendly empty state.
  await page.goto(`/assessment/organisations/${empty.slug}`);
  await expect(page.getByTestId("org-roles-empty")).toBeVisible();
  await expectNoAxeViolationsBothThemes(page);

  // 404s: an unknown or unpublished organisation; a role the organisation does not list; a role it does not offer.
  expect((await page.goto("/assessment/organisations/no-such-organisation"))?.status()).toBe(404);
  expect((await page.goto(`/assessment/organisations/${hidden.slug}`))?.status()).toBe(404);
  expect((await page.goto(`/assessment/organisations/${hidden.slug}/${shared.slug}`))?.status()).toBe(404);
  expect((await page.goto(`${orgPath()}/${thinRole.slug}`))?.status()).toBe(404);
  expect((await page.goto(`${orgPath()}/no-such-role`))?.status()).toBe(404);
  expect((await page.goto(`/assessment/organisations/${empty.slug}/${shared.slug}`))?.status()).toBe(404);
});

test("signed out: the role page explains that the organisation's own questions are included and that the result is shared, and asks to sign in; the test and result need an account", async ({ page }) => {
  await page.goto(rolePath());
  await expect(page.getByTestId("role-title")).toHaveText(`E2E Org Shared Role ${tag}`);
  await expect(page.getByTestId("role-expect-questions")).toContainText(`${TEST_SIZE} questions`);
  await expect(page.getByTestId("role-expect-questions")).toContainText(`${OWN_QUESTIONS} of ${orgName()}'s own questions`);
  await expect(page.getByTestId("role-expect")).toContainText(`your result is shared with ${orgName()}`);
  await expect(page.getByTestId("role-signed-out")).toBeVisible();
  await expect(page.getByTestId("role-signin")).toHaveAttribute("href", `/sign-in?return-to=${encodeURIComponent(rolePath())}`);
  await expect(page.getByTestId("role-start")).toHaveCount(0);
  await expectNoAxeViolationsBothThemes(page);

  await page.goto(`${rolePath()}/test/00000000-0000-4000-8000-000000000000`);
  await expect(page).toHaveURL(/\/sign-in\?return-to=/);
  await page.goto(`${rolePath()}/result/00000000-0000-4000-8000-000000000000`);
  await expect(page).toHaveURL(/\/sign-in\?return-to=/);

  await register(page, email, "Olive Candidate");
  await resetRateLimits();
  await register(page, otherEmail, "Omar Other");
});

test("the acknowledgement is REQUIRED; then the test includes the organisation's approved questions (never a pending one); the result is shared and cannot be deleted by the candidate", async ({ page }) => {
  await signIn(page, email, rolePath());
  await expect(page.getByTestId("role-start-card")).toBeVisible();
  const ack = page.getByTestId("role-ack");
  await expect(ack).not.toBeChecked();
  await expect(page.getByTestId("role-start-form")).toContainText(`I understand my result is shared with ${orgName()}.`);
  await expectNoAxeViolationsBothThemes(page);

  // Without the tick the server refuses, in words, and nothing starts.
  await page.getByTestId("role-start").click();
  await expect(page.getByTestId("role-start-form").getByRole("alert")).toContainText("Tick the box to confirm");
  await expect(page).toHaveURL(new RegExp(`${rolePath()}$`));
  const { getPrisma } = await import("../../src/db/prisma");
  expect(await getPrisma().roleTestAttempt.count({ where: { organisationId: org.organisationId, user: { email: email.toLowerCase() } } })).toBe(0);

  // Ticked: the test starts under the organisation's address.
  await ack.check();
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/test/[0-9a-f-]{36}$`));
  const attemptId = attemptIdOf(page.url());
  await expect(page.getByTestId("attempt-title")).toHaveText(`Questions 1–10 of ${TEST_SIZE}`);
  await expect(page.getByTestId("attempt-timer")).toHaveText(/^01:\d{2}:\d{2}$/);
  expect(await page.content()).not.toContain("Fixture model answer");
  const stored = await getPrisma().roleTestAttempt.findUniqueOrThrow({ where: { id: attemptId } });
  expect(stored.organisationId).toBe(org.organisationId);
  expect(stored.sharedWithOrganisation).toBe(true);
  expect(stored.size).toBe(TEST_SIZE);
  await expectNoAxeViolationsBothThemes(page);

  // Answer the first page, then finish from page 2: the answers are kept and the unanswered rest is counted.
  const questions = page.getByTestId("attempt-question");
  for (let i = 0; i < 10; i += 1) await questions.nth(i).getByRole("radio").nth(0).check();
  await page.getByTestId("attempt-next").click();
  await expect(page.getByTestId("attempt-title")).toHaveText(`Questions 11–20 of ${TEST_SIZE}`);
  await page.getByTestId("attempt-finish").click();
  await expect(page.getByTestId("attempt-finish-confirm")).toContainText(`${TEST_SIZE - 10} of ${TEST_SIZE} questions are unanswered`);
  await page.getByTestId("attempt-finish-anyway").click();

  // The result, under the organisation's address. Every one of the organisation's 6 approved questions is in the test; none of its 3 pending ones.
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/result/${attemptId}$`));
  await expect(page.getByTestId("result-question")).toHaveCount(TEST_SIZE);
  await expect(page.getByTestId("result-question").filter({ hasText: "Fixture question ORGQ-" })).toHaveCount(OWN_QUESTIONS);
  await expect(page.getByTestId("result-question").filter({ hasText: "PENDQ" })).toHaveCount(0);
  await expect(page.getByTestId("result-model-answer")).toHaveCount(TEST_SIZE);
  await expect(page.getByTestId("result-title")).toHaveText(new RegExp(`^\\d+ of ${TEST_SIZE} \\(\\d+ %\\)$`));
  await expect(page.locator("main")).toContainText(`Shared with ${orgName()}`);
  await expect(page.getByTestId("result-retake")).toHaveAttribute("href", rolePath()); // a new test needs the acknowledgement again
  await expect(page.getByTestId("result-back")).toHaveAttribute("href", rolePath());
  await expect(page.getByTestId("result-breakdown-row").first()).toBeVisible();
  await expectNoAxeViolationsBothThemes(page);

  // Back on the role page the result is listed — as the organisation's record: no checkbox, no delete button.
  await page.goto(rolePath());
  await expect(page.getByTestId("role-result-row")).toHaveCount(1);
  await expect(page.getByTestId("role-history")).toContainText(`shared with ${orgName()}`);
  await expect(page.getByTestId("role-result-select")).toHaveCount(0);
  await expect(page.getByTestId("role-delete-selected")).toHaveCount(0);
  await expect(page.getByTestId("role-result-link")).toHaveAttribute("href", `${rolePath()}/result/${attemptId}`);
  const finished = await getPrisma().roleTestAttempt.findUniqueOrThrow({ where: { id: attemptId }, select: { finishedAt: true, score: true } });
  expect(finished.finishedAt).not.toBeNull();
  expect(finished.score).toBe(10); // the first page was answered A (the correct option) — ten right
});

test("one running test per person and organisation: starting again returns to it (no new acknowledgement); the address must match the organisation; only the owner can open it; time up → scored as it stands; a private role tests only its own questions", async ({
  page,
  browser,
  baseURL,
}) => {
  await signIn(page, email, rolePath());
  await page.getByTestId("role-ack").check();
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/test/[0-9a-f-]{36}$`));
  const attemptUrl = page.url();
  const attemptId = attemptIdOf(attemptUrl);

  // Resume: the role page shows the running test; the one button returns to it and asks for no second tick.
  await page.goto(rolePath());
  await expect(page.getByTestId("role-running")).toContainText("It ends at");
  await expect(page.getByTestId("role-ack")).toHaveCount(0);
  await expect(page.getByTestId("role-start")).toHaveText("Return to my running test");
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(attemptUrl);

  // The same attempt is not reachable through another organisation's address, nor through Prepare for Interview's.
  expect((await page.goto(`/assessment/organisations/${edu.slug}/${shared.slug}/test/${attemptId}`))?.status()).toBe(404);
  expect((await page.goto(`/assessment/interview/${shared.slug}/test/${attemptId}`))?.status()).toBe(404);
  expect((await page.goto(`/assessment/interview/${shared.slug}/result/${attemptId}`))?.status()).toBe(404);
  // A running test has no result page: it goes back to the test.
  await page.goto(`${rolePath()}/result/${attemptId}`);
  await expect(page).toHaveURL(attemptUrl);

  // Another signed-in person gets a 404.
  const other = await browser.newContext({ baseURL });
  const otherPage = await other.newPage();
  await resetRateLimits();
  await signIn(otherPage, otherEmail, rolePath());
  expect((await otherPage.goto(attemptUrl))?.status()).toBe(404);
  expect((await otherPage.goto(`${rolePath()}/result/${attemptId}`))?.status()).toBe(404);
  await other.close();

  // The 90 minutes are up: opening the test scores it as it stands and shows the result.
  await setDeadlineIn(attemptId, -1000);
  await page.goto(attemptUrl);
  await expect(page).toHaveURL(new RegExp(`${rolePath()}/result/${attemptId}$`));
  await expect(page.getByTestId("result-title")).toHaveText(`0 of ${TEST_SIZE} (0 %)`);
  await expect(page.getByTestId("result-time-taken")).toHaveText("01:30:00");

  // The organisation's private role: only its own 12 approved questions.
  await page.goto(privatePath());
  await expect(page.getByTestId("role-expect-questions")).toContainText(`${PRIVATE_QUESTIONS} questions`);
  await page.getByTestId("role-ack").check();
  await page.getByTestId("role-start").click();
  await expect(page).toHaveURL(new RegExp(`${privatePath()}/test/[0-9a-f-]{36}$`));
  await expect(page.getByTestId("attempt-title")).toHaveText(`Questions 1–10 of ${PRIVATE_QUESTIONS}`);
});

test("the organisation pages have no horizontal overflow at 375, 768 and 1280 px", async ({ page }) => {
  await expectNoOverflow(page, "/assessment/organisations");
  await expectNoOverflow(page, orgPath());
  await expectNoOverflow(page, rolePath());
  await signIn(page, email, rolePath());
  await expectNoOverflow(page, rolePath()); // signed in: the start card, "Your results"
});
