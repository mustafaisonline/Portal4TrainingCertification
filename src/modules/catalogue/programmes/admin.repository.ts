import type { Db, JsonInput, JsonObjectInput, Tx } from "@/db/prisma";
import { getPrisma, JSON_NULL } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";
import { FEE_REGIONS, PROGRAMME_LEVELS, PROGRAMME_STATUSES } from "./constants";
import { textToModulePoints } from "./content-codec";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { normaliseModulePoints } from "./module-points";
import { findProgrammeBySlug } from "./repository";
import { PRICE_REGIONS, type PriceRegion, type ProgrammeContent, type ProgrammeLevel, type ProgrammeRecord, type ProgrammeStatus } from "./types";

/*
 * Trainings — the admin/trainer WRITE side (Milestone 12 WP2; plan §3).
 * Until this milestone a training existed only as an entry in
 * prisma/seed-data/courses.ts; from now on the portal is the source of
 * truth and the seed is the initial import (decision L8). Every write here
 * validates as a whole, runs in the caller's transaction and records its
 * audit row (ADR-022). Reads for the public pages stay in ./repository.ts.
 *
 * Scope: `platform_admin` sees and edits everything; a Trainer (`expert`
 * role, decision L1) sees only the trainings linked to their Trainer
 * profile through `programme_experts` (L7). The scope is a parameter of
 * every read and a check inside every write — never a UI-only condition.
 */

export type TrainingScope = { kind: "all" } | { kind: "expert"; expertId: string };

export function scopeWhere(scope: TrainingScope) {
  return scope.kind === "all" ? {} : { experts: { some: { expertId: scope.expertId } } };
}

/* ------------------------------------------------------------------ reads */

export type TrainingListItem = {
  id: string;
  slug: string;
  title: string;
  status: ProgrammeStatus;
  level: ProgrammeLevel;
  flagship: boolean;
  domainName: string;
  moduleCount: number;
  formatCount: number;
  /** Fee rows present, of the four (M12 WP1). */
  feeCount: number;
  feeRegions: PriceRegion[];
  openDates: number;
  expertNames: string[];
  updatedAt: Date;
};

export async function listTrainings(scope: TrainingScope, db: Db = getPrisma()): Promise<TrainingListItem[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const rows = await db.programme.findMany({
    where: scopeWhere(scope),
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true, slug: true, title: true, status: true, level: true, flagship: true, updatedAt: true,
      domain: { select: { name: true } },
      prices: { select: { region: true } },
      experts: { select: { expert: { select: { name: true } } } },
      _count: {
        select: {
          modules: true,
          formatsDelivery: true,
          offerings: { where: { status: "open", endsOn: { gte: today } } },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    status: r.status,
    level: r.level,
    flagship: r.flagship,
    domainName: r.domain.name,
    moduleCount: r._count.modules,
    formatCount: r._count.formatsDelivery,
    feeCount: r.prices.length,
    feeRegions: r.prices.map((p) => p.region),
    openDates: r._count.offerings,
    expertNames: r.experts.map((e) => e.expert.name),
    updatedAt: r.updatedAt,
  }));
}

/** One training for the admin screens — the public record plus what those
 *  screens need (status of any kind, experts, fee rows incl. validity). */
export type TrainingAdminRecord = ProgrammeRecord & {
  updatedAt: Date;
  expertIds: string[];
  feeRows: TrainingFeeRow[];
};

export type TrainingFeeRow = {
  region: PriceRegion;
  currency: string;
  listAmountMinor: number;
  offerAmountMinor: number;
  offerLabel: string;
  offerName: string;
  minParticipants: number | null;
  note: string | null;
  validFrom: Date | null;
  validTo: Date | null;
};

export async function getTrainingForAdmin(id: string, scope: TrainingScope, db: Db = getPrisma()): Promise<TrainingAdminRecord | null> {
  if (!isUuid(id)) return null;
  const row = await db.programme.findFirst({
    where: { id, ...scopeWhere(scope) },
    select: { slug: true, updatedAt: true, experts: { select: { expertId: true } }, prices: true },
  });
  if (!row) return null;
  const record = await findProgrammeBySlug(row.slug, db);
  if (!record) return null;
  return {
    ...record,
    updatedAt: row.updatedAt,
    expertIds: row.experts.map((e) => e.expertId),
    feeRows: row.prices
      .map((p) => ({
        region: p.region,
        currency: p.currency,
        listAmountMinor: Number(p.listAmountMinor),
        offerAmountMinor: Number(p.offerAmountMinor),
        offerLabel: p.offerLabel,
        offerName: p.offerName,
        minParticipants: p.minParticipants,
        note: p.note,
        validFrom: p.validFrom,
        validTo: p.validTo,
      }))
      .sort((a, b) => FEE_REGIONS.indexOf(a.region) - FEE_REGIONS.indexOf(b.region)),
  };
}

/** True when the scope may act on this training (a write-side guard). */
export async function canManageTraining(db: Db, scope: TrainingScope, programmeId: string): Promise<boolean> {
  if (!isUuid(programmeId)) return false;
  const row = await db.programme.findFirst({ where: { id: programmeId, ...scopeWhere(scope) }, select: { id: true } });
  return row !== null;
}

/* ------------------------------------------------------------ validation */

export class TrainingValidationError<F extends string = string> extends Error {
  readonly fieldErrors: Partial<Record<F, string>>;
  constructor(fieldErrors: Partial<Record<F, string>>) {
    super(`Training validation failed: ${Object.keys(fieldErrors).join(", ")}`);
    this.name = "TrainingValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class TrainingRefusedError extends Error {
  readonly code: "forbidden" | "not_found" | "slug_locked" | "format_in_use" | "last_fee_row";
  constructor(code: TrainingRefusedError["code"], message: string) {
    super(message);
    this.name = "TrainingRefusedError";
    this.code = code;
  }
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TITLE_MAX = 120;
const LINE_MAX = 300;
const TEXT_MAX = 2_000;

/** "Data Blueprint & AI/Vibe Coding" → "data-blueprint-ai-vibe-coding". */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/* ----------------------------------------------------------------- details */

export type TrainingDetailsInput = {
  title: string;
  subtitle: string;
  /** Blank on create = generated from the title. Immutable once published. */
  slug: string;
  domainId: string;
  level: ProgrammeLevel;
  flagship: boolean;
  durationLabel: string;
  prerequisites: string;
  /** Delivery labels as published, e.g. ["Live online", "Face-to-face"]. */
  formats: string[];
  certificateLabel: string;
  audienceSummary: string;
  summary: string;
  valueProposition: string;
  sortOrder: number;
};
export type TrainingDetailsField = keyof TrainingDetailsInput;
export type TrainingDetailsErrors = Partial<Record<TrainingDetailsField, string>>;

function req(errors: Record<string, string>, field: string, value: string, label: string, max = LINE_MAX) {
  if (!value.trim()) errors[field] = `Enter the ${label}.`;
  else if (value.length > max) errors[field] = `Use at most ${max} characters.`;
}

function normaliseDetails(raw: TrainingDetailsInput): TrainingDetailsInput {
  return {
    title: raw.title.trim(),
    subtitle: raw.subtitle.trim(),
    slug: raw.slug.trim().toLowerCase(),
    domainId: raw.domainId.trim(),
    level: raw.level,
    flagship: raw.flagship === true,
    durationLabel: raw.durationLabel.trim(),
    prerequisites: raw.prerequisites.trim(),
    formats: raw.formats.map((f) => f.trim()).filter((f) => f.length > 0),
    certificateLabel: raw.certificateLabel.trim(),
    audienceSummary: raw.audienceSummary.trim(),
    summary: raw.summary.trim(),
    valueProposition: raw.valueProposition.trim(),
    sortOrder: Number.isInteger(raw.sortOrder) ? raw.sortOrder : 0,
  };
}

async function validateDetails(db: Db, input: TrainingDetailsInput, existingId: string | null): Promise<TrainingDetailsErrors> {
  const errors: Record<string, string> = {};
  req(errors, "title", input.title, "title", TITLE_MAX);
  req(errors, "subtitle", input.subtitle, "subtitle");
  req(errors, "durationLabel", input.durationLabel, "duration");
  req(errors, "prerequisites", input.prerequisites, "prerequisites", TEXT_MAX);
  req(errors, "certificateLabel", input.certificateLabel, "certificate label");
  req(errors, "audienceSummary", input.audienceSummary, "audience summary");
  req(errors, "summary", input.summary, "summary", TEXT_MAX);
  req(errors, "valueProposition", input.valueProposition, "value proposition", TEXT_MAX);
  if (input.formats.length === 0) errors.formats = "List at least one delivery label (e.g. Live online).";
  if (!PROGRAMME_LEVELS.includes(input.level)) errors.level = "Choose a level.";
  if (!isUuid(input.domainId)) errors.domainId = "Choose a domain.";
  else if (!(await db.domain.findUnique({ where: { id: input.domainId }, select: { id: true } }))) errors.domainId = "That domain does not exist.";
  if (input.slug && !SLUG_RE.test(input.slug)) errors.slug = "Use lowercase letters, digits and single hyphens only.";
  if (input.slug && input.slug.length > 80) errors.slug = "Use at most 80 characters.";
  if (input.slug && !errors.slug) {
    const clash = await db.programme.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (clash && clash.id !== existingId) errors.slug = "Another training already uses this address.";
  }
  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 10_000) errors.sortOrder = "Order must be a whole number from 0 to 10000.";
  return errors as TrainingDetailsErrors;
}

/** A unique slug from the title: "-2", "-3", … on a clash. */
async function uniqueSlug(db: Db, title: string): Promise<string> {
  const base = slugify(title) || "training";
  let candidate = base;
  for (let n = 2; n < 1000; n++) {
    const clash = await db.programme.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
  throw new Error("could not find a free slug");
}

function detailsColumns(input: TrainingDetailsInput) {
  return {
    domainId: input.domainId,
    title: input.title,
    subtitle: input.subtitle,
    level: input.level,
    flagship: input.flagship,
    durationLabel: input.durationLabel,
    prerequisites: input.prerequisites,
    formats: input.formats,
    certificateLabel: input.certificateLabel,
    audienceSummary: input.audienceSummary,
    summary: input.summary,
    valueProposition: input.valueProposition,
    sortOrder: input.sortOrder,
  };
}

/** The content a brand-new training starts with: the required sections
 *  hold placeholders the editor replaces; nothing invented is published
 *  because a new training is always a draft (`unlisted`). */
function starterContent(title: string): ProgrammeContent {
  return {
    highlights: [`${title} — highlights to be written`],
    whoShouldAttend: { intro: "To be written.", roles: ["To be written"] },
    rationale: { heading: "Why this training", paragraphs: ["To be written."] },
    related: [],
  };
}

/** Creates a DRAFT training (`unlisted`) with its `programme.created` audit
 *  row. A Trainer creating it is linked as its lead expert so it is in
 *  their scope from the first save (L7). */
export async function createTraining(
  tx: Tx,
  raw: TrainingDetailsInput,
  actor: { userId: string; expertId: string | null },
): Promise<{ id: string; slug: string }> {
  const input = normaliseDetails(raw);
  const errors = await validateDetails(tx, input, null);
  if (Object.keys(errors).length) throw new TrainingValidationError<TrainingDetailsField>(errors);
  const slug = input.slug || (await uniqueSlug(tx, input.title));
  if (input.flagship) await tx.programme.updateMany({ where: { flagship: true }, data: { flagship: false } });
  const created = await tx.programme.create({
    data: { ...detailsColumns(input), slug, status: "unlisted", content: JSON.parse(JSON.stringify(starterContent(input.title))) },
    select: { id: true, slug: true },
  });
  if (actor.expertId) {
    await tx.programmeExpert.create({ data: { programmeId: created.id, expertId: actor.expertId, role: "lead" } });
  }
  await writeAudit(tx, {
    actorUserId: actor.userId,
    action: "programme.created",
    entityType: "programme",
    entityId: created.id,
    before: null,
    after: { slug, ...detailsColumns(input), status: "unlisted", leadExpertId: actor.expertId },
  });
  return created;
}

export async function updateTrainingDetails(tx: Tx, id: string, scope: TrainingScope, raw: TrainingDetailsInput, actorUserId: string): Promise<void> {
  if (!(await canManageTraining(tx, scope, id))) throw new TrainingRefusedError("not_found", "This training could not be found.");
  const existing = await tx.programme.findUnique({
    where: { id },
    select: {
      slug: true, status: true, domainId: true, title: true, subtitle: true, level: true, flagship: true, durationLabel: true,
      prerequisites: true, formats: true, certificateLabel: true, audienceSummary: true, summary: true, valueProposition: true, sortOrder: true,
    },
  });
  if (!existing) throw new TrainingRefusedError("not_found", "This training could not be found.");
  const input = normaliseDetails(raw);
  if (!input.slug) input.slug = existing.slug;
  if (existing.status === "published" && input.slug !== existing.slug) {
    throw new TrainingRefusedError("slug_locked", "The address of a published training cannot change — links to it have been shared.");
  }
  const errors = await validateDetails(tx, input, id);
  if (Object.keys(errors).length) throw new TrainingValidationError<TrainingDetailsField>(errors);
  if (input.flagship) await tx.programme.updateMany({ where: { flagship: true, id: { not: id } }, data: { flagship: false } });
  const before = { slug: existing.slug, ...detailsColumns({ ...existing, formats: existing.formats as string[] }) };
  const after = { slug: input.slug, ...detailsColumns(input) };
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  await tx.programme.update({ where: { id }, data: { ...detailsColumns(input), slug: input.slug } });
  await writeAudit(tx, { actorUserId, action: "programme.updated", entityType: "programme", entityId: id, before, after });
}

/* --------------------------------------------------------------- content */

export async function updateTrainingContent(tx: Tx, id: string, scope: TrainingScope, content: ProgrammeContent, actorUserId: string): Promise<void> {
  if (!(await canManageTraining(tx, scope, id))) throw new TrainingRefusedError("not_found", "This training could not be found.");
  const existing = await tx.programme.findUnique({ where: { id }, select: { content: true } });
  if (!existing) throw new TrainingRefusedError("not_found", "This training could not be found.");
  const next = JSON.parse(JSON.stringify(content)) as Record<string, unknown>;
  if (JSON.stringify(existing.content) === JSON.stringify(next)) return;
  await tx.programme.update({ where: { id }, data: { content: next as JsonObjectInput } });
  await writeAudit(tx, {
    actorUserId,
    action: "programme.content_updated",
    entityType: "programme",
    entityId: id,
    // The sections are large; the audit row records WHICH keys changed.
    before: { keys: Object.keys((existing.content as Record<string, unknown>) ?? {}).sort() },
    after: { keys: Object.keys(next).sort(), changed: changedKeys(existing.content as Record<string, unknown>, next) },
  });
}

function changedKeys(a: Record<string, unknown> | null, b: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b)]);
  return [...keys].filter((k) => JSON.stringify(a?.[k]) !== JSON.stringify(b[k])).sort();
}

/* --------------------------------------------------------------- modules */

export type TrainingModuleInput = { title: string; description: string; pointsText: string };
export type TrainingModuleErrors = Record<number, { title?: string; pointsText?: string }>;

/** Replaces the curriculum: rows by position (1-based), stale positions
 *  removed — the seed's own rule. */
export async function replaceTrainingModules(tx: Tx, id: string, scope: TrainingScope, modules: TrainingModuleInput[], actorUserId: string): Promise<void> {
  if (!(await canManageTraining(tx, scope, id))) throw new TrainingRefusedError("not_found", "This training could not be found.");
  const errors: TrainingModuleErrors = {};
  const parsed = modules.map((m, i) => {
    const title = m.title.trim();
    if (!title) errors[i] = { ...errors[i], title: "Enter the module title." };
    else if (title.length > LINE_MAX) errors[i] = { ...errors[i], title: `Use at most ${LINE_MAX} characters.` };
    const { points, error } = textToModulePoints(m.pointsText);
    if (error) errors[i] = { ...errors[i], pointsText: error };
    return { title, description: m.description.trim() || null, points };
  });
  if (Object.keys(errors).length) throw new TrainingValidationError<string>(errors as unknown as Record<string, string>);
  const before = await tx.programmeModule.findMany({ where: { programmeId: id }, orderBy: { position: "asc" }, select: { title: true, description: true, points: true } });
  for (const [i, m] of parsed.entries()) {
    // A module with no points stores SQL NULL (Prisma: DbNull), never `undefined`
    // (which would leave a previous value in place on update).
    const points = m.points === null ? JSON_NULL : (m.points as JsonInput);
    await tx.programmeModule.upsert({
      where: { programmeId_position: { programmeId: id, position: i + 1 } },
      create: { programmeId: id, position: i + 1, title: m.title, description: m.description, points },
      update: { title: m.title, description: m.description, points },
    });
  }
  await tx.programmeModule.deleteMany({ where: { programmeId: id, position: { gt: parsed.length } } });
  await writeAudit(tx, {
    actorUserId,
    action: "programme.modules_updated",
    entityType: "programme",
    entityId: id,
    before: { modules: before.map((m) => ({ title: m.title, description: m.description, points: normaliseModulePoints(m.points) })) },
    after: { modules: parsed },
  });
}

/* --------------------------------------------------------------- formats */

export type TrainingFormatInput = {
  name: string;
  badge: string;
  durationLabel: string;
  scheduleLabel: string;
  totalTimeLabel: string;
  bestForText: string;
};
export type TrainingFormatErrors = Record<number, Partial<Record<keyof TrainingFormatInput, string>>>;

const codeOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Replaces the pace formats by code (from the name). A format an offering
 *  still references cannot be removed (FK Restrict) — refused with a message. */
export async function replaceTrainingFormats(tx: Tx, id: string, scope: TrainingScope, formats: TrainingFormatInput[], actorUserId: string): Promise<void> {
  if (!(await canManageTraining(tx, scope, id))) throw new TrainingRefusedError("not_found", "This training could not be found.");
  const errors: TrainingFormatErrors = {};
  const parsed = formats.map((f, i) => {
    const e: Partial<Record<keyof TrainingFormatInput, string>> = {};
    for (const k of ["name", "durationLabel", "scheduleLabel", "totalTimeLabel"] as const) {
      if (!f[k].trim()) e[k] = "Required.";
      else if (f[k].length > LINE_MAX) e[k] = `Use at most ${LINE_MAX} characters.`;
    }
    const bestFor = f.bestForText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (Object.keys(e).length) errors[i] = e;
    return { code: codeOf(f.name.trim()), name: f.name.trim(), badge: f.badge.trim() || null, durationLabel: f.durationLabel.trim(), scheduleLabel: f.scheduleLabel.trim(), totalTimeLabel: f.totalTimeLabel.trim(), bestFor };
  });
  const codes = parsed.map((p) => p.code);
  if (new Set(codes).size !== codes.length) errors[0] = { ...errors[0], name: "Two formats have the same name." };
  if (Object.keys(errors).length) throw new TrainingValidationError<string>(errors as unknown as Record<string, string>);
  const before = await tx.deliveryFormat.findMany({ where: { programmeId: id }, orderBy: { position: "asc" }, select: { code: true, name: true, badge: true, durationLabel: true, scheduleLabel: true, totalTimeLabel: true, bestFor: true } });
  const removed = before.filter((b) => !codes.includes(b.code));
  if (removed.length) {
    const inUse = await tx.scheduledOffering.count({ where: { programmeId: id, deliveryFormat: { code: { in: removed.map((r) => r.code) } } } });
    if (inUse > 0) throw new TrainingRefusedError("format_in_use", "A format that dates are scheduled under cannot be removed. Cancel or re-assign those dates first.");
  }
  for (const [i, f] of parsed.entries()) {
    const data = { name: f.name, badge: f.badge, durationLabel: f.durationLabel, scheduleLabel: f.scheduleLabel, totalTimeLabel: f.totalTimeLabel, bestFor: f.bestFor, position: i + 1 };
    await tx.deliveryFormat.upsert({ where: { programmeId_code: { programmeId: id, code: f.code } }, create: { programmeId: id, code: f.code, ...data }, update: data });
  }
  await tx.deliveryFormat.deleteMany({ where: { programmeId: id, code: { notIn: codes } } });
  await writeAudit(tx, { actorUserId, action: "programme.formats_updated", entityType: "programme", entityId: id, before: { formats: before }, after: { formats: parsed } });
}

/* ------------------------------------------------------------------ fees */

export type TrainingFeeInput = {
  region: PriceRegion;
  currency: string;
  /** Major units as typed ("5,000" or "5000.00"). */
  listAmount: string;
  offerAmount: string;
  offerLabel: string;
  offerName: string;
  minParticipants: string;
  note: string;
  validFrom: string;
  validTo: string;
};
export type TrainingFeeField = keyof TrainingFeeInput;
export type TrainingFeeErrors = Partial<Record<TrainingFeeField, string>>;

/** "5,000" → 500000n; "12.5" → 1250n; anything else → null. */
export function parseMajorToMinor(value: string): bigint | null {
  const cleaned = value.replace(/[,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return BigInt(whole!) * 100n + BigInt((frac + "00").slice(0, 2));
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function parseDate(value: string): Date | null | undefined {
  const v = value.trim();
  if (!v) return null;
  if (!DATE_RE.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Creates or updates ONE fee row (the four-row structure, M12 WP1/WP2). */
export async function saveTrainingFee(tx: Tx, id: string, scope: TrainingScope, raw: TrainingFeeInput, actorUserId: string): Promise<void> {
  if (!(await canManageTraining(tx, scope, id))) throw new TrainingRefusedError("not_found", "This training could not be found.");
  const errors: TrainingFeeErrors = {};
  if (!FEE_REGIONS.includes(raw.region)) errors.region = "Unknown fee row.";
  const currency = raw.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Use a three-letter currency code (MYR, PKR, USD).";
  const list = parseMajorToMinor(raw.listAmount);
  const offer = parseMajorToMinor(raw.offerAmount);
  if (list === null) errors.listAmount = "Enter the full price as a number, e.g. 5000 or 5,000.00.";
  if (offer === null) errors.offerAmount = "Enter today's price as a number.";
  if (list !== null && offer !== null && offer > list) errors.offerAmount = "Today's price cannot be higher than the full price.";
  const offerLabel = raw.offerLabel.trim();
  if (!offerLabel) errors.offerLabel = "Enter the label shown beside the price (e.g. 50% OFF, or Full fee).";
  const offerName = raw.offerName.trim() || PRICE_REGIONS.find((r) => r.key === raw.region)?.subtitle || "";
  let minParticipants: number | null = null;
  if (raw.minParticipants.trim()) {
    minParticipants = /^\d+$/.test(raw.minParticipants.trim()) ? Number(raw.minParticipants.trim()) : Number.NaN;
    if (Number.isNaN(minParticipants) || minParticipants < 1 || minParticipants > 10_000) errors.minParticipants = "Minimum participants must be a whole number, or left blank.";
  }
  const note = raw.note.trim() || null;
  if (note && note.length > 500) errors.note = "Use at most 500 characters.";
  const validFrom = parseDate(raw.validFrom);
  const validTo = parseDate(raw.validTo);
  if (validFrom === undefined) errors.validFrom = "Enter a date, or leave blank.";
  if (validTo === undefined) errors.validTo = "Enter a date, or leave blank.";
  if (validFrom && validTo && validTo < validFrom) errors.validTo = "Valid-to cannot be before valid-from.";
  if (Object.keys(errors).length) throw new TrainingValidationError<TrainingFeeField>(errors);
  const data = { currency, listAmountMinor: list!, offerAmountMinor: offer!, offerLabel, offerName, minParticipants, note, validFrom: validFrom ?? null, validTo: validTo ?? null };
  const before = await tx.programmePrice.findUnique({ where: { programmeId_region: { programmeId: id, region: raw.region } } });
  await tx.programmePrice.upsert({ where: { programmeId_region: { programmeId: id, region: raw.region } }, create: { programmeId: id, region: raw.region, ...data }, update: data });
  const snap = (r: typeof before | typeof data | null) =>
    r ? { currency: r.currency, listAmountMinor: Number(r.listAmountMinor), offerAmountMinor: Number(r.offerAmountMinor), offerLabel: r.offerLabel, offerName: r.offerName, minParticipants: r.minParticipants, note: r.note, validFrom: r.validFrom, validTo: r.validTo } : null;
  await writeAudit(tx, { actorUserId, action: "programme.fee_updated", entityType: "programme", entityId: id, before: before ? { region: raw.region, ...snap(before) } : null, after: { region: raw.region, ...snap(data) } });
}

export async function removeTrainingFee(tx: Tx, id: string, scope: TrainingScope, region: PriceRegion, actorUserId: string): Promise<boolean> {
  if (!(await canManageTraining(tx, scope, id))) throw new TrainingRefusedError("not_found", "This training could not be found.");
  const existing = await tx.programmePrice.findUnique({ where: { programmeId_region: { programmeId: id, region } } });
  if (!existing) return false;
  await tx.programmePrice.delete({ where: { id: existing.id } });
  await writeAudit(tx, {
    actorUserId,
    action: "programme.fee_removed",
    entityType: "programme",
    entityId: id,
    before: { region, currency: existing.currency, listAmountMinor: Number(existing.listAmountMinor), offerAmountMinor: Number(existing.offerAmountMinor), offerLabel: existing.offerLabel },
    after: null,
  });
  return true;
}

/* ---------------------------------------------------------------- status */

/** Publish / unpublish / retire — administrators only (decision L2); the
 *  action layer enforces the role, this records the change. */
export async function setTrainingStatus(tx: Tx, id: string, status: ProgrammeStatus, actorUserId: string): Promise<void> {
  if (!PROGRAMME_STATUSES.includes(status)) throw new TrainingValidationError<"status">({ status: "Choose a status." });
  const existing = await tx.programme.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw new TrainingRefusedError("not_found", "This training could not be found.");
  if (existing.status === status) return;
  await tx.programme.update({ where: { id }, data: { status } });
  await writeAudit(tx, { actorUserId, action: "programme.status_changed", entityType: "programme", entityId: id, before: { status: existing.status }, after: { status } });
}
