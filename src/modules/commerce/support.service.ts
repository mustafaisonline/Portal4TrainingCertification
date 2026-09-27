import type { Db } from "@/db/prisma";
import { getPrisma, withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import type { PriceRegion } from "@/modules/catalogue/programmes/types";
import { findUserById } from "@/modules/identity/users.repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { ORDER_HOLD_MINUTES } from "./capacity";
import { appBaseUrl } from "./checkout.service";
import { CommerceError, PaymentsNotConfiguredError } from "./errors";
import { paymentsConfigured, stripeGateway, type PaymentGateway } from "./stripe";
import { enabledSupportSetting } from "./support.repository";

/*
 * "Support the Academy" (founder decisions M1–M5, 2026-09-27) — the smallest
 * possible payment through the real path: ONE transaction creates a pending
 * `support` order with the amount read from the setting in force (never
 * from the browser) and its audit row; then Stripe is asked for a hosted
 * Checkout Session. Nothing is granted when it is paid — the webhook marks
 * the order paid, records the payment and sends a thank-you (commerce/
 * webhook.service.ts). It bypasses the profile gate deliberately (M4): a
 * person signs in and pays, nothing else. No refund tier applies (M4).
 *
 * Why it exists: to prove card payments end to end — in development against
 * Stripe's test mode, and at go-live as the real check (M11 K16) — without
 * registering for a training. Switched off from Admin → Orders → Support
 * payment (M5).
 */

export type StartSupportInput = { userId: string; gateway?: PaymentGateway; now?: Date };
export type StartSupportResult = { orderId: string; url: string };

/** The `region` column is NOT NULL; a support order records the region
 *  whose published prices use its currency — informational only. */
function regionForCurrency(currency: string): PriceRegion {
  switch (currency) {
    case "MYR":
      return "malaysia";
    case "PKR":
      return "pakistan";
    default:
      return "international";
  }
}

export async function startSupportCheckout(input: StartSupportInput): Promise<StartSupportResult> {
  if (!input.gateway && !paymentsConfigured()) throw new PaymentsNotConfiguredError("STRIPE_SECRET_KEY");
  const gateway = input.gateway ?? stripeGateway();
  const baseUrl = appBaseUrl();
  const now = input.now ?? new Date();

  const user = await findUserById(input.userId);
  if (!user) throw new Error(`user ${input.userId} not found`);

  const { order, label } = await withTransaction(async (tx) => {
    const setting = await enabledSupportSetting(now, tx);
    if (!setting) throw new CommerceError("support_unavailable", "The support payment is switched off.");
    const pending = await tx.order.findFirst({ where: { userId: user.id, kind: "support", status: "pending", expiresAt: { gt: now } }, select: { id: true } });
    if (pending) throw new CommerceError("support_order_pending", `User ${user.id} already has pending support order ${pending.id}.`);
    const expiresAt = new Date(now.getTime() + ORDER_HOLD_MINUTES * 60_000);
    const order = await tx.order.create({
      data: {
        userId: user.id,
        offeringId: null,
        programmeId: null,
        kind: "support",
        status: "pending",
        region: regionForCurrency(setting.currency),
        currency: setting.currency,
        amountMinor: BigInt(setting.amountMinor),
        expiresAt,
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "order.created",
      entityType: "order",
      entityId: order.id,
      after: { kind: "support", amountMinor: setting.amountMinor, currency: setting.currency, settingId: setting.id, label: setting.label, expiresAt: expiresAt.toISOString() },
    });
    return { order, label: setting.label };
  });

  // Outside the database transaction: a network call must not hold row locks.
  const prisma = getPrisma();
  try {
    const session = await gateway.createCheckoutSession({
      orderId: order.id,
      amountMinor: Number(order.amountMinor),
      currency: order.currency,
      productName: label,
      customerEmail: user.email,
      expiresAt: order.expiresAt,
      successUrl: `${baseUrl}/support?order=${order.id}`,
      cancelUrl: `${baseUrl}/support?cancelled=1`,
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
    return { orderId: order.id, url: session.url };
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } });
    console.error(`[commerce] Stripe Checkout Session creation failed for support order ${order.id}`, err);
    throw err;
  }
}

export type SupportOrderView = {
  id: string;
  status: "pending" | "paid" | "expired" | "failed" | "cancelled" | "refunded" | "partially_refunded";
  effectiveStatus: "pending" | "paid" | "expired" | "failed" | "cancelled" | "refunded" | "partially_refunded";
  amountMinor: number;
  currency: string;
  createdAt: Date;
  paidAt: Date | null;
  expiresAt: Date;
  receiptUrl: string | null;
};

/** The `?order=` return banner's source of truth — the row, never the
 *  redirect. Only the person's own support orders. */
export async function findSupportOrderForUser(orderId: string, userId: string, now = new Date(), db: Db = getPrisma()): Promise<SupportOrderView | null> {
  if (!isUuid(orderId)) return null;
  const o = await db.order.findUnique({ where: { id: orderId }, include: { payment: { select: { receiptUrl: true } } } });
  if (!o || o.userId !== userId || o.kind !== "support") return null;
  return {
    id: o.id,
    status: o.status,
    effectiveStatus: o.status === "pending" && o.expiresAt.getTime() <= now.getTime() ? "expired" : o.status,
    amountMinor: Number(o.amountMinor),
    currency: o.currency,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    expiresAt: o.expiresAt,
    receiptUrl: o.payment?.receiptUrl ?? null,
  };
}
