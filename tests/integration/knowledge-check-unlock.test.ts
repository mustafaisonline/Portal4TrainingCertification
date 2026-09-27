import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { listOrdersForAdmin } from "@/modules/commerce/admin-orders.repository";
import { CommerceError, PaymentsNotConfiguredError } from "@/modules/commerce/errors";
import { listOrdersForUser } from "@/modules/commerce/registrations.service";
import type { CheckoutSessionInput, PaymentGateway } from "@/modules/commerce/stripe";
import { verifyStripeSignature } from "@/modules/commerce/stripe";
import { createUnlockSetting, currentUnlockSetting, enabledUnlockSetting, listUnlockHistory, UnlockSettingValidationError } from "@/modules/commerce/unlock.repository";
import { findUnlockOrderForUser, hasFreeLearningReview, startUnlockCheckout, unlockStatusForAttempt } from "@/modules/commerce/unlock.service";
import { handleStripeWebhook } from "@/modules/commerce/webhook.service";
import { replaceTopicFromImport } from "@/modules/free-learning/book.repository";
import { finishAttempt, getAttemptForUser, startAttempt } from "@/modules/free-learning/knowledge-check.repository";
import { importDraftQuestions, setAllQuestionsStatus } from "@/modules/free-learning/quiz.repository";
import { getUserForAdmin } from "@/modules/identity/admin-users.repository";
import { buildDataExport } from "@/modules/identity/data-export";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { createReview } from "@/modules/reviews/repository";
import { createAdminUser, createCertificateUser, flagshipProgramme } from "../helpers/certificates-db";
import { completeProfile, deleteTestUser, latestEmail } from "../helpers/identity-db";

/*
 * The Knowledge Check result-document unlock (Milestone 14 Phase 5; DR-03
 * §3) against the REAL test database with a FAKE gateway: the seeded
 * setting; the two-part gate (a Free Learning review + the fee paid or
 * exempt for Pakistan); the checkout's refusals (not finished, exempt,
 * disabled, pending, already paid) and its pending order naming the
 * attempt; the signed webhook marking it paid, auditing it and queueing
 * the unlock email; every order read model tolerating the new kind.
 */

const prisma = getPrisma();
const run = randomUUID().slice(0, 8);
const WEBHOOK_SECRET = "whsec_test_unlock";
const stripeForSigning = new Stripe("sk_test_signing_only");
const SLUG = `unlock-${run}`;
let admin: { id: string; email: string };
let person: { id: string; email: string; name: string };
let pakistani: { id: string; email: string; name: string };
let flagshipId = "";
let topicId = "";
let attemptId = "";
let unfinishedAttemptId = "";
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

async function attemptOf(id: string, userId: string) {
  const a = await getAttemptForUser(id, userId);
  if (!a) throw new Error(`attempt ${id} missing`);
  return a;
}

beforeAll(async () => {
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.APP_BASE_URL ??= "http://localhost:3101";
  admin = await createAdminUser("unlock-admin");
  person = await createCertificateUser({ prefix: "unlock-person", legalName: `Pat Payer ${run}` });
  pakistani = await createCertificateUser({ prefix: "unlock-pk", legalName: `Parveen Exempt ${run}` });
  await completeProfile(pakistani.id, { legalName: `Parveen Exempt ${run}`, countryCode: "PK", nationalityCode: "PK" });
  flagshipId = (await flagshipProgramme()).id;
  // A fixture topic with 50 reviewed questions so a 50-question attempt can be started and finished.
  const topic = await withTransaction((tx) =>
    replaceTopicFromImport(tx, { position: 84001, slug: SLUG, title: `Unlock Topic ${run}`, sourceHeading: "Unlock Topic", bodyHtml: "<p>x</p>", bodyText: "x", wordCount: 1, images: [], publish: true, importedAt: new Date() }, (id) => id),
  );
  topicId = topic.id;
  await withTransaction((tx) =>
    importDraftQuestions(tx, { topicId, replaceDrafts: false, questions: Array.from({ length: 50 }, (_, i) => ({ stem: `Unlock question ${i + 1}: choose option A?`, options: ["Alpha", "Bravo", "Charlie", "Delta", "Echo"], correct: 0, explanation: null })) }),
  );
  await withTransaction((tx) => setAllQuestionsStatus(tx, { topicId, status: "reviewed", actorUserId: admin.id }));
  const finished = await withTransaction((tx) => startAttempt(tx, { userId: person.id, size: 50 }));
  attemptId = finished.id;
  await withTransaction((tx) => finishAttempt(tx, { attemptId, userId: person.id }));
  unfinishedAttemptId = (await withTransaction((tx) => startAttempt(tx, { userId: person.id, size: 50 }))).id;
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
    await prisma.auditLog.deleteMany({ where: { entityType: "knowledge_check_unlock_setting", entityId: { in: createdSettingIds } } });
    await prisma.knowledgeCheckUnlockSetting.deleteMany({ where: { id: { in: createdSettingIds } } });
  }
  for (const u of [person, pakistani]) {
    const reviews = await prisma.review.findMany({ where: { userId: u.id }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: "review", entityId: { in: reviews.map((r) => r.id) } } });
    await prisma.review.deleteMany({ where: { userId: u.id } });
    await prisma.outboundEmail.deleteMany({ where: { toEmail: u.email } }).catch(() => undefined);
  }
  const ids = (await prisma.topicQuestion.findMany({ where: { topicId }, select: { id: true } })).map((x) => x.id);
  await prisma.auditLog.deleteMany({ where: { entityType: "topic_question", entityId: { in: ids } } });
  for (const u of [person, pakistani, admin]) await deleteTestUser(u.email);
  await prisma.bookTopic.deleteMany({ where: { slug: SLUG } });
  await disconnectPrisma();
});

describe("the setting (insert-only, effective-dated, audited — the support setting's twin)", () => {
  it("is seeded enabled at USD 10.00 and readable as 'current' and 'enabled'", async () => {
    const current = await currentUnlockSetting();
    expect(current).toMatchObject({ enabled: true, currency: "USD", amountMinor: 1000, label: "Knowledge Check result document" });
    expect((await enabledUnlockSetting())?.id).toBe(current!.id);
  });

  it("rejects a bad amount or currency and never overwrites — a new row and an audit entry each time", async () => {
    await expect(withTransaction((tx) => createUnlockSetting(tx, { enabled: true, amountMinor: 0, currency: "USD", label: "x", effectiveFrom: new Date(), note: null }, admin.id))).rejects.toBeInstanceOf(UnlockSettingValidationError);
    await expect(withTransaction((tx) => createUnlockSetting(tx, { enabled: true, amountMinor: 1000, currency: "us", label: "x", effectiveFrom: new Date(), note: null }, admin.id))).rejects.toBeInstanceOf(UnlockSettingValidationError);
    const before = (await listUnlockHistory()).length;
    const future = new Date(Date.now() + 60 * 60 * 1000);
    const row = await withTransaction((tx) => createUnlockSetting(tx, { enabled: true, amountMinor: 1200, currency: "USD", label: "Knowledge Check result document", effectiveFrom: future, note: `future ${run}` }, admin.id));
    createdSettingIds.push(row.id);
    expect((await listUnlockHistory()).length).toBe(before + 1);
    expect((await enabledUnlockSetting())?.amountMinor).toBe(1000); // the future row is not yet in force
    expect((await enabledUnlockSetting(new Date(future.getTime() + 1000)))?.amountMinor).toBe(1200);
    const audit = await listAuditForEntity(prisma, "knowledge_check_unlock_setting", row.id);
    expect(audit.map((a) => a.action)).toEqual(["knowledge_check_unlock.changed"]);
  });
});

describe("the gate", () => {
  it("starts with both halves open: no review, fee required at the setting's amount", async () => {
    expect(await hasFreeLearningReview(person.id)).toBe(false);
    const status = await unlockStatusForAttempt(await attemptOf(attemptId, person.id));
    expect(status).toEqual({ reviewSatisfied: false, fee: "required", pendingOrderId: null, unlocked: false, amountMinor: 1000, currency: "USD" });
  });

  it("a Pakistan profile is exempt from the fee but still needs the review; the review alone then unlocks", async () => {
    const pk = await withTransaction((tx) => startAttempt(tx, { userId: pakistani.id, size: 50 }));
    await withTransaction((tx) => finishAttempt(tx, { attemptId: pk.id, userId: pakistani.id }));
    const before = await unlockStatusForAttempt(await attemptOf(pk.id, pakistani.id));
    expect(before).toMatchObject({ reviewSatisfied: false, fee: "exempt", unlocked: false });
    await expect(startUnlockCheckout({ userId: pakistani.id, attemptId: pk.id, gateway: fakeGateway() })).rejects.toSatisfy((e: unknown) => e instanceof CommerceError && e.code === "unlock_fee_exempt");
    await withTransaction((tx) =>
      createReview(tx, { userId: pakistani.id, kind: "diagnostic", registrationId: null, programmeId: flagshipId, offeringId: null, body: "A review of Free Learning written by the unlock test. ".repeat(7), rating: 4, category: null, consentPublic: false, consentPhoto: false }),
    );
    const after = await unlockStatusForAttempt(await attemptOf(pk.id, pakistani.id));
    expect(after).toMatchObject({ reviewSatisfied: true, fee: "exempt", unlocked: true });
  });
});

describe("the checkout", () => {
  it("refuses without Stripe keys and no gateway, and refuses an unfinished attempt", async () => {
    const saved = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      await expect(startUnlockCheckout({ userId: person.id, attemptId })).rejects.toBeInstanceOf(PaymentsNotConfiguredError);
    } finally {
      if (saved !== undefined) process.env.STRIPE_SECRET_KEY = saved;
    }
    await expect(startUnlockCheckout({ userId: person.id, attemptId: unfinishedAttemptId, gateway: fakeGateway() })).rejects.toSatisfy((e: unknown) => e instanceof CommerceError && e.code === "unlock_not_finished");
    await expect(startUnlockCheckout({ userId: pakistani.id, attemptId, gateway: fakeGateway() })).rejects.toSatisfy((e: unknown) => e instanceof CommerceError && e.code === "unlock_not_finished"); // not their attempt
  });

  it("with the setting disabled, a new payment is refused", async () => {
    const off = await withTransaction((tx) => createUnlockSetting(tx, { enabled: false, amountMinor: 1000, currency: "USD", label: "Knowledge Check result document", effectiveFrom: new Date(), note: `off ${run}` }, admin.id));
    createdSettingIds.push(off.id);
    try {
      const status = await unlockStatusForAttempt(await attemptOf(attemptId, person.id), new Date(Date.now() + 1000));
      expect(status.fee).toBe("unavailable");
      await expect(startUnlockCheckout({ userId: person.id, attemptId, gateway: fakeGateway(), now: new Date(Date.now() + 1000) })).rejects.toSatisfy((e: unknown) => e instanceof CommerceError && e.code === "unlock_unavailable");
    } finally {
      const on = await withTransaction((tx) => createUnlockSetting(tx, { enabled: true, amountMinor: 1000, currency: "USD", label: "Knowledge Check result document", effectiveFrom: new Date(), note: `on ${run}` }, admin.id));
      createdSettingIds.push(on.id);
    }
  });

  let orderId = "";

  it("creates a pending unlock order naming the attempt, priced from the setting, and asks Stripe for a session", async () => {
    const gateway = fakeGateway();
    const now = new Date(Date.now() + 2000);
    const result = await startUnlockCheckout({ userId: person.id, attemptId, gateway, now });
    orderId = result.orderId;
    createdOrderIds.push(orderId);
    const attempt = await attemptOf(attemptId, person.id);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order).toMatchObject({ kind: "knowledge_check_unlock", status: "pending", offeringId: null, programmeId: null, knowledgeCheckAttemptId: attemptId, currency: "USD", region: "international" });
    expect(Number(order.amountMinor)).toBe(1000);
    expect(gateway.sessions[0]).toMatchObject({ orderId, amountMinor: 1000, currency: "USD", productName: `Knowledge Check result document — ${attempt.publicId}`, customerEmail: person.email });
    expect(gateway.sessions[0]!.successUrl).toBe(`${process.env.APP_BASE_URL}/free-learning/knowledge-check/${attemptId}/result?order=${orderId}`);
    expect(order.stripeCheckoutSessionId).toMatch(/^cs_test_/);
    const status = await unlockStatusForAttempt(attempt, now);
    expect(status).toMatchObject({ fee: "required", pendingOrderId: orderId, unlocked: false });
    await expect(startUnlockCheckout({ userId: person.id, attemptId, gateway, now })).rejects.toSatisfy((e: unknown) => e instanceof CommerceError && e.code === "unlock_order_pending");
    expect(await findUnlockOrderForUser(orderId, person.id, now)).toMatchObject({ id: orderId, effectiveStatus: "pending", amountMinor: 1000, currency: "USD" });
    expect(await findUnlockOrderForUser(orderId, pakistani.id, now)).toBeNull(); // not theirs
  });

  it("the signed webhook marks it paid with a payment row, an audit entry and the unlock email; the fee half then holds", async () => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const payload = sessionCompletedEvent(order);
    const first = await handleStripeWebhook(payload, sign(payload), fakeGateway());
    expect(first.status).toBe("processed");
    const paid = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payment: true } });
    expect(paid.status).toBe("paid");
    expect(paid.payment).not.toBeNull();
    const audit = (await listAuditForEntity(prisma, "order", orderId)).map((a) => a.action);
    expect(audit).toEqual(["order.created", "payment.succeeded"]);
    const email = await latestEmail(person.email, "commerce.knowledge-check-unlocked");
    expect(email).not.toBeNull();
    expect(email!.textBody).toContain(`/free-learning/knowledge-check/${attemptId}/document`);
    const again = await handleStripeWebhook(payload, sign(payload), fakeGateway());
    expect(again.status).toMatch(/duplicate|processed/);
    expect((await listAuditForEntity(prisma, "order", orderId)).length).toBe(2);

    const attempt = await attemptOf(attemptId, person.id);
    expect(await unlockStatusForAttempt(attempt)).toMatchObject({ reviewSatisfied: false, fee: "paid", pendingOrderId: null, unlocked: false });
    await expect(startUnlockCheckout({ userId: person.id, attemptId, gateway: fakeGateway() })).rejects.toSatisfy((e: unknown) => e instanceof CommerceError && e.code === "unlock_already_paid");
    // The review completes the gate.
    await withTransaction((tx) =>
      createReview(tx, { userId: person.id, kind: "diagnostic", registrationId: null, programmeId: flagshipId, offeringId: null, body: "A review of Free Learning written by the unlock test. ".repeat(7), rating: 5, category: null, consentPublic: false, consentPhoto: false }),
    );
    expect(await unlockStatusForAttempt(attempt)).toMatchObject({ reviewSatisfied: true, fee: "paid", unlocked: true });
  });

  it("the person's return banner, their orders, the admin list, the admin user detail and the data export all show the unlock order", async () => {
    expect(await findUnlockOrderForUser(orderId, person.id)).toMatchObject({ id: orderId, effectiveStatus: "paid", amountMinor: 1000, currency: "USD" });
    const mine = await listOrdersForUser(person.id);
    expect(mine[0]).toMatchObject({ id: orderId, kind: "knowledge_check_unlock", programmeTitle: "Knowledge Check result document", formatName: "One-time unlock", startsOn: null, endsOn: null });
    const adminList = await listOrdersForAdmin({ kind: "knowledge_check_unlock", q: person.email });
    expect(adminList.items.map((o) => o.id)).toEqual([orderId]);
    expect(adminList.items[0]).toMatchObject({ programmeTitle: "Knowledge Check result document", formatName: "One-time unlock", startsOn: null });
    const detail = await getUserForAdmin(person.id);
    expect(detail?.orders.map((o) => [o.kind, o.programmeTitle])).toEqual([["knowledge_check_unlock", "Knowledge Check result document"]]);
    const exported = await buildDataExport(person.id);
    expect((exported!.orders[0] as { programmeTitle: string; kind: string }).kind).toBe("knowledge_check_unlock");
  });
});
