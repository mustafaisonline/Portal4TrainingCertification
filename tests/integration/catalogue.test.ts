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
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { courses } from "../../prisma/seed-data/courses";
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
const unlistedSeed = courses.find((c) => !c.flagship)!;

afterAll(async () => {
  await disconnectPrisma();
});

describe("programmes", () => {
  it("the flagship is the only published programme and carries its full content", async () => {
    const flagship = await findFlagshipProgramme();
    expect(flagship).not.toBeNull();
    expect(flagship!.slug).toBe(flagshipSeed.slug);
    expect(flagship!.title).toBe(flagshipSeed.title);
    expect(flagship!.modules.map((m) => m.title)).toEqual(flagshipSeed.modules.map((m) => m.title));
    expect(flagship!.deliveryFormats.map((f) => f.name)).toEqual(flagshipSeed.deliveryFormats!.map((f) => f.name));
    expect(flagship!.content.highlights).toEqual(flagshipSeed.highlights);
    expect(flagship!.experts.length).toBeGreaterThan(0);

    const published = await listPublishedProgrammes();
    expect(published.map((p) => p.slug)).toEqual([flagshipSeed.slug]);
  });

  it("prices render exactly as published", async () => {
    const flagship = (await findFlagshipProgramme())!;
    const byRegion = Object.fromEntries(flagship.prices.map((p) => [p.region, p]));
    for (const region of ["malaysia", "pakistan", "international"] as const) {
      const p = byRegion[region]!;
      expect(formatMoney(p.offerAmountMinor, p.currency)).toBe(flagshipSeed.pricing![region].today);
      expect(formatMoney(p.listAmountMinor, p.currency)).toBe(flagshipSeed.pricing![region].original);
      expect(p.offerLabel).toBe(flagshipSeed.pricing![region].discount);
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
