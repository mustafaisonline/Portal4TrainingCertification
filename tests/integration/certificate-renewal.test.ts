import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { addDays, addMonths, todayIso } from "@/modules/certificates/dates";
import { createFeeSetting, currentFeeSetting } from "@/modules/certificates/fee.repository";
import { CertificateNotFoundError, findCertificateById, listRenewals } from "@/modules/certificates/repository";
import { findRenewalOrderForUser, previewRenewal, startRenewalCheckout } from "@/modules/certificates/renewal.service";
import { countSeatsTaken } from "@/modules/commerce/capacity";
import { PaymentsNotConfiguredError } from "@/modules/commerce/errors";
import { listOrdersForUser } from "@/modules/commerce/registrations.service";
import type { CheckoutSessionInput, PaymentGateway, RefundInput } from "@/modules/commerce/stripe";
import { verifyStripeSignature } from "@/modules/commerce/stripe";
import { handleStripeWebhook } from "@/modules/commerce/webhook.service";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { createAdminUser, createCertificateUser, deleteTestOffering, issueTestCertificate } from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * Renewal — integration against the REAL test database with the FAKE
 * payment gateway (M6 plan §6 criteria 4, 5, 6). Stripe's API is never
 * called; the only SDK use is the official test-header signer, so the
 * webhook path exercised is the real one (as commerce.test.ts does).
 */

const prisma = getPrisma();
const WEBHOOK_SECRET = "whsec_test_" + randomUUID().replace(/-/g, "");
const stripeForSigning = new Stripe("sk_test_signing_helper_only");

const emails: string[] = [];
const offerings: string[] = [];
let admin: { id: string; email: string };
let seedFee: { id: string; amountMinor: number; currency: string };

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
    async retrieveProcessingFee() {
      return null;
    },
    constructEvent(rawBody, signature) {
      return verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET);
    },
    ...overrides,
  };
  return gateway;
}

function sessionCompletedEvent(order: { id: string; amountMinor: bigint; currency: string }, opts: { eventId?: string; paymentIntent?: string; amountTotal?: number } = {}) {
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
        id: `cs_test_${randomUUID().slice(0, 12)}`,
        object: "checkout.session",
        mode: "payment",
        status: "complete",
        payment_status: "paid",
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        payment_intent: opts.paymentIntent ?? `pi_test_${randomUUID().slice(0, 12)}`,
        amount_total: opts.amountTotal ?? Number(order.amountMinor),
        currency: order.currency.toLowerCase(),
        customer_email: "someone@example.test",
      },
    },
  };
  return JSON.stringify(payload);
}

function sign(payload: string): string {
  return stripeForSigning.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
}

async function pay(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const payload = sessionCompletedEvent(order);
  return { outcome: await handleStripeWebhook(payload, sign(payload), fakeGateway()), payload };
}

async function holder(legalName = "Renewal Person") {
  const u = await createCertificateUser({ legalName, prefix: "m6r" });
  emails.push(u.email);
  return u;
}

/** A certificate whose expiry is `daysFromToday` away (negative = lapsed). */
async function certificateExpiring(daysFromToday: number, u?: { id: string; email: string }) {
  const owner = u ?? (await holder());
  const fixture = await issueTestCertificate({ adminUserId: admin.id, userId: owner.id, expiresOnIso: addDays(todayIso(new Date()), daysFromToday) });
  offerings.push(fixture.offeringId);
  return { ...fixture, owner };
}

beforeAll(async () => {
  admin = await createAdminUser("m6r-admin");
  emails.push(admin.email);
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  const fee = await currentFeeSetting();
  if (!fee) throw new Error("seeded certificate fee setting required");
  seedFee = fee;
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(async () => {
  for (const email of emails) await deleteTestUser(email);
  for (const id of offerings) await deleteTestOffering(id);
  await prisma.auditLog.deleteMany({ where: { entityType: "certificate_fee_setting", actorUserId: admin.id } });
  await prisma.certificateFeeSetting.deleteMany({ where: { createdByUserId: admin.id } });
  await prisma.outboundEmail.deleteMany({ where: { templateKey: { startsWith: "certificate." }, toEmail: { endsWith: "@example.test" } } });
  await prisma.stripeEvent.deleteMany({ where: { id: { startsWith: "evt_test_" } } });
  await disconnectPrisma();
});

/* ================================================================ checkout */

describe("startRenewalCheckout — window, owner, fee (E4, E5)", () => {
  it("refuses while more than 30 days remain; the preview says so", async () => {
    const { certificate, owner } = await certificateExpiring(31);
    const preview = await previewRenewal(certificate.id, owner.id);
    expect(preview).toMatchObject({ allowed: false, reason: "window_closed", status: "active", days: 31, amountMinor: seedFee.amountMinor, currency: "USD" });
    await expect(startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() })).rejects.toMatchObject({ code: "window_closed" });
    expect(await prisma.order.count({ where: { certificateId: certificate.id } })).toBe(0);
  });

  it("at 30 days: pending order of kind certificate_renewal with the fee's amount and currency, audit, Stripe session with the server's figures", async () => {
    const { certificate, owner, offeringId } = await certificateExpiring(30);
    const gateway = fakeGateway();
    const preview = await previewRenewal(certificate.id, owner.id);
    expect(preview).toMatchObject({ allowed: true, reason: null, status: "renewal_due", newExpiresOn: addMonths(certificate.expiresOn, 12), feeSettingId: seedFee.id });

    const result = await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway });
    expect(result.url).toBe(`https://checkout.stripe.test/${result.orderId}`);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } });
    expect(order).toMatchObject({ kind: "certificate_renewal", certificateId: certificate.id, userId: owner.id, offeringId, status: "pending", currency: seedFee.currency, region: "international" });
    expect(Number(order.amountMinor)).toBe(seedFee.amountMinor);
    expect(order.stripeCheckoutSessionId).toMatch(/^cs_test_/);
    expect(order.expiresAt.getTime() - order.createdAt.getTime()).toBeGreaterThanOrEqual(29 * 60_000);

    expect(gateway.sessions).toHaveLength(1);
    expect(gateway.sessions[0]).toMatchObject({
      orderId: order.id,
      amountMinor: seedFee.amountMinor,
      currency: seedFee.currency,
      customerEmail: owner.email,
      productName: `Certificate renewal ${certificate.certificateId} — 12 months`,
      successUrl: `${process.env.APP_BASE_URL}/account/certificate?order=${order.id}`,
      cancelUrl: `${process.env.APP_BASE_URL}/account/certificate?cancelled=1`,
    });
    const audit = await listAuditForEntity(prisma, "order", order.id);
    expect(audit.map((a) => a.action)).toEqual(["order.created"]);
    expect(audit[0]!.after).toMatchObject({ kind: "certificate_renewal", certificateId: certificate.id, amountMinor: seedFee.amountMinor, currency: "USD", feeSettingId: seedFee.id });

    // A pending renewal blocks a second one.
    await expect(startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway })).rejects.toMatchObject({ code: "order_pending" });
    expect(await previewRenewal(certificate.id, owner.id)).toMatchObject({ allowed: false, reason: "order_pending", pendingOrderId: order.id });
    // The return banner reads the row.
    expect(await findRenewalOrderForUser(order.id, owner.id)).toMatchObject({ id: order.id, status: "pending", effectiveStatus: "pending", certificateCode: certificate.certificateId, renewal: null });
    const stranger = await holder("Stranger");
    expect(await findRenewalOrderForUser(order.id, stranger.id)).toBeNull();
    // Orders list renders it as a renewal.
    const listed = await listOrdersForUser(owner.id);
    expect(listed.find((o) => o.id === order.id)).toMatchObject({ kind: "certificate_renewal", certificateCode: certificate.certificateId });
  });

  it("allowed when expired; refused when revoked; a stranger gets not found; no Stripe key and no gateway → PaymentsNotConfiguredError", async () => {
    const lapsed = await certificateExpiring(-40);
    await expect(startRenewalCheckout({ certificateId: lapsed.certificate.id, userId: lapsed.owner.id, gateway: fakeGateway() })).resolves.toMatchObject({ orderId: expect.any(String) });

    const stranger = await holder("Stranger Two");
    await expect(startRenewalCheckout({ certificateId: lapsed.certificate.id, userId: stranger.id, gateway: fakeGateway() })).rejects.toBeInstanceOf(CertificateNotFoundError);
    expect(await previewRenewal(lapsed.certificate.id, stranger.id)).toBeNull();

    const revoked = await certificateExpiring(5);
    await prisma.certificate.update({ where: { id: revoked.certificate.id }, data: { revokedAt: new Date(), revokedByUserId: admin.id, revocationReason: "Test" } });
    await expect(startRenewalCheckout({ certificateId: revoked.certificate.id, userId: revoked.owner.id, gateway: fakeGateway() })).rejects.toMatchObject({ code: "revoked" });
    expect(await previewRenewal(revoked.certificate.id, revoked.owner.id)).toMatchObject({ allowed: false, reason: "revoked" });

    const saved = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      const fresh = await certificateExpiring(5);
      await expect(startRenewalCheckout({ certificateId: fresh.certificate.id, userId: fresh.owner.id })).rejects.toBeInstanceOf(PaymentsNotConfiguredError);
      expect(await prisma.order.count({ where: { certificateId: fresh.certificate.id } })).toBe(0);
    } finally {
      if (saved !== undefined) process.env.STRIPE_SECRET_KEY = saved;
    }
  });

  it("marks the order failed when session creation throws, so a retry is possible at once", async () => {
    const { certificate, owner } = await certificateExpiring(5);
    const failing = fakeGateway({
      async createCheckoutSession() {
        throw new Error("stripe down");
      },
    });
    await expect(startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: failing })).rejects.toThrow("stripe down");
    expect((await prisma.order.findFirstOrThrow({ where: { certificateId: certificate.id } })).status).toBe("failed");
    await expect(startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() })).resolves.toBeTruthy();
  });

  it("a fee change effective tomorrow does not alter today's renewal (criterion 6)", async () => {
    const tomorrow = new Date(Date.now() + 24 * 3600_000);
    const future = await withTransaction((tx) => createFeeSetting(tx, { amountMinor: 2500, currency: "USD", effectiveFrom: tomorrow }, admin.id));
    try {
      const { certificate, owner } = await certificateExpiring(5);
      expect(await previewRenewal(certificate.id, owner.id)).toMatchObject({ amountMinor: seedFee.amountMinor, feeSettingId: seedFee.id });
      const { orderId } = await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() });
      expect(Number((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).amountMinor)).toBe(seedFee.amountMinor);
    } finally {
      await prisma.auditLog.deleteMany({ where: { entityType: "certificate_fee_setting", entityId: future.id } });
      await prisma.certificateFeeSetting.delete({ where: { id: future.id } });
    }
  });
});

/* ================================================================= webhook */

describe("paid renewal through the webhook (E5 arithmetic; plan §6 criterion 5)", () => {
  it("on time: extends from the OLD expiry; renewal row records fee setting, amount and currency; audit and email; replays change nothing", async () => {
    const { certificate, owner } = await certificateExpiring(10);
    const { orderId } = await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() });
    const { outcome, payload } = await pay(orderId);
    expect(outcome).toMatchObject({ duplicate: false, status: "processed" });

    const after = await findCertificateById(certificate.id);
    expect(after!.expiresOn).toBe(addMonths(certificate.expiresOn, 12));
    const renewals = await listRenewals(certificate.id);
    expect(renewals).toHaveLength(1);
    expect(renewals[0]).toMatchObject({ orderId, feeSettingId: seedFee.id, amountMinor: seedFee.amountMinor, currency: "USD", previousExpiresOn: certificate.expiresOn, newExpiresOn: after!.expiresOn });

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payment: true, registration: true } });
    expect(order.status).toBe("paid");
    expect(order.payment).toMatchObject({ currency: "USD", status: "succeeded" });
    expect(order.registration).toBeNull(); // a renewal never creates a seat
    expect((await listAuditForEntity(prisma, "order", orderId)).map((a) => a.action)).toEqual(["order.created", "payment.succeeded"]);
    const certAudit = await listAuditForEntity(prisma, "certificate", certificate.id);
    expect(certAudit.map((a) => a.action)).toEqual(["certificate.issued", "certificate.renewed"]);
    expect(certAudit[1]!.before).toEqual({ expiresOn: certificate.expiresOn });
    expect(certAudit[1]!.after).toMatchObject({ expiresOn: after!.expiresOn, orderId, feeSettingId: seedFee.id, amountMinor: seedFee.amountMinor });
    const email = await prisma.outboundEmail.findFirst({ where: { toEmail: owner.email, templateKey: "certificate.renewed" } });
    expect(email!.textBody).toContain(certificate.certificateId);
    expect(await findRenewalOrderForUser(orderId, owner.id)).toMatchObject({ status: "paid", effectiveStatus: "paid", renewal: { previousExpiresOn: certificate.expiresOn, newExpiresOn: after!.expiresOn } });

    // Replay of the same event: duplicate, nothing changes.
    expect(await handleStripeWebhook(payload, sign(payload), fakeGateway())).toMatchObject({ duplicate: true });
    // A DIFFERENT event for the already-paid order: also nothing.
    const again = sessionCompletedEvent(order);
    const secondOutcome = await handleStripeWebhook(again, sign(again), fakeGateway());
    expect(secondOutcome.note).toContain("already paid");
    expect((await findCertificateById(certificate.id))!.expiresOn).toBe(after!.expiresOn);
    expect(await listRenewals(certificate.id)).toHaveLength(1);
    expect(await prisma.outboundEmail.count({ where: { toEmail: owner.email, templateKey: "certificate.renewed" } })).toBe(1);
    // Now active for well over 30 days: the window is closed again.
    await expect(startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() })).rejects.toMatchObject({ code: "window_closed" });
  });

  it("lapsed: extends from TODAY, not from the old expiry", async () => {
    const { certificate, owner } = await certificateExpiring(-45);
    const { orderId } = await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() });
    const now = new Date();
    await pay(orderId);
    const after = await findCertificateById(certificate.id);
    expect(after!.expiresOn).toBe(addMonths(todayIso(now), 12));
    expect((await listRenewals(certificate.id))[0]).toMatchObject({ previousExpiresOn: certificate.expiresOn, newExpiresOn: after!.expiresOn });
  });

  it("a browser-supplied amount is ignored: the renewal records the order's server-set amount", async () => {
    const { certificate, owner } = await certificateExpiring(3);
    const { orderId } = await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const payload = sessionCompletedEvent(order, { amountTotal: 1 });
    await handleStripeWebhook(payload, sign(payload), fakeGateway());
    expect((await listRenewals(certificate.id))[0]).toMatchObject({ amountMinor: seedFee.amountMinor, currency: "USD" });
  });

  it("a fee change made after the order was created does not change what that order records", async () => {
    const { certificate, owner } = await certificateExpiring(3);
    const { orderId } = await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() });
    await new Promise((r) => setTimeout(r, 20));
    const raised = await withTransaction((tx) => createFeeSetting(tx, { amountMinor: 1900, currency: "USD", effectiveFrom: new Date() }, admin.id));
    try {
      await pay(orderId);
      expect((await listRenewals(certificate.id))[0]).toMatchObject({ feeSettingId: seedFee.id, amountMinor: seedFee.amountMinor });
      // …while a NEW renewal started now would use the raised fee.
      const other = await certificateExpiring(3);
      expect(await previewRenewal(other.certificate.id, other.owner.id)).toMatchObject({ amountMinor: 1900, feeSettingId: raised.id });
    } finally {
      await prisma.auditLog.deleteMany({ where: { entityType: "certificate_fee_setting", entityId: raised.id } });
      await prisma.certificateFeeSetting.delete({ where: { id: raised.id } });
    }
  });

  it("two paid orders → two renewals, each +12 months", async () => {
    const { certificate, owner } = await certificateExpiring(7);
    const first = await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() });
    // The first hold lapses (as Stripe's expiry would), which lets a second order be created before either is paid.
    await prisma.order.update({ where: { id: first.orderId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const second = await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() });
    await pay(first.orderId);
    await pay(second.orderId);
    const after = await findCertificateById(certificate.id);
    expect(after!.expiresOn).toBe(addMonths(certificate.expiresOn, 24));
    const renewals = await listRenewals(certificate.id);
    expect(renewals.map((r) => [r.previousExpiresOn, r.newExpiresOn])).toEqual([
      [certificate.expiresOn, addMonths(certificate.expiresOn, 12)],
      [addMonths(certificate.expiresOn, 12), addMonths(certificate.expiresOn, 24)],
    ]);
    expect((await listAuditForEntity(prisma, "certificate", certificate.id)).map((a) => a.action)).toEqual(["certificate.issued", "certificate.renewed", "certificate.renewed"]);
  });

  it("checkout.session.expired on a renewal order releases it without touching the certificate", async () => {
    const { certificate, owner } = await certificateExpiring(7);
    const { orderId } = await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const expired = JSON.parse(sessionCompletedEvent(order)) as { type: string; data: { object: { payment_status: string } } };
    expired.type = "checkout.session.expired";
    expired.data.object.payment_status = "unpaid";
    const payload = JSON.stringify(expired);
    expect(await handleStripeWebhook(payload, sign(payload), fakeGateway())).toMatchObject({ status: "processed" });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("expired");
    expect((await findCertificateById(certificate.id))!.expiresOn).toBe(certificate.expiresOn);
    expect(await listRenewals(certificate.id)).toHaveLength(0);
    // The hold is gone, so a new attempt is allowed.
    await expect(startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() })).resolves.toBeTruthy();
  });
});

/* ================================================================ capacity */

describe("capacity is unaffected by renewal orders (plan §4 'orders')", () => {
  it("a pending renewal order does not count as a held seat on the certificate's offering", async () => {
    const { certificate, owner, offeringId } = await certificateExpiring(7);
    await startRenewalCheckout({ certificateId: certificate.id, userId: owner.id, gateway: fakeGateway() });
    const now = new Date();
    expect(await prisma.order.count({ where: { offeringId, status: "pending", expiresAt: { gt: now } } })).toBe(1);
    const seats = await withTransaction((tx) => countSeatsTaken(tx, offeringId, now));
    expect(seats).toEqual({ confirmed: 1, pendingHeld: 0, taken: 1 });
  });
});
