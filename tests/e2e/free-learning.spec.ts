import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Free Learning topics through the screens (Milestone 14 Phase 2): the
 * topics list and search, a topic page with its image served from the
 * database, an unpublished topic hidden (page 404, image 404), and the
 * administrator's publish switch, audited. Fixtures are written through the
 * repository and removed afterwards.
 */

test.describe.configure({ mode: "serial" });

const PREFIX = `e2e-fl-${Date.now().toString(36)}`;
const adminEmail = uniqueEmail("e2e-fl-admin");
let topicAId = "";
let imageId = "";

test.beforeAll(async () => {
  const { withTransaction } = await import("../../src/db/prisma");
  const { replaceTopicFromImport } = await import("../../src/modules/free-learning/book.repository");
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 9, 9]);
  const a = await withTransaction((tx) =>
    replaceTopicFromImport(
      tx,
      {
        position: 80001,
        slug: `${PREFIX}-entity`,
        title: "E2E What is an Entity?",
        sourceHeading: "E2E What is an Entity?",
        bodyHtml: "<p>An <strong>entity</strong> is anything that can be identified.</p><p><img src=\"img://0\" alt=\"\" /></p>",
        bodyText: "An entity is anything that can be identified.",
        wordCount: 8,
        images: [{ ref: 0, mime: "image/png", bytes: png, alt: null }],
        publish: true,
        importedAt: new Date(),
      },
      (id) => `/free-learning/images/${id}`,
    ),
  );
  topicAId = a.id;
  await withTransaction((tx) =>
    replaceTopicFromImport(
      tx,
      { position: 80002, slug: `${PREFIX}-lakehouse`, title: "E2E Lakehouse Layers", sourceHeading: "E2E Lakehouse Layers", bodyHtml: "<p>Bronze, silver, gold.</p>", bodyText: "Bronze, silver, gold.", wordCount: 3, images: [], publish: true, importedAt: new Date() },
      (id) => id,
    ),
  );
  const { getPrisma } = await import("../../src/db/prisma");
  imageId = (await getPrisma().bookTopicImage.findFirst({ where: { topicId: topicAId }, select: { id: true } }))!.id;
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  await getPrisma().auditLog.deleteMany({ where: { entityType: "book_topic", entityId: topicAId } });
  await getPrisma().bookTopic.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await deleteTestUser(adminEmail);
  await disconnectPrisma();
});

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("topics list and search; a topic page with its database-served image and neighbours; the landing links the topics", async ({ page, request }) => {
  await page.goto("/free-learning/topics");
  await expect(page.getByTestId("topics-title")).toContainText("Topics from");
  await expect(page.locator(`[data-testid="topic-card"][data-slug="${PREFIX}-entity"]`)).toContainText("E2E What is an Entity?");
  await expectNoAxeViolations(page);

  await page.getByRole("searchbox", { name: "Search topics" }).fill("lakehouse");
  await page.getByTestId("topics-search").click();
  await expect(page).toHaveURL(/\/free-learning\/topics\?q=lakehouse$/);
  await expect(page.locator(`[data-testid="topic-card"][data-slug="${PREFIX}-lakehouse"]`)).toHaveCount(1);
  await expect(page.locator(`[data-testid="topic-card"][data-slug="${PREFIX}-entity"]`)).toHaveCount(0);
  await expect(page.getByTestId("topics-count")).toContainText("lakehouse");

  await page.goto(`/free-learning/topics/${PREFIX}-entity`);
  await expect(page.getByTestId("topic-title")).toHaveText("E2E What is an Entity?");
  await expect(page.getByTestId("topic-body")).toContainText("anything that can be identified");
  const img = page.getByTestId("topic-body").locator("img");
  await expect(img).toHaveAttribute("src", `/free-learning/images/${imageId}`);
  const res = await request.get(`/free-learning/images/${imageId}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  await expect(page.getByTestId("topic-next")).toContainText("E2E Lakehouse Layers");
  await expect(page.getByTestId("topic-quiz-coming")).toBeVisible();
  await expectNoAxeViolations(page);

  await page.goto("/free-learning");
  await expect(page.getByTestId("browse-topics")).toContainText("topics");
});

test("the topics list paginates ten a page (founder, 2026-09-27)", async ({ page }) => {
  // A dedicated set of 12 topics, isolated by a search word unique to this
  // test, so the page count is exact regardless of other fixtures in the
  // shared test database. Cleaned up by this file's afterAll (same PREFIX).
  const { withTransaction } = await import("../../src/db/prisma");
  const { replaceTopicFromImport } = await import("../../src/modules/free-learning/book.repository");
  const word = "e2epagequertyzz";
  for (let i = 1; i <= 12; i += 1) {
    await withTransaction((tx) =>
      replaceTopicFromImport(
        tx,
        { position: 84000 + i, slug: `${PREFIX}-page-${i}`, title: `E2E Page Topic ${i} ${word}`, sourceHeading: `E2E Page Topic ${i}`, bodyHtml: `<p>${word}</p>`, bodyText: word, wordCount: 1, images: [], publish: true, importedAt: new Date() },
        (id) => id,
      ),
    );
  }

  await page.goto(`/free-learning/topics?q=${word}`);
  await expect(page.getByTestId("topics-count")).toContainText("12 topics match");
  await expect(page.getByTestId("topics-count")).toContainText("page 1 of 2");
  await expect(page.getByTestId("topic-card")).toHaveCount(10);
  await expect(page.getByTestId("topics-page-prev")).toHaveCount(0);
  await expectNoAxeViolations(page);

  await page.getByTestId("topics-page-next").click();
  await expect(page).toHaveURL(new RegExp(`q=${word}.*page=2|page=2.*q=${word}`));
  await expect(page.getByTestId("topic-card")).toHaveCount(2);
  await expect(page.getByTestId("topics-page-next")).toHaveCount(0);
  await expectNoAxeViolations(page);

  await page.getByTestId("topics-page-prev").click();
  await expect(page.getByTestId("topic-card")).toHaveCount(10);

  // A fresh search drops any earlier ?page and lands back on page 1.
  await page.goto("/free-learning/topics?page=2");
  await page.getByRole("searchbox", { name: "Search topics" }).fill(word);
  await page.getByTestId("topics-search").click();
  await expect(page).toHaveURL(new RegExp(`\\?q=${word}$`));
  await expect(page.getByTestId("topic-card")).toHaveCount(10);
});

test("the administrator unpublishes a topic — page and image become 404, the list hides it — and publishes it again; both audited", async ({ page, request }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Ada Admin");
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
  await expect(page.getByTestId("free-learning-admin-title")).toBeVisible();
  const row = page.locator(`[data-testid="free-learning-admin-row"][data-slug="${PREFIX}-entity"]`);
  await expect(row.getByTestId("free-learning-admin-status")).toHaveText("Published");
  await expectNoAxeViolations(page);
  await row.getByTestId("free-learning-toggle").click();
  await expect(row.getByTestId("free-learning-admin-status")).toHaveText("Unpublished");

  expect((await request.get(`/free-learning/topics/${PREFIX}-entity`)).status()).toBe(404);
  expect((await request.get(`/free-learning/images/${imageId}`)).status()).toBe(404);
  await page.goto("/free-learning/topics");
  await expect(page.locator(`[data-testid="topic-card"][data-slug="${PREFIX}-entity"]`)).toHaveCount(0);

  await page.goto("/admin/free-learning");
  await row.getByTestId("free-learning-toggle").click();
  await expect(row.getByTestId("free-learning-admin-status")).toHaveText("Published");
  expect((await request.get(`/free-learning/topics/${PREFIX}-entity`)).status()).toBe(200);

  const { getPrisma } = await import("../../src/db/prisma");
  const audit = await getPrisma().auditLog.findMany({ where: { entityType: "book_topic", entityId: topicAId }, orderBy: { createdAt: "asc" } });
  expect(audit.map((a) => (a.after as { published: boolean }).published)).toEqual([false, true]);
});
