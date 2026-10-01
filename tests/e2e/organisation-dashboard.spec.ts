import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { getPrisma, withTransaction } from "../../src/db/prisma";
import { grantOrganisationAccess } from "../../src/modules/assessment/organisations.repository";
import { findUserByEmail } from "../../src/modules/identity/users.repository";
import { addQuestions, createOrganisationFixture, createSharedRole, deleteRoleFixtures, uniqueSlug } from "../helpers/assessment-roles-db";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * The Organisation Dashboard (CR-2026-10-01-1711, P3/P4): /organisation with the
 * tabs Overview · Roles · Questions · Results, and the CSV export. Fixtures are
 * created through the test helpers (unique slugs, nothing global is asserted) and
 * removed afterwards. Written without being run by its author — run it once.
 */
test.describe.configure({ mode: "serial" });

const orgEmail = uniqueEmail("e2e-orgdash");
const participantEmail = uniqueEmail("e2e-orgdash-p");
const candidateEmail = uniqueEmail("e2e-orgdash-c");
const suffix = uniqueSlug("x").slice(2);
const SHARED_NAME = `Fixture Role ${suffix}`;
const CATALOGUE_NAME = `Catalogue Role ${suffix}`;
const PRIVATE_NAME = `Quality Analyst ${suffix}`;
// A name that starts with "=" and carries a comma and quotes: the CSV must neutralise and quote it.
const CANDIDATE_NAME = '=Cara, "C" Candidate';

let sharedRoleId = "";
let catalogueRoleId = "";
let privateRoleId = "";
let orgA = { organisationId: "", slug: "" };
let orgB = { organisationId: "", slug: "" };

test.beforeAll(async () => {
  const shared = await createSharedRole({ slugPrefix: "t-od-shared", reviewed: 12, name: SHARED_NAME });
  const catalogue = await createSharedRole({ slugPrefix: "t-od-cat", reviewed: 5, name: CATALOGUE_NAME });
  sharedRoleId = shared.roleId;
  catalogueRoleId = catalogue.roleId;
  orgA = await createOrganisationFixture({ slugPrefix: "t-od-a", roleIds: [sharedRoleId] });
  orgB = await createOrganisationFixture({ slugPrefix: "t-od-b", roleIds: [sharedRoleId] });
  // Organisation B's own approved question on the shared role: organisation A must never see it.
  await addQuestions({ roleId: sharedRoleId, organisationId: orgB.organisationId, count: 1, status: "reviewed", tag: "orgBsecret" });
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  // Attempts first (they restrict the users), then the people.
  await deleteRoleFixtures({ roleIds: [sharedRoleId, catalogueRoleId], organisationIds: [orgA.organisationId, orgB.organisationId] });
  for (const e of [orgEmail, participantEmail, candidateEmail]) await deleteTestUser(e);
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}
async function register(page: Page, address: string, name: string) {
  await resetRateLimits(); // three registrations in a row from one address would hit the sign-up limit
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  // Registration hashes the password and can be slow on a cold server: allow it more than the default 5 s.
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/, { timeout: 30_000 });
}
async function signIn(page: Page, address: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}
async function signInAsOrganisation(page: Page) {
  await signIn(page, orgEmail);
}
const roleRow = (page: Page, name: string) => page.getByTestId("org-role-row").filter({ hasText: name });

test("a signed-out visitor is sent to sign in, for the page and for the CSV export", async ({ page, request }) => {
  await page.goto("/organisation");
  await expect(page).toHaveURL(/\/sign-in/);
  const res = await request.get("/organisation/results.csv", { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(res.status());
  expect(res.headers()["location"]).toContain("/sign-in");
});

test("set-up: register the Organisation user, a participant and a candidate", async ({ page }) => {
  await register(page, orgEmail, "Olu Org");
  await register(page, participantEmail, "Pia Participant");
  await register(page, candidateEmail, "Cara Candidate");
  const candidate = await findUserByEmail(candidateEmail);
  await getPrisma().user.update({ where: { id: candidate!.id }, data: { name: CANDIDATE_NAME } });
  const org = await findUserByEmail(orgEmail);
  await withTransaction((tx) => grantOrganisationAccess(tx, { userId: org!.id, organisationId: orgA.organisationId, grantedByUserId: null }));
});

test("a participant gets a 403; holding the role without an organisation record shows a friendly note (page and CSV)", async ({ page }) => {
  await signIn(page, participantEmail);
  expect((await page.goto("/organisation"))?.status()).toBe(403);
  expect((await page.request.get("/organisation/results.csv")).status()).toBe(403);

  await grantRoleByEmail(participantEmail, "org_admin"); // the role, with no organisation record
  await page.goto("/organisation");
  await expect(page.getByTestId("organisation-title")).toHaveText("Organisation Dashboard");
  await expect(page.getByTestId("organisation-no-record")).toContainText("isn’t set up yet");
  await expect(page.getByTestId("org-tabs")).toHaveCount(0);
  expect((await page.request.get("/organisation/results.csv")).status()).toBe(403);
});

test("an Organisation user sees the four tabs (plain links) and the Overview", async ({ page }) => {
  await signInAsOrganisation(page);
  await page.goto("/organisation");
  await expect(page.getByTestId("organisation-title")).toHaveText("Organisation Dashboard");
  await expect(page.getByTestId("organisation-name")).toHaveText(`Test organisation ${orgA.slug}`);
  const tabs = page.getByTestId("org-tabs").getByRole("link");
  await expect(tabs).toHaveText(["Overview", "Roles", "Questions", "Results"]);
  await expect(page.getByTestId("org-tab-overview")).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("org-tab-roles")).toHaveAttribute("href", "/organisation?tab=roles");

  await expect(page.getByTestId("org-type")).toHaveText("Company");
  await expect(page.getByTestId("org-published")).toHaveText("Published");
  await expect(page.getByTestId("org-stat-roles").getByRole("link")).toHaveText("1");
  await expect(page.getByTestId("org-stat-listed").getByRole("link")).toHaveText("1");
  await expect(page.getByTestId("org-stat-approved").getByRole("link")).toHaveText("0"); // organisation B's question is not ours
  await expect(page.getByTestId("org-stat-pending").getByRole("link")).toHaveText("0");
  await expect(page.getByTestId("org-how-it-works")).toContainText("An administrator approves every question you add");

  await page.getByTestId("org-tab-roles").click();
  await expect(page).toHaveURL(/\/organisation\?tab=roles$/);
  await expect(page.getByTestId("org-tab-roles")).toHaveAttribute("aria-current", "page");
});

test("Roles: add a catalogue role, create your own (not listed below 10 approved questions), remove a role", async ({ page }) => {
  await signInAsOrganisation(page);
  await page.goto("/organisation?tab=roles");
  await expect(roleRow(page, SHARED_NAME)).toHaveAttribute("data-listed", "yes");
  await expect(roleRow(page, SHARED_NAME).getByTestId("org-role-note")).toContainText("Listed");

  // Add from the catalogue.
  await page.getByTestId("org-catalogue-form").getByLabel("Role", { exact: true }).selectOption(catalogueRoleId);
  await page.getByTestId("org-catalogue-add").click();
  await expect(page.getByTestId("org-catalogue-status")).toContainText(`${CATALOGUE_NAME} added`);
  await expect(roleRow(page, CATALOGUE_NAME)).toHaveCount(1);
  await expect(roleRow(page, CATALOGUE_NAME)).toHaveAttribute("data-private", "no");

  // Create your own role.
  await page.getByLabel("Role name").fill(PRIVATE_NAME);
  await page.getByLabel(/^Description/).fill("A role we hire for ourselves.");
  await page.getByTestId("org-create-role-submit").click();
  await expect(page.getByTestId("org-create-role-status")).toContainText("created");
  const mine = roleRow(page, PRIVATE_NAME);
  await expect(mine).toHaveCount(1);
  await expect(mine).toHaveAttribute("data-private", "yes");
  await expect(mine).toHaveAttribute("data-listed", "no");
  await expect(mine.getByTestId("org-role-note")).toContainText("needs 10 approved questions");
  await expect(mine.getByTestId("org-role-note")).toContainText("It has 0");
  const row = await getPrisma().assessmentRole.findFirst({ where: { organisationId: orgA.organisationId, name: PRIVATE_NAME }, select: { id: true } });
  privateRoleId = row!.id;

  // Remove the catalogue role, behind a confirmation.
  await roleRow(page, CATALOGUE_NAME).getByTestId("org-role-remove").click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.locator("dialog[open]").getByTestId("confirm-dialog-cancel").click();
  await expect(roleRow(page, CATALOGUE_NAME)).toHaveCount(1); // kept
  await roleRow(page, CATALOGUE_NAME).getByTestId("org-role-remove").click();
  await page.locator("dialog[open]").getByTestId("confirm-dialog-confirm").click();
  await expect(roleRow(page, CATALOGUE_NAME)).toHaveCount(0);
  // ...and it is offered in the catalogue again.
  await expect(page.getByTestId("org-catalogue-form").locator(`option[value="${catalogueRoleId}"]`)).toHaveCount(1);
});

test("Questions: add (Pending approval), client validation, edit, delete only while pending, approved needs 'edit it first', other organisations' questions never shown", async ({ page }) => {
  await signInAsOrganisation(page);
  await page.goto(`/organisation?tab=questions&role=${privateRoleId}`);
  await expect(page.getByTestId("org-questions-role")).toHaveText(PRIVATE_NAME);
  await expect(page.getByTestId("org-approval-note")).toContainText("administrator approves every question");
  await expect(page.getByTestId("org-questions-none")).toBeVisible();
  await expect(page.getByTestId("org-questions-listing")).toContainText("needs 10 approved questions");

  const form = page.getByTestId("org-question-form");
  const fill = async (stem: string) => {
    await form.getByLabel("Category", { exact: true }).fill("Governance");
    await form.getByLabel("Question", { exact: true }).fill(stem);
    for (const [i, letter] of ["A", "B", "C", "D", "E"].entries()) await form.getByLabel(`Option ${letter}`, { exact: true }).fill(`Answer ${letter} ${i}`);
    await form.getByLabel("Model answer", { exact: true }).fill("A primary key uniquely identifies a row; a strong candidate also mentions surrogate and natural keys.");
  };

  // The browser checks "exactly one correct" before anything is sent.
  await fill("What does a primary key guarantee in a table?");
  await form.getByTestId("org-question-submit").click();
  await expect(page.getByTestId("org-question-status")).toContainText("Exactly one option must be correct");
  await expect(page.getByTestId("org-question")).toHaveCount(0);

  await form.getByLabel("Option C is the correct answer").check();
  await form.getByTestId("org-question-submit").click();
  await expect(page.getByTestId("org-question-status")).toContainText("Pending approval");
  const q = page.getByTestId("org-question");
  await expect(q).toHaveCount(1);
  await expect(q.getByTestId("org-question-chip")).toHaveText("Pending approval");
  await expect(q.getByTestId("org-question-stem")).toHaveText("What does a primary key guarantee in a table?");
  await expect(q.getByTestId("org-question-model-answer")).toContainText("uniquely identifies a row"); // the model answer is visible
  await expect(page.getByTestId("org-count-pending")).toContainText("Pending approval 1");
  await expect(form.getByLabel("Question", { exact: true })).toHaveValue(""); // a blank form for the next one

  // Edit it: still pending.
  await q.getByTestId("org-question-edit").click();
  const edit = page.getByTestId("org-question-edit-form");
  await edit.getByLabel("Question", { exact: true }).fill("What does a primary key guarantee, exactly?");
  await edit.getByTestId("org-question-save").click();
  await expect(q.getByTestId("org-question-stem")).toHaveText("What does a primary key guarantee, exactly?");
  await expect(q.getByTestId("org-question-chip")).toHaveText("Pending approval");

  // Delete a pending question (behind a confirmation).
  await q.getByTestId("org-question-delete").click();
  await page.locator("dialog[open]").getByTestId("confirm-dialog-confirm").click();
  await expect(page.getByTestId("org-questions-none")).toBeVisible();

  // An approved question cannot be deleted: "edit it first"; editing returns it to Pending approval.
  await addQuestions({ roleId: privateRoleId, organisationId: orgA.organisationId, count: 1, status: "reviewed", tag: "apr" });
  await page.reload();
  const approved = page.locator('[data-testid="org-question"][data-status="reviewed"]');
  await expect(approved).toHaveCount(1);
  await expect(approved.getByTestId("org-question-chip")).toHaveText("Approved");
  await expect(approved.getByTestId("org-question-edit-first")).toContainText("Edit it first");
  await expect(approved.getByTestId("org-question-delete")).toHaveCount(0);
  await expect(page.getByTestId("org-count-approved")).toContainText("Approved 1");
  await approved.getByTestId("org-question-edit").click();
  await expect(page.getByTestId("org-question-edit-warning")).toContainText("returns to Pending approval");
  await page.getByTestId("org-question-edit-form").getByTestId("org-question-save").click();
  await expect(page.locator('[data-testid="org-question"][data-status="reviewed"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="org-question"][data-status="pending"]')).toHaveCount(1);
  await expect(page.getByTestId("org-count-approved")).toContainText("Approved 0");

  // Another organisation's question on the same shared role is never shown here.
  await page.goto(`/organisation?tab=questions&role=${sharedRoleId}`);
  await expect(page.getByTestId("org-questions-role")).toHaveText(SHARED_NAME);
  await expect(page.getByTestId("org-questions-none")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("orgBsecret");
});

test("a private role is listed once it has 10 approved questions", async ({ page }) => {
  await addQuestions({ roleId: privateRoleId, organisationId: orgA.organisationId, count: 10, status: "reviewed" });
  await signInAsOrganisation(page);
  await page.goto("/organisation?tab=roles");
  await expect(roleRow(page, PRIVATE_NAME)).toHaveAttribute("data-listed", "yes");
  await expect(roleRow(page, PRIVATE_NAME).getByTestId("org-role-note")).toContainText("Listed");
});

test("Results: only this organisation's consenting candidates, role filter, CSV export (escaped), pagination", async ({ page }) => {
  const candidate = await findUserByEmail(candidateEmail);
  const started = new Date("2026-09-30T10:00:00.000Z");
  const finished = new Date(started.getTime() + 754_000); // 12 min 34 s
  const base = { userId: candidate!.id, size: 100, questionIds: [], answers: {}, startedAt: started, finishedAt: finished };
  await getPrisma().roleTestAttempt.createMany({
    data: [
      { ...base, roleId: sharedRoleId, organisationId: orgA.organisationId, score: 37, sharedWithOrganisation: true },
      { ...base, roleId: sharedRoleId, organisationId: orgA.organisationId, score: 55, sharedWithOrganisation: false }, // did not agree to share
      { ...base, roleId: privateRoleId, organisationId: orgA.organisationId, score: 80, sharedWithOrganisation: true },
      { ...base, roleId: sharedRoleId, organisationId: orgB.organisationId, score: 91, sharedWithOrganisation: true }, // another organisation's candidate
    ],
  });
  await signInAsOrganisation(page);
  await page.goto("/organisation?tab=results");
  await expect(page.getByTestId("org-result-row")).toHaveCount(2);
  const sharedRow = page.getByTestId("org-result-row").filter({ hasText: SHARED_NAME });
  await expect(sharedRow).toContainText(CANDIDATE_NAME);
  await expect(sharedRow).toContainText(candidateEmail);
  await expect(sharedRow).toContainText("37 / 100");
  await expect(sharedRow).toContainText("37%");
  await expect(sharedRow).toContainText("12 min 34 s");
  await expect(page.getByTestId("org-results-table")).toContainText("Time taken");
  await expect(page.locator("body")).not.toContainText("91 / 100");
  await expect(page.locator("body")).not.toContainText("55 / 100");

  // Role filter.
  await expect(page.getByTestId("org-results-filter-all")).toHaveAttribute("aria-current", "page");
  await page.getByTestId("org-results-filter-role").filter({ hasText: SHARED_NAME }).click();
  await expect(page.getByTestId("org-result-row")).toHaveCount(1);
  await expect(page.getByTestId("org-results-csv")).toHaveAttribute("href", `/organisation/results.csv?role=${sharedRoleId}`);

  // CSV: the same rows, RFC 4180, formula-safe, no-store.
  const filtered = await page.request.get(`/organisation/results.csv?role=${sharedRoleId}`);
  expect(filtered.status()).toBe(200);
  expect(filtered.headers()["content-type"]).toContain("text/csv");
  expect(filtered.headers()["content-disposition"]).toMatch(/^attachment; filename="[a-z0-9-]+-results-\d{4}-\d{2}-\d{2}\.csv"$/);
  expect(filtered.headers()["cache-control"]).toContain("no-store");
  const lines = (await filtered.text()).trimEnd().split("\r\n");
  expect(lines[0]).toBe("Candidate name,Email,Role,Score,Out of,Percent,Time taken (minutes),Finished (UTC)");
  expect(lines).toHaveLength(2);
  expect(lines[1]).toBe(`"'=Cara, ""C"" Candidate",${candidateEmail},${SHARED_NAME},37,100,37,12.6,2026-09-30T10:12:34.000Z`);

  const all = await (await page.request.get("/organisation/results.csv")).text();
  expect(all.trimEnd().split("\r\n")).toHaveLength(3); // header + two shared-with-us results
  expect(all).not.toContain(",91,");
  expect(all).not.toContain(",55,");
  expect((await page.request.get("/organisation/results.csv?role=not-a-uuid")).status()).toBe(404);

  // Pagination: twenty rows a page.
  await getPrisma().roleTestAttempt.createMany({
    data: Array.from({ length: 20 }, () => ({ ...base, roleId: sharedRoleId, organisationId: orgA.organisationId, score: 10, sharedWithOrganisation: true, finishedAt: new Date("2026-09-29T10:00:00.000Z") })),
  });
  await page.goto("/organisation?tab=results");
  await expect(page.getByTestId("org-results-pages")).toContainText("22 results · page 1 of 2");
  await expect(page.getByTestId("org-result-row")).toHaveCount(20);
  await page.getByRole("link", { name: "Next →" }).click();
  await expect(page.getByTestId("org-results-pages")).toContainText("page 2 of 2");
  await expect(page.getByTestId("org-result-row")).toHaveCount(2);
});

test("every tab has no WCAG 2.2 AA violations (light and dark) and no horizontal overflow at 375, 768 and 1280", async ({ page }) => {
  await signInAsOrganisation(page);
  const urls = ["/organisation", "/organisation?tab=roles", `/organisation?tab=questions&role=${privateRoleId}`, "/organisation?tab=results"];
  for (const url of urls) {
    await page.goto(url);
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await expectNoAxeViolations(page);
    }
    await page.emulateMedia({ colorScheme: "light" });
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${url} at ${width}px`).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
  }
});
