import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { AGENTIC_ITEMS } from "@/content/agentic/catalogue";
import { startAgenticCheckout } from "@/modules/agentic/checkout";
import { claimWithCredit, creditsLeft, downloadAccess, fulfilPaidAgenticOrder, hasActivePass, hasActivePortalPass, ownedSlugs } from "@/modules/agentic/entitlements";
import { runPassEndingReminders } from "@/modules/agentic/pass-reminders";
import { amountFor, parseSku, skuOfItem, skuOfPass, SKU_PACK10 } from "@/modules/agentic/products";
import { CommerceError } from "@/modules/commerce/errors";
import { listOrdersForUser } from "@/modules/commerce/registrations.service";
import type { CheckoutSessionInput, PaymentGateway } from "@/modules/commerce/stripe";
import { verifyStripeSignature } from "@/modules/commerce/stripe";
import { buildDataExport } from "@/modules/identity/data-export";
import { unlockStatusForAttempt } from "@/modules/commerce/unlock.service";
import { handleStripeWebhook } from "@/modules/commerce/webhook.service";
import { createReview } from "@/modules/reviews/repository";
import { flagshipProgramme } from "../helpers/certificates-db";
import { createCertificateUser } from "../helpers/certificates-db";
import { deleteTestUser, latestEmail } from "../helpers/identity-db";

/*
 * Agentic AI products (CR-2026-10-04-0112 / -0113) against the REAL test database with a FAKE gateway: the checkout's
 * refusals and its pending order (kind + SKU + OUR amount); the signed webhook granting an item / a 10-credit pack / a
 * 365-day pass, idempotently, with the purchase email; the atomic credit spend (13 parallel claims, 10 credits → exactly 10);
 * pass extension and expiry; the orders list naming the product.
 */

const run = randomUUID().slice(0, 8);
const WEBHOOK_SECRET = "whsec_test_agentic";
const signer = new Stripe("sk_test_signing_only");
const sign = (payload: string) => signer.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
const prisma = getPrisma();
let buyer: { id: string; email: string; name: string };
let packBuyer: { id: string; email: string; name: string };
let passBuyer: { id: string; email: string; name: string };
const slugs = AGENTIC_ITEMS.map((i) => i.slug);

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
    constructEvent: (raw, sig) => verifyStripeSignature(raw, sig, WEBHOOK_SECRET),
  };
  return gateway;
}

function paidEvent(order: { id: string; amountMinor: bigint; currency: string }) {
  return JSON.stringify({
    id: `evt_test_${randomUUID().replace(/-/g, "")}`,
    object: "event",
    api_version: "2026-01-01",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: "checkout.session.completed",
    data: { object: { id: `cs_test_${randomUUID().slice(0, 12)}`, object: "checkout.session", mode: "payment", status: "complete", payment_status: "paid", client_reference_id: order.id, metadata: { orderId: order.id }, payment_intent: `pi_test_${randomUUID().slice(0, 12)}`, amount_total: Number(order.amountMinor), currency: order.currency.toLowerCase(), customer_email: "x@example.test" } },
  });
}

async function buy(userId: string, sku: string) {
  const gw = fakeGateway();
  const started = await startAgenticCheckout({ userId, sku, acknowledged: true, gateway: gw });
  const order = await prisma.order.findUniqueOrThrow({ where: { id: started.orderId } });
  const payload = paidEvent(order);
  await handleStripeWebhook(payload, sign(payload), gw);
  return { started, order, gw, payload };
}

beforeAll(async () => {
  process.env["STRIPE_WEBHOOK_SECRET"] = WEBHOOK_SECRET;
  process.env["APP_BASE_URL"] ??= "http://localhost:3101";
  buyer = await createCertificateUser({ prefix: "agentic-buyer", legalName: `Ben Buyer ${run}` });
  packBuyer = await createCertificateUser({ prefix: "agentic-pack", legalName: `Pia Pack ${run}` });
  passBuyer = await createCertificateUser({ prefix: "agentic-pass", legalName: `Pax Pass ${run}` });
});
afterAll(async () => {
  for (const u of [buyer, packBuyer, passBuyer]) {
    const orders = await prisma.order.findMany({ where: { userId: u.id }, select: { id: true } });
    const ids = orders.map((o) => o.id);
    await prisma.auditLog.deleteMany({ where: { entityType: "order", entityId: { in: ids } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: u.id } });
    await prisma.outboundEmail.deleteMany({ where: { toEmail: u.email.toLowerCase() } });
    await prisma.notification.deleteMany({ where: { userId: u.id } });
    await prisma.agenticOwnership.deleteMany({ where: { userId: u.id } });
    await prisma.agenticCreditPack.deleteMany({ where: { userId: u.id } });
    await prisma.accessPass.deleteMany({ where: { userId: u.id } });
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await deleteTestUser(u.email);
  }
  await prisma.stripeEvent.deleteMany({ where: { payload: { path: ["data", "object", "customer_email"], equals: "x@example.test" } } });
  await disconnectPrisma();
});

describe("products", () => {
  it("prices are the founder's fixed prices, parsed from OUR sku — an unknown item or sku is refused", () => {
    expect(amountFor(parseSku(skuOfItem("delivery-advisor"))!)).toBe(200);
    expect(amountFor(parseSku(SKU_PACK10)!)).toBe(1000);
    expect(amountFor(parseSku(skuOfPass("agentic_unlimited"))!)).toBe(1000);
    expect(amountFor(parseSku(skuOfPass("portal_unlimited"))!)).toBe(2000);
    expect(parseSku("item:not-in-the-catalogue")).toBeNull();
    expect(parseSku("pass:forever")).toBeNull();
    expect(parseSku("pack:50")).toBeNull(); // the 50 and 100 packs are not offered yet
    expect(parseSku(null)).toBeNull();
  });
});

describe("buying one item", () => {
  it("creates a pending order from OUR catalogue (the amount is never the browser's), refuses an unacknowledged or unknown product", async () => {
    const gw = fakeGateway();
    await expect(startAgenticCheckout({ userId: buyer.id, sku: "item:nope", acknowledged: true, gateway: gw })).rejects.toMatchObject({ code: "agentic_unknown_product" });
    await expect(startAgenticCheckout({ userId: buyer.id, sku: skuOfItem("next-steps"), acknowledged: false, gateway: gw })).rejects.toMatchObject({ code: "agentic_not_acknowledged" });
    const r = await startAgenticCheckout({ userId: buyer.id, sku: skuOfItem("next-steps"), acknowledged: true, gateway: gw });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    expect(order).toMatchObject({ kind: "agentic_item", productSku: "item:next-steps", status: "pending", currency: "USD", offeringId: null, programmeId: null });
    expect(Number(order.amountMinor)).toBe(200);
    expect(gw.sessions[0]).toMatchObject({ amountMinor: 200, currency: "USD", orderId: order.id });
    // A second open checkout for the same product is refused while the first is pending.
    await expect(startAgenticCheckout({ userId: buyer.id, sku: skuOfItem("next-steps"), acknowledged: true, gateway: gw })).rejects.toMatchObject({ code: "agentic_order_pending" });
    await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } });
  });

  it("the signed webhook grants the item once (a replay changes nothing) and queues the purchase email; the orders list names the product", async () => {
    const { order, payload, gw } = await buy(buyer.id, skuOfItem("impact-analysis"));
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("paid");
    expect([...(await ownedSlugs(buyer.id))]).toContain("impact-analysis");
    expect(await downloadAccess(buyer.id, "impact-analysis")).toBe("owned");
    expect(await downloadAccess(buyer.id, "resume-work")).toBe("none");
    const mail = await latestEmail(buyer.email, "commerce.agentic-purchase");
    expect(mail?.subject).toContain("Impact Analysis");
    expect(mail?.textBody).toContain("non-refundable");
    await handleStripeWebhook(payload, sign(payload), gw); // exact replay of the same Stripe event
    expect(await prisma.agenticOwnership.count({ where: { userId: buyer.id, itemSlug: "impact-analysis" } })).toBe(1);
    expect(await prisma.outboundEmail.count({ where: { toEmail: buyer.email.toLowerCase(), templateKey: "commerce.agentic-purchase" } })).toBe(1);
    const titles = (await listOrdersForUser(buyer.id)).map((o) => o.programmeTitle);
    expect(titles).toContain("Agentic AI — Impact Analysis");
    // The person's own data export includes what they own (PDPA).
    const exported = await buildDataExport(buyer.id);
    expect(exported!.agentic.ownerships.map((o) => o["itemSlug"])).toContain("impact-analysis");
    // Owning it, the person cannot buy it again.
    await expect(startAgenticCheckout({ userId: buyer.id, sku: skuOfItem("impact-analysis"), acknowledged: true, gateway: fakeGateway() })).rejects.toMatchObject({ code: "agentic_already_owned" });
  });
});

describe("the 10-pack", () => {
  it("grants 10 credits; each claim spends one and gives the item; re-claiming an owned item is free; the 11th claim is refused", async () => {
    await buy(packBuyer.id, SKU_PACK10);
    expect(await creditsLeft(packBuyer.id)).toBe(10);
    const first = await withTransaction((tx) => claimWithCredit(tx, packBuyer.id, slugs[0]!));
    expect(first).toEqual({ ok: true, how: "credit" });
    expect(await creditsLeft(packBuyer.id)).toBe(9);
    expect(await withTransaction((tx) => claimWithCredit(tx, packBuyer.id, slugs[0]!))).toEqual({ ok: true, how: "already_owned" });
    expect(await creditsLeft(packBuyer.id)).toBe(9); // owned items cost nothing
    for (const s of slugs.slice(1, 10)) expect((await withTransaction((tx) => claimWithCredit(tx, packBuyer.id, s))).ok).toBe(true);
    expect(await creditsLeft(packBuyer.id)).toBe(0);
    expect(await withTransaction((tx) => claimWithCredit(tx, packBuyer.id, slugs[10]!))).toEqual({ ok: false, reason: "no_credit" });
    expect(await ownedSlugs(packBuyer.id)).toEqual(new Set(slugs.slice(0, 10)));
  });

  it("parallel claims can never spend more credits than exist: 13 at once on a fresh pack → exactly 10 succeed", async () => {
    const racer = await createCertificateUser({ prefix: "agentic-race", legalName: `Ray Racer ${run}` });
    try {
      await buy(racer.id, SKU_PACK10);
      const results = await Promise.all(slugs.map((s) => withTransaction((tx) => claimWithCredit(tx, racer.id, s)).catch(() => ({ ok: false as const, reason: "error" }))));
      expect(results.filter((r) => r.ok)).toHaveLength(10);
      expect(await creditsLeft(racer.id)).toBe(0);
      expect(await prisma.agenticOwnership.count({ where: { userId: racer.id } })).toBe(10);
      const pack = await prisma.agenticCreditPack.findFirstOrThrow({ where: { userId: racer.id } });
      expect(pack.creditsUsed).toBe(10);
    } finally {
      const ids = (await prisma.order.findMany({ where: { userId: racer.id }, select: { id: true } })).map((o) => o.id);
      await prisma.auditLog.deleteMany({ where: { OR: [{ entityType: "order", entityId: { in: ids } }, { actorUserId: racer.id }] } });
      await prisma.outboundEmail.deleteMany({ where: { toEmail: racer.email.toLowerCase() } });
      await prisma.notification.deleteMany({ where: { userId: racer.id } });
      await prisma.agenticOwnership.deleteMany({ where: { userId: racer.id } });
      await prisma.agenticCreditPack.deleteMany({ where: { userId: racer.id } });
      await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
      await prisma.order.deleteMany({ where: { id: { in: ids } } });
      await deleteTestUser(racer.email);
    }
  });
});

describe("annual passes", () => {
  it("a pass lasts 365 days, covers every item, makes single/pack purchases pointless, and the Portal pass is the one that unlocks result documents", async () => {
    const before = Date.now();
    await buy(passBuyer.id, skuOfPass("agentic_unlimited"));
    const pass = await prisma.accessPass.findFirstOrThrow({ where: { userId: passBuyer.id, plan: "agentic_unlimited" } });
    const days = (pass.endsAt.getTime() - pass.startsAt.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(365);
    expect(pass.startsAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(await hasActivePass(passBuyer.id)).toBe(true);
    expect(await hasActivePortalPass(passBuyer.id)).toBe(false); // Agentic AI Unlimited does not unlock result documents
    expect(await downloadAccess(passBuyer.id, "resume-work")).toBe("pass");
    await expect(startAgenticCheckout({ userId: passBuyer.id, sku: skuOfItem("resume-work"), acknowledged: true, gateway: fakeGateway() })).rejects.toMatchObject({ code: "agentic_covered_by_pass" });
    await expect(startAgenticCheckout({ userId: passBuyer.id, sku: SKU_PACK10, acknowledged: true, gateway: fakeGateway() })).rejects.toMatchObject({ code: "agentic_covered_by_pass" });
    expect(await withTransaction((tx) => claimWithCredit(tx, passBuyer.id, "next-steps"))).toEqual({ ok: true, how: "pass" }); // no credit is spent
    // The Portal pass adds the result-document unlock.
    await buy(passBuyer.id, skuOfPass("portal_unlimited"));
    expect(await hasActivePortalPass(passBuyer.id)).toBe(true);
  });

  it("buying the same plan again while it is active EXTENDS it from its end date (nothing is lost)", async () => {
    const first = await prisma.accessPass.findFirstOrThrow({ where: { userId: passBuyer.id, plan: "agentic_unlimited" } });
    await buy(passBuyer.id, skuOfPass("agentic_unlimited"));
    const passes = await prisma.accessPass.findMany({ where: { userId: passBuyer.id, plan: "agentic_unlimited" }, orderBy: { startsAt: "asc" } });
    expect(passes).toHaveLength(2);
    expect(passes[1]!.startsAt.getTime()).toBe(first.endsAt.getTime());
    expect(Math.round((passes[1]!.endsAt.getTime() - passes[1]!.startsAt.getTime()) / 86_400_000)).toBe(365);
  });

  it("an expired pass gives no access", async () => {
    const lapsed = await createCertificateUser({ prefix: "agentic-lapsed", legalName: `Lou Lapsed ${run}` });
    try {
      const { order } = await buy(lapsed.id, skuOfPass("portal_unlimited"));
      await prisma.accessPass.update({ where: { orderId: order.id }, data: { startsAt: new Date(Date.now() - 400 * 86_400_000), endsAt: new Date(Date.now() - 35 * 86_400_000) } });
      expect(await hasActivePass(lapsed.id)).toBe(false);
      expect(await hasActivePortalPass(lapsed.id)).toBe(false);
      expect(await downloadAccess(lapsed.id, "next-steps")).toBe("none");
    } finally {
      const ids = (await prisma.order.findMany({ where: { userId: lapsed.id }, select: { id: true } })).map((o) => o.id);
      await prisma.auditLog.deleteMany({ where: { OR: [{ entityType: "order", entityId: { in: ids } }, { actorUserId: lapsed.id }] } });
      await prisma.outboundEmail.deleteMany({ where: { toEmail: lapsed.email.toLowerCase() } });
      await prisma.notification.deleteMany({ where: { userId: lapsed.id } });
      await prisma.accessPass.deleteMany({ where: { userId: lapsed.id } });
      await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
      await prisma.order.deleteMany({ where: { id: { in: ids } } });
      await deleteTestUser(lapsed.email);
    }
  });

  it("a Portal Unlimited pass covers the Certificate of Achievement unlock (fee 'pass'); the cheaper Agentic AI pass does not", async () => {
    const fake = (userId: string) => ({ id: randomUUID(), userId, passed: true }) as never;
    const programmeId = (await flagshipProgramme()).id;
    const reviewer = await createCertificateUser({ prefix: "agentic-unlock", legalName: `Una Unlock ${run}` });
    try {
      await withTransaction((tx) => createReview(tx, { userId: reviewer.id, kind: "diagnostic", registrationId: null, programmeId, offeringId: null, body: "x".repeat(320), rating: 5, category: null, consentPublic: false, consentPhoto: false }));
      expect((await unlockStatusForAttempt(fake(reviewer.id))).fee).not.toBe("pass");
      await buy(reviewer.id, skuOfPass("agentic_unlimited"));
      expect((await unlockStatusForAttempt(fake(reviewer.id))).fee).not.toBe("pass"); // Agentic AI Unlimited is not the Portal plan
      await buy(reviewer.id, skuOfPass("portal_unlimited"));
      const status = await unlockStatusForAttempt(fake(reviewer.id));
      expect(status.fee).toBe("pass");
      expect(status.unlocked).toBe(true); // review done + a Portal pass
    } finally {
      const ids = (await prisma.order.findMany({ where: { userId: reviewer.id }, select: { id: true } })).map((o) => o.id);
      const reviewIds = (await prisma.review.findMany({ where: { userId: reviewer.id }, select: { id: true } })).map((r) => r.id);
      await prisma.auditLog.deleteMany({ where: { OR: [{ entityType: "order", entityId: { in: ids } }, { actorUserId: reviewer.id }, { entityType: "review", entityId: { in: reviewIds } }] } });
      await prisma.outboundEmail.deleteMany({ where: { toEmail: reviewer.email.toLowerCase() } });
      await prisma.notification.deleteMany({ where: { userId: reviewer.id } });
      await prisma.review.deleteMany({ where: { userId: reviewer.id } });
      await prisma.accessPass.deleteMany({ where: { userId: reviewer.id } });
      await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
      await prisma.order.deleteMany({ where: { id: { in: ids } } });
      await deleteTestUser(reviewer.email);
    }
  });

  it("a plan ending within 30 days gets ONE reminder email (a re-run sends nothing more); a plan that was already renewed, or ends later, gets none", async () => {
    const people = await Promise.all([createCertificateUser({ prefix: "agentic-rem-a", legalName: `Ria A ${run}` }), createCertificateUser({ prefix: "agentic-rem-b", legalName: `Rob B ${run}` }), createCertificateUser({ prefix: "agentic-rem-c", legalName: `Rae C ${run}` })]);
    try {
      const mk = async (userId: string, plan: "agentic_unlimited" | "portal_unlimited", startsDaysAgo: number, endsInDays: number) => {
        const o = await prisma.order.create({ data: { userId, kind: "access_pass", productSku: skuOfPass(plan), status: "paid", region: "international", currency: "USD", amountMinor: 1000n, expiresAt: new Date(), paidAt: new Date() } });
        return prisma.accessPass.create({ data: { userId, plan, orderId: o.id, startsAt: new Date(Date.now() - startsDaysAgo * 86_400_000), endsAt: new Date(Date.now() + endsInDays * 86_400_000) } });
      };
      await mk(people[0].id, "agentic_unlimited", 340, 10); // ends in 10 days → reminded
      await mk(people[1].id, "agentic_unlimited", 340, 10); // ends in 10 days, but renewed (a later pass starts when it ends) → not reminded
      await mk(people[1].id, "agentic_unlimited", -10, 375);
      await mk(people[2].id, "portal_unlimited", 100, 265); // ends in 265 days → not yet
      const first = await runPassEndingReminders();
      expect(first.queued).toBeGreaterThanOrEqual(1);
      expect(await prisma.outboundEmail.count({ where: { toEmail: people[0].email.toLowerCase(), templateKey: "commerce.agentic-pass-ending" } })).toBe(1);
      expect(await prisma.outboundEmail.count({ where: { toEmail: { in: [people[1].email.toLowerCase(), people[2].email.toLowerCase()] }, templateKey: "commerce.agentic-pass-ending" } })).toBe(0);
      const mail = await prisma.outboundEmail.findFirstOrThrow({ where: { toEmail: people[0].email.toLowerCase(), templateKey: "commerce.agentic-pass-ending" } });
      expect(mail.textBody).toContain("does not renew by itself");
      await runPassEndingReminders(); // a second run the same day
      expect(await prisma.outboundEmail.count({ where: { toEmail: people[0].email.toLowerCase(), templateKey: "commerce.agentic-pass-ending" } })).toBe(1);
    } finally {
      for (const u of people) {
        const ids = (await prisma.order.findMany({ where: { userId: u.id }, select: { id: true } })).map((o) => o.id);
        await prisma.outboundEmail.deleteMany({ where: { toEmail: u.email.toLowerCase() } });
        await prisma.notification.deleteMany({ where: { userId: u.id } });
        await prisma.accessPass.deleteMany({ where: { userId: u.id } });
        await prisma.order.deleteMany({ where: { id: { in: ids } } });
        await deleteTestUser(u.email);
      }
    }
  });

  it("an order whose SKU is not one we sell grants nothing and fails loudly", async () => {
    const o = await prisma.order.create({ data: { userId: buyer.id, kind: "agentic_item", productSku: "item:ghost", status: "paid", region: "international", currency: "USD", amountMinor: 200n, expiresAt: new Date() } });
    await expect(withTransaction((tx) => fulfilPaidAgenticOrder(tx, o, new Date()))).rejects.toThrow(/no valid product SKU/);
    await prisma.order.delete({ where: { id: o.id } });
    expect(CommerceError).toBeDefined();
  });
});
