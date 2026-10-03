import type { Db } from "@/db/prisma";
import { getPrisma, withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { regionForCountry } from "./pricing";
import { getAttemptForUser, type AttemptRecord } from "@/modules/free-learning/knowledge-check.repository";
import { getProfile } from "@/modules/identity/profile.repository";
import { findUserById } from "@/modules/identity/users.repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { ORDER_HOLD_MINUTES } from "./capacity";
import { appBaseUrl } from "./checkout.service";
import { CommerceError, PaymentsNotConfiguredError } from "./errors";
import { hasActivePortalPass } from "@/modules/agentic/entitlements";
import { paymentsConfigured, stripeGateway, type PaymentGateway } from "./stripe";
import { enabledUnlockSetting } from "./unlock.repository";

/*
 * Unlocking a Knowledge Check result DOCUMENT (Milestone 14 Phase 5; DR-03
 * §3). The document is shown when BOTH halves hold:
 *   1. a review of Free Learning exists (the reviews model's `diagnostic`
 *      kind — the review without a registration; hidden or rejected still
 *      counts, as for certificates), and
 *   2. the fee is settled: a PAID `knowledge_check_unlock` order for this
 *      attempt — or none is due because the person's profile country is
 *      Pakistan (founder decision P13, the card-payment rule).
 * The ID and the /verify page are never gated. Non-refundable once shown
 * (P14, refund policy §1). UX review 2026-09-27 U5: the document is offered
 * after a PASS only — a fail keeps its ID and verify page and can be retaken.
 */

export type UnlockStatus = {
  reviewSatisfied: boolean;
  /** `pass`: an active Portal Unlimited pass covers the unlock (CR-2026-10-04-0113; DR-05 "Certificate of Achievement"). */
  fee: "paid" | "pass" | "exempt" | "required" | "unavailable";
  /** A pending, unexpired unlock order for this attempt (the Stripe tab may still be open). */
  pendingOrderId: string | null;
  unlocked: boolean;
  amountMinor: number | null;
  currency: string | null;
};

export async function hasFreeLearningReview(userId: string, db: Db = getPrisma()): Promise<boolean> {
  return (await db.review.count({ where: { userId, kind: "diagnostic" } })) > 0;
}

export async function unlockStatusForAttempt(attempt: AttemptRecord, now = new Date(), db: Db = getPrisma()): Promise<UnlockStatus> {
  const [reviewSatisfied, portalPass, profile, paid, pending, setting] = await Promise.all([
    hasFreeLearningReview(attempt.userId, db),
    hasActivePortalPass(attempt.userId, now, db),
    getProfile(attempt.userId, db),
    db.order.findFirst({ where: { knowledgeCheckAttemptId: attempt.id, kind: "knowledge_check_unlock", status: { in: ["paid", "refunded", "partially_refunded"] } }, select: { id: true } }),
    db.order.findFirst({ where: { knowledgeCheckAttemptId: attempt.id, kind: "knowledge_check_unlock", status: "pending", expiresAt: { gt: now } }, select: { id: true } }),
    enabledUnlockSetting(now, db),
  ]);
  const exempt = profile?.countryCode ? regionForCountry(profile.countryCode) === "pakistan" : false;
  const fee: UnlockStatus["fee"] = paid ? "paid" : portalPass ? "pass" : exempt ? "exempt" : setting ? "required" : "unavailable";
  return {
    reviewSatisfied,
    fee,
    pendingOrderId: pending?.id ?? null,
    unlocked: attempt.passed === true && reviewSatisfied && (fee === "paid" || fee === "pass" || fee === "exempt"),
    amountMinor: setting?.amountMinor ?? null,
    currency: setting?.currency ?? null,
  };
}

export type StartUnlockInput = { userId: string; attemptId: string; gateway?: PaymentGateway; now?: Date };
export type StartUnlockResult = { orderId: string; url: string };

/** ONE transaction creates the pending unlock order (amount from the setting in force, never the browser) and its audit row; then Stripe is asked for a session. */
export async function startUnlockCheckout(input: StartUnlockInput): Promise<StartUnlockResult> {
  if (!input.gateway && !paymentsConfigured()) throw new PaymentsNotConfiguredError("STRIPE_SECRET_KEY");
  const gateway = input.gateway ?? stripeGateway();
  const baseUrl = appBaseUrl();
  const now = input.now ?? new Date();
  const user = await findUserById(input.userId);
  if (!user) throw new Error(`user ${input.userId} not found`);

  const { order, label, attempt } = await withTransaction(async (tx) => {
    const attempt = await getAttemptForUser(input.attemptId, user.id, tx);
    if (!attempt) throw new CommerceError("unlock_not_finished", `Attempt ${input.attemptId} not found for user ${user.id}.`);
    if (!attempt.finishedAt) throw new CommerceError("unlock_not_finished", `Attempt ${attempt.id} is not finished.`);
    if (!attempt.passed) throw new CommerceError("unlock_not_passed", `Attempt ${attempt.id} was not passed.`);
    const status = await unlockStatusForAttempt(attempt, now, tx);
    if (status.fee === "paid") throw new CommerceError("unlock_already_paid", `Attempt ${attempt.id} is already unlocked.`);
    if (status.fee === "pass") throw new CommerceError("unlock_fee_exempt", `User ${user.id} has an active Portal Unlimited pass.`);
    if (status.fee === "exempt") throw new CommerceError("unlock_fee_exempt", `User ${user.id} is exempt from the unlock fee.`);
    if (status.pendingOrderId) throw new CommerceError("unlock_order_pending", `Attempt ${attempt.id} has pending unlock order ${status.pendingOrderId}.`);
    const setting = await enabledUnlockSetting(now, tx);
    if (!setting) throw new CommerceError("unlock_unavailable", "The unlock fee setting is switched off.");
    const expiresAt = new Date(now.getTime() + ORDER_HOLD_MINUTES * 60_000);
    const order = await tx.order.create({
      data: {
        userId: user.id,
        offeringId: null,
        programmeId: null,
        knowledgeCheckAttemptId: attempt.id,
        kind: "knowledge_check_unlock",
        status: "pending",
        region: "international",
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
      after: { kind: "knowledge_check_unlock", attemptId: attempt.id, publicId: attempt.publicId, amountMinor: setting.amountMinor, currency: setting.currency, settingId: setting.id, label: setting.label, expiresAt: expiresAt.toISOString() },
    });
    return { order, label: setting.label, attempt };
  });

  const prisma = getPrisma();
  try {
    const session = await gateway.createCheckoutSession({
      orderId: order.id,
      amountMinor: Number(order.amountMinor),
      currency: order.currency,
      productName: `${label} — ${attempt.publicId}`,
      customerEmail: user.email,
      expiresAt: order.expiresAt,
      successUrl: `${baseUrl}/free-learning/knowledge-check/${attempt.id}/result?order=${order.id}`,
      cancelUrl: `${baseUrl}/free-learning/knowledge-check/${attempt.id}/result?cancelled=1`,
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
    return { orderId: order.id, url: session.url };
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } });
    console.error(`[commerce] Stripe Checkout Session creation failed for unlock order ${order.id}`, err);
    throw err;
  }
}

export type UnlockOrderView = { id: string; status: string; effectiveStatus: string; amountMinor: number; currency: string; paidAt: Date | null; receiptUrl: string | null };

/** The `?order=` banner's truth: the row, never the redirect; only the person's own unlock orders. */
export async function findUnlockOrderForUser(orderId: string, userId: string, now = new Date(), db: Db = getPrisma()): Promise<UnlockOrderView | null> {
  if (!isUuid(orderId)) return null;
  const o = await db.order.findUnique({ where: { id: orderId }, include: { payment: { select: { receiptUrl: true } } } });
  if (!o || o.userId !== userId || o.kind !== "knowledge_check_unlock") return null;
  return { id: o.id, status: o.status, effectiveStatus: o.status === "pending" && o.expiresAt.getTime() <= now.getTime() ? "expired" : o.status, amountMinor: Number(o.amountMinor), currency: o.currency, paidAt: o.paidAt, receiptUrl: o.payment?.receiptUrl ?? null };
}
