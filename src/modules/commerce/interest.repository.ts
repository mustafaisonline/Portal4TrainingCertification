import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { scopeWhere, type TrainingScope } from "@/modules/catalogue/programmes/admin.repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import type { InterestExportRow } from "./interest-rules";
import { SUPPORT_AMOUNT_MAX_MINOR, SupportSettingValidationError, validateSupportSettingInput, type CreateSupportSettingInput } from "./support.repository";

/*
 * "Register your interest" — the data (CR-2026-10-01-2138; founder, 2026-10-01).
 *
 *  - the FEE: an administrator-managed, effective-dated, insert-only setting,
 *    exactly like the Assessment unlock fee (the row in force is the newest
 *    `effective_from <= now`; `enabled` is the switch). The amount a person is
 *    shown and charged is read from here, never from a form.
 *  - the RECORD: one `training_interests` row per person per format. It is
 *    `confirmed` only by the verified Stripe webhook (or at once, fee waived,
 *    for a participant in Pakistan — no card route). Unpaid rows are re-used
 *    by a retry; they never count.
 *  - WHO SEES IT: the administrator sees every row; a Trainer sees the rows of
 *    their own trainings (the same `scopeWhere` as the Trainings area), and
 *    that includes the date of birth, which no one else sees.
 */

/* ------------------------------------------------------------------- fee */

export type InterestSettingRecord = {
  id: string;
  enabled: boolean;
  amountMinor: number;
  currency: string;
  label: string;
  effectiveFrom: Date;
  createdByUserId: string | null;
  note: string | null;
  createdAt: Date;
};

export const INTEREST_DEFAULT_LABEL = "Register your interest";
export const INTEREST_DEFAULT_CURRENCY = "USD";
/** USD 2.00 (founder, 2026-10-01). */
export const INTEREST_DEFAULT_AMOUNT_MINOR = 200;
export const INTEREST_AMOUNT_MAX_MINOR = SUPPORT_AMOUNT_MAX_MINOR;

function toRecord(r: InterestSettingRecord): InterestSettingRecord {
  return { id: r.id, enabled: r.enabled, amountMinor: r.amountMinor, currency: r.currency, label: r.label, effectiveFrom: r.effectiveFrom, createdByUserId: r.createdByUserId, note: r.note, createdAt: r.createdAt };
}

export async function interestSettingInForceAt(at: Date, db: Db = getPrisma()): Promise<InterestSettingRecord | null> {
  const row = await db.interestFeeSetting.findFirst({ where: { effectiveFrom: { lte: at } }, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
  return row ? toRecord(row) : null;
}

export async function currentInterestSetting(now = new Date(), db: Db = getPrisma()): Promise<InterestSettingRecord | null> {
  return interestSettingInForceAt(now, db);
}

/** The setting to charge by: in force and enabled; null means "registering interest is off". */
export async function enabledInterestSetting(now = new Date(), db: Db = getPrisma()): Promise<InterestSettingRecord | null> {
  const s = await interestSettingInForceAt(now, db);
  return s && s.enabled ? s : null;
}

export async function listInterestHistory(db: Db = getPrisma()): Promise<InterestSettingRecord[]> {
  const rows = await db.interestFeeSetting.findMany({ orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
  return rows.map(toRecord);
}

export type CreateInterestSettingInput = CreateSupportSettingInput;
export { SupportSettingValidationError as InterestSettingValidationError };

/** Appends a setting (same validation as the support payment) and audits it against the one in force. */
export async function createInterestSetting(tx: Tx, input: CreateInterestSettingInput, adminUserId: string, now = new Date()): Promise<InterestSettingRecord> {
  const errors = validateSupportSettingInput(input, now);
  if (Object.keys(errors).length) throw new SupportSettingValidationError(errors);
  const current = await interestSettingInForceAt(now, tx);
  const row = await tx.interestFeeSetting.create({
    data: {
      enabled: input.enabled,
      amountMinor: input.amountMinor,
      currency: input.currency.trim().toUpperCase(),
      label: input.label.trim(),
      effectiveFrom: input.effectiveFrom,
      createdByUserId: adminUserId,
      note: input.note?.trim() || null,
    },
  });
  await writeAudit(tx, {
    actorUserId: adminUserId,
    action: "interest_fee.changed",
    entityType: "interest_fee_setting",
    entityId: row.id,
    before: current ? { settingId: current.id, enabled: current.enabled, amountMinor: current.amountMinor, currency: current.currency, label: current.label, effectiveFrom: current.effectiveFrom.toISOString() } : null,
    after: { enabled: row.enabled, amountMinor: row.amountMinor, currency: row.currency, label: row.label, effectiveFrom: row.effectiveFrom.toISOString() },
    reason: row.note,
  });
  return toRecord(row);
}

/* ---------------------------------------------------------- eligibility */

function startOfTodayUtc(now: Date): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Dates a person can register for today under a format: open, not yet started, public (not a private cohort). */
export function openDateWhere(now: Date) {
  return { status: "open" as const, startsOn: { gte: startOfTodayUtc(now) }, organisationId: null };
}

/** Of these formats, the ones with NO open date — the ones interest may be registered in (founder Q3: once a date exists they register for the training itself). */
export async function formatIdsWithoutOpenDate(formatIds: readonly string[], now = new Date(), db: Db = getPrisma()): Promise<Set<string>> {
  if (formatIds.length === 0) return new Set();
  const withDate = await db.scheduledOffering.findMany({ where: { deliveryFormatId: { in: [...formatIds] }, ...openDateWhere(now) }, select: { deliveryFormatId: true }, distinct: ["deliveryFormatId"] });
  const taken = new Set(withDate.map((o) => o.deliveryFormatId));
  return new Set(formatIds.filter((id) => !taken.has(id)));
}

export type InterestFormatTarget = {
  formatId: string;
  formatName: string;
  programmeId: string;
  programmeSlug: string;
  programmeTitle: string;
  programmePublished: boolean;
  hasOpenDate: boolean;
};

/** A format with what is needed to decide eligibility; null when it does not exist. */
export async function interestTarget(formatId: string, now = new Date(), db: Db = getPrisma()): Promise<InterestFormatTarget | null> {
  if (!isUuid(formatId)) return null;
  const f = await db.deliveryFormat.findUnique({ where: { id: formatId }, select: { id: true, name: true, programme: { select: { id: true, slug: true, title: true, status: true } } } });
  if (!f) return null;
  const open = await db.scheduledOffering.count({ where: { deliveryFormatId: f.id, ...openDateWhere(now) } });
  return { formatId: f.id, formatName: f.name, programmeId: f.programme.id, programmeSlug: f.programme.slug, programmeTitle: f.programme.title, programmePublished: f.programme.status === "published", hasOpenDate: open > 0 };
}

/* --------------------------------------------------------------- records */

export type InterestRow = {
  id: string;
  programmeId: string;
  programmeTitle: string;
  programmeSlug: string;
  formatId: string;
  formatName: string;
  userId: string;
  fullName: string | null;
  email: string;
  mobile: string | null;
  dateOfBirth: Date | null;
  feeWaived: boolean;
  confirmedAt: Date;
  notifiedAt: Date | null;
};

const rowSelect = {
  id: true, programmeId: true, deliveryFormatId: true, userId: true, fullName: true, email: true, mobile: true, dateOfBirth: true, feeWaived: true, confirmedAt: true, notifiedAt: true,
  programme: { select: { title: true, slug: true } },
  deliveryFormat: { select: { name: true } },
} as const;

type RowShape = { id: string; programmeId: string; deliveryFormatId: string; userId: string; fullName: string | null; email: string; mobile: string | null; dateOfBirth: Date | null; feeWaived: boolean; confirmedAt: Date | null; notifiedAt: Date | null; programme: { title: string; slug: string }; deliveryFormat: { name: string } };

function toRow(r: RowShape): InterestRow {
  return {
    id: r.id, programmeId: r.programmeId, programmeTitle: r.programme.title, programmeSlug: r.programme.slug, formatId: r.deliveryFormatId, formatName: r.deliveryFormat.name, userId: r.userId,
    fullName: r.fullName, email: r.email, mobile: r.mobile, dateOfBirth: r.dateOfBirth, feeWaived: r.feeWaived, confirmedAt: r.confirmedAt ?? new Date(0), notifiedAt: r.notifiedAt,
  };
}

export type InterestFilter = { programmeId?: string; formatId?: string; notified?: "yes" | "no" };

/** Confirmed interests in the caller's scope (a Trainer: their own trainings; an administrator: all), newest first. */
export async function listInterests(scope: TrainingScope, filter: InterestFilter = {}, db: Db = getPrisma()): Promise<InterestRow[]> {
  const rows = await db.trainingInterest.findMany({
    where: {
      status: "confirmed",
      programme: scopeWhere(scope),
      ...(filter.programmeId && isUuid(filter.programmeId) ? { programmeId: filter.programmeId } : {}),
      ...(filter.formatId && isUuid(filter.formatId) ? { deliveryFormatId: filter.formatId } : {}),
      ...(filter.notified === "yes" ? { notifiedAt: { not: null } } : filter.notified === "no" ? { notifiedAt: null } : {}),
    },
    orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
    select: rowSelect,
  });
  return rows.map(toRow);
}

export function toExportRows(rows: readonly InterestRow[]): InterestExportRow[] {
  return rows.map((r) => ({ trainingTitle: r.programmeTitle, formatName: r.formatName, fullName: r.fullName, email: r.email, mobile: r.mobile, dateOfBirth: r.dateOfBirth, registeredAt: r.confirmedAt, feeWaived: r.feeWaived, notifiedAt: r.notifiedAt }));
}

export type FormatInterestCount = { confirmed: number; notified: number };

/** Confirmed (and notified) interest counts per format, over the caller's scope. */
export async function interestCountsByFormat(scope: TrainingScope, db: Db = getPrisma()): Promise<Map<string, FormatInterestCount>> {
  const rows = await db.trainingInterest.groupBy({
    by: ["deliveryFormatId", "notifiedAt"],
    where: { status: "confirmed", programme: scopeWhere(scope) },
    _count: { _all: true },
  });
  const out = new Map<string, FormatInterestCount>();
  for (const r of rows) {
    const c = out.get(r.deliveryFormatId) ?? { confirmed: 0, notified: 0 };
    c.confirmed += r._count._all;
    if (r.notifiedAt) c.notified += r._count._all;
    out.set(r.deliveryFormatId, c);
  }
  return out;
}

export async function countConfirmedInterests(scope: TrainingScope, db: Db = getPrisma()): Promise<{ confirmed: number; awaitingNotice: number }> {
  const [confirmed, awaitingNotice] = await Promise.all([
    db.trainingInterest.count({ where: { status: "confirmed", programme: scopeWhere(scope) } }),
    db.trainingInterest.count({ where: { status: "confirmed", notifiedAt: null, programme: scopeWhere(scope) } }),
  ]);
  return { confirmed, awaitingNotice };
}

export class InterestRefusedError extends Error {
  readonly code: "forbidden" | "not_found";
  constructor(code: InterestRefusedError["code"], message: string) {
    super(message);
    this.name = "InterestRefusedError";
    this.code = code;
  }
}

/** Marks the given confirmed interests notified (in the caller's scope only); returns how many changed. Audited per row. */
export async function markInterestsNotified(tx: Tx, scope: TrainingScope, ids: readonly string[], actorUserId: string, now = new Date()): Promise<number> {
  const clean = [...new Set(ids.filter(isUuid))];
  if (clean.length === 0) return 0;
  const rows = await tx.trainingInterest.findMany({ where: { id: { in: clean }, status: "confirmed", notifiedAt: null, programme: scopeWhere(scope) }, select: { id: true, programmeId: true, deliveryFormatId: true } });
  for (const r of rows) {
    await tx.trainingInterest.update({ where: { id: r.id }, data: { notifiedAt: now, notifiedByUserId: actorUserId } });
    await writeAudit(tx, { actorUserId, action: "interest.notified", entityType: "training_interest", entityId: r.id, before: { notifiedAt: null }, after: { notifiedAt: now.toISOString(), programmeId: r.programmeId, formatId: r.deliveryFormatId } });
  }
  return rows.length;
}

/* -------------------------------------------------------- the person's own */

export type MyInterest = {
  id: string;
  status: "pending" | "confirmed" | "expired";
  programmeTitle: string;
  programmeSlug: string;
  formatName: string;
  feeWaived: boolean;
  confirmedAt: Date | null;
  notifiedAt: Date | null;
  /** A date is now open under this format — the person can register for the training itself. */
  hasOpenDate: boolean;
};

/** The person's confirmed interests, newest first, each with whether a date now exists. */
export async function listInterestsForUser(userId: string, now = new Date(), db: Db = getPrisma()): Promise<MyInterest[]> {
  const rows = await db.trainingInterest.findMany({
    where: { userId, status: "confirmed" },
    orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, status: true, deliveryFormatId: true, feeWaived: true, confirmedAt: true, notifiedAt: true, programme: { select: { title: true, slug: true } }, deliveryFormat: { select: { name: true } } },
  });
  const noDate = await formatIdsWithoutOpenDate(rows.map((r) => r.deliveryFormatId), now, db);
  return rows.map((r) => ({ id: r.id, status: r.status, programmeTitle: r.programme.title, programmeSlug: r.programme.slug, formatName: r.deliveryFormat.name, feeWaived: r.feeWaived, confirmedAt: r.confirmedAt, notifiedAt: r.notifiedAt, hasOpenDate: !noDate.has(r.deliveryFormatId) }));
}

/** The person's own row for one format (any status) — what the button on the training page needs. */
export async function interestStatusForUser(userId: string, formatIds: readonly string[], db: Db = getPrisma()): Promise<Map<string, "pending" | "confirmed" | "expired">> {
  if (formatIds.length === 0) return new Map();
  const rows = await db.trainingInterest.findMany({ where: { userId, deliveryFormatId: { in: [...formatIds] } }, select: { deliveryFormatId: true, status: true } });
  return new Map(rows.map((r) => [r.deliveryFormatId, r.status]));
}
