import { getPrisma, withTransaction } from "@/db/prisma";
import {
  findOfferingById,
  listUpcomingPublicOfferings,
  MODALITY_LABEL,
  type OfferingRecord,
} from "@/modules/catalogue/offerings/repository";
import type { PriceRegion } from "@/modules/catalogue/programmes/types";
import { sendEmail } from "@/modules/notifications/email";
import { writeAudit } from "@/modules/platform/audit/repository";
import { formatDateRange } from "@/shared/util/dates";
import { lockOfferingForSeat, startsInFuture } from "./capacity";
import { appBaseUrl } from "./checkout.service";
import { registrationCancelledMessage, registrationTransferredMessage, type OfferingLine } from "./emails";
import { CommerceError } from "./errors";
import { recomputePaymentStatus } from "./payments";
import { refundAmountMinor, refundPercentFor, type RefundPercent } from "./refund-policy";
import { stripeGateway, type PaymentGateway } from "./stripe";

/*
 * A person's registrations and orders (M4 plan §2 items 5 and 6): the read
 * models for /account/programmes and /account/orders, participant
 * cancellation with the refund tier ENFORCED by `refundPercentFor`, and the
 * one free transfer. Every write carries its audit row in the same
 * transaction; every email goes through the outbox after the commit.
 */

export type RegistrationStatus = "confirmed" | "cancelled" | "transferred";
export type OrderStatus = "pending" | "paid" | "expired" | "failed" | "cancelled" | "refunded" | "partially_refunded";
export type RefundStatus = "pending" | "succeeded" | "failed";

export type RefundView = { id: string; amountMinor: number; percent: number; status: RefundStatus; createdAt: Date };

export type RegistrationView = {
  id: string;
  status: RegistrationStatus;
  transferUsed: boolean;
  cancelledAt: Date | null;
  cancellationRefundPercent: number | null;
  createdAt: Date;
  offering: OfferingRecord;
  order: { id: string; status: OrderStatus; amountMinor: number; currency: string; region: PriceRegion; paidAt: Date | null };
  payment: { id: string; receiptUrl: string | null; status: string; providerFeeMinor: number | null } | null;
  refunds: RefundView[];
};

export type OrderKind = "registration" | "certificate_renewal";

export type OrderView = {
  id: string;
  status: OrderStatus;
  /** M6: what the order buys — a seat, or 12 more months on a certificate. */
  kind: OrderKind;
  /** The printed certificate ID for a renewal order; null otherwise. */
  certificateCode: string | null;
  createdAt: Date;
  paidAt: Date | null;
  expiresAt: Date;
  amountMinor: number;
  currency: string;
  region: PriceRegion;
  programmeTitle: string;
  formatName: string;
  startsOn: Date;
  endsOn: Date;
  receiptUrl: string | null;
  registrationId: string | null;
};

const registrationInclude = {
  order: { include: { payment: { include: { refunds: { orderBy: { createdAt: "asc" as const } } } } } },
} as const;

type RegistrationRow = NonNullable<Awaited<ReturnType<typeof loadRegistration>>>;

function loadRegistration(id: string) {
  return getPrisma().registration.findUnique({ where: { id }, include: registrationInclude });
}

async function toView(row: RegistrationRow): Promise<RegistrationView> {
  const offering = await findOfferingById(row.offeringId);
  if (!offering) throw new Error(`offering ${row.offeringId} missing for registration ${row.id}`);
  const payment = row.order.payment;
  return {
    id: row.id,
    status: row.status,
    transferUsed: row.transferUsed,
    cancelledAt: row.cancelledAt,
    cancellationRefundPercent: row.cancellationRefundPercent,
    createdAt: row.createdAt,
    offering,
    order: {
      id: row.order.id,
      status: row.order.status,
      amountMinor: Number(row.order.amountMinor),
      currency: row.order.currency,
      region: row.order.region,
      paidAt: row.order.paidAt,
    },
    payment: payment
      ? { id: payment.id, receiptUrl: payment.receiptUrl, status: payment.status, providerFeeMinor: payment.providerFeeMinor == null ? null : Number(payment.providerFeeMinor) }
      : null,
    refunds: (payment?.refunds ?? []).map((r) => ({
      id: r.id,
      amountMinor: Number(r.amountMinor),
      percent: r.percent,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}

export async function listRegistrationsForUser(userId: string): Promise<RegistrationView[]> {
  const rows = await getPrisma().registration.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: registrationInclude,
  });
  return Promise.all(rows.map(toView));
}

/** The most recent confirmed registration — the dashboard's one line. */
export async function latestConfirmedRegistration(userId: string): Promise<RegistrationView | null> {
  const row = await getPrisma().registration.findFirst({
    where: { userId, status: "confirmed" },
    orderBy: { createdAt: "desc" },
    include: registrationInclude,
  });
  return row ? toView(row) : null;
}

export async function listOrdersForUser(userId: string): Promise<OrderView[]> {
  const rows = await getPrisma().order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      payment: { select: { receiptUrl: true } },
      registration: { select: { id: true } },
      certificate: { select: { certificateId: true } },
      offering: { include: { programme: { select: { title: true } }, deliveryFormat: { select: { name: true } } } },
    },
  });
  return rows.map((o) => ({
    id: o.id,
    status: o.status,
    kind: o.kind,
    certificateCode: o.certificate?.certificateId ?? null,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    expiresAt: o.expiresAt,
    amountMinor: Number(o.amountMinor),
    currency: o.currency,
    region: o.region,
    programmeTitle: o.offering.programme.title,
    formatName: o.offering.deliveryFormat?.name ?? MODALITY_LABEL[o.offering.modality],
    startsOn: o.offering.startsOn,
    endsOn: o.offering.endsOn,
    receiptUrl: o.payment?.receiptUrl ?? null,
    registrationId: o.registration?.id ?? null,
  }));
}

/** One order, only if it belongs to the person — the confirmation page's
 *  source of truth (never the redirect). */
export async function findOrderForUser(orderId: string, userId: string): Promise<OrderView | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const all = await listOrdersForUser(userId);
  return all.find((o) => o.id === orderId) ?? null;
}

/** Other OPEN, future public dates of the same programme — what a transfer
 *  can go to. Capacity is checked when the transfer is made. */
export async function listTransferTargets(registration: RegistrationView, now = new Date()): Promise<OfferingRecord[]> {
  if (registration.status !== "confirmed" || registration.transferUsed) return [];
  const all = await listUpcomingPublicOfferings(registration.offering.programmeId);
  return all.filter((o) => o.status === "open" && o.id !== registration.offering.id && startsInFuture(o, now));
}

function offeringLine(o: OfferingRecord): OfferingLine {
  return { programmeTitle: o.programmeTitle, formatName: o.format?.name ?? MODALITY_LABEL[o.modality], dates: formatDateRange(o.startsOn, o.endsOn) };
}

/* ----------------------------------------------------------- cancellation */

export type CancelRegistrationInput = { registrationId: string; userId: string; gateway?: PaymentGateway; now?: Date };

export type CancelRegistrationResult = {
  registrationId: string;
  refundPercent: RefundPercent;
  refundAmountMinor: number;
  currency: string;
  refundStatus: "none" | "pending" | "succeeded" | "failed";
  refundId: string | null;
};

/**
 * Participant cancellation (plan §3 D2, §6 commitment 4). The tier is
 * computed from days-before-start at the moment of cancellation; the
 * registration is cancelled and audited in one transaction with the pending
 * `refunds` row; then Stripe is asked for the refund. If Stripe refuses, the
 * refund row is marked `failed` and a `refund_failed` error is thrown — the
 * registration STAYS cancelled (the person asked for that) and the screen
 * says the refund needs manual attention.
 */
export async function cancelRegistration(input: CancelRegistrationInput): Promise<CancelRegistrationResult> {
  const now = input.now ?? new Date();
  const row = await loadRegistration(input.registrationId);
  if (!row || row.userId !== input.userId) throw new CommerceError("registration_not_found", `Registration ${input.registrationId} not found for user.`);
  if (row.status !== "confirmed") throw new CommerceError("registration_not_active", `Registration ${row.id} is ${row.status}.`);
  const offering = await findOfferingById(row.offeringId);
  if (!offering) throw new Error(`offering ${row.offeringId} missing`);
  const user = await getPrisma().user.findUnique({ where: { id: row.userId }, select: { email: true, name: true } });
  if (!user) throw new Error(`user ${row.userId} missing`);

  const percent = refundPercentFor(offering.startsOn, now);
  const payment = row.order.payment;
  // Net of the provider's fee (founder, 2026-09-22). Recorded by the webhook
  // when the payment settled; fetched now if it was not, and treated as zero
  // (absorbed) if the provider still cannot report it.
  let feeMinor = payment?.providerFeeMinor == null ? null : Number(payment.providerFeeMinor);
  if (payment && percent > 0 && feeMinor === null) {
    try {
      const fee = await (input.gateway ?? stripeGateway()).retrieveProcessingFee(payment.providerPaymentIntentId);
      if (fee && fee.currency.toUpperCase() === payment.currency.toUpperCase()) {
        feeMinor = fee.feeMinor;
        await getPrisma().payment.update({ where: { id: payment.id }, data: { providerFeeMinor: BigInt(feeMinor) } });
      }
    } catch (err) {
      console.warn(`[commerce] processing fee unavailable for payment ${payment.id}; refunding gross`, err instanceof Error ? err.message : err);
    }
  }
  const amount = payment && percent > 0 ? refundAmountMinor(Number(payment.amountMinor), percent, feeMinor ?? 0) : 0;
  const currency = payment?.currency ?? row.order.currency;

  const refund = await withTransaction(async (tx) => {
    await tx.registration.update({
      where: { id: row.id },
      data: { status: "cancelled", cancelledAt: now, cancellationRefundPercent: percent },
    });
    await writeAudit(tx, {
      actorUserId: input.userId,
      action: "registration.cancelled",
      entityType: "registration",
      entityId: row.id,
      before: { status: "confirmed" },
      after: { status: "cancelled", cancelledAt: now.toISOString(), cancellationRefundPercent: percent, refundAmountMinor: amount, processingFeeMinor: feeMinor },
    });
    if (!(payment && amount > 0)) return null;
    const created = await tx.refund.create({
      data: {
        paymentId: payment.id,
        amountMinor: BigInt(amount),
        percent,
        reason: "participant_cancellation",
        status: "pending",
        requestedByUserId: input.userId,
      },
    });
    await writeAudit(tx, {
      actorUserId: input.userId,
      action: "refund.created",
      entityType: "refund",
      entityId: created.id,
      after: { paymentId: payment.id, amountMinor: amount, percent, reason: "participant_cancellation", status: "pending" },
    });
    return created;
  });

  let refundStatus: CancelRegistrationResult["refundStatus"] = refund ? "pending" : "none";
  let gatewayError: unknown = null;
  if (refund && payment) {
    const gateway = input.gateway ?? stripeGateway();
    try {
      const result = await gateway.createRefund({
        paymentIntentId: payment.providerPaymentIntentId,
        amountMinor: amount,
        metadata: { refundId: refund.id, orderId: row.order.id, registrationId: row.id },
      });
      await withTransaction(async (tx) => {
        await tx.refund.update({ where: { id: refund.id }, data: { providerRefundId: result.id, status: result.status } });
        await writeAudit(tx, {
          actorUserId: null,
          action: "refund.updated",
          entityType: "refund",
          entityId: refund.id,
          before: { status: "pending", providerRefundId: null },
          after: { status: result.status, providerRefundId: result.id },
        });
        if (result.status === "succeeded") await recomputePaymentStatus(tx, payment.id);
      });
      refundStatus = result.status;
    } catch (err) {
      gatewayError = err;
      const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error(`[commerce] Stripe refund failed for refund ${refund.id} (registration ${row.id})`, err);
      await withTransaction(async (tx) => {
        await tx.refund.update({ where: { id: refund.id }, data: { status: "failed" } });
        await writeAudit(tx, {
          actorUserId: null,
          action: "refund.updated",
          entityType: "refund",
          entityId: refund.id,
          before: { status: "pending" },
          after: { status: "failed" },
          reason: message.slice(0, 500),
        });
      });
      refundStatus = "failed";
    }
  }

  await sendEmail(
    registrationCancelledMessage({
      to: user.email,
      name: user.name,
      offering: offeringLine(offering),
      refundPercent: percent,
      refundAmountMinor: amount,
      currency,
      refundStatus,
    }),
  );

  if (gatewayError) {
    throw new CommerceError(
      "refund_failed",
      `Registration ${row.id} is cancelled but the refund of ${amount} ${currency} could not be issued: ${gatewayError instanceof Error ? gatewayError.message : String(gatewayError)}`,
    );
  }
  return { registrationId: row.id, refundPercent: percent, refundAmountMinor: amount, currency, refundStatus, refundId: refund?.id ?? null };
}

/* --------------------------------------------------------------- transfer */

export type TransferRegistrationInput = { registrationId: string; targetOfferingId: string; userId: string; now?: Date };
export type TransferRegistrationResult = { registrationId: string; from: OfferingRecord; to: OfferingRecord };

/**
 * The one free transfer (plan §3 D2): once, before the current date starts,
 * to another OPEN date of the SAME programme with a seat (same lock and count
 * as checkout).
 *
 * IMPLEMENTATION NOTE — `registrations.order_id` is UNIQUE, so a second
 * registration row cannot point at the same order; the transfer therefore
 * moves THIS row to the new offering (`offering_id` updated, `transfer_used`
 * set) and the audit row keeps the before/after offering. The
 * `transferred` status and `transferred_to_registration_id` column stay
 * unused until the data model allows a chain (a Rule 1 decision).
 */
export async function transferRegistration(input: TransferRegistrationInput): Promise<TransferRegistrationResult> {
  const now = input.now ?? new Date();
  const row = await loadRegistration(input.registrationId);
  if (!row || row.userId !== input.userId) throw new CommerceError("registration_not_found", `Registration ${input.registrationId} not found for user.`);
  if (row.status !== "confirmed") throw new CommerceError("registration_not_active", `Registration ${row.id} is ${row.status}.`);
  if (row.transferUsed) throw new CommerceError("transfer_used", `Registration ${row.id} has already used its free transfer.`);
  if (input.targetOfferingId === row.offeringId) throw new CommerceError("transfer_same_offering", "Target is the current date.");
  const from = await findOfferingById(row.offeringId);
  if (!from) throw new Error(`offering ${row.offeringId} missing`);
  if (!startsInFuture(from, now)) throw new CommerceError("offering_started", `Offering ${from.id} has already started; no transfer.`);
  const user = await getPrisma().user.findUnique({ where: { id: row.userId }, select: { email: true, name: true } });
  if (!user) throw new Error(`user ${row.userId} missing`);

  const to = await withTransaction(async (tx) => {
    const { offering: target } = await lockOfferingForSeat(tx, input.targetOfferingId, now);
    if (target.programmeId !== from.programmeId) {
      throw new CommerceError("transfer_wrong_programme", `Offering ${target.id} belongs to another programme.`);
    }
    await tx.registration.update({ where: { id: row.id }, data: { offeringId: target.id, transferUsed: true } });
    await writeAudit(tx, {
      actorUserId: input.userId,
      action: "registration.transferred",
      entityType: "registration",
      entityId: row.id,
      before: { offeringId: from.id, transferUsed: false },
      after: { offeringId: target.id, transferUsed: true },
    });
    return target;
  });

  await sendEmail(
    registrationTransferredMessage({
      to: user.email,
      name: user.name,
      from: offeringLine(from),
      to_: offeringLine(to),
      accountUrl: `${appBaseUrl()}/account/programmes`,
    }),
  );
  return { registrationId: row.id, from, to };
}
