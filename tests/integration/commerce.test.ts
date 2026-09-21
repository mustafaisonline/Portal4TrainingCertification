import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import type { ProgrammeRecord } from "@/modules/catalogue/programmes/types";
import { startCheckout } from "@/modules/commerce/checkout.service";
import { CommerceError, InvalidSignatureError, PaymentsNotConfiguredError } from "@/modules/commerce/errors";
import { cancelRegistration, listOrdersForUser, listRegistrationsForUser, transferRegistration } from "@/modules/commerce/registrations.service";
import type { CheckoutSessionInput, PaymentGateway, RefundInput } from "@/modules/commerce/stripe";
import { verifyStripeSignature } from "@/modules/commerce/stripe";
import { handleStripeWebhook } from "@/modules/commerce/webhook.service";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { uniqueEmail } from "../helpers/identity-db";

/*
 * Registration & payment — integration against the REAL test database
 * (M4 plan §7 criteria 3–8, 10). Stripe's API is never called: the services
 * take a FAKE gateway. The ONLY Stripe SDK use is the official
 * `generateTestHeaderString` helper, which signs a test event exactly as
 * Stripe would, so the signature path under test is the real one.
 */

const prisma = getPrisma();
const WEBHOOK_SECRET = "whsec_test_" + randomUUID().replace(/-/g, "");
const stripeForSigning = new Stripe("sk_test_signing_helper_only");

let flagship: ProgrammeRecord;
const createdUsers: string[] = [];
const createdOfferings: string[] = [];

/* ------------------------------------------------------------ fake gateway */

function fakeGateway(overrides: Partial<PaymentGateway> = {}) {
  const sessions: CheckoutSessionInput[] = [];
  const refunds: RefundInput[] = [];
  const gateway: PaymentGateway & { sessions: CheckoutSessionInput[]; refunds: RefundInput[] } = {
    sessions,
    refunds,
    async createCheckoutSession(input) {
      sessions.push(input);
      return { id: `cs_test_${randomUUID().slice(0, 12)}`, url: `https://checkout.stripe.test/${input.orderId}` };
    },
    async createRefund(input) {
      refunds.push(input);
      return { id: `re_test_${randomUUID().slice(0, 12)}`, status: "succeeded" };
    },
    constructEvent(rawBody, signature) {
      return verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET);
    },
    ...overrides,
  };
  return gateway;
}

/* ------------------------------------------------------------ fixtures */

async function createUser(country: string | null) {
  const user = await prisma.user.create({ data: { email: uniqueEmail("m4"), name: `M4 ${country ?? "Nowhere"}`, country } });
  createdUsers.push(user.id);
  return user;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function createOffering(opts: { startInDays: number; capacity: number | null; status?: "open" | "planned" | "full" }) {
  const startsOn = daysFromNow(opts.startInDays);
  const endsOn = daysFromNow(opts.startInDays + 2);
  const row = await prisma.scheduledOffering.create({
    data: {
      programmeId: flagship.id,
      deliveryFormatId: flagship.deliveryFormats[0]?.id ?? null,
      modality: "live_online",
      timezone: "Asia/Kuala_Lumpur",
      startsOn,
      endsOn,
      capacity: opts.capacity,
      status: opts.status ?? "open",
    },
  });
  createdOfferings.push(row.id);
  return row;
}

function sessionCompletedEvent(order: { id: string; amountMinor: bigint; currency: string }, opts: { eventId?: string; paymentIntent?: string; sessionId?: string } = {}) {
  const sessionId = opts.sessionId ?? `cs_test_${randomUUID().slice(0, 12)}`;
  const payload = {
    id: opts.eventId ?? `evt_test_${randomUUID().replace(/-/g, "")}`,
    object: "event",
    api_version: "2026-01-01",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        mode: "payment",
        status: "complete",
        payment_status: "paid",
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        payment_intent: opts.paymentIntent ?? `pi_test_${randomUUID().slice(0, 12)}`,
        amount_total: Number(order.amountMinor),
        currency: order.currency.toLowerCase(),
        customer_email: "someone@example.test",
      },
    },
  };
  return JSON.stringify(payload);
}

function sign(payload: string, secret = WEBHOOK_SECRET): string {
  return stripeForSigning.webhooks.generateTestHeaderString({ payload, secret });
}

/** Drives an order to paid through the (signed, fake-gateway) webhook. */
async function payOrder(orderId: string, gateway = fakeGateway()) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const payload = sessionCompletedEvent(order);
  await handleStripeWebhook(payload, sign(payload), gateway);
  return prisma.registration.findUniqueOrThrow({ where: { orderId } });
}

/* ------------------------------------------------------------ lifecycle */

beforeAll(async () => {
  const p = await findFlagshipProgramme();
  if (!p) throw new Error("seeded flagship programme required");
  flagship = p;
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(async () => {
  // Everything this file created, in dependency order. audit_log is
  // insert-only in the product; this test-only cleanup keeps the TEST
  // database from growing without bound.
  const orderIds = (await prisma.order.findMany({ where: { userId: { in: createdUsers } }, select: { id: true } })).map((o) => o.id);
  const paymentIds = (await prisma.payment.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((p) => p.id);
  const refundIds = (await prisma.refund.findMany({ where: { paymentId: { in: paymentIds } }, select: { id: true } })).map((r) => r.id);
  const registrationIds = (await prisma.registration.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((r) => r.id);
  await prisma.$transaction([
    prisma.refund.deleteMany({ where: { id: { in: refundIds } } }),
    prisma.registration.deleteMany({ where: { id: { in: registrationIds } } }),
    prisma.payment.deleteMany({ where: { id: { in: paymentIds } } }),
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.auditLog.deleteMany({ where: { entityId: { in: [...orderIds, ...paymentIds, ...refundIds, ...registrationIds, ...createdUsers] } } }),
    prisma.auditLog.deleteMany({ where: { actorUserId: { in: createdUsers } } }),
    prisma.consent.deleteMany({ where: { userId: { in: createdUsers } } }),
    prisma.outboundEmail.deleteMany({ where: { templateKey: { startsWith: "commerce." }, toEmail: { endsWith: "@example.test" } } }),
    prisma.stripeEvent.deleteMany({ where: { id: { startsWith: "evt_test_" } } }),
    prisma.scheduledOffering.deleteMany({ where: { id: { in: createdOfferings } } }),
    prisma.user.deleteMany({ where: { id: { in: createdUsers } } }),
  ]);
  await disconnectPrisma();
});

/* ================================================================ checkout */

describe("checkout — server-priced by profile country (plan §3 D3, §6.3)", () => {
  it.each([
    ["Malaysia", "malaysia"],
    ["Pakistan", "pakistan"],
    ["Singapore", "international"],
    [null, "international"],
  ] as const)("country %j → region %s: pending order, consents, audit, gateway call with that amount and currency", async (country, region) => {
    const offering = await createOffering({ startInDays: 30, capacity: 10 });
    const user = await createUser(country);
    const gateway = fakeGateway();
    const expected = flagship.prices.find((p) => p.region === region)!;

    const result = await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway });
    expect(result.url).toBe(`https://checkout.stripe.test/${result.orderId}`);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } });
    expect(order.status).toBe("pending");
    expect(order.region).toBe(region);
    expect(order.currency).toBe(expected.currency);
    expect(Number(order.amountMinor)).toBe(expected.offerAmountMinor);
    expect(order.stripeCheckoutSessionId).toMatch(/^cs_test_/);
    expect(order.expiresAt.getTime() - order.createdAt.getTime()).toBeGreaterThanOrEqual(29 * 60_000);
    expect(order.expiresAt.getTime() - order.createdAt.getTime()).toBeLessThanOrEqual(31 * 60_000);

    // The gateway received the server's figures — never the client's.
    expect(gateway.sessions).toHaveLength(1);
    expect(gateway.sessions[0]).toMatchObject({
      orderId: order.id,
      amountMinor: expected.offerAmountMinor,
      currency: expected.currency,
      customerEmail: user.email,
    });
    expect(gateway.sessions[0]!.productName).toContain(flagship.title);
    expect(gateway.sessions[0]!.successUrl).toBe(`${process.env.APP_BASE_URL}/account/programmes?order=${order.id}`);
    expect(gateway.sessions[0]!.cancelUrl).toBe(`${process.env.APP_BASE_URL}/checkout/${offering.id}?cancelled=1`);

    const consents = await prisma.consent.findMany({ where: { userId: user.id }, select: { documentKey: true, documentVersion: true } });
    expect(consents.map((c) => c.documentKey).sort()).toEqual(["privacy", "refund", "terms"]);
    const audit = await listAuditForEntity(prisma, "order", order.id);
    expect(audit.map((a) => a.action)).toEqual(["order.created"]);
    expect(audit[0]!.actorUserId).toBe(user.id);
  });

  it("refuses without consent, and creates nothing", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 10 });
    const user = await createUser("Malaysia");
    await expect(startCheckout({ userId: user.id, offeringId: offering.id, consent: false, gateway: fakeGateway() })).rejects.toMatchObject({ code: "consent_required" });
    expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);
  });

  it("refuses a date that is not open", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 10, status: "planned" });
    const user = await createUser("Malaysia");
    await expect(startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway: fakeGateway() })).rejects.toMatchObject({ code: "offering_not_open" });
  });

  it("without STRIPE_SECRET_KEY and no injected gateway: PaymentsNotConfiguredError, no order", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 10 });
    const user = await createUser("Malaysia");
    const saved = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      await expect(startCheckout({ userId: user.id, offeringId: offering.id, consent: true })).rejects.toBeInstanceOf(PaymentsNotConfiguredError);
    } finally {
      if (saved !== undefined) process.env.STRIPE_SECRET_KEY = saved;
    }
    expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);
  });

  it("marks the order failed (releasing the hold) when session creation throws", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 1 });
    const user = await createUser("Malaysia");
    const failing = fakeGateway({
      async createCheckoutSession() {
        throw new Error("stripe down");
      },
    });
    await expect(startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway: failing })).rejects.toThrow("stripe down");
    const order = await prisma.order.findFirstOrThrow({ where: { userId: user.id } });
    expect(order.status).toBe("failed");
    // The seat is free again for someone else.
    const other = await createUser("Malaysia");
    await expect(startCheckout({ userId: other.id, offeringId: offering.id, consent: true, gateway: fakeGateway() })).resolves.toBeTruthy();
  });
});

/* ================================================================ capacity */

describe("capacity — a pending order holds a seat (plan §7 criterion 4)", () => {
  it("second person refused while the first order is pending; an expired hold releases the seat", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 1 });
    const first = await createUser("Malaysia");
    const second = await createUser("Malaysia");

    const held = await startCheckout({ userId: first.id, offeringId: offering.id, consent: true, gateway: fakeGateway() });
    await expect(startCheckout({ userId: second.id, offeringId: offering.id, consent: true, gateway: fakeGateway() })).rejects.toMatchObject({ code: "offering_full" });

    // The 30-minute hold lapses (Stripe's expiry event would set `expired`;
    // the count also ignores a pending order whose expires_at has passed).
    await prisma.order.update({ where: { id: held.orderId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(startCheckout({ userId: second.id, offeringId: offering.id, consent: true, gateway: fakeGateway() })).resolves.toBeTruthy();
  });

  it("the same person cannot hold two seats or register twice", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 5 });
    const user = await createUser("Malaysia");
    const first = await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway: fakeGateway() });
    await expect(startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway: fakeGateway() })).rejects.toMatchObject({ code: "order_pending" });
    await payOrder(first.orderId);
    await expect(startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway: fakeGateway() })).rejects.toMatchObject({ code: "already_registered" });
  });
});

/* ================================================================= webhook */

describe("webhook — stored first, verified, idempotent (plan §6.1, §6.2, §6.5)", () => {
  it("signed checkout.session.completed → order paid, payment, registration, audit, email; replay changes nothing", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 3 });
    const user = await createUser("Malaysia");
    const { orderId } = await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway: fakeGateway() });
    const pending = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const paymentIntent = `pi_test_${randomUUID().slice(0, 12)}`;
    const payload = sessionCompletedEvent(pending, { paymentIntent });
    const eventId = (JSON.parse(payload) as { id: string }).id;

    const first = await handleStripeWebhook(payload, sign(payload), fakeGateway());
    expect(first).toMatchObject({ eventId, duplicate: false, status: "processed" });

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payment: true, registration: true } });
    expect(order.status).toBe("paid");
    expect(order.paidAt).not.toBeNull();
    expect(order.stripePaymentIntentId).toBe(paymentIntent);
    expect(order.payment).toMatchObject({ providerPaymentIntentId: paymentIntent, currency: pending.currency, status: "succeeded" });
    expect(Number(order.payment!.amountMinor)).toBe(Number(pending.amountMinor));
    expect(order.registration).toMatchObject({ userId: user.id, offeringId: offering.id, status: "confirmed", transferUsed: false });

    const orderAudit = (await listAuditForEntity(prisma, "order", orderId)).map((a) => a.action);
    expect(orderAudit).toEqual(["order.created", "payment.succeeded"]);
    const regAudit = (await listAuditForEntity(prisma, "registration", order.registration!.id)).map((a) => a.action);
    expect(regAudit).toEqual(["registration.confirmed"]);

    const email = await prisma.outboundEmail.findFirst({ where: { toEmail: user.email, templateKey: "commerce.registration-confirmed" } });
    expect(email).not.toBeNull();
    expect(email!.textBody).toContain(flagship.title);

    const stored = await prisma.stripeEvent.findUniqueOrThrow({ where: { id: eventId } });
    expect(stored.status).toBe("processed");
    expect(stored.type).toBe("checkout.session.completed");

    // Replay: same event id → duplicate; nothing changes.
    const again = await handleStripeWebhook(payload, sign(payload), fakeGateway());
    expect(again).toMatchObject({ eventId, duplicate: true });
    expect(await prisma.registration.count({ where: { orderId } })).toBe(1);
    expect(await prisma.payment.count({ where: { orderId } })).toBe(1);
    expect((await listAuditForEntity(prisma, "order", orderId)).map((a) => a.action)).toEqual(orderAudit);
    expect(await prisma.outboundEmail.count({ where: { toEmail: user.email, templateKey: "commerce.registration-confirmed" } })).toBe(1);

    // A DIFFERENT event for the already-paid order is also a no-op.
    const second = sessionCompletedEvent(pending, { paymentIntent });
    const secondOutcome = await handleStripeWebhook(second, sign(second), fakeGateway());
    expect(secondOutcome.duplicate).toBe(false);
    expect(secondOutcome.note).toContain("already paid");
    expect(await prisma.registration.count({ where: { orderId } })).toBe(1);
  });

  it("a tampered signature → InvalidSignatureError and no stripe_events row", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 3 });
    const user = await createUser("Malaysia");
    const { orderId } = await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway: fakeGateway() });
    const pending = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const payload = sessionCompletedEvent(pending);
    const eventId = (JSON.parse(payload) as { id: string }).id;

    await expect(handleStripeWebhook(payload, sign(payload, "whsec_wrong"), fakeGateway())).rejects.toBeInstanceOf(InvalidSignatureError);
    await expect(handleStripeWebhook(payload, "t=1,v1=deadbeef", fakeGateway())).rejects.toBeInstanceOf(InvalidSignatureError);
    // A body altered after signing (amount changed) does not verify either.
    const tampered = payload.replace('"payment_status":"paid"', '"payment_status":"unpaid"');
    await expect(handleStripeWebhook(tampered, sign(payload), fakeGateway())).rejects.toBeInstanceOf(InvalidSignatureError);

    expect(await prisma.stripeEvent.findUnique({ where: { id: eventId } })).toBeNull();
    expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("pending");
    expect(await prisma.registration.count({ where: { orderId } })).toBe(0);
  });

  it("checkout.session.expired → order expired + audit; unknown types are stored as ignored", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 3 });
    const user = await createUser("Malaysia");
    const { orderId } = await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway: fakeGateway() });
    const pending = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const expired = JSON.parse(sessionCompletedEvent(pending)) as { type: string; data: { object: { payment_status: string } } };
    expired.type = "checkout.session.expired";
    expired.data.object.payment_status = "unpaid";
    const payload = JSON.stringify(expired);
    expect(await handleStripeWebhook(payload, sign(payload), fakeGateway())).toMatchObject({ status: "processed" });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("expired");
    expect((await listAuditForEntity(prisma, "order", orderId)).map((a) => a.action)).toEqual(["order.created", "order.expired"]);

    const other = JSON.stringify({ ...(JSON.parse(payload) as object), id: `evt_test_${randomUUID().replace(/-/g, "")}`, type: "customer.created" });
    expect(await handleStripeWebhook(other, sign(other), fakeGateway())).toMatchObject({ status: "ignored" });
  });
});

/* ================================================================== refunds */

describe("cancellation — refund tier enforced (plan §3 D2, §7 criterion 7)", () => {
  async function paidRegistration(startInDays: number, gateway = fakeGateway()) {
    const offering = await createOffering({ startInDays, capacity: 3 });
    const user = await createUser("Malaysia");
    const { orderId } = await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway });
    const registration = await payOrder(orderId, gateway);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { orderId } });
    return { offering, user, orderId, registration, payment };
  }

  it.each([
    [20, 100],
    [10, 50],
    [3, 0],
  ] as const)("%i days before start → %i %% refund", async (days, percent) => {
    const gateway = fakeGateway();
    const { user, orderId, registration, payment } = await paidRegistration(days, gateway);
    const result = await cancelRegistration({ registrationId: registration.id, userId: user.id, gateway });
    expect(result.refundPercent).toBe(percent);
    const expectedAmount = Math.round((Number(payment.amountMinor) * percent) / 100);
    expect(result.refundAmountMinor).toBe(expectedAmount);

    const reg = await prisma.registration.findUniqueOrThrow({ where: { id: registration.id } });
    expect(reg.status).toBe("cancelled");
    expect(reg.cancellationRefundPercent).toBe(percent);
    expect(reg.cancelledAt).not.toBeNull();

    const refunds = await prisma.refund.findMany({ where: { paymentId: payment.id } });
    if (percent === 0) {
      expect(refunds).toHaveLength(0);
      expect(gateway.refunds).toHaveLength(0);
      expect(result.refundStatus).toBe("none");
    } else {
      expect(refunds).toHaveLength(1);
      expect(Number(refunds[0]!.amountMinor)).toBe(expectedAmount);
      expect(refunds[0]!.status).toBe("succeeded");
      expect(refunds[0]!.providerRefundId).toMatch(/^re_test_/);
      expect(gateway.refunds).toEqual([{ paymentIntentId: payment.providerPaymentIntentId, amountMinor: expectedAmount, metadata: expect.objectContaining({ refundId: refunds[0]!.id }) }]);
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payment: true } });
      expect(order.status).toBe(percent === 100 ? "refunded" : "partially_refunded");
      expect(order.payment!.status).toBe(percent === 100 ? "refunded" : "partially_refunded");
    }
    const audit = (await listAuditForEntity(prisma, "registration", registration.id)).map((a) => a.action);
    expect(audit).toEqual(["registration.confirmed", "registration.cancelled"]);
    expect(await prisma.outboundEmail.count({ where: { toEmail: user.email, templateKey: "commerce.registration-cancelled" } })).toBe(1);
  });

  it("when Stripe refuses the refund: registration stays cancelled, refund row failed, error surfaced", async () => {
    const gateway = fakeGateway({
      async createRefund() {
        throw new Error("insufficient balance");
      },
    });
    const { user, registration, payment } = await paidRegistration(20, gateway);
    await expect(cancelRegistration({ registrationId: registration.id, userId: user.id, gateway })).rejects.toMatchObject({ code: "refund_failed" });
    expect((await prisma.registration.findUniqueOrThrow({ where: { id: registration.id } })).status).toBe("cancelled");
    const refund = await prisma.refund.findFirstOrThrow({ where: { paymentId: payment.id } });
    expect(refund.status).toBe("failed");
    expect(refund.providerRefundId).toBeNull();
  });

  it("only the owner can cancel; a cancelled registration cannot be cancelled again", async () => {
    const { user, registration } = await paidRegistration(20);
    const stranger = await createUser("Malaysia");
    await expect(cancelRegistration({ registrationId: registration.id, userId: stranger.id, gateway: fakeGateway() })).rejects.toMatchObject({ code: "registration_not_found" });
    await cancelRegistration({ registrationId: registration.id, userId: user.id, gateway: fakeGateway() });
    await expect(cancelRegistration({ registrationId: registration.id, userId: user.id, gateway: fakeGateway() })).rejects.toMatchObject({ code: "registration_not_active" });
  });
});

/* ================================================================= transfer */

describe("transfer — once, free, same programme, with a seat (plan §7 criterion 8)", () => {
  it("first transfer succeeds and moves the seat; a second is refused", async () => {
    const from = await createOffering({ startInDays: 30, capacity: 1 });
    const to = await createOffering({ startInDays: 60, capacity: 1 });
    const third = await createOffering({ startInDays: 90, capacity: 1 });
    const user = await createUser("Malaysia");
    const { orderId } = await startCheckout({ userId: user.id, offeringId: from.id, consent: true, gateway: fakeGateway() });
    const registration = await payOrder(orderId);

    const result = await transferRegistration({ registrationId: registration.id, targetOfferingId: to.id, userId: user.id });
    expect(result.from.id).toBe(from.id);
    expect(result.to.id).toBe(to.id);
    const moved = await prisma.registration.findUniqueOrThrow({ where: { id: registration.id } });
    expect(moved.offeringId).toBe(to.id);
    expect(moved.transferUsed).toBe(true);
    expect(moved.orderId).toBe(orderId);
    expect((await listAuditForEntity(prisma, "registration", registration.id)).map((a) => a.action)).toEqual(["registration.confirmed", "registration.transferred"]);
    expect(await prisma.outboundEmail.count({ where: { toEmail: user.email, templateKey: "commerce.registration-transferred" } })).toBe(1);

    // The seat on the old date is free again; the new date is now full.
    const newcomer = await createUser("Malaysia");
    await expect(startCheckout({ userId: newcomer.id, offeringId: from.id, consent: true, gateway: fakeGateway() })).resolves.toBeTruthy();
    await expect(startCheckout({ userId: newcomer.id, offeringId: to.id, consent: true, gateway: fakeGateway() })).rejects.toMatchObject({ code: "offering_full" });

    await expect(transferRegistration({ registrationId: registration.id, targetOfferingId: third.id, userId: user.id })).rejects.toMatchObject({ code: "transfer_used" });
  });

  it("refuses a full target and a date that is not open", async () => {
    const from = await createOffering({ startInDays: 30, capacity: 2 });
    const full = await createOffering({ startInDays: 60, capacity: 1 });
    const planned = await createOffering({ startInDays: 60, capacity: 5, status: "planned" });
    const user = await createUser("Malaysia");
    const occupant = await createUser("Malaysia");
    const reg = await payOrder((await startCheckout({ userId: user.id, offeringId: from.id, consent: true, gateway: fakeGateway() })).orderId);
    await payOrder((await startCheckout({ userId: occupant.id, offeringId: full.id, consent: true, gateway: fakeGateway() })).orderId);

    await expect(transferRegistration({ registrationId: reg.id, targetOfferingId: full.id, userId: user.id })).rejects.toMatchObject({ code: "offering_full" });
    await expect(transferRegistration({ registrationId: reg.id, targetOfferingId: planned.id, userId: user.id })).rejects.toMatchObject({ code: "offering_not_open" });
    await expect(transferRegistration({ registrationId: reg.id, targetOfferingId: from.id, userId: user.id })).rejects.toMatchObject({ code: "transfer_same_offering" });
    expect((await prisma.registration.findUniqueOrThrow({ where: { id: reg.id } })).transferUsed).toBe(false);
  });
});

/* ============================================================== read models */

describe("read models", () => {
  it("list registrations and orders for the person, with amounts as recorded", async () => {
    const offering = await createOffering({ startInDays: 30, capacity: 3 });
    const user = await createUser("Pakistan");
    const { orderId } = await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, gateway: fakeGateway() });
    await payOrder(orderId);
    const pk = flagship.prices.find((p) => p.region === "pakistan")!;

    const regs = await listRegistrationsForUser(user.id);
    expect(regs).toHaveLength(1);
    expect(regs[0]!.offering.id).toBe(offering.id);
    expect(regs[0]!.order).toMatchObject({ id: orderId, status: "paid", amountMinor: pk.offerAmountMinor, currency: "PKR", region: "pakistan" });

    const orders = await listOrdersForUser(user.id);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ id: orderId, status: "paid", amountMinor: pk.offerAmountMinor, currency: "PKR", programmeTitle: flagship.title });
    expect(orders[0]!.registrationId).toBe(regs[0]!.id);
  });

  it("CommerceError carries a stable code", () => {
    const err = new CommerceError("offering_full", "x");
    expect(err.code).toBe("offering_full");
    expect(err).toBeInstanceOf(Error);
  });
});
