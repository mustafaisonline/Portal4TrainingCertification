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
  await page.goto("/free-trainings");
  await expect(page.getByTestId("topics-title")).toContainText("Topics from");
  await expect(page.locator(`[data-testid="topic-card"][data-slug="${PREFIX}-entity"]`)).toContainText("E2E What is an Entity?");
  await expectNoAxeViolations(page);

  await page.getByRole("searchbox", { name: "Search topics" }).fill("lakehouse");
  await page.getByTestId("topics-search").click();
  await expect(page).toHaveURL(/\/free-trainings\?tab=content&q=lakehouse$/); // the hidden `tab` field precedes `q` in the form
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
  // No questions yet: the Topic tab offers no jump, and the Questions tab says they are being prepared.
  await expect(page.getByTestId("topic-tab-questions")).toHaveText("Questions");
  await expect(page.getByTestId("topic-to-questions")).toHaveCount(0);
  await page.getByTestId("topic-tab-questions").click();
  await expect(page.getByTestId("topic-quiz-coming")).toBeVisible();
  await expect(page).toHaveTitle(/.+/); // a client-side switch: metadata streams in after the body
  await expectNoAxeViolations(page);

  // The retired combined landing and the retired topics-list URL both land
  // on the Knowledge Hub, which hosts the topics browser itself (founder,
  // 2026-09-28: "no need for two pages").
  await page.goto("/free-learning");
  await expect(page).toHaveURL(/\/free-trainings$/);
  await expect(page.getByTestId("topics-title")).toBeVisible();
  await page.goto("/free-learning/topics");
  await expect(page).toHaveURL(/\/free-trainings$/);
});

test("the topics list paginates ten a page, with First/Previous/Next/Last (founder, 2026-09-27); a fresh search resets to page 1", async ({ page }) => {
  // 23 topics = 3 pages (10, 10, 3) — isolated by a search word unique to
  // this test, so the page count is exact regardless of other fixtures in
  // the shared test database. Cleaned up by this file's afterAll (same
  // PREFIX). Three pages is the minimum that actually distinguishes First
  // from Previous and Last from Next: on page 1, Next → 2 but Last → 3; on
  // the final page, Previous → 2 but First → 1.
  const { withTransaction } = await import("../../src/db/prisma");
  const { replaceTopicFromImport } = await import("../../src/modules/free-learning/book.repository");
  const word = "e2epagequertyzz";
  for (let i = 1; i <= 23; i += 1) {
    await withTransaction((tx) =>
      replaceTopicFromImport(
        tx,
        { position: 84000 + i, slug: `${PREFIX}-page-${i}`, title: `E2E Page Topic ${i} ${word}`, sourceHeading: `E2E Page Topic ${i}`, bodyHtml: `<p>${word}</p>`, bodyText: word, wordCount: 1, images: [], publish: true, importedAt: new Date() },
        (id) => id,
      ),
    );
  }

  await page.goto(`/free-trainings?q=${word}`);
  await expect(page.getByTestId("topics-count")).toContainText("23 topics match");
  await expect(page.getByTestId("topics-count")).toContainText("page 1 of 3");
  await expect(page.getByTestId("topic-card")).toHaveCount(10);
  await expect(page.getByTestId("topics-page-first")).toHaveCount(0);
  await expect(page.getByTestId("topics-page-prev")).toHaveCount(0);
  const nextHref = await page.getByTestId("topics-page-next").getAttribute("href");
  const lastHref = await page.getByTestId("topics-page-last").getAttribute("href");
  expect(nextHref).toContain("page=2");
  expect(lastHref).toContain("page=3");
  expect(nextHref).not.toBe(lastHref); // Last is not just an alias of Next on a page where they differ
  await expectNoAxeViolations(page);

  // Last jumps straight to the final (partial) page.
  await page.getByTestId("topics-page-last").click();
  await expect(page).toHaveURL(/page=3/);
  await expect(page.getByTestId("topics-count")).toContainText("page 3 of 3");
  await expect(page.getByTestId("topic-card")).toHaveCount(3);
  await expect(page.getByTestId("topics-page-next")).toHaveCount(0);
  await expect(page.getByTestId("topics-page-last")).toHaveCount(0);
  const firstHref = await page.getByTestId("topics-page-first").getAttribute("href");
  const prevHref = await page.getByTestId("topics-page-prev").getAttribute("href");
  expect(firstHref).toContain("page=1");
  expect(prevHref).toContain("page=2");
  expect(firstHref).not.toBe(prevHref); // First is not just an alias of Previous here either
  await expectNoAxeViolations(page);

  // First jumps straight back to page 1.
  await page.getByTestId("topics-page-first").click();
  await expect(page).toHaveURL(/page=1/);
  await expect(page.getByTestId("topic-card")).toHaveCount(10);

  // A fresh search drops any earlier ?page and lands back on page 1.
  await page.goto("/free-trainings?page=2");
  await page.getByRole("searchbox", { name: "Search topics" }).fill(word);
  await page.getByTestId("topics-search").click();
  await expect(page).toHaveURL(/\?tab=content&q=e2epagequertyzz$/); // the hidden `tab` field precedes `q` in the form
  await expect(page.getByTestId("topic-card")).toHaveCount(10);
});

test("Content and Index views (founder, 2026-09-28): Content is the default on landing; Index lists names only, unpaginated, and a search stays on the active tab", async ({ page }) => {
  const { withTransaction } = await import("../../src/db/prisma");
  const { replaceTopicFromImport } = await import("../../src/modules/free-learning/book.repository");
  const word = "e2etabqzxjk";
  for (let i = 1; i <= 3; i += 1) {
    await withTransaction((tx) =>
      replaceTopicFromImport(
        tx,
        { position: 85000 + i, slug: `${PREFIX}-tab-${i}`, title: `E2E Tab Topic ${i} ${word}`, sourceHeading: `E2E Tab Topic ${i}`, bodyHtml: `<p>${word} body text</p>`, bodyText: `${word} body text`, wordCount: 3, images: [], publish: true, importedAt: new Date() },
        (id) => id,
      ),
    );
  }

  // Landing bare defaults to Content, with the excerpt visible.
  await page.goto(`/free-trainings?q=${word}`);
  await expect(page.getByTestId("topics-tab-content")).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("topics-tab-index")).not.toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("topics-list")).toContainText("body text");
  await expect(page.getByTestId("topics-index-list")).toHaveCount(0);
  await expectNoAxeViolations(page);

  // Index: names only (no excerpt), the full matching list, no pagination controls.
  await page.getByTestId("topics-tab-index").click();
  await expect(page).toHaveURL(/tab=index/);
  await expect(page.getByTestId("topics-tab-index")).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("index-item")).toHaveCount(3);
  await expect(page.getByTestId("topics-index-list")).not.toContainText("body text");
  await expect(page.getByTestId("topics-list")).toHaveCount(0);
  await expect(page.getByTestId("topics-pagination")).toHaveCount(0);
  await expectNoAxeViolations(page);

  // A search submitted from Index stays on Index.
  await page.getByRole("searchbox", { name: "Search topics" }).fill(word);
  await page.getByTestId("topics-search").click();
  await expect(page).toHaveURL(/tab=index/);
  await expect(page.getByTestId("index-item")).toHaveCount(3);

  // Switching back to Content restores the excerpt view.
  await page.getByTestId("topics-tab-content").click();
  await expect(page).toHaveURL(/(?:\?|&)q=e2etabqzxjk(?:&|$)/);
  await expect(page.getByTestId("topics-list")).toContainText("body text");
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
  await page.goto("/free-trainings");
  await expect(page.locator(`[data-testid="topic-card"][data-slug="${PREFIX}-entity"]`)).toHaveCount(0);

  await page.goto("/admin/free-learning");
  await row.getByTestId("free-learning-toggle").click();
  await expect(row.getByTestId("free-learning-admin-status")).toHaveText("Published");
  expect((await request.get(`/free-learning/topics/${PREFIX}-entity`)).status()).toBe(200);

  const { getPrisma } = await import("../../src/db/prisma");
  const audit = await getPrisma().auditLog.findMany({ where: { entityType: "book_topic", entityId: topicAId }, orderBy: { createdAt: "asc" } });
  expect(audit.map((a) => (a.after as { published: boolean }).published)).toEqual([false, true]);
});
