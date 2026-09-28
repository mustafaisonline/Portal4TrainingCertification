import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import type { ProgrammeRecord } from "@/modules/catalogue/programmes/types";
import { startCheckout } from "@/modules/commerce/checkout.service";
import {
  COUPON_FLOOR_MINOR,
  CouponAdminError,
  couponDisplayStatus,
  createCoupon,
  deleteCoupon,
  generateCouponCode,
  listCoupons,
  normaliseCouponCode,
  priceWithCoupon,
  setCouponStatus,
  updateCoupon,
  validateCoupon,
} from "@/modules/commerce/coupons.repository";
import { CommerceError } from "@/modules/commerce/errors";
import type { CheckoutSessionInput, PaymentGateway } from "@/modules/commerce/stripe";
import { verifyStripeSignature } from "@/modules/commerce/stripe";
import { handleStripeWebhook } from "@/modules/commerce/webhook.service";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { countryCodeFor } from "@/content/countries";
import { completeProfile, uniqueEmail } from "../helpers/identity-db";

/*
 * Coupons (founder specification + N1–N8 approved 2026-09-28) against the
 * REAL test database: code generation, the §7 floor table, the §6 validation
 * matrix, admin CRUD with audit rows, and the full checkout → webhook →
 * redemption path with a FAKE gateway (Stripe's API is never called; the
 * webhook signature path is the real one).
 */

const prisma = getPrisma();
const WEBHOOK_SECRET = "whsec_test_" + randomUUID().replace(/-/g, "");
const stripeForSigning = new Stripe("sk_test_signing_helper_only");

let flagship: ProgrammeRecord;
let admin: { id: string };
const createdUsers: string[] = [];
const createdOfferings: string[] = [];
const createdCoupons: string[] = [];

function fakeGateway() {
  const sessions: CheckoutSessionInput[] = [];
  const gateway: PaymentGateway & { sessions: CheckoutSessionInput[] } = {
    sessions,
    async createCheckoutSession(input) {
      sessions.push(input);
      return { id: `cs_test_${randomUUID().slice(0, 12)}`, url: `https://checkout.stripe.test/${input.orderId}` };
    },
    async createRefund() {
      return { id: `re_test_${randomUUID().slice(0, 12)}`, status: "succeeded" };
    },
    async retrieveProcessingFee() {
      return { feeMinor: 100, currency: "USD" };
    },
    constructEvent(rawBody, signature) {
      return verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET);
    },
  };
  return gateway;
}

async function createUser(country: string) {
  const user = await prisma.user.create({ data: { email: uniqueEmail("coupon"), name: `Coupon ${country}`, country } });
  createdUsers.push(user.id);
  await completeProfile(user.id, { countryCode: countryCodeFor(country) ?? "US", nationalityCode: countryCodeFor(country) ?? "US" });
  return user;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function createOffering() {
  const row = await prisma.scheduledOffering.create({
    data: {
      programmeId: flagship.id,
      deliveryFormatId: flagship.deliveryFormats[0]?.id ?? null,
      modality: "live_online",
      timezone: "Asia/Kuala_Lumpur",
      startsOn: daysFromNow(40),
      endsOn: daysFromNow(42),
      capacity: null,
      status: "open",
    },
  });
  createdOfferings.push(row.id);
  return row;
}

async function makeCoupon(input: { email: string; discountPercent: number; programmeId?: string; expiresAt?: Date | null }) {
  const coupon = await withTransaction((tx) =>
    createCoupon(tx, {
      email: input.email,
      programmeId: input.programmeId ?? flagship.id,
      discountPercent: input.discountPercent,
      expiresAt: input.expiresAt ?? null,
      actorUserId: admin.id,
    }),
  );
  createdCoupons.push(coupon.id);
  return coupon;
}

function sessionCompletedEvent(order: { id: string; amountMinor: bigint; currency: string }) {
  return JSON.stringify({
    id: `evt_test_${randomUUID().replace(/-/g, "")}`,
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
        payment_intent: `pi_test_${randomUUID().slice(0, 12)}`,
        amount_total: Number(order.amountMinor),
        currency: order.currency.toLowerCase(),
        customer_email: "someone@example.test",
      },
    },
  });
}

async function payOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const payload = sessionCompletedEvent(order);
  await handleStripeWebhook(payload, stripeForSigning.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET }), fakeGateway());
}

beforeAll(async () => {
  const p = await findFlagshipProgramme();
  if (!p) throw new Error("seeded flagship programme required");
  flagship = p;
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  const row = await prisma.user.create({ data: { email: uniqueEmail("coupon-admin"), name: "Coupon Admin" } });
  createdUsers.push(row.id);
  admin = { id: row.id };
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(async () => {
  const orderIds = (await prisma.order.findMany({ where: { userId: { in: createdUsers } }, select: { id: true } })).map((o) => o.id);
  const paymentIds = (await prisma.payment.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((p) => p.id);
  const registrationIds = (await prisma.registration.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((r) => r.id);
  await prisma.$transaction([
    // Orders reference coupons (coupon_id) AND coupons reference orders
    // (redeemed_order_id), both Restrict: clear the first, then delete the
    // coupons, then the orders.
    prisma.order.updateMany({ where: { couponId: { in: createdCoupons } }, data: { couponId: null } }),
    prisma.coupon.deleteMany({ where: { id: { in: createdCoupons } } }),
    prisma.registration.deleteMany({ where: { id: { in: registrationIds } } }),
    prisma.payment.deleteMany({ where: { id: { in: paymentIds } } }),
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.auditLog.deleteMany({ where: { entityId: { in: [...orderIds, ...registrationIds, ...createdCoupons, ...createdUsers] } } }),
    prisma.auditLog.deleteMany({ where: { actorUserId: { in: createdUsers } } }),
    prisma.consent.deleteMany({ where: { userId: { in: createdUsers } } }),
    prisma.userProfile.deleteMany({ where: { userId: { in: createdUsers } } }),
    prisma.outboundEmail.deleteMany({ where: { toEmail: { endsWith: "@example.test" } } }),
    prisma.stripeEvent.deleteMany({ where: { id: { startsWith: "evt_test_" } } }),
    prisma.scheduledOffering.deleteMany({ where: { id: { in: createdOfferings } } }),
    prisma.user.deleteMany({ where: { id: { in: createdUsers } } }),
  ]);
  await disconnectPrisma();
});

/* ============================================================= pure maths */

describe("code generation and the floor (spec §4, §7; N2, N8)", () => {
  it("codes are TRN- + 6 characters from the unambiguous alphabet; matching is case-insensitive", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateCouponCode()).toMatch(/^TRN-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
    }
    expect(generateCouponCode(() => 0)).toBe("TRN-222222"); // injectable random, deterministic
    expect(normaliseCouponCode("  trn-x7k9p2 ")).toBe("TRN-X7K9P2");
  });

  it("the §7 table on USD 100: 50%→50, 90%→10, 98%→2, 99%→2 (floored); a list below the floor never charges more than the list", () => {
    expect(priceWithCoupon(10000, 50)).toEqual({ listMinor: 10000, finalMinor: 5000, discountMinor: 5000, floorApplied: false });
    expect(priceWithCoupon(10000, 90)).toEqual({ listMinor: 10000, finalMinor: 1000, discountMinor: 9000, floorApplied: false });
    expect(priceWithCoupon(10000, 98)).toEqual({ listMinor: 10000, finalMinor: COUPON_FLOOR_MINOR, discountMinor: 9800, floorApplied: false });
    expect(priceWithCoupon(10000, 99)).toEqual({ listMinor: 10000, finalMinor: COUPON_FLOOR_MINOR, discountMinor: 9800, floorApplied: true });
    expect(priceWithCoupon(10000, 100)).toEqual({ listMinor: 10000, finalMinor: COUPON_FLOOR_MINOR, discountMinor: 9800, floorApplied: true });
    // A training cheaper than the floor is never charged MORE because of a coupon.
    expect(priceWithCoupon(150, 10).finalMinor).toBe(150);
  });
});

/* ============================================================= admin CRUD */

describe("admin management (spec §2/§3/§12; N7)", () => {
  it("creates a coupon — email lower-cased, audited; refuses a bad email, an out-of-range percent, an unknown training", async () => {
    const coupon = await makeCoupon({ email: "  Person@Example.TEST ", discountPercent: 98 });
    expect(coupon.email).toBe("person@example.test");
    expect(coupon.code).toMatch(/^TRN-/);
    expect(couponDisplayStatus(coupon)).toBe("Active");
    const audit = await listAuditForEntity(prisma, "coupon", coupon.id);
    expect(audit.map((a) => a.action)).toEqual(["coupon.created"]);

    await expect(makeCoupon({ email: "not-an-email", discountPercent: 50 })).rejects.toThrow(CouponAdminError);
    await expect(makeCoupon({ email: "x@example.test", discountPercent: 0 })).rejects.toThrow(CouponAdminError);
    await expect(makeCoupon({ email: "x@example.test", discountPercent: 101 })).rejects.toThrow(CouponAdminError);
    await expect(makeCoupon({ email: "x@example.test", discountPercent: 50, programmeId: randomUUID() })).rejects.toThrow(CouponAdminError);
  });

  it("edits, disables and deletes an unredeemed coupon, each audited; the derived statuses read Disabled and Expired", async () => {
    const coupon = await makeCoupon({ email: "edit@example.test", discountPercent: 10 });
    const updated = await withTransaction((tx) =>
      updateCoupon(tx, { id: coupon.id, email: "other@example.test", programmeId: flagship.id, discountPercent: 25, expiresAt: null, actorUserId: admin.id }),
    );
    expect([updated.email, updated.discountPercent]).toEqual(["other@example.test", 25]);

    const disabled = await withTransaction((tx) => setCouponStatus(tx, { id: coupon.id, status: "disabled", actorUserId: admin.id }));
    expect(couponDisplayStatus(disabled)).toBe("Disabled");

    const expired = await makeCoupon({ email: "old@example.test", discountPercent: 10, expiresAt: new Date(Date.now() - 60_000) });
    expect(couponDisplayStatus(expired)).toBe("Expired");

    await withTransaction((tx) => deleteCoupon(tx, { id: coupon.id, actorUserId: admin.id }));
    expect(await prisma.coupon.findUnique({ where: { id: coupon.id } })).toBeNull();
    const audit = await listAuditForEntity(prisma, "coupon", coupon.id);
    expect(audit.map((a) => a.action)).toEqual(["coupon.created", "coupon.updated", "coupon.status_changed", "coupon.deleted"]);
  });
});

/* ============================================================ validation */

describe("the §6 validation matrix", () => {
  it("refuses: unknown code, disabled, expired, wrong email, wrong training, payment in progress", async () => {
    const user = await createUser("Singapore");
    const check = (code: string, email = user.email) => validateCoupon({ code, userEmail: email, programmeId: flagship.id });

    expect(await check("TRN-NOPE99")).toEqual({ ok: false, reason: "coupon_not_found" });

    const disabled = await makeCoupon({ email: user.email, discountPercent: 50 });
    await withTransaction((tx) => setCouponStatus(tx, { id: disabled.id, status: "disabled", actorUserId: admin.id }));
    expect(await check(disabled.code)).toEqual({ ok: false, reason: "coupon_disabled" });

    const expired = await makeCoupon({ email: user.email, discountPercent: 50, expiresAt: new Date(Date.now() - 60_000) });
    expect(await check(expired.code)).toEqual({ ok: false, reason: "coupon_expired" });

    const wrongEmail = await makeCoupon({ email: "someone-else@example.test", discountPercent: 50 });
    expect(await check(wrongEmail.code)).toEqual({ ok: false, reason: "coupon_email_mismatch" });

    const other = await prisma.programme.findFirst({ where: { id: { not: flagship.id } }, select: { id: true } });
    if (other) {
      const wrongTraining = await makeCoupon({ email: user.email, discountPercent: 50, programmeId: other.id });
      expect(await validateCoupon({ code: wrongTraining.code, userEmail: user.email, programmeId: flagship.id })).toEqual({ ok: false, reason: "coupon_wrong_training" });
    }

    // A live pending order carrying the coupon blocks a second use (N3).
    const inProgress = await makeCoupon({ email: user.email, discountPercent: 50 });
    const offering = await createOffering();
    await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, couponCode: inProgress.code.toLowerCase(), gateway: fakeGateway() });
    expect(await check(inProgress.code)).toEqual({ ok: false, reason: "coupon_payment_in_progress" });

    // A valid one, case-insensitively.
    const valid = await makeCoupon({ email: user.email.toUpperCase(), discountPercent: 98 });
    const result = await validateCoupon({ code: valid.code.toLowerCase(), userEmail: user.email, programmeId: flagship.id });
    expect(result.ok).toBe(true);
  });
});

/* ============================================== checkout → webhook → used */

describe("checkout with a coupon (spec §9, §15; N2–N5)", () => {
  it("prices the order server-side, charges the gateway the discounted amount, redeems on the webhook, then refuses reuse — and a webhook replay changes nothing", async () => {
    const user = await createUser("Singapore"); // international → USD
    const usd = flagship.prices.find((p) => p.region === "international")!;
    const coupon = await makeCoupon({ email: user.email, discountPercent: 98 });
    const offering = await createOffering();
    const gateway = fakeGateway();

    await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, couponCode: coupon.code, gateway });
    const order = await prisma.order.findFirstOrThrow({ where: { userId: user.id, offeringId: offering.id } });
    const expected = priceWithCoupon(usd.offerAmountMinor, 98).finalMinor;
    expect(Number(order.amountMinor)).toBe(expected);
    expect(Number(order.amountBeforeCouponMinor)).toBe(usd.offerAmountMinor);
    expect(order.couponDiscountPercent).toBe(98);
    expect(order.couponId).toBe(coupon.id);
    expect(gateway.sessions[0]!.amountMinor).toBe(expected); // Stripe is asked for the discounted figure, nothing else

    await payOrder(order.id);
    const redeemed = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } });
    expect(redeemed.redeemedAt).not.toBeNull();
    expect(redeemed.redeemedByUserId).toBe(user.id);
    expect(redeemed.redeemedOrderId).toBe(order.id);
    expect((await listAuditForEntity(prisma, "coupon", coupon.id)).map((a) => a.action)).toContain("coupon.redeemed");

    // The admin table reads the REAL recorded figures.
    const listed = (await listCoupons()).find((c) => c.id === coupon.id)!;
    expect([listed.paidAmountMinor, listed.amountBeforeCouponMinor, couponDisplayStatus(listed)]).toEqual([expected, usd.offerAmountMinor, "Used"]);

    // Used → cannot be validated, edited or deleted; a replayed webhook changes nothing.
    expect(await validateCoupon({ code: coupon.code, userEmail: user.email, programmeId: flagship.id })).toEqual({ ok: false, reason: "coupon_used" });
    await expect(
      withTransaction((tx) => updateCoupon(tx, { id: coupon.id, email: "x@example.test", programmeId: flagship.id, discountPercent: 1, expiresAt: null, actorUserId: admin.id })),
    ).rejects.toThrow(CouponAdminError);
    await expect(withTransaction((tx) => deleteCoupon(tx, { id: coupon.id, actorUserId: admin.id }))).rejects.toThrow(CouponAdminError);
    const firstRedeemedAt = redeemed.redeemedAt;
    await payOrder(order.id);
    expect((await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).redeemedAt).toEqual(firstRedeemedAt);
  });

  it("a 100% coupon still charges the 2.00 floor; an invalid coupon refuses the checkout and creates no order", async () => {
    const user = await createUser("Singapore");
    const coupon = await makeCoupon({ email: user.email, discountPercent: 100 });
    const offering = await createOffering();
    const gateway = fakeGateway();
    await startCheckout({ userId: user.id, offeringId: offering.id, consent: true, couponCode: coupon.code, gateway });
    expect(gateway.sessions[0]!.amountMinor).toBe(COUPON_FLOOR_MINOR);

    const other = await createUser("Singapore");
    const notTheirs = await makeCoupon({ email: user.email, discountPercent: 50 });
    const offering2 = await createOffering();
    await expect(startCheckout({ userId: other.id, offeringId: offering2.id, consent: true, couponCode: notTheirs.code, gateway: fakeGateway() })).rejects.toMatchObject({
      code: "coupon_email_mismatch",
    } satisfies Partial<CommerceError>);
    expect(await prisma.order.findFirst({ where: { userId: other.id } })).toBeNull();
  });
});
