import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { listDiagnosticQuestions } from "@/modules/catalogue/diagnostic/repository";
import { createEnquiry, findEnquiriesByEmail } from "@/modules/catalogue/enquiries/repository";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { listFaqGroups } from "@/modules/catalogue/faq/repository";
import { listUpcomingPublicOfferings } from "@/modules/catalogue/offerings/repository";
import {
  findFlagshipProgramme,
  findProgrammeBySlug,
  findPublishedProgrammeBySlug,
  listPublishedProgrammes,
} from "@/modules/catalogue/programmes/repository";
import { isModulePointGroup } from "@/modules/catalogue/programmes/module-points";
import { cardPaymentAvailable, formatMoney, priceRegionMeta, pricesForCard, type ModulePointGroup } from "@/modules/catalogue/programmes/types";
import { priceForUser } from "@/modules/commerce/pricing";
import { courses, LEARN_VIBE_CODING_MODULES } from "../../prisma/seed-data/courses";
import { faqGroups } from "../../prisma/seed-data/faq";
import { questions } from "../../prisma/seed-data/questions";
import { uniqueEmail } from "../helpers/identity-db";

/*
 * Catalogue — integration against the REAL test database, which the run
 * seeds first. Expected values come from the seed-data files (the reviewed
 * content), never from literals typed here, so this asserts "the database
 * holds what the founder reviewed" (M3 plan §8 criteria 2, 4, 5).
 */
const prisma = getPrisma();
const flagshipSeed = courses.find((c) => c.flagship)!;
// Published = the flagship plus any entry that states `status: "published"`
// (Learn Vibe Coding, 2026-09-26), in seed order; everything else is unlisted.
const publishedSeeds = courses.filter((c) => c.flagship || c.status === "published");
const unlistedSeed = courses.find((c) => !c.flagship && c.status !== "published")!;

afterAll(async () => {
  await disconnectPrisma();
});

describe("programmes", () => {
  it("the published programmes are exactly the seed's published entries, in order; the flagship carries its full content", async () => {
    const flagship = await findFlagshipProgramme();
    expect(flagship).not.toBeNull();
    expect(flagship!.slug).toBe(flagshipSeed.slug);
    expect(flagship!.title).toBe(flagshipSeed.title);
    expect(flagship!.modules.map((m) => m.title)).toEqual(flagshipSeed.modules.map((m) => m.title));
    expect(flagship!.deliveryFormats.map((f) => f.name)).toEqual(flagshipSeed.deliveryFormats!.map((f) => f.name));
    expect(flagship!.content.highlights).toEqual(flagshipSeed.highlights);
    expect(flagship!.experts.length).toBeGreaterThan(0);

    const published = await listPublishedProgrammes();
    expect(published.map((p) => p.slug)).toEqual(publishedSeeds.map((c) => c.slug));
    expect(published.map((p) => p.slug)).toEqual(["learn-vibe-coding", flagshipSeed.slug]);
  });

  it("Learn Vibe Coding (2026-09-26) is published, not the flagship, priced at 75% off, and carries the new sections", async () => {
    const seed = courses.find((c) => c.slug === "learn-vibe-coding")!;
    const row = await findPublishedProgrammeBySlug("learn-vibe-coding");
    expect(row).not.toBeNull();
    expect(row!.flagship).toBe(false);
    expect(row!.title).toBe(seed.title);
    expect(row!.modules.map((m) => m.title)).toEqual(seed.modules.map((m) => m.title));
    expect(row!.modules).toHaveLength(6);
    expect(row!.content.relationshipNote).toBe(seed.relationshipNote);
    expect(row!.content.afterThisTraining).toEqual(seed.afterThisTraining);
    expect(row!.content.faq).toEqual(seed.faq);
    expect(row!.content.related).toEqual([flagshipSeed.slug]);
    // Founder's figures 2026-09-26 (second round): today = 25% of the original.
    for (const p of row!.prices) {
      const seeded = seed.pricing![p.region]!;
      expect(p.offerAmountMinor * 4, p.region).toBe(p.listAmountMinor);
      expect(p.offerLabel, p.region).toBe("75% OFF");
      expect(formatMoney(p.offerAmountMinor, p.currency)).toBe(seeded.today);
      expect(formatMoney(p.listAmountMinor, p.currency)).toBe(seeded.original);
    }
    // Three rows — no HRD Corp row has been published for this training (M12 WP1).
    expect(row!.prices.map((p) => p.region)).toEqual(["malaysia", "pakistan", "international"]);
    expect(row!.prices.map((p) => formatMoney(p.offerAmountMinor, p.currency))).toEqual(["RM 500", "Rs. 5,000", "USD 200"]);
    expect(row!.prices.map((p) => formatMoney(p.listAmountMinor, p.currency))).toEqual(["RM 2,000", "Rs. 20,000", "USD 800"]);
    // The new editorial keys (founder change list 2026-09-26).
    expect(row!.content.whoShouldAttend).toEqual(seed.whoShouldAttend);
    expect(row!.content.whatYouGet).toEqual(seed.whatYouGet);
    expect(row!.content.whatYouGet).toHaveLength(3);
    expect(row!.content.paceNotes).toEqual(seed.paceNotes);
    // M12 WP1: the region notes are columns of the fee rows, not content JSON.
    const byRegion = Object.fromEntries(row!.prices.map((p) => [p.region, p]));
    expect(byRegion["malaysia"]!.note).toMatch(/minimum of 25 participants/);
    expect(byRegion["international"]!.note).toMatch(/minimum of 25 participants/);
    expect(byRegion["pakistan"]!.note).toBeNull();
    expect(row!.prices.every((p) => p.minParticipants === null)).toBe(true);
    expect("regionalPricing" in row!.content).toBe(false);
    // No "Included" list and no value stack on a published page.
    expect(row!.content.included).toBeUndefined();
    expect(row!.content.valueStack).toBeUndefined();
    expect(row!.experts.length).toBeGreaterThan(0);
  });

  it("the flagship has the FOUR fee rows (M12 WP1): Malaysia via HRD Corp · Malaysia not via HRD Corp · Pakistan · Rest of the world — each a programme_prices row with its minimum and note", async () => {
    const flagship = (await findFlagshipProgramme())!;
    const byRegion = Object.fromEntries(flagship.prices.map((p) => [p.region, p]));
    // Founder's fee-row order (PRICE_REGIONS).
    expect(flagship.prices.map((p) => p.region)).toEqual(["malaysia_hrdcorp", "malaysia", "pakistan", "international"]);
    expect(formatMoney(byRegion["malaysia"]!.offerAmountMinor, "MYR")).toBe("RM 2,500");
    expect(formatMoney(byRegion["malaysia"]!.listAmountMinor, "MYR")).toBe("RM 5,000");
    expect(byRegion["malaysia"]!.offerLabel).toBe("50% OFF");
    expect(formatMoney(byRegion["international"]!.offerAmountMinor, "USD")).toBe("USD 1,000");
    expect(formatMoney(byRegion["international"]!.listAmountMinor, "USD")).toBe("USD 4,000");
    expect(byRegion["international"]!.offerLabel).toBe("75% OFF");
    // ONE Pakistan row (unchanged shape from before this update) — currency PKR.
    expect(byRegion["pakistan"]!.currency).toBe("PKR");
    expect(formatMoney(byRegion["pakistan"]!.offerAmountMinor, "PKR")).toBe("Rs. 100,000");
    expect(formatMoney(byRegion["pakistan"]!.listAmountMinor, "PKR")).toBe("Rs. 200,000");
    expect(byRegion["pakistan"]!.offerLabel).toBe("55% OFF");
    expect(flagship.prices.filter((p) => p.region === "pakistan")).toHaveLength(1);

    // "Via HRD Corp" is its OWN row (was a display option in content JSON
    // until M12 WP1): the full RM 5,000, undiscounted, minimum 25, and it
    // is display-only — claimed through the employer, never charged (L5).
    const hrd = byRegion["malaysia_hrdcorp"]!;
    expect(hrd.currency).toBe("MYR");
    expect(formatMoney(hrd.offerAmountMinor, "MYR")).toBe("RM 5,000");
    expect(hrd.listAmountMinor).toBe(hrd.offerAmountMinor);
    expect(hrd.minParticipants).toBe(25);
    expect(hrd.note).toMatch(/no online option/);
    expect(cardPaymentAvailable("malaysia_hrdcorp")).toBe(false);
    expect(priceRegionMeta("malaysia_hrdcorp").payment).toBe("hrd_corp");
    // "Without HRD Corp" = the `malaysia` row a Malaysian card payment is
    // charged (L6) — RM 2,500 (50% off RM 5,000), minimum 25, same note.
    expect(byRegion["malaysia"]!.minParticipants).toBe(25);
    expect(byRegion["malaysia"]!.note).toMatch(/no online option/);
    expect(priceForUser(flagship, { country: "Malaysia" }).region).toBe("malaysia");
    expect(priceForUser(flagship, { country: "Malaysia" }).offerAmountMinor).toBe(250_000);
    // Both Malaysian rows sit on the one "Malaysia" public card, HRD Corp first.
    expect(pricesForCard(flagship.prices, "malaysia").map((p) => p.region)).toEqual(["malaysia_hrdcorp", "malaysia"]);
    expect(pricesForCard(flagship.prices, "international").map((p) => p.region)).toEqual(["international"]);

    // Pakistan and Rest of the world: one row each, note on the row, no minimum.
    expect(byRegion["pakistan"]!.note).toMatch(/minimum of 100 participants/);
    expect(byRegion["international"]!.note).toMatch(/minimum of 100 participants/);
    expect(byRegion["pakistan"]!.minParticipants).toBeNull();
    expect(byRegion["international"]!.minParticipants).toBeNull();
    // The presentation JSON is retired (migration 20260926130859).
    expect("regionalPricing" in flagship.content).toBe(false);
    expect(flagship.content.whatYouGet).toHaveLength(2);
    expect(flagship.content.paceNotes).toHaveLength(3);
    expect(flagship.content.included).toBeUndefined();
    expect(flagship.content.valueStack).toBeUndefined();
    expect(flagship.content.valueStackTotal).toBeUndefined();
  });

  it("the flagship's curriculum is TWO modules (founder, 2026-09-26): Module 1 groups the ten Data Blueprint topics, Module 2 IS the Learn Vibe Coding curriculum; Certificate of Completion; 2 days", async () => {
    const flagship = (await findFlagshipProgramme())!;
    expect(flagship.modules).toHaveLength(2);
    expect(flagship.modules.map((m) => m.title)).toEqual(["Module 1 · Data Blueprint", "Module 2 · Learn Vibe Coding"]);

    const m1 = flagship.modules[0]!.points!;
    expect(m1).toHaveLength(10);
    expect(m1.every(isModulePointGroup)).toBe(true);
    expect((m1 as ModulePointGroup[]).map((g) => g.title)).toEqual([
      "AI-powered product development fundamentals",
      "Decision support systems (DSS)",
      "What is data",
      "What is metadata",
      "Building blocks of data",
      "Data modelling",
      "Data processing & storage",
      "DAC Architecture",
      "Data governance, security, privacy & quality",
      "Agentic AI",
    ]);
    for (const g of m1 as ModulePointGroup[]) {
      expect(g.description, g.title).toBeTruthy();
      expect(g.points!.length, g.title).toBeGreaterThan(0);
    }

    // Module 2 == the shared constant == what the Learn Vibe Coding row holds.
    const m2 = flagship.modules[1]!.points!;
    expect(m2).toEqual(LEARN_VIBE_CODING_MODULES.map((m) => ({ title: m.title, points: m.points })));
    const lvc = (await findPublishedProgrammeBySlug("learn-vibe-coding"))!;
    expect(lvc.modules).toHaveLength(6);
    expect(lvc.modules.map((m) => ({ title: m.title, points: m.points }))).toEqual(m2);

    // The page sections the founder asked for, and the retired copy gone.
    expect(flagship.certificateLabel).toBe("Certificate of Completion");
    expect(flagship.durationLabel).toBe("2 days");
    expect(flagship.deliveryFormats).toHaveLength(3);
    expect(flagship.content.relationshipNote).toMatch(/Learn Vibe Coding/);
    expect(flagship.content.rationale.heading).toBe("Why you need this training");
    expect(flagship.content.rationale.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(flagship.content.rationale.problems).toHaveLength(4);
    expect(flagship.content.afterThisTraining?.heading).toBe("Start freelancing or lead data-and-AI work straight after");
    expect(flagship.content.afterThisTraining?.items.length).toBeGreaterThanOrEqual(5);
    expect(flagship.content.outcomes).toContain("Direct an AI coding agent from a written vision to a working product with guardrails");
    expect(flagship.content.faq).toHaveLength(5);
    expect(flagship.content.related).toContain("learn-vibe-coding");
    expect(flagship.content.methodology?.name).toBe("Your learning journey");
    expect(flagship.content.methodology?.steps.map((s) => s.title)).toEqual(expect.arrayContaining(["Plan", "Build", "Test", "Deploy", "Improve"]));
    expect(JSON.stringify(flagship.content)).not.toMatch(/PromptOS|4 weeks|17 modules/);
  });

  it("prices render exactly as published — all four rows", async () => {
    const flagship = (await findFlagshipProgramme())!;
    const byRegion = Object.fromEntries(flagship.prices.map((p) => [p.region, p]));
    for (const region of ["malaysia_hrdcorp", "malaysia", "pakistan", "international"] as const) {
      const p = byRegion[region]!;
      const seeded = flagshipSeed.pricing![region]!;
      expect(formatMoney(p.offerAmountMinor, p.currency)).toBe(seeded.today);
      expect(formatMoney(p.listAmountMinor, p.currency)).toBe(seeded.original);
      expect(p.offerLabel).toBe(seeded.discount);
      expect(p.minParticipants).toBe(seeded.minParticipants ?? null);
      expect(p.note).toBe(seeded.note ?? null);
    }
  });

  it("an unlisted programme is invisible publicly but retained (disable, not delete)", async () => {
    expect(await findPublishedProgrammeBySlug(unlistedSeed.slug)).toBeNull();
    const any = await findProgrammeBySlug(unlistedSeed.slug);
    expect(any?.status).toBe("unlisted");
    expect(any?.title).toBe(unlistedSeed.title);
  });

  it("no scheduled offering exists (DR-02 §4.1 — no invented dates)", async () => {
    expect(await listUpcomingPublicOfferings()).toEqual([]);
    expect(await prisma.scheduledOffering.count()).toBe(0);
  });
});

describe("experts, FAQ, diagnostic", () => {
  it("the published expert carries the accreditation and profile sections", async () => {
    const [expert] = await listPublishedExperts();
    expect(expert).toBeDefined();
    expect(expert!.hrdCorpAccreditation?.trainerId).toBeTruthy();
    expect(expert!.profile.about.length).toBeGreaterThan(0);
    expect(expert!.photoPath).toMatch(/^\/experts\//);
  });

  it("FAQ groups preserve the authored order and content", async () => {
    const groups = await listFaqGroups();
    expect(groups.map((g) => g.title)).toEqual(faqGroups.map((g) => g.title));
    expect(groups.flatMap((g) => g.items.map((i) => i.question))).toEqual(faqGroups.flatMap((g) => g.items.map((i) => i.q)));
  });

  it("diagnostic questions match the seed, in order, each with a capability area", async () => {
    const qs = await listDiagnosticQuestions();
    expect(qs.map((q) => q.code)).toEqual(questions.map((q) => q.id));
    expect(qs.map((q) => q.domain.code)).toEqual(questions.map((q) => q.domain));
    for (const q of qs) expect(q.options).not.toContain("I'm not sure");
  });
});

describe("enquiries", () => {
  it("persist and read back by email (lower-cased)", async () => {
    const email = uniqueEmail("enq").toUpperCase();
    const row = await createEnquiry({
      kind: "general",
      name: "Enquiry Test",
      email,
      organisation: null,
      message: "Integration test enquiry — please ignore.",
      programmeId: null,
      sourcePath: "/contact-us",
    });
    expect(row.status).toBe("new");
    const found = await findEnquiriesByEmail(email);
    expect(found.map((e) => e.id)).toContain(row.id);
    expect(found[0]!.email).toBe(email.toLowerCase());
    await prisma.enquiry.delete({ where: { id: row.id } });
  });
});
