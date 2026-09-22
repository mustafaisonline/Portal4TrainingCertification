import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";
import { CertificateValidationError } from "./repository";

/*
 * The renewal fee (M6 plan §3 E4; R-F1/R-F2): an ADMIN-MANAGED, EFFECTIVE-
 * DATED setting in the database, insert-only. The fee in force at an instant
 * is the newest row whose `effective_from` is not after it. Seeded at
 * USD 10.00 (prisma/seed.ts); changed only through `createFeeSetting`, which
 * writes `certificate_fee.changed` in the same transaction. The amount a
 * holder is shown and charged is always read from here — never from a form.
 */

export type FeeSettingRecord = {
  id: string;
  amountMinor: number;
  currency: string;
  effectiveFrom: Date;
  createdByUserId: string | null;
  note: string | null;
  createdAt: Date;
};

export const FEE_AMOUNT_MAX_MINOR = 100_000;
export const FEE_DEFAULT_CURRENCY = "USD";
const FEE_NOTE_MAX = 500;
/** An effective time may be a minute in the past to absorb clock skew
 *  between the browser's form and the server. */
const FEE_PAST_TOLERANCE_MS = 60_000;

type Row = NonNullable<Awaited<ReturnType<typeof load>>>;

function load(db: Db, id: string) {
  return db.certificateFeeSetting.findUnique({ where: { id } });
}

function toRecord(r: Row): FeeSettingRecord {
  return {
    id: r.id,
    amountMinor: r.amountMinor,
    currency: r.currency,
    effectiveFrom: r.effectiveFrom,
    createdByUserId: r.createdByUserId,
    note: r.note,
    createdAt: r.createdAt,
  };
}

/** The fee in force at instant `at`: newest `effective_from <= at`. Null
 *  only on a database that was never seeded. */
export async function feeSettingInForceAt(at: Date, db: Db = getPrisma()): Promise<FeeSettingRecord | null> {
  const row = await db.certificateFeeSetting.findFirst({
    where: { effectiveFrom: { lte: at } },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
  });
  return row ? toRecord(row) : null;
}

/** The fee in force now. */
export async function currentFeeSetting(now = new Date(), db: Db = getPrisma()): Promise<FeeSettingRecord | null> {
  return feeSettingInForceAt(now, db);
}

/** Every setting ever made, newest `effective_from` first (future ones included). */
export async function listFeeHistory(db: Db = getPrisma()): Promise<FeeSettingRecord[]> {
  const rows = await db.certificateFeeSetting.findMany({ orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
  return rows.map(toRecord);
}

export type CreateFeeSettingInput = {
  /** Integer minor units, 0 < x ≤ FEE_AMOUNT_MAX_MINOR. */
  amountMinor: number;
  /** ISO 4217, three letters; stored upper-case. */
  currency: string;
  /** When the new fee starts applying; not more than a minute in the past. */
  effectiveFrom: Date;
  note?: string | null;
};

export function validateFeeSettingInput(input: CreateFeeSettingInput, now = new Date()): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0 || input.amountMinor > FEE_AMOUNT_MAX_MINOR) {
    errors["amountMinor"] = `Enter an amount above 0 and up to ${(FEE_AMOUNT_MAX_MINOR / 100).toFixed(2)}.`;
  }
  if (!/^[A-Z]{3}$/.test(input.currency.trim().toUpperCase())) errors["currency"] = "Enter a three-letter currency code, e.g. USD.";
  if (!(input.effectiveFrom instanceof Date) || Number.isNaN(input.effectiveFrom.getTime())) errors["effectiveFrom"] = "Enter the date and time the fee takes effect.";
  else if (input.effectiveFrom.getTime() < now.getTime() - FEE_PAST_TOLERANCE_MS) errors["effectiveFrom"] = "The effective time cannot be in the past.";
  if (input.note && input.note.trim().length > FEE_NOTE_MAX) errors["note"] = `Keep the note to ${FEE_NOTE_MAX} characters.`;
  return errors;
}

/** Appends a fee setting and audits it against the fee currently in force.
 *  Throws `CertificateValidationError` with per-field messages. */
export async function createFeeSetting(tx: Tx, input: CreateFeeSettingInput, adminUserId: string, now = new Date()): Promise<FeeSettingRecord> {
  const errors = validateFeeSettingInput(input, now);
  if (Object.keys(errors).length) throw new CertificateValidationError(errors);
  const current = await feeSettingInForceAt(now, tx);
  const row = await tx.certificateFeeSetting.create({
    data: {
      amountMinor: input.amountMinor,
      currency: input.currency.trim().toUpperCase(),
      effectiveFrom: input.effectiveFrom,
      createdByUserId: adminUserId,
      note: input.note?.trim() || null,
    },
  });
  await writeAudit(tx, {
    actorUserId: adminUserId,
    action: "certificate_fee.changed",
    entityType: "certificate_fee_setting",
    entityId: row.id,
    before: current ? { feeSettingId: current.id, amountMinor: current.amountMinor, currency: current.currency, effectiveFrom: current.effectiveFrom.toISOString() } : null,
    after: { amountMinor: row.amountMinor, currency: row.currency, effectiveFrom: row.effectiveFrom.toISOString() },
    reason: row.note,
  });
  return toRecord(row);
}
