import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";
import { SUPPORT_AMOUNT_MAX_MINOR, validateSupportSettingInput, type CreateSupportSettingInput, SupportSettingValidationError } from "./support.repository";

/*
 * The Free Assessment Check result-document unlock fee (Milestone 14 Phase 5;
 * DR-03 §3; founder decisions P13 — Pakistan exempt — and P14 —
 * non-refundable). The SAME discipline as the support payment: an
 * admin-managed, effective-dated, insert-only setting; the row in force is
 * the newest `effective_from <= now`; `enabled` is the switch. The amount a
 * person is shown and charged is read from here, never from a form.
 */

export type UnlockSettingRecord = {
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

export const UNLOCK_DEFAULT_LABEL = "Free Assessment Check result document";
export const UNLOCK_DEFAULT_CURRENCY = "USD";
/** US$10.00 (founder, 2026-09-27). */
export const UNLOCK_DEFAULT_AMOUNT_MINOR = 1000;
export const UNLOCK_AMOUNT_MAX_MINOR = SUPPORT_AMOUNT_MAX_MINOR;

function toRecord(r: { id: string; enabled: boolean; amountMinor: number; currency: string; label: string; effectiveFrom: Date; createdByUserId: string | null; note: string | null; createdAt: Date }): UnlockSettingRecord {
  return { id: r.id, enabled: r.enabled, amountMinor: r.amountMinor, currency: r.currency, label: r.label, effectiveFrom: r.effectiveFrom, createdByUserId: r.createdByUserId, note: r.note, createdAt: r.createdAt };
}

export async function unlockSettingInForceAt(at: Date, db: Db = getPrisma()): Promise<UnlockSettingRecord | null> {
  const row = await db.knowledgeCheckUnlockSetting.findFirst({ where: { effectiveFrom: { lte: at } }, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
  return row ? toRecord(row) : null;
}

export async function currentUnlockSetting(now = new Date(), db: Db = getPrisma()): Promise<UnlockSettingRecord | null> {
  return unlockSettingInForceAt(now, db);
}

/** The setting to charge by: in force and enabled; null means "unlock unavailable". */
export async function enabledUnlockSetting(now = new Date(), db: Db = getPrisma()): Promise<UnlockSettingRecord | null> {
  const s = await unlockSettingInForceAt(now, db);
  return s && s.enabled ? s : null;
}

export async function listUnlockHistory(db: Db = getPrisma()): Promise<UnlockSettingRecord[]> {
  const rows = await db.knowledgeCheckUnlockSetting.findMany({ orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
  return rows.map(toRecord);
}

export type CreateUnlockSettingInput = CreateSupportSettingInput;
export { SupportSettingValidationError as UnlockSettingValidationError };

/** Appends a setting (same validation as the support payment) and audits it against the one in force. */
export async function createUnlockSetting(tx: Tx, input: CreateUnlockSettingInput, adminUserId: string, now = new Date()): Promise<UnlockSettingRecord> {
  const errors = validateSupportSettingInput(input, now);
  if (Object.keys(errors).length) throw new SupportSettingValidationError(errors);
  const current = await unlockSettingInForceAt(now, tx);
  const row = await tx.knowledgeCheckUnlockSetting.create({
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
    action: "knowledge_check_unlock.changed",
    entityType: "knowledge_check_unlock_setting",
    entityId: row.id,
    before: current ? { settingId: current.id, enabled: current.enabled, amountMinor: current.amountMinor, currency: current.currency, label: current.label, effectiveFrom: current.effectiveFrom.toISOString() } : null,
    after: { enabled: row.enabled, amountMinor: row.amountMinor, currency: row.currency, label: row.label, effectiveFrom: row.effectiveFrom.toISOString() },
    reason: row.note,
  });
  return toRecord(row);
}
