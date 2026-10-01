import AxeBuilder from "@axe-core/playwright";
import { CONTACT_EMAIL, contactMailto, interestSubject } from "../../src/content/contact";
import { expect, test, type Page } from "@playwright/test";
import { footerExplore, footerLegal, primaryNav, verifyLink } from "../../src/shared/chrome/site-nav";

/*
 * Public portal — end to end (M3 plan §8). Every navigation target resolves;
 * the programme page shows what the DATABASE holds (expected values read
 * through the repository, never typed here); unlisted programmes 404; the
 * schedule is honest about having no dates; the contact form persists.
 */

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

const navTargets = [...new Set([...primaryNav, ...footerExplore, ...footerLegal, verifyLink].map((i) => i.href))];

test("every header and footer link resolves with 200", async ({ request }) => {
  for (const href of navTargets) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

test("programme page renders the flagship from the database", async ({ page }) => {
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const { formatMoney } = await import("../../src/modules/catalogue/programmes/types");
  const flagship = await findFlagshipProgramme();
  expect(flagship, "seeded flagship").not.toBeNull();

  // 2026-09-26: the flagship renders through the shared training template
  // at its /programs page (its bespoke landing was retired that day); the
  // curriculum is two modules whose titles appear as the accordion summaries.
  await page.goto(`/programs/${flagship!.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const body = await page.locator("body").innerText();
  for (const m of flagship!.modules) expect(body, `module ${m.position}`).toContain(m.title);
  const my = flagship!.prices.find((p) => p.region === "malaysia")!;
  expect(body).toContain(formatMoney(my.offerAmountMinor, my.currency));
  for (const f of flagship!.deliveryFormats) expect(body, `format ${f.code}`).toContain(f.name);
  await expectNoAxeViolations(page);
});

test("an unlisted programme is a real 404; the published one is served", async ({ page }) => {
  const { findFlagshipProgramme, listPublishedProgrammes } = await import("../../src/modules/catalogue/programmes/repository");
  const { getPrisma, withTransaction } = await import("../../src/db/prisma");
  const { createTraining } = await import("../../src/modules/catalogue/programmes/admin.repository");
  const { randomUUID } = await import("node:crypto");
  const prisma = getPrisma();

  // "Unlisted" is a lifecycle state (disable, not delete), not a seed-content
  // property — a dedicated fixture created via createTraining() (which always
  // creates status:"unlisted") proves the 404 without depending on the seed
  // file containing any particular non-published entry (M14: deleted seed
  // entries must never resurrect, and must not be relied on by tests either).
  const domainId = (await prisma.domain.findFirst({ select: { id: true } }))!.id;
  const run = randomUUID().slice(0, 8);
  const unlisted = await withTransaction((tx) =>
    createTraining(
      tx,
      {
        title: `E2E Unlisted Programme ${run}`,
        subtitle: "A subtitle",
        slug: `e2e-unlisted-${run}`,
        domainId,
        level: "practitioner",
        flagship: false,
        durationLabel: "2 days",
        prerequisites: "None",
        formats: ["Live online"],
        certificateLabel: "Certificate of Completion",
        audienceSummary: "People who test",
        summary: "A summary of the test training.",
        valueProposition: "Learn to test.",
        sortOrder: 99,
      },
      { userId: randomUUID(), expertId: null },
    ),
  );
  try {
    expect((await page.goto(`/programs/${unlisted.slug}`))?.status()).toBe(404);

    const flagship = (await findFlagshipProgramme())!;
    expect((await page.goto(`/programs/${flagship.slug}`))?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Two trainings are published since 2026-09-26 (Learn Vibe Coding + the flagship).
    expect((await listPublishedProgrammes()).length).toBe(2);
  } finally {
    await prisma.auditLog.deleteMany({ where: { entityType: "programme", entityId: unlisted.id } });
    await prisma.programme.deleteMany({ where: { id: unlisted.id } });
  }
});

test("schedule shows the honest no-dates state and a register-interest path", async ({ page }) => {
  await page.goto("/schedule");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const interest = page.getByRole("link", { name: /register interest/i }).first();
  await expect(interest).toBeVisible();
  await expect(interest).toHaveAttribute("href", /^mailto:sales@yourpartnertechnologies\.com\?subject=Interest/);
  await expectNoAxeViolations(page);
});

// Founder, 2026-09-29 (Milestone 15, Req 8): the contact form is gone; the page
// carries the founder-supplied sales email as its one contact option (WhatsApp
// was dropped). Every "register interest"-style button is an email with the
// training in the subject.
test("contact page: no form, one email option, no WhatsApp; an old context link keeps its subject; no accessibility violations", async ({ page }) => {
  await page.goto("/contact-us");
  await expect(page.getByTestId("contact-section")).toBeVisible();
  // No form inside the page body (the header's search form sits outside <main>).
  await expect(page.locator("main form")).toHaveCount(0);
  await expect(page.getByLabel("Your name")).toHaveCount(0);

  const email = page.getByTestId("contact-email");
  await expect(email).toHaveText(CONTACT_EMAIL);
  await expect(email).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
  await expect(page.locator("a[href*='wa.me'], a[href*='whatsapp']")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/whatsapp/i);
  await expectNoAxeViolations(page);

  // A link shared before the form was removed still resolves, and the email keeps the training.
  await page.goto("/contact-us?kind=programme_interest&programme=learn-vibe-coding");
  await expect(page.getByTestId("contact-about")).toContainText("Learn Vibe Coding");
  await expect(page.getByTestId("contact-email")).toHaveAttribute("href", contactMailto(interestSubject("Learn Vibe Coding")));
});

test("public pages have no WCAG 2.2 AA violations", async ({ page }) => {
  for (const href of ["/", "/programs", "/about-us", "/faq", "/free-trainings", "/assessment", "/verify"]) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 }), href).toBeVisible();
    await expectNoAxeViolations(page);
  }
});

// Founder, 2026-09-30 (M7): no trainer dedicated pages. The top-level slug is a
// content-less, data-driven redirect: a PUBLISHED trainer with an external
// profile (Medium, else LinkedIn; https only) -> 308 to it; anything else -> 404.
test("the old trainer address 308s to the trainer's external profile (data-driven); unknown, unpublished and URL-less trainers are 404", async ({ request }) => {
  const { findPublishedExpertBySlug } = await import("../../src/modules/catalogue/experts/repository");
  const { trainerProfileUrl } = await import("../../src/modules/catalogue/experts/profile-url");

  // Mustafa Qizilbash -> the Medium profile stored on his record (seed data).
  const founder = await findPublishedExpertBySlug("mustafa-qizilbash");
  expect(founder).not.toBeNull();
  expect(trainerProfileUrl(founder)).toBe("https://medium.com/@mustafaisonline/profile-mustafa-qizilbash-2fb7a294f40f");
  const res = await request.get("/mustafa-qizilbash", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toBe("https://medium.com/@mustafaisonline/profile-mustafa-qizilbash-2fb7a294f40f");

  // The retired directory addresses chain into it (one hop each; not followed).
  const dir = await request.get("/trainers", { maxRedirects: 0 });
  expect(dir.status()).toBe(308);
  expect(dir.headers()["location"]).toMatch(/\/mustafa-qizilbash$/);
  const dirSlug = await request.get("/trainers/mustafa-qizilbash", { maxRedirects: 0 });
  expect(dirSlug.status()).toBe(308);
  expect(dirSlug.headers()["location"]).toMatch(/\/mustafa-qizilbash$/);

  // Unknown slug: an ordinary 404.
  expect((await request.get("/nobody-here", { maxRedirects: 0 })).status()).toBe(404);

  // Data-driven: LinkedIn is the fallback; a trainer with no usable URL, an
  // unsafe (non-https) one, or an unpublished one is a 404 — nothing is invented.
  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const run = `${Date.now().toString(36)}`;
  const base = { name: "E2E Redirect Trainer", roleTitle: "Trainer", location: "Nowhere", headline: "h", experienceLine: "e", summary: "s", photoPath: "/experts/mustafa-qizilbash-v2.jpg", expertise: [] as string[] };
  const profileWith = (extra: Record<string, unknown>) => ({ about: [], background: [], specialisations: [], technologies: [], certifications: [], education: [], ...extra });
  const linkedin = "https://www.linkedin.com/in/e2e-redirect-trainer/";
  const slugs = { linkedin: `e2e-li-${run}`, none: `e2e-none-${run}`, unsafe: `e2e-unsafe-${run}`, unpublished: `e2e-unpub-${run}` };
  try {
    await prisma.expert.create({ data: { ...base, slug: slugs.linkedin, published: true, profile: profileWith({ linkedin }) } });
    await prisma.expert.create({ data: { ...base, slug: slugs.none, published: true, profile: profileWith({}) } });
    await prisma.expert.create({ data: { ...base, slug: slugs.unsafe, published: true, profile: profileWith({ mediumProfile: "javascript:alert(1)", linkedin: "http://www.linkedin.com/in/x" }) } });
    await prisma.expert.create({ data: { ...base, slug: slugs.unpublished, published: false, profile: profileWith({ mediumProfile: "https://medium.com/@hidden" }) } });

    const li = await request.get(`/${slugs.linkedin}`, { maxRedirects: 0 });
    expect(li.status()).toBe(308);
    expect(li.headers()["location"]).toBe(linkedin);
    for (const slug of [slugs.none, slugs.unsafe, slugs.unpublished]) {
      expect((await request.get(`/${slug}`, { maxRedirects: 0 })).status(), slug).toBe(404);
    }
  } finally {
    await prisma.expert.deleteMany({ where: { slug: { in: Object.values(slugs) } } });
  }
});

test("no public page links to a trainer page, and the sitemap lists none (founder, 2026-09-30, M7)", async ({ page, request }) => {
  for (const href of ["/", "/programs", "/programs/learn-vibe-coding", "/programs/data-blueprint-ai-vibe-coding", "/about-us", "/contact-us", "/free-trainings", "/assessment", "/faq", "/schedule", "/reviews", "/verify"]) {
    await page.goto(href);
    const links = await page.locator("a[href]").evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(links.filter((h) => /^\/(mustafa-qizilbash|trainers)(\/|#|\?|$)/.test(h)), href).toEqual([]);
  }
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).not.toContain("mustafa-qizilbash");
  expect(xml).not.toContain("/trainers");
  // The footer has no "Trainer" item any more.
  await page.goto("/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Trainer", exact: true })).toHaveCount(0);
});

test.afterAll(async () => {
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});

test("the site has a favicon: an icon link in the page head, the SVG and the Apple touch icon are served (founder, 2026-09-30)", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('head link[rel="icon"]').first()).toHaveAttribute("href", /\/icon\.svg/);
  await expect(page.locator('head link[rel="apple-touch-icon"]').first()).toHaveAttribute("href", /\/apple-icon\.png/);
  const svg = await request.get("/icon.svg");
  expect(svg.status()).toBe(200);
  expect(svg.headers()["content-type"]).toContain("image/svg+xml");
  const apple = await request.get("/apple-icon.png");
  expect(apple.status()).toBe(200);
  expect(apple.headers()["content-type"]).toContain("image/png");
});
