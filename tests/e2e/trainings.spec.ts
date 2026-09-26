import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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
  const enquiry = `/contact-us?kind=programme_interest&programme=${slug}`;
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

test("/programs lists exactly the published trainings in order, Learn Vibe Coding first, each linked, priced per region in full words at 75% off", async ({ page }) => {
  const { listPublishedProgrammes } = await import("../../src/modules/catalogue/programmes/repository");
  const published = await listPublishedProgrammes();
  expect(published.map((p) => p.slug)).toEqual(["learn-vibe-coding", "data-blueprint-ai-vibe-coding"]);

  await page.goto("/programs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trainings");
  // Direct children only: each card carries its own per-region price list.
  const items = page.getByTestId("trainings-list").locator("> li");
  await expect(items).toHaveCount(published.length);
  for (const [i, p] of published.entries()) {
    const item = items.nth(i);
    await expect(item.getByRole("heading", { level: 3 })).toHaveText(p.title);
    await expect(item.getByRole("link", { name: /details/i })).toHaveAttribute("href", `/programs/${p.slug}`);
    // Every region named in full — never a code that could read as a currency.
    // "International" became "Rest of the world" (M12 L12, 2026-09-26).
    for (const [card, label] of [["malaysia", "Malaysia"], ["pakistan", "Pakistan"], ["international", "Rest of the world"]] as const) {
      await expect(item.getByTestId(`card-price-${card}`).getByText(label, { exact: true })).toBeVisible();
    }
    await expect(item).not.toContainText("(MY)");
    await expect(item).not.toContainText("(PK)");
    await expect(item).not.toContainText("(INT)");
    await expect(item).not.toContainText("International");
    // Learn Vibe Coding is 75% off in every region; the flagship's prices
    // were updated 2026-09-26 (second time that day) to a different
    // discount per region — see the flagship's own test below.
    if (p.slug === "data-blueprint-ai-vibe-coding") {
      await expect(item.getByText("50% OFF", { exact: true })).toHaveCount(1);
      await expect(item.getByText("55% OFF", { exact: true })).toHaveCount(1);
      await expect(item.getByText("75% OFF", { exact: true })).toHaveCount(1);
    } else {
      await expect(item.getByText("75% OFF", { exact: true })).toHaveCount(3);
    }
  }

  // Learn Vibe Coding: RM 500 (was 2,000) · Rs 5,000 (was 20,000) · USD 200 (was 800), plus the note.
  const lvc = items.nth(0);
  const lvcExpected: [string, string, string][] = [
    ["malaysia", "RM 500", "RM 2,000"],
    ["pakistan", "Rs. 5,000", "Rs. 20,000"],
    ["international", "USD 200", "USD 800"],
  ];
  for (const [region, today, original] of lvcExpected) {
    const row = lvc.getByTestId(`card-price-${region}`);
    await expect(row.getByText(today, { exact: true })).toBeVisible();
    await expect(row.locator(".line-through")).toHaveText(original);
  }
  const lvcNote = "Online training price. In-person training needs a minimum of 25 participants; cost discussed separately.";
  await expect(lvc.getByTestId("card-price-malaysia")).toContainText(lvcNote);
  await expect(lvc.getByTestId("card-price-international")).toContainText(lvcNote);
  await expect(lvc.getByTestId("card-price-pakistan")).not.toContainText(lvcNote);

  // Flagship (updated 2026-09-26, second time that day): RM 2,500 (was
  // 5,000, 50% OFF) · Rs 100,000 (was 200,000, 55% OFF) · USD 1,000 (was
  // 4,000, 75% OFF).
  const flagship = items.nth(1);
  const flagshipExpected: [string, string, string][] = [
    ["malaysia", "RM 2,500", "RM 5,000"],
    ["pakistan", "Rs. 100,000", "Rs. 200,000"],
    ["international", "USD 1,000", "USD 4,000"],
  ];
  for (const [region, today, original] of flagshipExpected) {
    const row = flagship.getByTestId(`card-price-${region}`);
    await expect(row.getByText(today, { exact: true })).toBeVisible();
    await expect(row.locator(".line-through")).toHaveText(original);
  }
  await expect(flagship.getByTestId("card-price-malaysia")).toContainText("no online option for this training in Malaysia");
  await expect(flagship.getByTestId("card-price-international")).toContainText("minimum of 100 participants");
  // Pakistan now carries a note too (it used to have none — this listing
  // card doesn't show Malaysia's or Pakistan's old `options`, so the
  // Pakistan card previously had no note text at all).
  await expect(flagship.getByTestId("card-price-pakistan")).toContainText("minimum of 100 participants");

  // Malaysia's HRD Corp fee — 2026-09-26, later still (founder: "Bring in
  // HRD Corp fee as well" on this listing card too, not just the detail
  // page). M12 WP1 (later that day): both figures are now their own
  // `programme_prices` rows (`malaysia_hrdcorp`, `malaysia`), rendered on
  // the one Malaysia entry — same data as the detail page's price card.
  const myListingOptions = flagship.getByTestId("card-price-options-malaysia");
  await expect(myListingOptions.locator("> div")).toHaveCount(2);
  await expect(myListingOptions.locator("> div").nth(0)).toHaveAttribute("data-testid", "card-price-row-malaysia_hrdcorp");
  await expect(myListingOptions.locator("> div").nth(1)).toHaveAttribute("data-testid", "card-price-row-malaysia");
  const hrdCorpRow = myListingOptions.locator("> div").filter({ hasText: "Via HRD Corp" });
  await expect(hrdCorpRow.getByText("RM 5,000", { exact: true })).toBeVisible();
  await expect(hrdCorpRow.locator(".line-through")).toHaveCount(0);
  await expect(hrdCorpRow).toContainText(/minimum 25 participants/i);
  const withoutHrdCorpRow = myListingOptions.locator("> div").filter({ hasText: "Without HRD Corp" });
  await expect(withoutHrdCorpRow.getByText("RM 2,500", { exact: true })).toBeVisible();
  await expect(withoutHrdCorpRow.locator(".line-through")).toHaveText("RM 5,000");
  await expect(withoutHrdCorpRow).toContainText(/minimum 25 participants/i);

  // No unlisted programme is offered.
  const { getPrisma } = await import("../../src/db/prisma");
  const unlisted = await getPrisma().programme.findMany({ where: { status: "unlisted" }, select: { title: true } });
  const body = await page.locator("body").innerText();
  for (const u of unlisted) expect(body, u.title).not.toContain(u.title);

  // Closing CTA row.
  await expect(page.getByRole("link", { name: "Take the free diagnostic" })).toHaveAttribute("href", "/diagnostic");
  await expect(page.getByRole("link", { name: "Training for a team?" })).toHaveAttribute("href", "/for-organisations");

  // Header nav: "Trainings" is present and current here.
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  await expect(nav.getByRole("link", { name: "Trainings" })).toHaveAttribute("href", "/programs");
  await expect(nav.getByRole("link", { name: "Trainings" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Programme" })).toHaveCount(0);
  await expectNoAxeViolations(page);
});

test("/programs/learn-vibe-coding renders the training with its sections, the region price cards and the payment rule", async ({ page }) => {
  const { findPublishedProgrammeBySlug } = await import("../../src/modules/catalogue/programmes/repository");
  const training = await findPublishedProgrammeBySlug("learn-vibe-coding");
  expect(training, "seeded Learn Vibe Coding").not.toBeNull();

  const res = await page.goto("/programs/learn-vibe-coding");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(training!.title);
  await expect(page.getByRole("link", { name: "← All trainings" })).toHaveAttribute("href", "/programs");
  await expect(page.getByTestId("relationship-note")).toHaveText(training!.content.relationshipNote!);
  await expect(page.getByRole("heading", { name: "Why you need this training" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start freelancing straight after the session" })).toBeVisible();

  // Header CTAs.
  const hero = page.locator("section").first();
  await expect(hero.getByRole("link", { name: "Register your interest" })).toHaveAttribute(
    "href",
    "/contact-us?kind=programme_interest&programme=learn-vibe-coding",
  );
  await expect(hero.getByRole("link", { name: "See upcoming dates" })).toHaveAttribute("href", "/schedule");
  // The "Trainings" nav item is current on a training page too.
  await expect(page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Trainings" })).toHaveAttribute(
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
    `/contact-us?kind=programme_interest&programme=${flagship!.slug}`,
  );
  await expect(hero.getByRole("link", { name: "See upcoming dates" })).toHaveAttribute("href", "/schedule");
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

  // Certification note and FAQ (five questions, native <details>).
  await expect(page.getByText(/This course awards a/)).toContainText("certificate of completion");
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
  const enquiry = `/contact-us?kind=programme_interest&programme=${flagship!.slug}`;
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
  const { disconnectPrisma } = await import("../../src/db/prisma");
  await disconnectPrisma();
});
