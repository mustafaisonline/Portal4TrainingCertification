import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createAdminUser, createCertificateUser, deleteCertificateChain, deleteTestOffering, issueTestCertificate, type IssuedCertificateFixture } from "../helpers/certificates-db";
import { deleteTestUser, resetRateLimits } from "../helpers/identity-db";

/*
 * The header search bar and /search (Milestone 14 Phase 1, founder decision
 * P17): one input, "Search Candidates or Training"; results in two groups —
 * published trainings by words in their title/summary, and certificates by
 * exact ID or listed holder name with /verify's rules. The five-item header
 * (P15–P17) and the retired-route redirects are asserted here too.
 */

let issued: IssuedCertificateFixture;
let admin: { id: string; email: string };
let holder: { id: string; email: string; name: string };

// A topic with ten reviewed questions, so the free diagnostic's fresh
// random draw (founder, 2026-09-28) has a bank to serve from in the test
// database, whose baseline holds no reviewed questions.
const DIAG_SLUG = `e2e-diag-${Date.now().toString(36)}`;
let diagTopicId = "";

test.beforeAll(async () => {
  admin = await createAdminUser("e2e-search-admin");
  holder = await createCertificateUser({ prefix: "e2e-search-holder", legalName: "Selina Searchable" });
  issued = await issueTestCertificate({ adminUserId: admin.id, userId: holder.id, listed: true });
  const { withTransaction } = await import("../../src/db/prisma");
  const { replaceTopicFromImport } = await import("../../src/modules/free-learning/book.repository");
  const { importDraftQuestions, setAllQuestionsStatus } = await import("../../src/modules/free-learning/quiz.repository");
  const r = await withTransaction((tx) =>
    replaceTopicFromImport(tx, { position: 83001, slug: DIAG_SLUG, title: "E2E Diagnostic Topic", sourceHeading: "E2E Diagnostic Topic", bodyHtml: "<p>x</p>", bodyText: "x", wordCount: 1, images: [], publish: true, importedAt: new Date() }, (id) => id),
  );
  diagTopicId = r.id;
  await withTransaction((tx) =>
    importDraftQuestions(tx, { topicId: diagTopicId, replaceDrafts: false, questions: Array.from({ length: 10 }, (_, i) => ({ stem: `E2E diagnostic question ${i + 1}: pick option A?`, options: ["Alpha", "Bravo", "Charlie", "Delta", "Echo"], correct: 0, explanation: null })) }),
  );
  await withTransaction((tx) => setAllQuestionsStatus(tx, { topicId: diagTopicId, status: "reviewed", actorUserId: admin.id }));
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  await deleteCertificateChain([issued.certificate.id]);
  await deleteTestOffering(issued.offeringId);
  await deleteTestUser(holder.email);
  await deleteTestUser(admin.email);
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const qIds = (await prisma.topicQuestion.findMany({ where: { topicId: diagTopicId }, select: { id: true } })).map((x) => x.id);
  await prisma.auditLog.deleteMany({ where: { entityType: "topic_question", entityId: { in: qIds } } });
  await prisma.bookTopic.deleteMany({ where: { slug: DIAG_SLUG } });
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("the header has the four items beside the logo (which is Home) and a search bar; the retired routes redirect", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  // UX review 2026-09-27 D1: "Home" is the logo on the desktop bar; the phone menu keeps the item.
  // Founder, 2026-09-28: Knowledge Hub / Free Certifications / Professional Trainings (in that order) replace the earlier set; For Organisations was merged into the trainings page and no longer has its own item. (The search bar was briefly a full-width second row the same day; reverted on founder feedback to its place beside Reviews, then reduced in width.)
  // CR-2026-10-04-0110 (founder, 2026-10-04): the bar is Home · Product ▾ · Reviews · About Us (Product is a button that opens the panel).
  expect(await nav.getByRole("link").allTextContents()).toEqual(["Home", "Reviews", "About Us"]);
  await expect(nav.getByTestId("product-menu-button")).toHaveText("Product");
  const search = page.getByTestId("site-search").getByRole("searchbox");
  await expect(search).toHaveAttribute("placeholder", "Search Candidates or Training");
  await search.fill("vibe");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=vibe$/);

  for (const [from, to] of [
    ["/hrd-corp", /\/programs(#hrd-corp)?$/],
    ["/diagnostic", /\/free-learning\/diagnostic$/],
    ["/diagnostic/result", /\/free-learning\/diagnostic\/result$/],
    ["/free-learning", /\/free-trainings$/],
    ["/free-learning/topics", /\/free-trainings$/],
    ["/free-learning/knowledge-check", /\/assessment$/],
    ["/for-organisations", /\/programs(#for-organisations)?$/],
  ] as const) {
    await page.goto(from);
    await expect(page).toHaveURL(to);
  }
});

test("/search: a training by a word in its title; a certificate by ID and by listed name; honest empty states; no WCAG violations", async ({ page }) => {
  await page.goto("/search?q=vibe");
  await expect(page.getByTestId("search-title")).toHaveText("Results for “vibe”");
  await expect(page.locator('[data-testid="search-training"][data-slug="learn-vibe-coding"]')).toContainText("Learn Vibe Coding");
  await expect(page.getByTestId("search-certificates-none")).toBeVisible(); // "vibe" is a name search with no listed match
  await expectNoAxeViolations(page);

  await page.goto(`/search?q=${issued.certificate.certificateId}`);
  const cert = page.getByTestId("search-certificate");
  await expect(cert).toHaveCount(1);
  await expect(cert.getByTestId("search-certificate-name")).toHaveText("Selina Searchable");
  await expect(cert.getByRole("link", { name: issued.certificate.certificateId })).toHaveAttribute("href", `/verify/${issued.certificate.certificateId}`);
  await expect(page.getByTestId("search-trainings-none")).toBeVisible();

  await page.goto("/search?q=Selina%20Searchable");
  await expect(page.getByTestId("search-certificate")).toHaveCount(1);

  await page.goto("/search?q=zzqx-nothing-here");
  await expect(page.getByTestId("search-trainings-none")).toBeVisible();
  await expect(page.getByTestId("search-certificates-none")).toBeVisible();

  await page.goto("/search");
  await expect(page.getByTestId("search-hint")).toBeVisible();
});

test("Professional Trainings has HRD Corp merged, no registration-in-progress copy; the Knowledge Hub hosts the topics browser; Free Certifications hosts the Free Assessment Check; the diagnostic draws ten from the bank and saves nothing", async ({ page }) => {
  await page.goto("/programs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trainings");
  await expect(page.getByTestId("hrd-corp-sections")).toContainText("What HRD Corp is");
  // Founder, 2026-09-28: the "getting registered with HRD Corp" copy is gone.
  await expect(page.getByTestId("hrd-corp-sections")).not.toContainText("Registered Training Provider");
  await expect(page.getByTestId("who-this-is-for")).toContainText("Individuals");
  await expect(page.getByTestId("who-this-is-for")).toContainText("Organisations");
  await expect(page.getByTestId("who-this-is-for")).toContainText("Education");
  await expectNoAxeViolations(page);

  // Founder, 2026-09-28: the free page is the Knowledge Hub and hosts the
  // topics browser itself (the separate topics page merged in); it no longer
  // offers the diagnostic — that entry point is the home page's band alone.
  await page.goto("/free-trainings");
  await expect(page.getByTestId("free-trainings-title")).toBeVisible();
  await expect(page.getByText("Knowledge Hub").first()).toBeVisible();
  await expect(page.getByTestId("learn-free")).toContainText("I Am Datapedia!");
  // Founder, 2026-09-28: the card shows the book's own cover.
  await expect(page.getByTestId("datapedia-cover")).toBeVisible();
  await expect(page.getByTestId("datapedia-amazon")).toHaveAttribute("href", /amazon\.com\/dp\/B0F1NT87CL/);
  await expect(page.getByTestId("topics-title")).toBeVisible();
  await expect(page.getByTestId("topics-count")).toContainText("topics");
  await expect(page.getByTestId("free-diagnostic-card")).toHaveCount(0);
  await expectNoAxeViolations(page);

  // Free Certifications hosts the Free Assessment Check start screen (signed out:
  // the pitch, the bank and a sign-in button).
  await page.goto("/assessment");
  await expect(page.getByTestId("assessment-title")).toBeVisible();
  await expect(page.getByTestId("free-test")).toContainText("200 questions");
  await expect(page.getByTestId("free-test")).not.toContainText("50, 100 or 200");
  await expect(page.getByTestId("kc-signed-out")).toBeVisible();
  await expectNoAxeViolations(page);

  // The diagnostic (founder, 2026-09-28): Start draws a fresh random ten
  // from the reviewed question bank; nothing is saved.
  await page.goto("/free-learning/diagnostic");
  await expect(page.getByTestId("diagnostic-not-saved")).toContainText("we do not save your diagnostic results");
  await page.getByRole("button", { name: /Start free diagnostic/ }).click();
  await expect(page.getByText("Question 1 of ~10")).toBeVisible();
  await expect(page.getByRole("radiogroup")).toBeVisible();
  expect(await page.getByRole("radio").count()).toBeGreaterThanOrEqual(5);
  await page.goto("/");
  await expect(page.getByTestId("diagnostic-not-saved")).toContainText("we do not save your diagnostic results");

  // Founder, 2026-09-30 (M7): the trainer's dedicated page is gone. The old
  // /trainers address still moves permanently (one hop, not followed — the
  // chain's next hop is the external profile, which a test must not visit).
  const trainersHop = await page.request.get("/trainers", { maxRedirects: 0 });
  expect(trainersHop.status()).toBe(308);
  expect(trainersHop.headers()["location"]).toMatch(/\/mustafa-qizilbash$/);
});
