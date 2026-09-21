import type { Tx } from "@/db/prisma";

/*
 * Payment / order status derived from OUR refund rows (M4 plan §5). Called
 * whenever a refund reaches a terminal state — by the cancellation service
 * when Stripe answers synchronously, and by the webhook service on
 * `refund.updated` / `charge.refunded` — so both paths agree by construction.
 */

export type DerivedPaymentStatus = "succeeded" | "refunded" | "partially_refunded";

export function derivePaymentStatus(paidAmountMinor: number, refundedAmountMinor: number): DerivedPaymentStatus {
  if (refundedAmountMinor <= 0) return "succeeded";
  return refundedAmountMinor >= paidAmountMinor ? "refunded" : "partially_refunded";
}

/** Recomputes `payments.status` (and mirrors it onto the order when money has
 *  gone back) from the SUCCEEDED refunds of one payment. Idempotent. */
export async function recomputePaymentStatus(tx: Tx, paymentId: string): Promise<DerivedPaymentStatus> {
  const payment = await tx.payment.findUnique({ where: { id: paymentId }, select: { id: true, orderId: true, amountMinor: true, status: true } });
  if (!payment) throw new Error(`payment ${paymentId} not found`);
  const agg = await tx.refund.aggregate({ where: { paymentId, status: "succeeded" }, _sum: { amountMinor: true } });
  const refunded = Number(agg._sum.amountMinor ?? 0n);
  const status = derivePaymentStatus(Number(payment.amountMinor), refunded);
  if (status !== payment.status) {
    await tx.payment.update({ where: { id: paymentId }, data: { status } });
  }
  if (status !== "succeeded") {
    await tx.order.update({ where: { id: payment.orderId }, data: { status } });
  }
  return status;
}
