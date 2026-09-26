import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { normaliseModulePoints } from "./module-points";
import type { ProgrammeContent, ProgrammePriceRecord, ProgrammeRecord, ProgrammeSummary } from "./types";

/*
 * Programme repository (module: catalogue). Pages read programmes ONLY
 * through here; nothing in app/ knows a slug, title or price literal
 * (ADR-023). Public readers see `published` rows only — "disable, not
 * delete" (founder, 2026-09-20) is `status = unlisted`, which 404s.
 */

const include = {
  modules: { orderBy: { position: "asc" as const } },
  formatsDelivery: { orderBy: { position: "asc" as const } },
  prices: true,
  experts: { include: { expert: { select: { id: true, slug: true, name: true, roleTitle: true, headline: true, photoPath: true } } } },
};

type Row = NonNullable<Awaited<ReturnType<typeof loadBySlug>>>;

function loadBySlug(db: Db, slug: string) {
  return db.programme.findUnique({ where: { slug }, include });
}

function toRecord(row: Row): ProgrammeRecord {
  return {
    id: row.id,
    domainId: row.domainId,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    level: row.level,
    status: row.status,
    flagship: row.flagship,
    durationLabel: row.durationLabel,
    prerequisites: row.prerequisites,
    formats: row.formats as string[],
    certificateLabel: row.certificateLabel,
    audienceSummary: row.audienceSummary,
    summary: row.summary,
    valueProposition: row.valueProposition,
    content: row.content as ProgrammeContent,
    sortOrder: row.sortOrder,
    modules: row.modules.map((m) => ({
      position: m.position,
      title: m.title,
      description: m.description,
      // Plain points or groups (2026-09-26) — validated lightly, never cast.
      points: normaliseModulePoints(m.points),
    })),
    deliveryFormats: row.formatsDelivery.map((f) => ({
      id: f.id,
      code: f.code,
      name: f.name,
      badge: f.badge,
      durationLabel: f.durationLabel,
      scheduleLabel: f.scheduleLabel,
      totalTimeLabel: f.totalTimeLabel,
      bestFor: f.bestFor as string[],
      position: f.position,
    })),
    prices: row.prices
      .map((p) => ({
        region: p.region,
        currency: p.currency,
        listAmountMinor: Number(p.listAmountMinor),
        offerAmountMinor: Number(p.offerAmountMinor),
        offerLabel: p.offerLabel,
        offerName: p.offerName,
      }))
      .sort((a, b) => order(a.region) - order(b.region)),
    experts: row.experts.map((e) => e.expert),
  };
}

function order(region: string): number {
  return ["malaysia", "pakistan", "international"].indexOf(region);
}

/** The founder-designated flagship, if it is published. */
export async function findFlagshipProgramme(db: Db = getPrisma()): Promise<ProgrammeRecord | null> {
  const row = await db.programme.findFirst({ where: { flagship: true, status: "published" }, include });
  return row ? toRecord(row) : null;
}

/** Published programme by slug; unlisted/retired → null (public 404). */
export async function findPublishedProgrammeBySlug(slug: string, db: Db = getPrisma()): Promise<ProgrammeRecord | null> {
  const row = await loadBySlug(db, slug);
  return row && row.status === "published" ? toRecord(row) : null;
}

/** Any status — for admin (M8) and tests. */
export async function findProgrammeBySlug(slug: string, db: Db = getPrisma()): Promise<ProgrammeRecord | null> {
  const row = await loadBySlug(db, slug);
  return row ? toRecord(row) : null;
}

export async function listPublishedProgrammes(db: Db = getPrisma()): Promise<ProgrammeSummary[]> {
  const rows = await db.programme.findMany({
    where: { status: "published" },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, slug: true, title: true, subtitle: true, level: true, status: true, flagship: true,
      durationLabel: true, formats: true, certificateLabel: true, audienceSummary: true, summary: true, sortOrder: true,
    },
  });
  return rows.map((r) => ({ ...r, formats: r.formats as string[] }));
}

/** Listing card with its published prices and editorial content — the
 *  /programs hub (2026-09-26). `content` is carried so the card can show the
 *  per-region pricing notes (`content.regionalPricing`). */
export type ProgrammeCard = ProgrammeSummary & { prices: ProgrammePriceRecord[]; content: ProgrammeContent };

export async function listPublishedProgrammesWithPrices(db: Db = getPrisma()): Promise<ProgrammeCard[]> {
  const rows = await db.programme.findMany({
    where: { status: "published" },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, slug: true, title: true, subtitle: true, level: true, status: true, flagship: true,
      durationLabel: true, formats: true, certificateLabel: true, audienceSummary: true, summary: true, sortOrder: true,
      prices: true,
      content: true,
    },
  });
  return rows.map((r) => ({
    ...r,
    formats: r.formats as string[],
    content: r.content as ProgrammeContent,
    prices: r.prices
      .map((p) => ({
        region: p.region,
        currency: p.currency,
        listAmountMinor: Number(p.listAmountMinor),
        offerAmountMinor: Number(p.offerAmountMinor),
        offerLabel: p.offerLabel,
        offerName: p.offerName,
      }))
      .sort((a, b) => order(a.region) - order(b.region)),
  }));
}

export type AdminProgrammeOption = { id: string; title: string; slug: string; status: ProgrammeRecord["status"] };

/** Every programme, any status — the admin offerings form lets the founder
 *  schedule an unlisted programme (e.g. a private cohort) too. */
export async function listProgrammesForAdmin(db: Db = getPrisma()): Promise<AdminProgrammeOption[]> {
  return db.programme.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, title: true, slug: true, status: true },
  });
}

export type AdminDeliveryFormatOption = { id: string; programmeId: string; code: string; name: string };

/** Every delivery format of every programme, in position order — the admin
 *  offerings form filters them by the chosen programme. */
export async function listDeliveryFormatsForAdmin(db: Db = getPrisma()): Promise<AdminDeliveryFormatOption[]> {
  return db.deliveryFormat.findMany({
    orderBy: [{ programmeId: "asc" }, { position: "asc" }],
    select: { id: true, programmeId: true, code: true, name: true },
  });
}

/** Related programmes (by slug list) that are published. */
export async function listPublishedProgrammesBySlugs(slugs: string[], db: Db = getPrisma()): Promise<ProgrammeSummary[]> {
  if (slugs.length === 0) return [];
  const all = await listPublishedProgrammes(db);
  return all.filter((p) => slugs.includes(p.slug));
}
