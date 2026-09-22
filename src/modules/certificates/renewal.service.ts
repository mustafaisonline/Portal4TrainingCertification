import type { Db, Tx } from "@/db/prisma";
import { getPrisma, withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { ORDER_HOLD_MINUTES } from "@/modules/commerce/capacity";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { PaymentsNotConfiguredError } from "@/modules/commerce/errors";
import { paymentsConfigured, stripeGateway, type PaymentGateway } from "@/modules/commerce/stripe";
import { findUserById } from "@/modules/identity/users.repository";
import type { EmailMessage } from "@/modules/notifications/email";
import { writeAudit } from "@/modules/platform/audit/repository";
import { VALIDITY_MONTHS, type CertificateStatus } from "./constants";
import { dateColumnToIso, isoToDateColumn, todayIso } from "./dates";
import { certificateRenewedMessage } from "./emails";
import { feeSettingInForceAt } from "./fee.repository";
import { CertificateNotFoundError, CertificateStateError, toRecord, type CertificateRecord } from "./repository";
import { canRenew, renewedExpiry, statusOf } from "./rules";

/*
 * Renewal (M6 plan §3 E4/E5/E7, §5 "Renewal"). Modelled on commerce's
 * checkout: ONE transaction creates the pending order under a lock on the
 * certificate row, with the amount read from the fee setting in force
 * (never from the browser) and its audit row; then Stripe is asked for a
 * hosted Checkout Session. Nothing changes on the certificate until the
 * webhook confirms payment (`applyPaidRenewal`, called by
 * commerce/webhook.service.ts inside its own locked transaction).
 *
 * The order keeps the certificate's offering and programme (E14), and its
 * `region` is `international` — the region whose published prices are in
 * USD, the currency every holder pays for renewal (E4, E13). No refund or
 * cancellation path exists for a renewal (E7): the extension is instant.
 */

export type RenewalRefusal = "revoked" | "window_closed" | "order_pending" | "fee_unavailable";

export type RenewalPreview = {
  certificate: CertificateRecord;
  status: CertificateStatus;
  days: number;
  allowed: boolean;
  reason: RenewalRefusal | null;
  /** The unexpired pending renewal order blocking a second one, if any. */
  pendingOrderId: string | null;
  /** From the fee setting in force now; null only when none is seeded. */
  amountMinor: number | null;
  currency: string | null;
  feeSettingId: string | null;
  /** What paying today would produce (E5 arithmetic). */
  newExpiresOn: string;
  validityMonths: number;
};

/** What the holder page shows beside "Renew" — read-only and unlocked; the
 *  authoritative checks run again inside `startRenewalCheckout`. Null when
 *  the certificate is not this person's (never leaks another's row). */
export async function previewRenewal(id: string, userId: string, now = new Date(), db: Db = getPrisma()): Promise<RenewalPreview | null> {
  if (!isUuid(id)) return null;
  const row = await db.certificate.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  const certificate = toRecord(row);
  const today = todayIso(now);
  const { status, days } = statusOf(certificate, today);
  const pending = await db.order.findFirst({
    where: { certificateId: id, kind: "certificate_renewal", status: "pending", expiresAt: { gt: now } },
    select: { id: true },
  });
  const fee = await feeSettingInForceAt(now, db);
  const reason: RenewalRefusal | null =
    status === "revoked" ? "revoked" : !canRenew(certificate, today) ? "window_closed" : pending ? "order_pending" : !fee ? "fee_unavailable" : null;
  return {
    certificate,
    status,
    days,
    allowed: reason === null,
    reason,
    pendingOrderId: pending?.id ?? null,
    amountMinor: fee?.amountMinor ?? null,
    currency: fee?.currency ?? null,
    feeSettingId: fee?.id ?? null,
    newExpiresOn: renewedExpiry(certificate.expiresOn, today),
    validityMonths: VALIDITY_MONTHS,
  };
}

/* ---------------------------------------------------------------- checkout */

export type StartRenewalInput = {
  /** Certificate row uuid (not the printed ID). */
  certificateId: string;
  userId: string;
  gateway?: PaymentGateway;
  now?: Date;
};

export type StartRenewalResult = { orderId: string; url: string };

async function lockCertificate(tx: Tx, id: string) {
  if (!isUuid(id)) return null;
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM certificates WHERE id = ${id}::uuid FOR UPDATE`;
  if (locked.length === 0) return null;
  return tx.certificate.findUnique({ where: { id } });
}

export async function startRenewalCheckout(input: StartRenewalInput): Promise<StartRenewalResult> {
  // Fail before creating an order when there is nothing to hand the person to.
  if (!input.gateway && !paymentsConfigured()) throw new PaymentsNotConfiguredError("STRIPE_SECRET_KEY");
  const gateway = input.gateway ?? stripeGateway();
  const baseUrl = appBaseUrl();
  const now = input.now ?? new Date();
  const today = todayIso(now);

  const user = await findUserById(input.userId);
  if (!user) throw new Error(`user ${input.userId} not found`);

  const { order, certificate } = await withTransaction(async (tx) => {
    const row = await lockCertificate(tx, input.certificateId);
    if (!row || row.userId !== user.id) throw new CertificateNotFoundError(input.certificateId);
    const certificate = toRecord(row);
    const { status } = statusOf(certificate, today);
    if (status === "revoked") throw new CertificateStateError("revoked", `Certificate ${certificate.certificateId} is revoked and cannot be renewed.`);
    if (!canRenew(certificate, today)) {
      throw new CertificateStateError("window_closed", `Certificate ${certificate.certificateId} expires on ${certificate.expiresOn}; renewal opens 30 days before.`);
    }
    const pending = await tx.order.findFirst({
      where: { certificateId: row.id, kind: "certificate_renewal", status: "pending", expiresAt: { gt: now } },
      select: { id: true },
    });
    if (pending) throw new CertificateStateError("order_pending", `Certificate ${certificate.certificateId} already has pending renewal order ${pending.id}.`);
    const fee = await feeSettingInForceAt(now, tx);
    if (!fee) throw new CertificateStateError("fee_unavailable", "No renewal fee setting is in force.");

    const expiresAt = new Date(now.getTime() + ORDER_HOLD_MINUTES * 60_000);
    const order = await tx.order.create({
      data: {
        userId: user.id,
        offeringId: certificate.offeringId,
        programmeId: certificate.programmeId,
        kind: "certificate_renewal",
        certificateId: row.id,
        status: "pending",
        region: "international",
        currency: fee.currency,
        amountMinor: BigInt(fee.amountMinor),
        expiresAt,
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "order.created",
      entityType: "order",
      entityId: order.id,
      after: {
        kind: "certificate_renewal",
        certificateId: row.id,
        certificateCode: certificate.certificateId,
        amountMinor: fee.amountMinor,
        currency: fee.currency,
        feeSettingId: fee.id,
        expiresAt: expiresAt.toISOString(),
      },
    });
    return { order, certificate };
  });

  // Outside the database transaction: a network call must not hold row locks.
  const prisma = getPrisma();
  try {
    const session = await gateway.createCheckoutSession({
      orderId: order.id,
      amountMinor: Number(order.amountMinor),
      currency: order.currency,
      productName: `Certificate renewal ${certificate.certificateId} — ${VALIDITY_MONTHS} months`,
      customerEmail: user.email,
      expiresAt: order.expiresAt,
      successUrl: `${baseUrl}/account/certificate?order=${order.id}`,
      cancelUrl: `${baseUrl}/account/certificate?cancelled=1`,
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
    return { orderId: order.id, url: session.url };
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } });
    console.error(`[certificates] Stripe Checkout Session creation failed for renewal order ${order.id}`, err);
    throw err;
  }
}

/* ----------------------------------------------------------------- webhook */

export type ApplyPaidRenewalInput = {
  order: { id: string; userId: string; certificateId: string | null; createdAt: Date; amountMinor: bigint; currency: string };
  user: { email: string; name: string };
  receiptUrl: string | null;
  /** `stripe:<event id>` — the audit row's reason. */
  reason: string;
  now: Date;
};

export type ApplyPaidRenewalResult = { email: EmailMessage | null; note?: string };

/**
 * The certificate side of a paid renewal, INSIDE the webhook's transaction
 * (the order row is already locked and marked paid there; C3/C4). Computes
 * the new expiry (E5), inserts the insert-only renewal row and moves
 * `expires_on` — once: a renewal row already recorded for this order means a
 * replay, and nothing changes. The amount recorded is the ORDER's amount
 * (server-set from the fee in force when the order was created).
 */
export async function applyPaidRenewal(tx: Tx, input: ApplyPaidRenewalInput): Promise<ApplyPaidRenewalResult> {
  const { order } = input;
  if (!order.certificateId) throw new Error(`renewal order ${order.id} has no certificate_id`);
  const existing = await tx.certificateRenewal.findUnique({ where: { orderId: order.id } });
  if (existing) return { email: null, note: `renewal for order ${order.id} already recorded; no change` };

  const row = await lockCertificate(tx, order.certificateId);
  if (!row) throw new CertificateNotFoundError(order.certificateId);
  const certificate = toRecord(row);
  const fee = await feeSettingInForceAt(order.createdAt, tx);
  if (!fee) throw new Error(`no fee setting in force at ${order.createdAt.toISOString()} for renewal order ${order.id}`);

  const today = todayIso(input.now);
  const previousExpiresOn = certificate.expiresOn;
  const newExpiresOn = renewedExpiry(previousExpiresOn, today);
  const amountMinor = Number(order.amountMinor);

  await tx.certificateRenewal.create({
    data: {
      certificateId: row.id,
      orderId: order.id,
      feeSettingId: fee.id,
      previousExpiresOn: isoToDateColumn(previousExpiresOn),
      newExpiresOn: isoToDateColumn(newExpiresOn),
      amountMinor: order.amountMinor,
      currency: order.currency,
    },
  });
  await tx.certificate.update({ where: { id: row.id }, data: { expiresOn: isoToDateColumn(newExpiresOn) } });
  await writeAudit(tx, {
    actorUserId: null,
    action: "certificate.renewed",
    entityType: "certificate",
    entityId: row.id,
    before: { expiresOn: previousExpiresOn },
    after: { expiresOn: newExpiresOn, orderId: order.id, feeSettingId: fee.id, amountMinor, currency: order.currency },
    reason: input.reason,
  });

  return {
    email: certificateRenewedMessage({
      to: input.user.email,
      name: input.user.name,
      programmeTitle: certificate.programmeTitle,
      certificateId: certificate.certificateId,
      previousExpiresOn,
      newExpiresOn,
      amountMinor,
      currency: order.currency,
      orderId: order.id,
      receiptUrl: input.receiptUrl,
      accountUrl: `${appBaseUrl()}/account/certificate`,
    }),
  };
}

/* -------------------------------------------------------------- return url */

export type RenewalOrderView = {
  id: string;
  /** The stored status; `effectiveStatus` folds an elapsed pending hold into `expired`. */
  status: "pending" | "paid" | "expired" | "failed" | "cancelled" | "refunded" | "partially_refunded";
  effectiveStatus: "pending" | "paid" | "expired" | "failed" | "cancelled" | "refunded" | "partially_refunded";
  amountMinor: number;
  currency: string;
  createdAt: Date;
  paidAt: Date | null;
  expiresAt: Date;
  /** Certificate row uuid and printed ID. */
  certificateId: string;
  certificateCode: string;
  receiptUrl: string | null;
  /** Present once the webhook has applied the renewal. */
  renewal: { previousExpiresOn: string; newExpiresOn: string } | null;
};

/** The `?order=` return banner's source of truth — the database row, never
 *  the redirect. Only the person's own renewal orders. */
export async function findRenewalOrderForUser(orderId: string, userId: string, now = new Date(), db: Db = getPrisma()): Promise<RenewalOrderView | null> {
  if (!isUuid(orderId)) return null;
  const o = await db.order.findUnique({
    where: { id: orderId },
    include: { payment: { select: { receiptUrl: true } }, renewal: true, certificate: { select: { id: true, certificateId: true } } },
  });
  if (!o || o.userId !== userId || o.kind !== "certificate_renewal" || !o.certificate) return null;
  return {
    id: o.id,
    status: o.status,
    effectiveStatus: o.status === "pending" && o.expiresAt.getTime() <= now.getTime() ? "expired" : o.status,
    amountMinor: Number(o.amountMinor),
    currency: o.currency,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    expiresAt: o.expiresAt,
    certificateId: o.certificate.id,
    certificateCode: o.certificate.certificateId,
    receiptUrl: o.payment?.receiptUrl ?? null,
    renewal: o.renewal ? { previousExpiresOn: dateColumnToIso(o.renewal.previousExpiresOn), newExpiresOn: dateColumnToIso(o.renewal.newExpiresOn) } : null,
  };
}
