/*
 * Seed — reference data and reviewed content that the application reads and
 * never hardcodes (ADR-023 / BR-5). Seeds live here, never in migrations
 * (ADR-029), and are IDEMPOTENT: a second run leaves the database exactly as
 * the first left it (Milestone 1 restart proof B; Milestone 3 criterion 2).
 *
 * Content sources are the founder-reviewed files under ./seed-data, ported
 * verbatim from the mockup (ADR-045). This file only MAPS them to tables.
 *
 * Milestone 3 defaults recorded for ratification (MILESTONE_3_EXECUTION_
 * PLAN.md §10): domain assignment per programme; non-flagship programmes
 * seeded `unlisted`; NO scheduled offering is ever seeded (DR-02 §4.1).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { disconnectPrisma, getPrisma } from "../src/db/prisma.ts";
import { domains as domainSeeds } from "./seed-data/domains.ts";
import { courses, mentorshipPackages, pricingRegions, type Course, type RegionKey } from "./seed-data/courses.ts";
import { practitioners } from "./seed-data/practitioners.ts";
import { faqGroups } from "./seed-data/faq.ts";
import { questions } from "./seed-data/questions.ts";

const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["DATABASE_URL"] && existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const prisma = getPrisma();

// ── Domains ──────────────────────────────────────────────────────────────────
const DOMAIN_SLUGS: Record<string, string> = {
  DF: "data-foundations",
  DE: "data-engineering",
  AI: "ai-machine-learning",
  GA: "governance-ai-assurance",
  GT: "governance-technology",
};

async function seedDomains(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const d of domainSeeds) {
    const slug = DOMAIN_SLUGS[d.code];
    if (!slug) throw new Error(`no slug mapping for domain ${d.code}`);
    const row = await prisma.domain.upsert({
      where: { code: d.code },
      create: { code: d.code, name: d.name, slug, description: d.scope },
      update: { name: d.name, slug, description: d.scope },
      select: { id: true },
    });
    ids.set(d.code, row.id);
  }
  return ids;
}

// ── Programmes ───────────────────────────────────────────────────────────────
/** Plan §10.1 default — one seed edit to change. */
const PROGRAMME_DOMAIN: Record<string, string> = {
  "data-ai-essentials": "DF",
  "data-blueprint": "DF",
  "enterprise-data-modelling": "DF",
  "enterprise-data-architecture": "DE",
  "agentic-ai-strategy-adoption": "AI",
  "ai-powered-product-development": "AI",
  "data-ai-career-mentorship": "AI",
};

const CURRENCY: Record<RegionKey, string> = { malaysia: "MYR", pakistan: "PKR", international: "USD" };

/** "RM 4,999" → 499900 · "Rs. 102,839.86" → 10283986 · "USD 2,811" → 281100 */
function minor(published: string): bigint {
  // The numeric token after the currency prefix ("Rs." carries a dot itself).
  const m = published.match(/([0-9][0-9,]*(?:\.[0-9]+)?)/)?.[1]?.replace(/,/g, "");
  const n = m ? Number(m) : NaN;
  if (!Number.isFinite(n)) throw new Error(`unparseable amount "${published}"`);
  return BigInt(Math.round(n * 100));
}

function levelOf(c: Course) {
  return c.level.toLowerCase() as "foundation" | "practitioner" | "architect" | "executive" | "builder" | "mentorship";
}

async function seedProgrammes(domainIds: Map<string, string>): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const [index, c] of courses.entries()) {
    const domainCode = PROGRAMME_DOMAIN[c.slug];
    const domainId = domainCode ? domainIds.get(domainCode) : undefined;
    if (!domainId) throw new Error(`no domain mapping for programme ${c.slug}`);

    const content = {
      highlights: c.highlights,
      whoShouldAttend: c.whoShouldAttend,
      rationale: c.rationale,
      outcomes: c.outcomes,
      outcomeGroups: c.outcomeGroups,
      included: c.included,
      pedagogy: c.pedagogy,
      benefits: c.benefits,
      careerPaths: c.careerPaths,
      methodology: c.methodology,
      valueStack: c.valueStack,
      valueStackTotal: c.valueStackTotal,
      related: c.related,
      externalResources: c.externalResources,
      ...(c.slug === "data-ai-career-mentorship" ? { mentorshipPackages } : {}),
    };
    const data = {
      domainId,
      title: c.title,
      subtitle: c.subtitle,
      level: levelOf(c),
      status: c.flagship ? ("published" as const) : ("unlisted" as const),
      flagship: c.flagship === true,
      durationLabel: c.duration,
      prerequisites: c.prerequisites,
      formats: c.formats,
      certificateLabel: c.certificate,
      audienceSummary: c.audienceSummary,
      summary: c.summary,
      valueProposition: c.valueProposition,
      content: JSON.parse(JSON.stringify(content)),
      sortOrder: index,
    };
    const row = await prisma.programme.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, ...data },
      update: data,
      select: { id: true },
    });
    ids.set(c.slug, row.id);

    // Modules — by (programme, position); stale positions removed.
    for (const [i, m] of c.modules.entries()) {
      await prisma.programmeModule.upsert({
        where: { programmeId_position: { programmeId: row.id, position: i + 1 } },
        create: { programmeId: row.id, position: i + 1, title: m.title, description: m.description ?? null, points: m.points ?? undefined },
        update: { title: m.title, description: m.description ?? null, points: m.points ?? undefined },
      });
    }
    await prisma.programmeModule.deleteMany({ where: { programmeId: row.id, position: { gt: c.modules.length } } });

    // Delivery formats — by (programme, code).
    const formats = c.deliveryFormats ?? [];
    for (const [i, f] of formats.entries()) {
      const code = f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const fd = { name: f.name, badge: f.badge ?? null, durationLabel: f.duration, scheduleLabel: f.schedule, totalTimeLabel: f.totalTime, bestFor: f.bestFor, position: i + 1 };
      await prisma.deliveryFormat.upsert({
        where: { programmeId_code: { programmeId: row.id, code } },
        create: { programmeId: row.id, code, ...fd },
        update: fd,
      });
    }
    await prisma.deliveryFormat.deleteMany({
      where: { programmeId: row.id, code: { notIn: formats.map((f) => f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) } },
    });

    // Prices — by (programme, region). Amounts from the published strings.
    if (c.pricing) {
      for (const region of pricingRegions) {
        const p = c.pricing[region.key];
        const pd = {
          currency: CURRENCY[region.key],
          listAmountMinor: minor(p.original),
          offerAmountMinor: minor(p.today),
          offerLabel: p.discount,
          offerName: region.subtitle,
        };
        await prisma.programmePrice.upsert({
          where: { programmeId_region: { programmeId: row.id, region: region.key } },
          create: { programmeId: row.id, region: region.key, ...pd },
          update: pd,
        });
      }
    } else {
      await prisma.programmePrice.deleteMany({ where: { programmeId: row.id } });
    }
  }
  return ids;
}

// ── Experts ──────────────────────────────────────────────────────────────────
async function seedExperts(programmeIds: Map<string, string>) {
  for (const p of practitioners) {
    const { slug, name, role, location, headline, experienceLine, summary, photo, expertise, hrdCorpAccreditation, ...profile } = p;
    const data = {
      name,
      roleTitle: role,
      location,
      headline,
      experienceLine,
      summary,
      photoPath: photo,
      expertise,
      profile: JSON.parse(JSON.stringify(profile)),
      hrdCorpAccreditation: hrdCorpAccreditation ? JSON.parse(JSON.stringify(hrdCorpAccreditation)) : undefined,
      published: true,
    };
    const row = await prisma.expert.upsert({ where: { slug }, create: { slug, ...data }, update: data, select: { id: true } });
    // The founder delivers every programme today (lead expert association).
    for (const programmeId of programmeIds.values()) {
      await prisma.programmeExpert.upsert({
        where: { programmeId_expertId: { programmeId, expertId: row.id } },
        create: { programmeId, expertId: row.id, role: "lead" },
        update: {},
      });
    }
  }
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
async function seedFaq() {
  const keep: { groupTitle: string; position: number }[] = [];
  for (const [g, group] of faqGroups.entries()) {
    for (const [i, item] of group.items.entries()) {
      const position = g * 100 + i;
      keep.push({ groupTitle: group.title, position });
      const data = { question: item.q, answer: item.a, href: item.href ?? null, hrefLabel: item.hrefLabel ?? null, tbc: item.tbc === true, published: true };
      await prisma.faqEntry.upsert({
        where: { groupTitle_position: { groupTitle: group.title, position } },
        create: { groupTitle: group.title, position, ...data },
        update: data,
      });
    }
  }
  const all = await prisma.faqEntry.findMany({ select: { id: true, groupTitle: true, position: true } });
  const stale = all.filter((r) => !keep.some((k) => k.groupTitle === r.groupTitle && k.position === r.position));
  if (stale.length) await prisma.faqEntry.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
}

// ── Diagnostic questions ─────────────────────────────────────────────────────
async function seedQuestions(domainIds: Map<string, string>) {
  for (const [i, q] of questions.entries()) {
    const domainId = domainIds.get(q.domain);
    if (!domainId) throw new Error(`question ${q.id}: unknown domain ${q.domain}`);
    const data = { domainId, position: i + 1, scenario: q.scenario, options: q.options };
    await prisma.diagnosticQuestion.upsert({ where: { code: q.id }, create: { code: q.id, ...data }, update: data });
  }
  await prisma.diagnosticQuestion.deleteMany({ where: { code: { notIn: questions.map((q) => q.id) } } });
}

/** Milestone 6 (E4): the renewal fee is a database setting, seeded once at the
 *  founder's USD 10.00 and changed only from the admin screen afterwards. The
 *  seed never overwrites an existing history. */
async function seedCertificateFee() {
  const existing = await prisma.certificateFeeSetting.count();
  if (existing > 0) return;
  await prisma.certificateFeeSetting.create({
    data: { amountMinor: 1000, currency: "USD", effectiveFrom: new Date(0), createdByUserId: null, note: "Founder-specified opening fee (2026-09-20)" },
  });
}

async function main() {
  const domainIds = await seedDomains();
  const programmeIds = await seedProgrammes(domainIds);
  await seedExperts(programmeIds);
  await seedFaq();
  await seedQuestions(domainIds);
  await seedCertificateFee();

  const [d, p, published, m, f, pr, e, faq, q, o] = await Promise.all([
    prisma.domain.count(),
    prisma.programme.count(),
    prisma.programme.count({ where: { status: "published" } }),
    prisma.programmeModule.count(),
    prisma.deliveryFormat.count(),
    prisma.programmePrice.count(),
    prisma.expert.count(),
    prisma.faqEntry.count(),
    prisma.diagnosticQuestion.count(),
    prisma.scheduledOffering.count(),
  ]);
  console.log(
    `seed: domains=${d} programmes=${p} (published=${published}) modules=${m} formats=${f} prices=${pr} experts=${e} faq=${faq} questions=${q} offerings=${o}`,
  );
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
