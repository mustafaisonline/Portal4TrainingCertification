import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { listOrdersForAdmin } from "@/modules/commerce/admin-orders.repository";
import { CommerceError, PaymentsNotConfiguredError } from "@/modules/commerce/errors";
import { listOrdersForUser } from "@/modules/commerce/registrations.service";
import type { CheckoutSessionInput, PaymentGateway } from "@/modules/commerce/stripe";
import { verifyStripeSignature } from "@/modules/commerce/stripe";
import {
  createSupportSetting,
  currentSupportSetting,
  enabledSupportSetting,
  listSupportHistory,
  SupportSettingValidationError,
} from "@/modules/commerce/support.repository";
import { findSupportOrderForUser, startSupportCheckout } from "@/modules/commerce/support.service";
import { handleStripeWebhook } from "@/modules/commerce/webhook.service";
import { buildDataExport } from "@/modules/identity/data-export";
import { getUserForAdmin } from "@/modules/identity/admin-users.repository";
import { grantRole } from "@/modules/identity/roles.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { latestEmail, uniqueEmail } from "../helpers/identity-db";

/*
 * "Support the Academy" (founder decisions M1–M5, 2026-09-27) against the
 * REAL test database with a FAKE gateway (the Stripe SDK is used only for its
 * official signature helper): the setting's history and validation; a
 * checkout that bypasses the profile gate, records a `support` order with
 * no offering or programme, and refuses when disabled or already pending;
 * the signed webhook marking it paid with a payment row, audit and a
 * thank-you; and every order read model tolerating the new kind.
 */

const prisma = getPrisma();
const run = randomUUID().slice(0, 8);
const WEBHOOK_SECRET = "whsec_test_support";
const stripeForSigning = new Stripe("sk_test_signing_only");
let admin: { id: string };
let person: { id: string; email: string; name: string };
const createdOrderIds: string[] = [];
const createdSettingIds: string[] = [];

function fakeGateway() {
  const sessions: CheckoutSessionInput[] = [];
  const gateway: PaymentGateway & { sessions: CheckoutSessionInput[] } = {
    sessions,
    async createCheckoutSession(input) {
      sessions.push(input);
      return { id: `cs_test_${randomUUID().slice(0, 12)}`, url: `https://checkout.stripe.test/${input.orderId}` };
    },
    async createRefund() {
      throw new Error("not used");
    },
    async retrieveProcessingFee() {
      return null;
    },
    constructEvent(rawBody, signature) {
      return verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET);
    },
  };
  return gateway;
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
const sign = (payload: string) => stripeForSigning.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });

beforeAll(async () => {
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.APP_BASE_URL ??= "http://localhost:3101";
  const a = await prisma.user.create({ data: { email: uniqueEmail("support-admin"), name: "Sam Admin", country: "Malaysia" }, select: { id: true } });
  admin = a;
  await withTransaction((tx) => grantRole(tx, { userId: a.id, role: "platform_admin", grantedByUserId: null, reason: "test" }));
  // A person with NO profile at all — the point of M4 (no profile gate).
  person = await prisma.user.create({ data: { email: uniqueEmail("support-person"), name: `Pat Payer ${run}`, country: "Malaysia" }, select: { id: true, email: true, name: true } });
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(async () => {
  if (createdOrderIds.length) {
    await prisma.auditLog.deleteMany({ where: { entityType: "order", entityId: { in: createdOrderIds } } });
    for (const id of createdOrderIds) await prisma.stripeEvent.deleteMany({ where: { payload: { path: ["data", "object", "client_reference_id"], equals: id } } }).catch(() => undefined);
    await prisma.payment.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  }
  if (createdSettingIds.length) {
    await prisma.auditLog.deleteMany({ where: { entityType: "support_payment_setting", entityId: { in: createdSettingIds } } });
    await prisma.supportPaymentSetting.deleteMany({ where: { id: { in: createdSettingIds } } });
  }
  await prisma.outboundEmail.deleteMany({ where: { toEmail: person.email } }).catch(() => undefined);
  for (const u of [admin, person]) {
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorUserId: u.id }, { entityType: "user", entityId: u.id }] } });
    await prisma.userRole.deleteMany({ where: { userId: u.id } });
    await prisma.user.deleteMany({ where: { id: u.id } });
  }
  await disconnectPrisma();
});

describe("the setting (insert-only, effective-dated, audited)", () => {
  it("is seeded enabled at RM 2.00 and readable as 'in force' and 'enabled'", async () => {
    const current = await currentSupportSetting();
    expect(current).toMatchObject({ enabled: true, currency: "MYR", amountMinor: 200, label: "Support the Academy" });
    expect((await enabledSupportSetting())?.id).toBe(current!.id);
  });

  it("validation: amount below Stripe's MYR minimum, bad currency, blank label, past effective time", async () => {
    const now = new Date();
    await expect(withTransaction((tx) => createSupportSetting(tx, { enabled: true, amountMinor: 100, currency: "MYR", label: "x", effectiveFrom: now }, admin.id, now))).rejects.toSatisfy(
      (e: unknown) => e instanceof SupportSettingValidationError && /minimum charge in MYR is 2.00/.test(e.fieldErrors["amountMinor"] ?? ""),
    );
    await expect(withTransaction((tx) => createSupportSetting(tx, { enabled: true, amountMinor: 200, currency: "RM", label: "", effectiveFrom: new Date(now.getTime() - 3_600_000) }, admin.id, now))).rejects.toSatisfy(
      (e: unknown) => e instanceof SupportSettingValidationError && ["currency", "label", "effectiveFrom"].every((k) => k in e.fieldErrors),
    );
  });

  it("a new setting appends to the history and writes support_payment.changed with before/after", async () => {
    const now = new Date();
    const row = await withTransaction((tx) => createSupportSetting(tx, { enabled: false, amountMinor: 500, currency: "MYR", label: `Support ${run}`, effectiveFrom: now, note: `test ${run}` }, admin.id, now));
    createdSettingIds.push(row.id);
    expect((await currentSupportSetting(new Date(now.getTime() + 1000)))?.id).toBe(row.id);
    expect(await enabledSupportSetting(new Date(now.getTime() + 1000))).toBeNull();
    expect((await listSupportHistory())[0]!.id).toBe(row.id);
    const audit = await listAuditForEntity(prisma, "support_payment_setting", row.id);
    expect(audit.map((a) => a.action)).toEqual(["support_payment.changed"]);
    expect((audit[0]!.before as { amountMinor: number }).amountMinor).toBe(200);
    expect((audit[0]!.after as { enabled: boolean }).enabled).toBe(false);
    // Restore: enabled again from now on, so the tests below (and the seed's
    // intent) see the payment available.
    const back = await withTransaction((tx) => createSupportSetting(tx, { enabled: true, amountMinor: 200, currency: "MYR", label: "Support the Academy", effectiveFrom: new Date(), note: `restore ${run}` }, admin.id));
    createdSettingIds.push(back.id);
  });
});

describe("checkout → webhook → read models", () => {
  let orderId: string;

  it("refuses without Stripe keys, before creating any order", async () => {
    const before = await prisma.order.count({ where: { userId: person.id } });
    const saved = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      await expect(startSupportCheckout({ userId: person.id })).rejects.toBeInstanceOf(PaymentsNotConfiguredError);
    } finally {
      if (saved !== undefined) process.env.STRIPE_SECRET_KEY = saved;
    }
    expect(await prisma.order.count({ where: { userId: person.id } })).toBe(before);
  });

  it("creates a pending `support` order with NO offering or programme, at the setting's amount, no profile needed; Stripe gets the label", async () => {
    const gateway = fakeGateway();
    const { orderId: id, url } = await startSupportCheckout({ userId: person.id, gateway });
    orderId = id;
    createdOrderIds.push(id);
    expect(url).toBe(`https://checkout.stripe.test/${id}`);
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(order).toMatchObject({ kind: "support", status: "pending", offeringId: null, programmeId: null, currency: "MYR", region: "malaysia" });
    expect(Number(order.amountMinor)).toBe(200);
    expect(order.stripeCheckoutSessionId).toMatch(/^cs_test_/);
    expect(gateway.sessions[0]).toMatchObject({ orderId: id, amountMinor: 200, currency: "MYR", productName: "Support the Academy", customerEmail: person.email });
    expect(gateway.sessions[0]!.successUrl).toMatch(new RegExp(`/support\\?order=${id}$`));
    const audit = await listAuditForEntity(prisma, "order", id);
    expect(audit.map((a) => a.action)).toEqual(["order.created"]);
    expect((audit[0]!.after as { kind: string }).kind).toBe("support");
  });

  it("a second attempt while the first hold is live is refused", async () => {
    await expect(startSupportCheckout({ userId: person.id, gateway: fakeGateway() })).rejects.toSatisfy((e: unknown) => e instanceof CommerceError && e.code === "support_order_pending");
  });

  it("the signed checkout.session.completed marks it paid: payment row, audit, thank-you email; no registration; replay changes nothing", async () => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const payload = sessionCompletedEvent(order);
    const first = await handleStripeWebhook(payload, sign(payload), fakeGateway());
    expect(first.status).toBe("processed");
    const paid = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payment: true, registration: true } });
    expect(paid.status).toBe("paid");
    expect(paid.paidAt).not.toBeNull();
    expect(paid.payment).toMatchObject({ status: "succeeded", currency: "MYR" });
    expect(Number(paid.payment!.amountMinor)).toBe(200);
    expect(paid.registration).toBeNull();
    const audit = (await listAuditForEntity(prisma, "order", orderId)).map((a) => a.action);
    expect(audit).toEqual(["order.created", "payment.succeeded"]);
    const email = await latestEmail(person.email, "commerce.support-received");
    expect(email?.subject).toBe("Thank you — Support the Academy");
    // Replay: the event id is the same → stored once, nothing changes.
    const again = await handleStripeWebhook(payload, sign(payload), fakeGateway());
    expect(again.status).toMatch(/duplicate|processed/);
    expect((await listAuditForEntity(prisma, "order", orderId)).length).toBe(2);
  });

  it("the person's return banner, their orders, the admin list and the data export all show the support order", async () => {
    const view = await findSupportOrderForUser(orderId, person.id);
    expect(view).toMatchObject({ id: orderId, effectiveStatus: "paid", amountMinor: 200, currency: "MYR" });
    expect(await findSupportOrderForUser(orderId, admin.id)).toBeNull(); // not theirs
    const mine = await listOrdersForUser(person.id);
    expect(mine[0]).toMatchObject({ id: orderId, kind: "support", programmeTitle: "Support the Academy", formatName: "One-off payment", startsOn: null, endsOn: null });
    const adminList = await listOrdersForAdmin({ kind: "support", q: person.email });
    expect(adminList.items.map((o) => o.id)).toEqual([orderId]);
    expect(adminList.items[0]).toMatchObject({ programmeTitle: "Support the Academy", startsOn: null });
    const detail = await getUserForAdmin(person.id);
    expect(detail?.orders.map((o) => [o.kind, o.programmeTitle])).toEqual([["support", "Support the Academy"]]);
    const exported = await buildDataExport(person.id);
    expect((exported!.orders[0] as { programmeTitle: string; kind: string }).programmeTitle).toBe("Support the Academy");
  });

  it("with the setting disabled, a new payment is refused", async () => {
    const off = await withTransaction((tx) => createSupportSetting(tx, { enabled: false, amountMinor: 200, currency: "MYR", label: "Support the Academy", effectiveFrom: new Date(), note: `off ${run}` }, admin.id));
    createdSettingIds.push(off.id);
    try {
      await expect(startSupportCheckout({ userId: person.id, gateway: fakeGateway(), now: new Date(Date.now() + 1000) })).rejects.toSatisfy((e: unknown) => e instanceof CommerceError && e.code === "support_unavailable");
    } finally {
      const on = await withTransaction((tx) => createSupportSetting(tx, { enabled: true, amountMinor: 200, currency: "MYR", label: "Support the Academy", effectiveFrom: new Date(), note: `on ${run}` }, admin.id));
      createdSettingIds.push(on.id);
    }
  });
});
