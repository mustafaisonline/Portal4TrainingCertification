import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";

/*
 * The "Support the Academy" payment setting (founder decisions M1–M5,
 * 2026-09-27) — modelled on the certificate renewal fee: an ADMIN-MANAGED,
 * EFFECTIVE-DATED, insert-only setting. The row in force at an instant is
 * the newest `effective_from <= instant`. `enabled` is the kill switch: off
 * hides the card on /account and /programs, and `startSupportCheckout`
 * refuses. The amount, currency and label a person is shown and charged are
 * read from here — never from a form or a constant.
 */

export type SupportSettingRecord = {
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

export const SUPPORT_DEFAULT_LABEL = "Support the Academy";
export const SUPPORT_DEFAULT_CURRENCY = "MYR";
/** RM 2.00 — Stripe's minimum charge in MYR (eCard learned this live). */
export const SUPPORT_DEFAULT_AMOUNT_MINOR = 200;
export const SUPPORT_AMOUNT_MAX_MINOR = 100_000;
const NOTE_MAX = 500;
const LABEL_MAX = 80;
const PAST_TOLERANCE_MS = 60_000;

function toRecord(r: { id: string; enabled: boolean; amountMinor: number; currency: string; label: string; effectiveFrom: Date; createdByUserId: string | null; note: string | null; createdAt: Date }): SupportSettingRecord {
  return { id: r.id, enabled: r.enabled, amountMinor: r.amountMinor, currency: r.currency, label: r.label, effectiveFrom: r.effectiveFrom, createdByUserId: r.createdByUserId, note: r.note, createdAt: r.createdAt };
}

/** The setting in force at `at`; null on a database that was never seeded. */
export async function supportSettingInForceAt(at: Date, db: Db = getPrisma()): Promise<SupportSettingRecord | null> {
  const row = await db.supportPaymentSetting.findFirst({ where: { effectiveFrom: { lte: at } }, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
  return row ? toRecord(row) : null;
}

export async function currentSupportSetting(now = new Date(), db: Db = getPrisma()): Promise<SupportSettingRecord | null> {
  return supportSettingInForceAt(now, db);
}

/** The setting to SHOW: the one in force and enabled; null means "no card". */
export async function enabledSupportSetting(now = new Date(), db: Db = getPrisma()): Promise<SupportSettingRecord | null> {
  const s = await supportSettingInForceAt(now, db);
  return s && s.enabled ? s : null;
}

export async function listSupportHistory(db: Db = getPrisma()): Promise<SupportSettingRecord[]> {
  const rows = await db.supportPaymentSetting.findMany({ orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
  return rows.map(toRecord);
}

export type CreateSupportSettingInput = {
  enabled: boolean;
  amountMinor: number;
  currency: string;
  label: string;
  effectiveFrom: Date;
  note?: string | null;
};

export class SupportSettingValidationError extends Error {
  readonly fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) {
    super(`Support payment setting validation failed: ${Object.keys(fieldErrors).join(", ")}`);
    this.name = "SupportSettingValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function validateSupportSettingInput(input: CreateSupportSettingInput, now = new Date()): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0 || input.amountMinor > SUPPORT_AMOUNT_MAX_MINOR) {
    errors["amountMinor"] = `Enter an amount above 0 and up to ${(SUPPORT_AMOUNT_MAX_MINOR / 100).toFixed(2)}.`;
  }
  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) errors["currency"] = "Enter a three-letter currency code, e.g. MYR.";
  // Stripe minimum charges (docs.stripe.com/currencies#minimum-and-maximum-charge-amounts).
  const minimum: Record<string, number> = { MYR: 200, USD: 50, EUR: 50, GBP: 30, SGD: 50, AUD: 50 };
  if (!errors["amountMinor"] && minimum[currency] !== undefined && input.amountMinor < minimum[currency]!) {
    errors["amountMinor"] = `Stripe's minimum charge in ${currency} is ${(minimum[currency]! / 100).toFixed(2)}.`;
  }
  if (!input.label.trim()) errors["label"] = "Enter the name shown on Stripe's page and the receipt.";
  else if (input.label.trim().length > LABEL_MAX) errors["label"] = `Keep the label to ${LABEL_MAX} characters.`;
  if (!(input.effectiveFrom instanceof Date) || Number.isNaN(input.effectiveFrom.getTime())) errors["effectiveFrom"] = "Enter the date and time the setting takes effect.";
  else if (input.effectiveFrom.getTime() < now.getTime() - PAST_TOLERANCE_MS) errors["effectiveFrom"] = "The effective time cannot be in the past.";
  if (input.note && input.note.trim().length > NOTE_MAX) errors["note"] = `Keep the note to ${NOTE_MAX} characters.`;
  return errors;
}

/** Appends a setting and audits it against the one in force. */
export async function createSupportSetting(tx: Tx, input: CreateSupportSettingInput, adminUserId: string, now = new Date()): Promise<SupportSettingRecord> {
  const errors = validateSupportSettingInput(input, now);
  if (Object.keys(errors).length) throw new SupportSettingValidationError(errors);
  const current = await supportSettingInForceAt(now, tx);
  const row = await tx.supportPaymentSetting.create({
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
    action: "support_payment.changed",
    entityType: "support_payment_setting",
    entityId: row.id,
    before: current ? { settingId: current.id, enabled: current.enabled, amountMinor: current.amountMinor, currency: current.currency, label: current.label, effectiveFrom: current.effectiveFrom.toISOString() } : null,
    after: { enabled: row.enabled, amountMinor: row.amountMinor, currency: row.currency, label: row.label, effectiveFrom: row.effectiveFrom.toISOString() },
    reason: row.note,
  });
  return toRecord(row);
}
