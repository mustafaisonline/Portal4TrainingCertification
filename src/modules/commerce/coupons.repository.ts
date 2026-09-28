import { randomInt } from "node:crypto";
import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";

/*
 * Coupons (founder specification + decisions N1–N8, approved 2026-09-28).
 * An administrator creates a coupon for ONE email address and ONE training;
 * single-use, percentage-off (1–100), optionally expiring. The discount is
 * computed HERE, server-side only (spec §15), and the charge never falls
 * below 2.00 of the order currency (N2 — USD 2.00 international, RM 2.00
 * Malaysia; Pakistan pays the local partner and never sees a coupon field).
 * A coupon becomes Used only when Stripe confirms the payment (N3, webhook);
 * an abandoned checkout frees it, and a live pending order blocks a second
 * checkout with the same coupon. "Used"/"Expired" are derived, not stored.
 */

/* --------------------------------------------------------- code generation */

/** N8: TRN- + 6 crypto-random characters from an alphabet without look-alikes
 *  (no 0/O/1/I). ~32^6 ≈ a billion combinations — not guessable. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_PREFIX = "TRN-";

export function generateCouponCode(random: (max: number) => number = randomInt): string {
  let symbols = "";
  for (let i = 0; i < 6; i += 1) symbols += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return `${CODE_PREFIX}${symbols}`;
}

/** Codes are matched case-insensitively by normalising BOTH sides to the
 *  stored uppercase form (spec §4). */
export function normaliseCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/* ------------------------------------------------------------- floor maths */

/** N2: the Stripe charge never falls below 2.00 of the order currency —
 *  200 minor units (USD 2.00, RM 2.00; the same rule the RM 2.00 support
 *  payment set as the platform minimum). */
export const COUPON_FLOOR_MINOR = 200;

export type CouponPricing = {
  /** The price before the coupon, minor units. */
  listMinor: number;
  /** What Stripe charges: max(rounded discounted price, floor). */
  finalMinor: number;
  /** listMinor − finalMinor — what the person actually saves. */
  discountMinor: number;
  /** True when the percentage alone would have gone below the floor. */
  floorApplied: boolean;
};

export function priceWithCoupon(listMinor: number, discountPercent: number): CouponPricing {
  const discounted = Math.round((listMinor * (100 - discountPercent)) / 100);
  const finalMinor = Math.min(listMinor, Math.max(discounted, COUPON_FLOOR_MINOR));
  return { listMinor, finalMinor, discountMinor: listMinor - finalMinor, floorApplied: discounted < COUPON_FLOOR_MINOR };
}

/* -------------------------------------------------------------- validation */

export type CouponRecord = {
  id: string;
  code: string;
  email: string;
  programmeId: string;
  programmeTitle: string;
  programmeSlug: string;
  discountPercent: number;
  status: "active" | "disabled";
  expiresAt: Date | null;
  redeemedAt: Date | null;
  redeemedByUserId: string | null;
  redeemedByEmail: string | null;
  redeemedOrderId: string | null;
  createdAt: Date;
};

const select = {
  id: true,
  code: true,
  email: true,
  programmeId: true,
  programme: { select: { title: true, slug: true } },
  discountPercent: true,
  status: true,
  expiresAt: true,
  redeemedAt: true,
  redeemedByUserId: true,
  redeemedByUser: { select: { email: true } },
  redeemedOrderId: true,
  createdAt: true,
} as const;

type Row = {
  id: string;
  code: string;
  email: string;
  programmeId: string;
  programme: { title: string; slug: string };
  discountPercent: number;
  status: "active" | "disabled";
  expiresAt: Date | null;
  redeemedAt: Date | null;
  redeemedByUserId: string | null;
  redeemedByUser: { email: string } | null;
  redeemedOrderId: string | null;
  createdAt: Date;
};

function toRecord(r: Row): CouponRecord {
  return {
    id: r.id,
    code: r.code,
    email: r.email,
    programmeId: r.programmeId,
    programmeTitle: r.programme.title,
    programmeSlug: r.programme.slug,
    discountPercent: r.discountPercent,
    status: r.status,
    expiresAt: r.expiresAt,
    redeemedAt: r.redeemedAt,
    redeemedByUserId: r.redeemedByUserId,
    redeemedByEmail: r.redeemedByUser?.email ?? null,
    redeemedOrderId: r.redeemedOrderId,
    createdAt: r.createdAt,
  };
}

/** The spec's §10 statuses, derived — never stored, never able to drift. */
export function couponDisplayStatus(c: Pick<CouponRecord, "status" | "redeemedAt" | "expiresAt">, now = new Date()): "Active" | "Used" | "Expired" | "Disabled" {
  if (c.redeemedAt) return "Used";
  if (c.status === "disabled") return "Disabled";
  if (c.expiresAt && c.expiresAt.getTime() <= now.getTime()) return "Expired";
  return "Active";
}

/** The spec's §6/§14 refusal reasons, in check order. */
export type CouponRefusal =
  | "coupon_not_found"
  | "coupon_disabled"
  | "coupon_expired"
  | "coupon_used"
  | "coupon_email_mismatch"
  | "coupon_wrong_training"
  | "coupon_payment_in_progress";

export type CouponValidation = { ok: true; coupon: CouponRecord } | { ok: false; reason: CouponRefusal };

/** The seven checks of spec §6, in order, against the SIGNED-IN account (N5)
 *  and the training being bought. The floor (check 7) cannot fail — it is
 *  enforced by `priceWithCoupon` — so it never refuses. */
export async function validateCoupon(
  input: { code: string; userEmail: string; programmeId: string; now?: Date },
  db: Db = getPrisma(),
): Promise<CouponValidation> {
  const now = input.now ?? new Date();
  const code = normaliseCouponCode(input.code);
  if (!code) return { ok: false, reason: "coupon_not_found" };
  const row = await db.coupon.findUnique({ where: { code }, select });
  if (!row) return { ok: false, reason: "coupon_not_found" };
  const coupon = toRecord(row);
  if (coupon.status === "disabled") return { ok: false, reason: "coupon_disabled" };
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "coupon_expired" };
  if (coupon.redeemedAt) return { ok: false, reason: "coupon_used" };
  if (coupon.email !== input.userEmail.trim().toLowerCase()) return { ok: false, reason: "coupon_email_mismatch" };
  if (coupon.programmeId !== input.programmeId) return { ok: false, reason: "coupon_wrong_training" };
  // N3: a live pending order already carries this coupon — one at a time.
  const pending = await db.order.findFirst({
    where: { couponId: coupon.id, status: "pending", expiresAt: { gt: now } },
    select: { id: true },
  });
  if (pending) return { ok: false, reason: "coupon_payment_in_progress" };
  return { ok: true, coupon };
}

/* -------------------------------------------------------------- redemption */

/** Called by the webhook inside the paid-order transaction (N3): the coupon
 *  becomes Used the moment Stripe confirms the payment. Idempotent — a
 *  webhook retry finds `redeemedAt` set and writes nothing. */
export async function redeemCoupon(tx: Tx, input: { couponId: string; orderId: string; userId: string; now: Date; reason: string }): Promise<boolean> {
  const existing = await tx.coupon.findUnique({ where: { id: input.couponId }, select: { id: true, redeemedAt: true } });
  if (!existing || existing.redeemedAt) return false;
  await tx.coupon.update({
    where: { id: input.couponId },
    data: { redeemedAt: input.now, redeemedByUserId: input.userId, redeemedOrderId: input.orderId },
  });
  await writeAudit(tx, {
    actorUserId: null,
    action: "coupon.redeemed",
    entityType: "coupon",
    entityId: input.couponId,
    before: null,
    after: { orderId: input.orderId, userId: input.userId, redeemedAt: input.now.toISOString() },
    reason: input.reason,
  });
  return true;
}

/* ------------------------------------------------------------------- admin */

export type CouponListRow = CouponRecord & {
  /** The paid amount of the redeemed order, when redeemed. */
  paidAmountMinor: number | null;
  paidCurrency: string | null;
  amountBeforeCouponMinor: number | null;
};

export async function listCoupons(db: Db = getPrisma()): Promise<CouponListRow[]> {
  const rows = await db.coupon.findMany({
    select: { ...select, redeemedOrder: { select: { amountMinor: true, currency: true, amountBeforeCouponMinor: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    ...toRecord(r),
    paidAmountMinor: r.redeemedOrder ? Number(r.redeemedOrder.amountMinor) : null,
    paidCurrency: r.redeemedOrder?.currency ?? null,
    amountBeforeCouponMinor: r.redeemedOrder?.amountBeforeCouponMinor === null || r.redeemedOrder?.amountBeforeCouponMinor === undefined ? null : Number(r.redeemedOrder.amountBeforeCouponMinor),
  }));
}

export async function getCoupon(id: string, db: Db = getPrisma()): Promise<CouponRecord | null> {
  const row = await db.coupon.findUnique({ where: { id }, select });
  return row ? toRecord(row) : null;
}

export class CouponAdminError extends Error {
  constructor(
    readonly reason: "invalid_email" | "invalid_percent" | "invalid_expiry" | "programme_not_found" | "not_found" | "already_redeemed" | "code_exhausted",
    message: string,
  ) {
    super(message);
    this.name = "CouponAdminError";
  }
}

function validateFields(input: { email: string; discountPercent: number; expiresAt: Date | null }): { email: string } {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CouponAdminError("invalid_email", "Enter the entitled person's email address.");
  if (!Number.isInteger(input.discountPercent) || input.discountPercent < 1 || input.discountPercent > 100) {
    throw new CouponAdminError("invalid_percent", "The discount must be a whole number from 1 to 100.");
  }
  if (input.expiresAt && Number.isNaN(input.expiresAt.getTime())) throw new CouponAdminError("invalid_expiry", "The expiry date is not a valid date.");
  return { email };
}

export async function createCoupon(
  tx: Tx,
  input: { email: string; programmeId: string; discountPercent: number; expiresAt: Date | null; actorUserId: string },
): Promise<CouponRecord> {
  const { email } = validateFields(input);
  const programme = await tx.programme.findUnique({ where: { id: input.programmeId }, select: { id: true } });
  if (!programme) throw new CouponAdminError("programme_not_found", "Choose the training this coupon applies to.");
  // Uniqueness is guaranteed by the @unique constraint; collisions in a
  // ~billion-code space are retried a few times, then reported honestly.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCouponCode();
    const clash = await tx.coupon.findUnique({ where: { code }, select: { id: true } });
    if (clash) continue;
    const row = await tx.coupon.create({
      data: { code, email, programmeId: input.programmeId, discountPercent: input.discountPercent, expiresAt: input.expiresAt, createdByUserId: input.actorUserId },
      select,
    });
    await writeAudit(tx, {
      actorUserId: input.actorUserId,
      action: "coupon.created",
      entityType: "coupon",
      entityId: row.id,
      before: null,
      after: { code, email, programmeId: input.programmeId, discountPercent: input.discountPercent, expiresAt: input.expiresAt?.toISOString() ?? null },
    });
    return toRecord(row);
  }
  throw new CouponAdminError("code_exhausted", "A unique code could not be generated. Please try again.");
}

/** Edit before redemption only (spec §12): email, training, percent, expiry. */
export async function updateCoupon(
  tx: Tx,
  input: { id: string; email: string; programmeId: string; discountPercent: number; expiresAt: Date | null; actorUserId: string },
): Promise<CouponRecord> {
  const existing = await tx.coupon.findUnique({ where: { id: input.id }, select });
  if (!existing) throw new CouponAdminError("not_found", "This coupon no longer exists.");
  if (existing.redeemedAt) throw new CouponAdminError("already_redeemed", "A redeemed coupon is a record and cannot be edited.");
  const { email } = validateFields(input);
  const programme = await tx.programme.findUnique({ where: { id: input.programmeId }, select: { id: true } });
  if (!programme) throw new CouponAdminError("programme_not_found", "Choose the training this coupon applies to.");
  const row = await tx.coupon.update({
    where: { id: input.id },
    data: { email, programmeId: input.programmeId, discountPercent: input.discountPercent, expiresAt: input.expiresAt },
    select,
  });
  await writeAudit(tx, {
    actorUserId: input.actorUserId,
    action: "coupon.updated",
    entityType: "coupon",
    entityId: input.id,
    before: { email: existing.email, programmeId: existing.programmeId, discountPercent: existing.discountPercent, expiresAt: existing.expiresAt?.toISOString() ?? null },
    after: { email, programmeId: input.programmeId, discountPercent: input.discountPercent, expiresAt: input.expiresAt?.toISOString() ?? null },
  });
  return toRecord(row);
}

export async function setCouponStatus(tx: Tx, input: { id: string; status: "active" | "disabled"; actorUserId: string }): Promise<CouponRecord> {
  const existing = await tx.coupon.findUnique({ where: { id: input.id }, select });
  if (!existing) throw new CouponAdminError("not_found", "This coupon no longer exists.");
  if (existing.redeemedAt) throw new CouponAdminError("already_redeemed", "A redeemed coupon is a record; its status no longer changes anything.");
  if (existing.status === input.status) return toRecord(existing);
  const row = await tx.coupon.update({ where: { id: input.id }, data: { status: input.status }, select });
  await writeAudit(tx, {
    actorUserId: input.actorUserId,
    action: "coupon.status_changed",
    entityType: "coupon",
    entityId: input.id,
    before: { status: existing.status },
    after: { status: input.status },
  });
  return toRecord(row);
}

/** Delete a coupon that was NEVER redeemed (spec §12: used coupons are audit
 *  records and are never deleted). Pending orders that referenced it keep
 *  their prices; the reference is cleared first so Restrict cannot block. */
export async function deleteCoupon(tx: Tx, input: { id: string; actorUserId: string }): Promise<void> {
  const existing = await tx.coupon.findUnique({ where: { id: input.id }, select });
  if (!existing) throw new CouponAdminError("not_found", "This coupon no longer exists.");
  if (existing.redeemedAt) throw new CouponAdminError("already_redeemed", "A redeemed coupon is an audit record and cannot be deleted — disable it instead.");
  await tx.order.updateMany({ where: { couponId: input.id }, data: { couponId: null } });
  await tx.coupon.delete({ where: { id: input.id } });
  await writeAudit(tx, {
    actorUserId: input.actorUserId,
    action: "coupon.deleted",
    entityType: "coupon",
    entityId: input.id,
    before: { code: existing.code, email: existing.email, programmeId: existing.programmeId, discountPercent: existing.discountPercent },
    after: null,
  });
}
