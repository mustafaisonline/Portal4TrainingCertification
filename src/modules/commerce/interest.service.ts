import { getPrisma, withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { getProfile } from "@/modules/identity/profile.repository";
import { findUserById } from "@/modules/identity/users.repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { ORDER_HOLD_MINUTES } from "./capacity";
import { appBaseUrl } from "./checkout.service";
import { CommerceError, PaymentsNotConfiguredError } from "./errors";
import type { InterestFormValues } from "./interest-rules";
import { enabledInterestSetting, interestTarget } from "./interest.repository";
import { regionForCountry } from "./pricing";
import { paymentsConfigured, stripeGateway, type PaymentGateway } from "./stripe";

/*
 * Registering interest in a training FORMAT (CR-2026-10-01-2138; founder
 * decisions Q2–Q9, 2026-10-01).
 *
 * The person is signed in. ONE transaction records the form (one row per
 * person per format — an unpaid row is re-used by a retry) and, for a card
 * payer, a pending `interest` order whose amount is read from the fee setting
 * in force (never from the browser); then Stripe is asked for a hosted
 * Checkout Session. The row becomes `confirmed` ONLY in the verified-webhook
 * transaction (webhook.service.ts) — returning from Stripe proves nothing.
 *
 * A participant whose profile country is Pakistan has no card route (the
 * local-partner rule, Q4): their interest is registered at once, fee waived,
 * and says so. The fee is NON-REFUNDABLE and is not credited against a later
 * fee (Q9).
 *
 * Eligibility (Q3): a published training's format with NO open scheduled date;
 * once a date exists the person registers for the training itself.
 */

export type StartInterestInput = { userId: string; formatId: string; form: InterestFormValues; gateway?: PaymentGateway; now?: Date };
export type StartInterestResult = { kind: "checkout"; orderId: string; interestId: string; url: string } | { kind: "registered"; interestId: string };

export async function startInterestRegistration(input: StartInterestInput): Promise<StartInterestResult> {
  const now = input.now ?? new Date();
  const user = await findUserById(input.userId);
  if (!user) throw new Error(`user ${input.userId} not found`);
  const profile = await getProfile(user.id);
  const waived = regionForCountry(profile?.countryCode ?? null) === "pakistan";
  // A card payer needs Stripe; a Pakistan participant pays nothing, so never blocks on it.
  if (!waived && !input.gateway && !paymentsConfigured()) throw new PaymentsNotConfiguredError("STRIPE_SECRET_KEY");
  const gateway = waived ? null : (input.gateway ?? stripeGateway());
  const baseUrl = appBaseUrl();

  const outcome = await withTransaction(async (tx) => {
    const target = await interestTarget(input.formatId, now, tx);
    if (!target || !target.programmePublished || target.hasOpenDate) throw new CommerceError("interest_unavailable", `Format ${input.formatId} is not open for interest.`);
    const setting = await enabledInterestSetting(now, tx);
    if (!setting) throw new CommerceError("interest_fee_off", "Registering interest is switched off.");

    const existing = await tx.trainingInterest.findUnique({ where: { userId_deliveryFormatId: { userId: user.id, deliveryFormatId: target.formatId } }, include: { order: { select: { id: true, status: true, expiresAt: true } } } });
    if (existing?.status === "confirmed") throw new CommerceError("interest_already_registered", `User ${user.id} already registered interest in ${target.formatId}.`);
    if (existing?.order && existing.order.status === "pending" && existing.order.expiresAt.getTime() > now.getTime()) {
      throw new CommerceError("interest_order_pending", `Interest ${existing.id} has pending order ${existing.order.id}.`);
    }

    const details = { email: input.form.email, fullName: input.form.fullName, mobile: input.form.mobile, dateOfBirth: input.form.dateOfBirth, consent: input.form.consent };

    if (waived) {
      const row = existing
        ? await tx.trainingInterest.update({ where: { id: existing.id }, data: { ...details, orderId: null, status: "confirmed", feeWaived: true, confirmedAt: now } })
        : await tx.trainingInterest.create({ data: { programmeId: target.programmeId, deliveryFormatId: target.formatId, userId: user.id, ...details, status: "confirmed", feeWaived: true, confirmedAt: now } });
      await writeAudit(tx, { actorUserId: user.id, action: "interest.registered", entityType: "training_interest", entityId: row.id, after: { programmeId: target.programmeId, formatId: target.formatId, feeWaived: true, reason: "no card route in Pakistan" } });
      return { kind: "registered" as const, interestId: row.id, target };
    }

    const expiresAt = new Date(now.getTime() + ORDER_HOLD_MINUTES * 60_000);
    const order = await tx.order.create({
      data: {
        userId: user.id,
        offeringId: null,
        programmeId: target.programmeId,
        kind: "interest",
        status: "pending",
        region: "international",
        currency: setting.currency,
        amountMinor: BigInt(setting.amountMinor),
        expiresAt,
      },
    });
    const row = existing
      ? await tx.trainingInterest.update({ where: { id: existing.id }, data: { ...details, orderId: order.id, status: "pending", feeWaived: false } })
      : await tx.trainingInterest.create({ data: { programmeId: target.programmeId, deliveryFormatId: target.formatId, userId: user.id, ...details, orderId: order.id, status: "pending" } });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "order.created",
      entityType: "order",
      entityId: order.id,
      after: { kind: "interest", interestId: row.id, programmeId: target.programmeId, formatId: target.formatId, amountMinor: setting.amountMinor, currency: setting.currency, settingId: setting.id, label: setting.label, expiresAt: expiresAt.toISOString() },
    });
    return { kind: "checkout" as const, interestId: row.id, order, label: setting.label, target };
  });

  if (outcome.kind === "registered") return { kind: "registered", interestId: outcome.interestId };

  const { order, label, target } = outcome;
  const prisma = getPrisma();
  try {
    const session = await gateway!.createCheckoutSession({
      orderId: order.id,
      amountMinor: Number(order.amountMinor),
      currency: order.currency,
      productName: `${label} — ${target.programmeTitle} (${target.formatName}) — non-refundable`,
      customerEmail: user.email,
      expiresAt: order.expiresAt,
      successUrl: `${baseUrl}/programs/${target.programmeSlug}?interest=${order.id}`,
      cancelUrl: `${baseUrl}/programs/${target.programmeSlug}?interest=cancelled`,
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
    return { kind: "checkout", orderId: order.id, interestId: outcome.interestId, url: session.url };
  } catch (err) {
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "failed" } }),
      prisma.trainingInterest.update({ where: { id: outcome.interestId }, data: { status: "expired" } }),
    ]);
    console.error(`[commerce] Stripe Checkout Session creation failed for interest order ${order.id}`, err);
    throw err;
  }
}

export type InterestOrderView = { id: string; status: string; effectiveStatus: string; amountMinor: number; currency: string; paidAt: Date | null; receiptUrl: string | null };

/** The `?interest=` banner's truth: the row, never the redirect; only the person's own interest orders. */
export async function findInterestOrderForUser(orderId: string, userId: string, now = new Date()): Promise<InterestOrderView | null> {
  if (!isUuid(orderId)) return null;
  const o = await getPrisma().order.findUnique({ where: { id: orderId }, include: { payment: { select: { receiptUrl: true } } } });
  if (!o || o.userId !== userId || o.kind !== "interest") return null;
  return { id: o.id, status: o.status, effectiveStatus: o.status === "pending" && o.expiresAt.getTime() <= now.getTime() ? "expired" : o.status, amountMinor: Number(o.amountMinor), currency: o.currency, paidAt: o.paidAt, receiptUrl: o.payment?.receiptUrl ?? null };
}
