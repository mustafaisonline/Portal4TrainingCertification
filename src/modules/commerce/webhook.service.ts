import type { JsonInput, Tx } from "@/db/prisma";
import { getPrisma, withTransaction } from "@/db/prisma";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { sendEmail, type EmailMessage } from "@/modules/notifications/email";
import { writeAudit } from "@/modules/platform/audit/repository";
import { formatDateRange } from "@/shared/util/dates";
import { appBaseUrl } from "./checkout.service";
import { registrationConfirmedMessage } from "./emails";
import { recomputePaymentStatus } from "./payments";
import { mapRefundStatus, stripeGateway, type PaymentGateway, type Stripe } from "./stripe";

/*
 * Stripe webhook processing (M4 plan §2 item 4; §6 commitments 1, 2, 5).
 *
 *   1. The signature is verified first. A bad signature throws
 *      `InvalidSignatureError` before anything is stored — the route answers
 *      400 and NOTHING is recorded as processed.
 *   2. The event is INSERTED into `stripe_events` (status `received`) before
 *      it is acted on. The primary key is Stripe's event id, so a replay is a
 *      duplicate: it returns `{ duplicate: true }` and changes nothing. An
 *      event whose earlier attempt `failed` (or is stuck `received` for more
 *      than ten minutes after a crash) is processed again — Stripe retries
 *      exactly so.
 *   3. The event is processed inside ONE transaction, with the order row
 *      locked and its status re-checked, so even two different events for
 *      the same paid order cannot create two registrations.
 *   4. The row is marked `processed` / `ignored`, or `failed` with the error
 *      and the error is rethrown so the route answers 500 and Stripe retries.
 *
 * Emails are queued through the outbox AFTER the transaction commits: a row
 * for a registration that was rolled back must not exist.
 */

export type WebhookOutcome = {
  eventId: string;
  type: string;
  duplicate: boolean;
  status: "processed" | "ignored" | "received" | "failed";
  note?: string;
};

type ProcessResult = { status: "processed" | "ignored"; note?: string; emails: EmailMessage[] };

const STUCK_RECEIVED_MS = 10 * 60 * 1000;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";
}

export async function handleStripeWebhook(rawBody: string, signature: string, gateway: PaymentGateway = stripeGateway()): Promise<WebhookOutcome> {
  const event = gateway.constructEvent(rawBody, signature); // InvalidSignatureError → 400
  const prisma = getPrisma();
  const now = new Date();

  // 2. Store first.
  let fresh = false;
  try {
    await prisma.stripeEvent.create({
      data: { id: event.id, type: event.type, status: "received", payload: JSON.parse(rawBody) as JsonInput },
    });
    fresh = true;
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
  }
  if (!fresh) {
    const existing = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
    const retryable =
      existing !== null &&
      (existing.status === "failed" || (existing.status === "received" && now.getTime() - existing.receivedAt.getTime() > STUCK_RECEIVED_MS));
    if (!retryable) {
      return { eventId: event.id, type: event.type, duplicate: true, status: existing?.status ?? "received" };
    }
    await prisma.stripeEvent.update({ where: { id: event.id }, data: { status: "received", error: null, processedAt: null } });
  }

  // 3. Process.
  try {
    const result = await withTransaction((tx) => processEvent(tx, event, now));
    await prisma.stripeEvent.update({
      where: { id: event.id },
      data: { status: result.status, processedAt: new Date(), error: result.note ?? null },
    });
    for (const message of result.emails) await sendEmail(message);
    // Refunds are net of Stripe's fee (founder, 2026-09-22): record it as soon
    // as a payment is settled. Outside the transaction — a network call must
    // not hold the order lock — and never fatal: a missing fee is retried on
    // the next charge event and, failing that, fetched at cancellation time.
    if (result.status === "processed" && FEE_EVENTS.has(event.type)) {
      await recordProcessingFee(paymentIntentIdOf(event), gateway).catch((err) =>
        console.warn(`[commerce] processing fee not recorded for ${event.id}:`, err instanceof Error ? err.message : err),
      );
    }
    return { eventId: event.id, type: event.type, duplicate: false, status: result.status, note: result.note };
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[commerce] webhook ${event.type} ${event.id} failed`, err);
    await prisma.stripeEvent.update({ where: { id: event.id }, data: { status: "failed", error: message.slice(0, 2000) } });
    throw err;
  }
}

/* ---------------------------------------------------------- processing fee */

const FEE_EVENTS = new Set<string>(["checkout.session.completed", "checkout.session.async_payment_succeeded", "charge.succeeded", "charge.updated"]);

function paymentIntentIdOf(event: Stripe.Event): string | null {
  const object = event.data.object as { object?: string; payment_intent?: string | { id: string } | null };
  return idOf(object.payment_intent);
}

/** Stores the provider's fee on the payment row once, when it is known. */
export async function recordProcessingFee(paymentIntentId: string | null, gateway: PaymentGateway): Promise<number | null> {
  if (!paymentIntentId) return null;
  const prisma = getPrisma();
  const payment = await prisma.payment.findUnique({
    where: { providerPaymentIntentId: paymentIntentId },
    select: { id: true, currency: true, providerFeeMinor: true },
  });
  if (!payment) return null;
  if (payment.providerFeeMinor !== null) return Number(payment.providerFeeMinor);
  const fee = await gateway.retrieveProcessingFee(paymentIntentId);
  if (!fee || fee.currency.toUpperCase() !== payment.currency.toUpperCase()) return null;
  await prisma.payment.update({ where: { id: payment.id }, data: { providerFeeMinor: BigInt(fee.feeMinor) } });
  return fee.feeMinor;
}

/* ------------------------------------------------------------- dispatcher */

async function processEvent(tx: Tx, event: Stripe.Event, now: Date): Promise<ProcessResult> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return sessionPaid(tx, event, event.data.object, now);
    case "checkout.session.expired":
      return sessionExpired(tx, event, event.data.object);
    case "checkout.session.async_payment_failed":
      return sessionPaymentFailed(tx, event.data.object);
    case "charge.succeeded":
    case "charge.updated":
      return chargeReceipt(tx, event.data.object);
    case "charge.refunded":
      return chargeRefunded(tx, event, event.data.object);
    case "refund.created":
    case "refund.updated":
      return refundChanged(tx, event, event.data.object);
    default:
      return { status: "ignored", note: `event type ${event.type} is not handled`, emails: [] };
  }
}

function orderIdOf(session: Stripe.Checkout.Session): string | null {
  return session.client_reference_id ?? session.metadata?.["orderId"] ?? null;
}

function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

const orderInclude = {
  user: { select: { id: true, email: true, name: true } },
  offering: {
    include: {
      programme: { select: { title: true } },
      deliveryFormat: { select: { name: true } },
    },
  },
} as const;

/** Lock the order row and load it. Null when the id is unknown here (an
 *  event from another environment sharing the endpoint, or a test-mode event
 *  after a database reset) — ignored, not failed, so Stripe stops retrying. */
async function lockOrder(tx: Tx, orderId: string) {
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;
  if (locked.length === 0) return null;
  return tx.order.findUnique({ where: { id: orderId }, include: orderInclude });
}

/* ----------------------------------------------------------- paid session */

async function sessionPaid(tx: Tx, event: Stripe.Event, session: Stripe.Checkout.Session, now: Date): Promise<ProcessResult> {
  if (session.payment_status !== "paid") {
    return { status: "ignored", note: `payment_status=${session.payment_status}; awaiting the async payment result`, emails: [] };
  }
  const orderId = orderIdOf(session);
  if (!orderId) return { status: "ignored", note: "session carries no client_reference_id / metadata.orderId", emails: [] };
  const order = await lockOrder(tx, orderId);
  if (!order) return { status: "ignored", note: `order ${orderId} is unknown to this database`, emails: [] };
  if (order.status === "paid" || order.status === "refunded" || order.status === "partially_refunded") {
    return { status: "processed", note: `order ${orderId} was already ${order.status}; no change`, emails: [] };
  }

  const paymentIntentId = idOf(session.payment_intent) ?? session.id;
  const amountMinor = session.amount_total ?? Number(order.amountMinor);
  const currency = (session.currency ?? order.currency).toUpperCase();
  const previousStatus = order.status;

  await tx.order.update({
    where: { id: order.id },
    data: {
      status: "paid",
      paidAt: now,
      stripePaymentIntentId: paymentIntentId,
      stripeCheckoutSessionId: order.stripeCheckoutSessionId ?? session.id,
    },
  });

  // `charge.succeeded` often arrives BEFORE the session event; if its row is
  // already stored, the receipt URL is taken from it rather than lost.
  const earlierCharge = await tx.stripeEvent.findFirst({
    where: { type: { in: ["charge.succeeded", "charge.updated"] }, payload: { path: ["data", "object", "payment_intent"], equals: paymentIntentId } },
    orderBy: { receivedAt: "desc" },
    select: { payload: true },
  });
  const chargeObject = (earlierCharge?.payload as { data?: { object?: { id?: string; receipt_url?: string | null } } } | null)?.data?.object;

  const payment = await tx.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      provider: "stripe",
      providerPaymentIntentId: paymentIntentId,
      providerChargeId: chargeObject?.id ?? null,
      amountMinor: BigInt(amountMinor),
      currency,
      receiptUrl: chargeObject?.receipt_url ?? null,
      status: "succeeded",
    },
    update: {},
  });
  const registration = await tx.registration.upsert({
    where: { orderId: order.id },
    create: { userId: order.userId, offeringId: order.offeringId, orderId: order.id, status: "confirmed" },
    update: {},
  });

  const reason = `stripe:${event.id}`;
  await writeAudit(tx, {
    actorUserId: null,
    action: "payment.succeeded",
    entityType: "order",
    entityId: order.id,
    before: { status: previousStatus },
    after: { status: "paid", paymentId: payment.id, paymentIntentId, amountMinor, currency, checkoutSessionId: session.id },
    reason,
  });
  await writeAudit(tx, {
    actorUserId: null,
    action: "registration.confirmed",
    entityType: "registration",
    entityId: registration.id,
    after: { userId: order.userId, offeringId: order.offeringId, orderId: order.id, status: "confirmed" },
    reason,
  });

  const o = order.offering;
  const email = registrationConfirmedMessage({
    to: order.user.email,
    name: order.user.name,
    offering: {
      programmeTitle: o.programme.title,
      formatName: o.deliveryFormat?.name ?? MODALITY_LABEL[o.modality],
      dates: formatDateRange(o.startsOn, o.endsOn),
    },
    orderId: order.id,
    amountMinor,
    currency,
    accountUrl: `${appBaseUrl()}/account/programmes`,
  });
  return { status: "processed", emails: [email] };
}

/* -------------------------------------------------- expired / failed hold */

async function sessionExpired(tx: Tx, event: Stripe.Event, session: Stripe.Checkout.Session): Promise<ProcessResult> {
  const orderId = orderIdOf(session);
  if (!orderId) return { status: "ignored", note: "session carries no order id", emails: [] };
  const order = await lockOrder(tx, orderId);
  if (!order) return { status: "ignored", note: `order ${orderId} is unknown to this database`, emails: [] };
  if (order.status !== "pending") return { status: "processed", note: `order ${orderId} was already ${order.status}; no change`, emails: [] };
  await tx.order.update({ where: { id: order.id }, data: { status: "expired" } });
  await writeAudit(tx, {
    actorUserId: null,
    action: "order.expired",
    entityType: "order",
    entityId: order.id,
    before: { status: "pending" },
    after: { status: "expired" },
    reason: `stripe:${event.id}`,
  });
  return { status: "processed", emails: [] };
}

async function sessionPaymentFailed(tx: Tx, session: Stripe.Checkout.Session): Promise<ProcessResult> {
  const orderId = orderIdOf(session);
  if (!orderId) return { status: "ignored", note: "session carries no order id", emails: [] };
  const order = await lockOrder(tx, orderId);
  if (!order) return { status: "ignored", note: `order ${orderId} is unknown to this database`, emails: [] };
  if (order.status !== "pending") return { status: "processed", note: `order ${orderId} was already ${order.status}; no change`, emails: [] };
  await tx.order.update({ where: { id: order.id }, data: { status: "failed" } });
  return { status: "processed", note: "async payment failed; hold released", emails: [] };
}

/* ------------------------------------------------------------ receipt url */

async function chargeReceipt(tx: Tx, charge: Stripe.Charge): Promise<ProcessResult> {
  const paymentIntentId = idOf(charge.payment_intent);
  if (!paymentIntentId) return { status: "ignored", note: "charge without payment_intent", emails: [] };
  const payment = await tx.payment.findUnique({ where: { providerPaymentIntentId: paymentIntentId }, select: { id: true, receiptUrl: true, providerChargeId: true } });
  if (!payment) {
    // The session event has not arrived yet; sessionPaid() reads this stored
    // event's payload when it does.
    return { status: "ignored", note: `no payment for ${paymentIntentId} yet; receipt kept in the stored event`, emails: [] };
  }
  if (payment.receiptUrl === charge.receipt_url && payment.providerChargeId === charge.id) {
    return { status: "processed", note: "receipt already recorded", emails: [] };
  }
  await tx.payment.update({ where: { id: payment.id }, data: { receiptUrl: charge.receipt_url ?? payment.receiptUrl, providerChargeId: charge.id } });
  return { status: "processed", emails: [] };
}

/* ---------------------------------------------------------------- refunds */

async function applyRefundStatus(tx: Tx, event: Stripe.Event, providerRefundId: string, stripeStatus: string | null): Promise<"updated" | "unchanged" | "unknown"> {
  const row = await tx.refund.findUnique({ where: { providerRefundId } });
  if (!row) return "unknown";
  const status = mapRefundStatus(stripeStatus);
  if (row.status === status) return "unchanged";
  await tx.refund.update({ where: { id: row.id }, data: { status } });
  await writeAudit(tx, {
    actorUserId: null,
    action: "refund.updated",
    entityType: "refund",
    entityId: row.id,
    before: { status: row.status },
    after: { status },
    reason: `stripe:${event.id}`,
  });
  await recomputePaymentStatus(tx, row.paymentId);
  return "updated";
}

async function refundChanged(tx: Tx, event: Stripe.Event, refund: Stripe.Refund): Promise<ProcessResult> {
  const outcome = await applyRefundStatus(tx, event, refund.id, refund.status);
  if (outcome === "unknown") {
    // A refund not created by this product (e.g. from the Stripe Dashboard —
    // admin-initiated refunds are M8). Recorded as ignored, never invented.
    return { status: "ignored", note: `refund ${refund.id} is not one this product created`, emails: [] };
  }
  return { status: "processed", note: outcome === "unchanged" ? "refund status already recorded" : undefined, emails: [] };
}

async function chargeRefunded(tx: Tx, event: Stripe.Event, charge: Stripe.Charge): Promise<ProcessResult> {
  const paymentIntentId = idOf(charge.payment_intent);
  const payment = paymentIntentId ? await tx.payment.findUnique({ where: { providerPaymentIntentId: paymentIntentId }, select: { id: true } }) : null;
  if (!payment) return { status: "ignored", note: `no payment for charge ${charge.id}`, emails: [] };
  // Refund objects are included only when the API version expands them; when
  // present, each known one is updated. The payment status itself is derived
  // from OUR succeeded refund rows (recomputePaymentStatus).
  const listed = charge.refunds?.data ?? [];
  for (const r of listed) await applyRefundStatus(tx, event, r.id, r.status);
  await recomputePaymentStatus(tx, payment.id);
  return { status: "processed", note: listed.length ? undefined : "charge.refunded without refund objects; statuses come from refund.updated", emails: [] };
}
