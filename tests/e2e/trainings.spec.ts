import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { contactUsHref } from "../../src/content/contact";

/*
 * Trainings hub and training pages — end to end (founder request 2026-09-26:
 * "/DataBlueprint-AIVibeCoding → /programs", "Programme → Trainings", the
 * Learn Vibe Coding training; second round the same day: prices at 75% off
 * with the original struck through, the Investment section as region CARDS
 * with the payment rule per region, "Who can take this training", "What you
 * get out of this training", participant numbers under the formats, no
 * "Included" list, and the "← All trainings" link on the flagship page).
 * Expected values are read from the database through the repository, never
 * typed here, except the founder-given prices, which are asserted literally
 * because the request fixed them.
 */

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

const LOCAL_PARTNER = "Please contact us — our local partner will contact you to arrange payment through local banks or in cash.";
const NO_CARD_ANYWHERE =
  "Please contact us — we will make sure our local partner contacts you, anywhere in the world, to arrange payment through local banks or in cash.";

/** The shared Investment cards: four cards in the founder's order, the
 *  price per region with its original struck through and "75% OFF", the
 *  payment rule per region, the Pakistan local-partner message and the
 *  fourth "Can't pay by card?" card. */
async function expectInvestmentCards(page: Page, slug: string, figures: Record<"international" | "malaysia" | "pakistan", { today: string; original: string }>) {
  const investment = page.locator("#investment");
  // Founder, 2026-10-03: no email address on the portal — the price cards' "Contact us" leads to the Contact Us form with the training pre-set.
  const { findPublishedProgrammeBySlug } = await import("../../src/modules/catalogue/programmes/repository");
  const enquiry = contactUsHref({ kind: "programme_interest", programmeSlug: (await findPublishedProgrammeBySlug(slug))!.slug });
  await expect(investment.getByRole("heading", { name: "Course investment" })).toBeVisible();
  await expect(investment.getByRole("tab")).toHaveCount(0);
  const cards = investment.getByTestId("price-cards").locator("> *");
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(0)).toHaveAttribute("data-testid", "price-card-international");
  await expect(cards.nth(1)).toHaveAttribute("data-testid", "price-card-malaysia");
  await expect(cards.nth(2)).toHaveAttribute("data-testid", "price-card-pakistan");
  await expect(cards.nth(3)).toHaveAttribute("data-testid", "price-card-no-card");

  for (const [region, f] of Object.entries(figures) as ["international" | "malaysia" | "pakistan", { today: string; original: string }][]) {
    const card = investment.getByTestId(`price-card-${region}`);
    await expect(card.getByText(f.today, { exact: true })).toBeVisible();
    await expect(card.locator(".line-through").filter({ hasText: f.original })).toBeVisible();
    await expect(card.getByText("75% OFF", { exact: true })).toBeVisible();
    await expect(card.getByText("How you pay")).toBeVisible();
  }
  await expect(investment.getByTestId("price-card-malaysia")).toContainText("Card payment in RM");
  await expect(investment.getByTestId("price-card-malaysia")).toContainText(/you save/i);
  await expect(investment.getByTestId("price-card-international")).toContainText("Card payment in USD");
  await expect(investment.getByTestId("price-card-international")).toContainText(/you save/i);

  // M13 (founder decisions 1–2, 2026-09-27): the card-paying regions carry ONE
  // button, "See dates and register", to this training's dates on the
  // schedule; "See upcoming dates" and "Register your interest" are gone
  // from the cards. The filtered schedule names the training and offers
  // the way back to all trainings.
  for (const region of ["international", "malaysia"] as const) {
    const card = investment.getByTestId(`price-card-${region}`);
    await expect(card.getByTestId(`see-dates-${region}`)).toHaveText("See dates and register");
    await expect(card.getByTestId(`see-dates-${region}`)).toHaveAttribute("href", `/schedule?training=${slug}`);
    await expect(card.getByRole("link", { name: "See upcoming dates" })).toHaveCount(0);
    await expect(card.getByRole("link", { name: "Register your interest" })).toHaveCount(0);
  }
  const title = await page.getByRole("heading", { level: 1 }).first().innerText();
  await page.goto(`/schedule?training=${slug}`);
  await expect(page.getByTestId("schedule-title")).toHaveText(`Dates for ${title}`);
  await expect(page.getByTestId("schedule-all")).toHaveAttribute("href", "/schedule");
  await page.goto("/schedule?training=no-such-training");
  await expect(page.getByTestId("schedule-title")).toHaveText("Upcoming dates");
  await page.goto(`/programs/${slug}`);

  // Pakistan: no card — the local-partner message and a Contact us button.
  const pk = investment.getByTestId("price-card-pakistan");
  await expect(pk).toContainText("Payment through our local partner");
  await expect(pk.getByTestId("local-partner-message")).toHaveText(LOCAL_PARTNER);
  await expect(pk.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", enquiry);
  await expect(pk.getByRole("link", { name: /see upcoming dates/i })).toHaveCount(0);

  // The fourth card.
  const noCard = investment.getByTestId("price-card-no-card");
  await expect(noCard.getByRole("heading", { name: "Can’t pay by card?" })).toBeVisible();
  await expect(noCard).toContainText(NO_CARD_ANYWHERE);
  await expect(noCard.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", enquiry);

  // No value stack, no stale "no online payment" sentence.
  await expect(investment.getByText("What is included")).toHaveCount(0);
  await expect(investment.getByText("Total value")).toHaveCount(0);
  await expect(investment.getByText(/no online payment yet/i)).toHaveCount(0);
}

// Founder, 2026-09-28: the training cards carried the trainer's photo; since
// 2026-09-30 (M6) they do not. One training still gets a real photo here, so the
// /programs test proves a card with a stored photo renders NO image (and the
// photo route/upload keep working for the admin).
test.beforeAll(async () => {
  const { readFileSync } = await import("node:fs");
  const { getPrisma } = await import("../../src/db/prisma");
  const photo = readFileSync("public/experts/mustafa-qizilbash-v2.jpg");
  await getPrisma().programme.update({
    where: { slug: "learn-vibe-coding" },
    data: { photo, photoMime: "image/jpeg", photoUpdatedAt: new Date() },
  });
});

test("/programs lists exactly the published trainings in order as small tiles — name, subhead, a format graph and the two buttons; no prices (they are on each training's page)", async ({ page }) => {
  const { listPublishedProgrammes } = await import("../../src/modules/catalogue/programmes/repository");
  const published = await listPublishedProgrammes();
  expect(published.map((p) => p.slug)).toEqual(["learn-vibe-coding", "data-blueprint-ai-vibe-coding"]);

  await page.goto("/programs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trainings");
  const items = page.getByTestId("trainings-list").locator("> li");
  await expect(items).toHaveCount(published.length);
  for (const [i, p] of published.entries()) {
    const item = items.nth(i);
    await expect(item.getByRole("heading", { level: 3 })).toHaveText(p.title);
    await expect(item.getByTestId("tile-subhead")).not.toHaveText("");
    await expect(item.getByTestId("card-details")).toHaveAttribute("href", `/programs/${p.slug}`);
    await expect(item.getByTestId("card-register")).toContainText("Register");
    await expect(item.getByTestId("card-register")).toHaveAttribute("href", `/schedule?training=${p.slug}`);
    // The graph: one dot per pace format, with a plain-words label.
    const graph = item.getByTestId("tile-graph");
    await expect(graph.getByRole("img")).toHaveAttribute("aria-label", /format|dates/);
    expect(Number(await graph.getAttribute("data-total"))).toBeGreaterThan(0);
    // Small tiles: prices, timelines and the HRD note live on the training's own page.
    await expect(item).not.toContainText("RM ");
    await expect(item).not.toContainText("USD ");
    await expect(item).not.toContainText("OFF");
    await expect(item.getByTestId("card-timelines")).toHaveCount(0);
  }
  // Four across on a wide screen, so tens of trainings stay scannable.
  const first = await items.nth(0).boundingBox();
  const second = await items.nth(1).boundingBox();
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(4); // side by side, not stacked
});

test("/programs/learn-vibe-coding renders the training with its sections, the region price cards and the payment rule", async ({ page }) => {
  const { findPublishedProgrammeBySlug } = await import("../../src/modules/catalogue/programmes/repository");
  const training = await findPublishedProgrammeBySlug("learn-vibe-coding");
  expect(training, "seeded Learn Vibe Coding").not.toBeNull();

  const res = await page.goto("/programs/learn-vibe-coding");
  // 200 with the photo set (beforeAll). Founder, 2026-09-28 evening: the
  // detail page carries NO images any more — the photo lives on the
  // /programs card alone (asserted in the listing test), and the two
  // section illustrations are gone.
  expect(res?.status()).toBe(200);
  await expect(page.locator("img[src*='programs%2Fimages'], img[src^='/programs/images/']")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(training!.title);
  await expect(page.getByRole("link", { name: "← All trainings" })).toHaveAttribute("href", "/programs");
  await expect(page.getByTestId("relationship-note")).toHaveText(training!.content.relationshipNote!);
  await expect(page.getByRole("heading", { name: "Why you need this training" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start freelancing straight after the session" })).toBeVisible();

  // Header CTAs.
  const hero = page.locator("section").first();
  // CR-2026-10-02-0721: the hero button leads into the interest flow (sign in, returning to the formats) — the mailto is only the fallback when that flow is off.
  await expect(hero.getByRole("link", { name: "Register your interest" })).toHaveAttribute(
    "href",
    new RegExp(`^/sign-in\\?return-to=.*${training!.slug}.*formats$`),
  );
  await expect(hero.getByRole("link", { name: "See dates and register" })).toHaveAttribute("href", "/schedule?training=learn-vibe-coding"); // M13: the page lists no dates; the schedule filtered to this training does
  // The "Trainings" nav item is current on a training page too.
  await expect(page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Professional Trainings" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Who can take this training (renamed; content from the seed) — no coding background needed.
  await expect(page.getByRole("heading", { name: "Who can take this training" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who should attend" })).toHaveCount(0);
  const who = page.locator("#who-can-take-this-training");
  await expect(who).toContainText(training!.content.whoShouldAttend.intro);
  await expect(who).toContainText("no coding background is needed");
  for (const role of training!.content.whoShouldAttend.roles) await expect(who.getByText(role, { exact: true })).toBeVisible();

  // Choose your pace — participant numbers.
  const formats = page.locator("#formats");
  await expect(formats.getByRole("heading", { name: "Flexible learning formats" })).toBeVisible();
  const paceNotes = formats.getByTestId("pace-notes").getByRole("listitem");
  await expect(paceNotes).toHaveText(training!.content.paceNotes!);
  await expect(paceNotes).toHaveText([/Live online — individual seats, priced per person/, /minimum 25 participants; cost discussed separately/]);
  await expect(formats).not.toContainText("up to about 15");

  // What you get out of this training — before the Investment section, incl. the Starter Kit.
  const whatYouGet = page.locator("#what-you-get");
  await expect(whatYouGet.getByRole("heading", { name: "What you get out of this training" })).toBeVisible();
  await expect(whatYouGet.getByTestId("what-you-get").getByRole("listitem")).toHaveText(training!.content.whatYouGet!);
  await expect(whatYouGet).toContainText("Certificate of Completion with a unique ID and public verification page");
  await expect(whatYouGet).toContainText("hard copy when you attend in person, a soft copy when you attend online");
  await expect(whatYouGet).toContainText("Vibe Coding Starter Kit");
  const whatYouGetBox = await whatYouGet.boundingBox();
  const investmentBox = await page.locator("#investment").boundingBox();
  expect(whatYouGetBox!.y).toBeLessThan(investmentBox!.y);

  // No "Included" list.
  await expect(page.getByText("Included", { exact: true })).toHaveCount(0);

  // Six curriculum modules, each a disclosure; the first point of Part 1.
  expect(training!.modules).toHaveLength(6);
  const curriculum = page.locator("#curriculum");
  await expect(curriculum).toContainText("6 modules");
  for (const m of training!.modules) await expect(curriculum.getByText(m.title, { exact: true })).toBeVisible();
  await curriculum.getByText(training!.modules[0]!.title, { exact: true }).click();
  // Learn Vibe Coding's points are plain strings (no groups).
  const firstPoint = training!.modules[0]!.points![0]!;
  expect(typeof firstPoint).toBe("string");
  await expect(curriculum.getByText(firstPoint as string)).toBeVisible();

  // FAQ as native <details>.
  const faq = page.locator("#faq");
  expect(training!.content.faq!.length).toBeGreaterThanOrEqual(4);
  await expect(faq.locator("details")).toHaveCount(training!.content.faq!.length);
  await faq.getByText(training!.content.faq![0]!.q, { exact: true }).click();
  await expect(faq.getByText(training!.content.faq![0]!.a)).toBeVisible();

  // Investment: four cards, the founder's figures at 75% off, the payment rule.
  await expectInvestmentCards(page, "learn-vibe-coding", {
    international: { today: "USD 200", original: "USD 800" },
    malaysia: { today: "RM 500", original: "RM 2,000" },
    pakistan: { today: "Rs. 5,000", original: "Rs. 20,000" },
  });
  const lvcNote = "Online training price. In-person training needs a minimum of 25 participants; cost discussed separately.";
  await expect(page.getByTestId("price-note-malaysia")).toHaveText(lvcNote);
  await expect(page.getByTestId("price-note-international")).toHaveText(lvcNote);
  await expect(page.getByTestId("price-note-pakistan")).toHaveCount(0);
  await expectNoAxeViolations(page);
});

test("/programs/data-blueprint-ai-vibe-coding renders the flagship on the shared training template: the two-module curriculum, the Learn Vibe Coding sections and the price cards", async ({ page }) => {
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const { LEARN_VIBE_CODING_MODULES } = await import("../../prisma/seed-data/courses");
  const flagship = await findFlagshipProgramme();
  expect(flagship).not.toBeNull();
  expect(flagship!.slug).toBe("data-blueprint-ai-vibe-coding");

  const res = await page.goto(`/programs/${flagship!.slug}`);
  expect(res?.status()).toBe(200);
  // The generic template's title h1 — the bespoke landing (retired
  // 2026-09-26) and its "It's a method" headline are gone.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Data Blueprint & AI/Vibe Coding");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(flagship!.title);
  await expect(page.locator("#the-method")).toHaveCount(0);
  await expect(page.getByText("What participants say")).toHaveCount(0);
  await expect(page.getByText("Stop prompting. Start building properly.")).toHaveCount(0);
  const back = page.getByRole("link", { name: "← All trainings" });
  await expect(back).toHaveAttribute("href", "/programs");
  expect((await back.boundingBox())!.y).toBeLessThan((await page.getByRole("heading", { level: 1 }).boundingBox())!.y);
  await expect(page.getByTestId("relationship-note")).toHaveText(flagship!.content.relationshipNote!);
  await expect(page.getByTestId("relationship-note")).toContainText("Module 2 of this training is our standalone Learn Vibe Coding masterclass");

  // Hero CTAs and meta: duration "2 days", Certificate of Completion.
  const hero = page.locator("section").first();
  await expect(hero.getByRole("link", { name: "Register your interest" })).toHaveAttribute(
    "href",
    new RegExp(`^/sign-in\\?return-to=.*${flagship!.slug}.*formats$`),
  );
  await expect(hero.getByRole("link", { name: "See dates and register" })).toHaveAttribute("href", `/schedule?training=${flagship!.slug}`); // M13: the page lists no dates; the schedule filtered to this training does
  await expect(hero.locator("dl")).toContainText("2 days");
  await expect(hero.locator("dl")).toContainText("Certificate of Completion");
  await expect(hero.locator("dl")).not.toContainText("4 weeks");
  await expect(hero.locator("dl")).not.toContainText(/participation/i);

  // The sections Learn Vibe Coding has, now on the flagship too.
  await expect(page.getByRole("heading", { name: "Why you need this training" })).toBeVisible();
  await expect(page.getByRole("heading", { name: flagship!.content.afterThisTraining!.heading })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start freelancing or lead data-and-AI work straight after" })).toBeVisible();
  const after = page.locator("#after-this-training");
  await expect(after.getByRole("listitem")).toHaveText(flagship!.content.afterThisTraining!.items);
  await expect(after).not.toContainText(/income|earn/i);

  // Who can take this training — from the seed, no coding required.
  await expect(page.getByRole("heading", { name: "Who can take this training" })).toBeVisible();
  const who = page.locator("#who-can-take-this-training");
  await expect(who).toContainText(flagship!.content.whoShouldAttend.intro);
  await expect(who).toContainText("no coding is required");
  for (const role of flagship!.content.whoShouldAttend.roles) await expect(who.getByText(role, { exact: true })).toBeVisible();

  // Participant numbers under the formats (the three formats are kept).
  const formats = page.locator("#formats");
  await expect(formats.getByRole("heading", { name: "Flexible learning formats" })).toBeVisible();
  for (const f of flagship!.deliveryFormats) await expect(formats.getByText(f.name, { exact: true }).first()).toBeVisible();
  const paceNotes = formats.getByTestId("pace-notes").getByRole("listitem");
  await expect(paceNotes).toHaveText(flagship!.content.paceNotes!);
  await expect(paceNotes).toHaveText([/Malaysia — in person only, minimum 25 participants/, /Outside Malaysia — online per person; in person from 100 participants/, /Pakistan — in person from 100 participants, online from 10 participants/]);

  // Curriculum: exactly TWO modules (founder, 2026-09-26). Module 1 groups the
  // ten Data Blueprint topics; Module 2 IS the Learn Vibe Coding curriculum.
  expect(flagship!.modules).toHaveLength(2);
  const curriculum = page.locator("#curriculum");
  await expect(curriculum).toContainText("2 modules");
  await expect(curriculum).not.toContainText("17 modules");
  await expect(curriculum.getByText("Module 1 · Data Blueprint", { exact: true })).toBeVisible();
  await expect(curriculum.getByText("Module 2 · Learn Vibe Coding", { exact: true })).toBeVisible();
  const modules = curriculum.locator("details");
  await expect(modules).toHaveCount(2);
  const module2 = modules.nth(1);
  await curriculum.getByText("Module 2 · Learn Vibe Coding", { exact: true }).click();
  await expect(module2.getByTestId("module-point-group")).toHaveCount(LEARN_VIBE_CODING_MODULES.length);
  await expect(module2.getByTestId("module-point-group")).toHaveCount(6);
  await expect(module2.getByRole("heading", { level: 4, name: "Part 1 · Foundations (about 60 minutes)" })).toBeVisible();
  await expect(module2.getByText("What is Vibe Coding, and what it is not")).toBeVisible();
  await expect(module2.getByText(LEARN_VIBE_CODING_MODULES[0]!.points[0]!)).toBeVisible();
  for (const m of LEARN_VIBE_CODING_MODULES) await expect(module2.getByRole("heading", { level: 4, name: m.title })).toBeVisible();
  const module1 = modules.nth(0);
  await curriculum.getByText("Module 1 · Data Blueprint", { exact: true }).click();
  await expect(module1.getByTestId("module-point-group")).toHaveCount(10);
  await expect(module1.getByRole("heading", { level: 4, name: "Decision support systems (DSS)" })).toBeVisible();
  await expect(module1.getByRole("heading", { level: 4, name: "Agentic AI" })).toBeVisible();
  await expect(module1.getByText("OLTP vs OLAP — operational systems vs analytical systems")).toBeVisible();
  // The retired modules 11–17 do not render.
  for (const gone of ["Product discovery & validation", "Prompt engineering & PromptOS", "Capstone project"]) {
    await expect(curriculum.getByText(gone, { exact: true })).toHaveCount(0);
  }

  // The learning journey carries the plan → build → test → deploy → improve loop.
  for (const step of ["Plan", "Build", "Test", "Deploy", "Improve"]) {
    await expect(page.getByRole("heading", { level: 3, name: step, exact: true })).toBeVisible();
  }

  // What you get — two items, before the Investment section.
  const whatYouGet = page.locator("#what-you-get");
  await expect(whatYouGet.getByRole("heading", { name: "What you get out of this training" })).toBeVisible();
  await expect(whatYouGet.getByTestId("what-you-get").getByRole("listitem")).toHaveText(flagship!.content.whatYouGet!);
  await expect(whatYouGet).not.toContainText("Starter Kit");
  expect((await whatYouGet.boundingBox())!.y).toBeLessThan((await page.locator("#investment").boundingBox())!.y);
  await expect(page.getByText("Included", { exact: true })).toHaveCount(0);

  // Trainer: the template's TrainerCard shows the published expert.
  await expect(page.getByRole("heading", { name: "Taught by a practitioner" })).toBeVisible();
  expect(flagship!.experts.length).toBeGreaterThan(0);
  await expect(page.getByText(flagship!.experts[0]!.name, { exact: true }).first()).toBeVisible();
  // M7 link rule (founder, 2026-09-30): the trainer's name links ONLY to their
  // external profile (Medium, else LinkedIn), safely in a new tab — and is plain
  // text when there is none. Never a link to a dedicated portal page.
  {
    const { listPublishedExperts } = await import("../../src/modules/catalogue/experts/repository");
    const { trainerProfileUrl } = await import("../../src/modules/catalogue/experts/profile-url");
    const shown = (await listPublishedExperts()).find((e) => e.name === flagship!.experts[0]!.name)!;
    const expectedUrl = trainerProfileUrl(shown);
    const nameLink = page.getByTestId("trainer-card-name-link");
    if (expectedUrl) {
      await expect(nameLink).toHaveAttribute("href", expectedUrl);
      await expect(nameLink).toHaveAttribute("target", "_blank");
      await expect(nameLink).toHaveAttribute("rel", /noopener/);
      await expect(nameLink).toHaveAttribute("rel", /noreferrer/);
      await expect(nameLink).toContainText("(opens external site)");
    } else {
      await expect(nameLink).toHaveCount(0);
      await expect(page.getByTestId("trainer-card-name")).toHaveText(shown.name);
    }
    await expect(page.locator('a[href^="/mustafa-qizilbash"]')).toHaveCount(0);
    // CR-2026-10-01-2246: a trainer with an HRD Corp accreditation also shows the Trainer ID and HRD Corp's own verification link; one without shows neither.
    const hrd = shown.hrdCorpAccreditation;
    const verify = page.getByTestId("trainer-card-hrd-verify");
    if (hrd) {
      await expect(page.getByTestId("trainer-card-hrd")).toContainText(`ID ${hrd.trainerId}`);
      await expect(verify).toHaveText("Verify on HRD Corp ↗");
      await expect(verify).toHaveAttribute("href", hrd.verifyUrl);
      await expect(verify).toHaveAttribute("target", "_blank");
      await expect(verify).toHaveAttribute("rel", /noopener/);
      await expect(verify).toHaveAttribute("rel", /noreferrer/);
    } else {
      await expect(verify).toHaveCount(0);
      await expect(page.getByTestId("trainer-card-hrd")).toHaveCount(0);
    }
  }

  // Certification note and FAQ (five questions, native <details>).
  await expect(page.getByText(/This training awards a/)).toContainText("certificate of completion");
  const faq = page.locator("#faq");
  expect(flagship!.content.faq).toHaveLength(5);
  await expect(faq.locator("details")).toHaveCount(5);
  await faq.getByText("Is Module 2 the same as the Learn Vibe Coding training?", { exact: true }).click();
  await expect(faq.getByText(flagship!.content.faq![1]!.a)).toBeVisible();

  // Related trainings: Learn Vibe Coding is linked.
  await expect(page.getByRole("heading", { name: "Related trainings" })).toBeVisible();
  await expect(page.locator('a[href="/programs/learn-vibe-coding"]').first()).toBeVisible();

  // Investment cards — UPDATED 2026-09-26, second time that day: Malaysia
  // now shows two figures (via `options`, like Pakistan used to), Pakistan
  // now shows one figure (like International always has), each region has
  // its own discount label, so `expectInvestmentCards` (which assumes a
  // flat "75% OFF" and the simple today/original layout everywhere) no
  // longer fits this card set — asserted directly instead.
  const investment = page.locator("#investment");
  const enquiry = contactUsHref({ kind: "programme_interest", programmeSlug: flagship!.slug });
  await expect(investment.getByRole("heading", { name: "Course investment" })).toBeVisible();
  await expect(investment.getByRole("tab")).toHaveCount(0);
  const cards = investment.getByTestId("price-cards").locator("> *");
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(0)).toHaveAttribute("data-testid", "price-card-international");
  await expect(cards.nth(1)).toHaveAttribute("data-testid", "price-card-malaysia");
  await expect(cards.nth(2)).toHaveAttribute("data-testid", "price-card-pakistan");
  await expect(cards.nth(3)).toHaveAttribute("data-testid", "price-card-no-card");

  // International — simple figure, unchanged layout, new amounts, 75% OFF.
  const intl = investment.getByTestId("price-card-international");
  await expect(intl.getByText("USD 1,000", { exact: true })).toBeVisible();
  await expect(intl.locator(".line-through").filter({ hasText: "USD 4,000" })).toBeVisible();
  await expect(intl.getByText("75% OFF", { exact: true })).toBeVisible();
  await expect(intl).toContainText("Card payment in USD");
  await expect(intl).toContainText(/you save/i);

  // Malaysia — two fee ROWS on one card (M12 WP1): "Via HRD Corp"
  // (`malaysia_hrdcorp`) at the undiscounted RM 5,000 (today = original,
  // so no strike-through), "Without HRD Corp" (`malaysia`, the checkout
  // row) at RM 2,500 with RM 5,000 struck through. Each row is scoped by
  // its `<dt>` label — "RM 5,000" appears twice on this card.
  const my = investment.getByTestId("price-card-malaysia");
  await expect(my.getByText("50% OFF", { exact: true })).toBeVisible();
  await expect(my.getByTestId("price-row-malaysia_hrdcorp")).toBeVisible();
  await expect(my.getByTestId("price-row-malaysia")).toBeVisible();
  const hrdCorpRow = my.locator("dl > div").filter({ hasText: "Via HRD Corp" });
  await expect(hrdCorpRow.getByText("RM 5,000", { exact: true })).toBeVisible();
  await expect(hrdCorpRow.locator(".line-through")).toHaveCount(0);
  await expect(hrdCorpRow).toContainText(/minimum 25 participants/i);
  const withoutHrdCorpRow = my.locator("dl > div").filter({ hasText: "Without HRD Corp" });
  await expect(withoutHrdCorpRow.getByText("RM 2,500", { exact: true })).toBeVisible();
  await expect(withoutHrdCorpRow.locator(".line-through")).toHaveText("RM 5,000");
  await expect(withoutHrdCorpRow).toContainText(/minimum 25 participants/i);
  await expect(my).toContainText("Card payment in RM");

  // Pakistan — now the simple single-figure layout (no `options`), 55% OFF.
  const pk = investment.getByTestId("price-card-pakistan");
  await expect(pk.getByText("Rs. 100,000", { exact: true })).toBeVisible();
  await expect(pk.locator(".line-through").filter({ hasText: "Rs. 200,000" })).toBeVisible();
  await expect(pk.getByText("55% OFF", { exact: true })).toBeVisible();
  await expect(pk.getByText("In-person", { exact: true })).toHaveCount(0);
  await expect(pk).toContainText("Payment through our local partner");
  await expect(pk.getByTestId("local-partner-message")).toHaveText(LOCAL_PARTNER);
  await expect(pk.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", enquiry);

  // The fourth card, and no stray value-stack/old-payment text.
  const noCard = investment.getByTestId("price-card-no-card");
  await expect(noCard.getByRole("heading", { name: "Can’t pay by card?" })).toBeVisible();
  await expect(noCard.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", enquiry);
  await expect(investment.getByText("What is included")).toHaveCount(0);
  await expect(investment.getByText("Total value")).toHaveCount(0);
  await expect(investment.getByText(/no online payment yet/i)).toHaveCount(0);

  await expect(page.getByTestId("price-note-malaysia")).toHaveText(
    "In-person training price. Minimum 25 participants. There is no online option for this training in Malaysia.",
  );
  await expect(page.getByTestId("price-note-pakistan")).toHaveText(
    "Online training price. In-person training needs a minimum of 100 participants; cost discussed separately.",
  );
  await expect(page.getByTestId("price-note-international")).toHaveText(
    "Online training price. In-person training needs a minimum of 100 participants; cost discussed separately.",
  );
  await expectNoAxeViolations(page);
});

test("every published training's \"Who delivers this\" shows the trainer's HRD Corp verification link when the trainer has the HRD badge (CR-2026-10-01-2246)", async ({ page }) => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const { listPublishedExperts } = await import("../../src/modules/catalogue/experts/repository");
  const slugs = (await getPrisma().programme.findMany({ where: { status: "published" }, select: { slug: true } })).map((p) => p.slug);
  await disconnectPrisma();
  expect(slugs.length).toBeGreaterThanOrEqual(2);
  const accredited = (await listPublishedExperts()).filter((e) => e.hrdCorpAccreditation);
  expect(accredited.length).toBeGreaterThanOrEqual(1);
  for (const slug of slugs) {
    await page.goto(`/programs/${slug}`);
    const card = page.getByTestId("trainer-card-name");
    if ((await card.count()) === 0) continue; // a training with no trainer card shows no section
    const verify = page.getByTestId("trainer-card-hrd-verify");
    await expect(verify, slug).toHaveCount(1);
    await expect(verify, slug).toHaveAttribute("href", /^https:\/\/trainers\.hrdcorp\.gov\.my\/ecert\?id=/);
  }
});

test("the retired URLs redirect permanently to the /programs paths", async ({ request }) => {
  const old = await request.get("/DataBlueprint-AIVibeCoding", { maxRedirects: 0 });
  expect(old.status()).toBeGreaterThanOrEqual(300);
  expect(old.status()).toBeLessThan(400);
  expect(old.headers()["location"]).toMatch(/\/programs\/data-blueprint-ai-vibe-coding$/);

  const course = await request.get("/courses/learn-vibe-coding", { maxRedirects: 0 });
  expect(course.status()).toBeGreaterThanOrEqual(300);
  expect(course.status()).toBeLessThan(400);
  expect(course.headers()["location"]).toMatch(/\/programs\/learn-vibe-coding$/);

  const index = await request.get("/courses", { maxRedirects: 0 });
  expect(index.headers()["location"]).toMatch(/\/programs$/);

  // Followed, they land on 200 pages.
  expect((await request.get("/DataBlueprint-AIVibeCoding")).status()).toBe(200);
  expect((await request.get("/courses/learn-vibe-coding")).status()).toBe(200);
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  await getPrisma().programme.update({ where: { slug: "learn-vibe-coding" }, data: { photo: null, photoMime: null, photoUpdatedAt: null } });
  await disconnectPrisma();
});
