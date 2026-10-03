import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { replaceTrainingFormats, TrainingRefusedError } from "@/modules/catalogue/programmes/admin.repository";
import { listOrdersForAdmin } from "@/modules/commerce/admin-orders.repository";
import { CommerceError } from "@/modules/commerce/errors";
import { listFormatsOverview, summariseFormats } from "@/modules/commerce/formats-overview";
import {
  createInterestSetting,
  enabledInterestSetting,
  formatIdsWithoutOpenDate,
  interestCountsByFormat,
  InterestSettingValidationError,
  listInterestHistory,
  listInterests,
  listInterestsForUser,
  markInterestsNotified,
} from "@/modules/commerce/interest.repository";
import { findInterestOrderForUser, startInterestRegistration } from "@/modules/commerce/interest.service";
import { validateInterestForm } from "@/modules/commerce/interest-rules";
import { listOrdersForUser } from "@/modules/commerce/registrations.service";
import type { CheckoutSessionInput, PaymentGateway } from "@/modules/commerce/stripe";
import { verifyStripeSignature } from "@/modules/commerce/stripe";
import { handleStripeWebhook } from "@/modules/commerce/webhook.service";
import { buildDataExport } from "@/modules/identity/data-export";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { createAdminUser, createCertificateUser, flagshipProgramme } from "../helpers/certificates-db";
import { completeProfile, deleteTestUser, latestEmail } from "../helpers/identity-db";

/*
 * "Register your interest" (CR-2026-10-01-2138) against the REAL test
 * database with a FAKE gateway: the seeded USD 2 fee and its effective-dated
 * history; eligibility (a published training's format with no open date); the
 * checkout's pending order and its refusals (pending, already registered,
 * unavailable); the signed webhook as the ONLY thing that confirms (audited,
 * emailed, duplicate-safe), and expiry; a retry after a lapsed hold; the
 * Pakistan participant registering without the fee; the Trainer / administrator
 * scope on the lists, counts and "mark as notified"; the person's own list;
 * the order read models; the personal-data export; and the guard that keeps a
 * format people are waiting for from being removed.
 */

const prisma = getPrisma();
const run = randomUUID().slice(0, 8);
const WEBHOOK_SECRET = "whsec_test_interest";
const stripeForSigning = new Stripe("sk_test_signing_only");
let admin: { id: string; email: string };
let person: { id: string; email: string; name: string };
let other: { id: string; email: string; name: string };
let pakistani: { id: string; email: string; name: string };
let programmeId = "";
let programmeTitle = "";
let formatId = "";
let datedFormatId = "";
let expertId = "";
const createdOrderIds: string[] = [];
const createdSettingIds: string[] = [];
const createdOfferingIds: string[] = [];

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

function sessionEvent(type: "checkout.session.completed" | "checkout.session.expired", order: { id: string; amountMinor: bigint; currency: string }) {
  return JSON.stringify({
    id: `evt_test_${randomUUID().replace(/-/g, "")}`,
    object: "event",
    api_version: "2026-01-01",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type,
    data: {
      object: {
        id: `cs_test_${randomUUID().slice(0, 12)}`,
        object: "checkout.session",
        mode: "payment",
        status: type === "checkout.session.completed" ? "complete" : "expired",
        payment_status: type === "checkout.session.completed" ? "paid" : "unpaid",
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

const form = (email: string, over: Record<string, unknown> = {}) => {
  const r = validateInterestForm({ email, fullName: "Ivy Interested", mobile: "+60 12 345 6789", dateOfBirth: "1990-05-17", consent: true, ...over });
  if (!r.ok) throw new Error(JSON.stringify(r.fieldErrors));
  return r.values;
};

async function payInterest(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const body = sessionEvent("checkout.session.completed", order);
  return handleStripeWebhook(body, sign(body), fakeGateway());
}

beforeAll(async () => {
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.APP_BASE_URL ??= "http://localhost:3101";
  admin = await createAdminUser("int-admin");
  person = await createCertificateUser({ prefix: "int-person", legalName: `Ivy Interested ${run}` });
  other = await createCertificateUser({ prefix: "int-other", legalName: `Otto Other ${run}` });
  pakistani = await createCertificateUser({ prefix: "int-pk", legalName: `Parveen Free ${run}` });
  await completeProfile(pakistani.id, { legalName: `Parveen Free ${run}`, countryCode: "PK", nationalityCode: "PK" });
  const p = await flagshipProgramme();
  programmeId = p.id;
  programmeTitle = p.title;
  expertId = (await prisma.programmeExpert.findFirstOrThrow({ where: { programmeId } })).expertId;
  const format = await prisma.deliveryFormat.create({ data: { programmeId, code: `t-int-${run}`, name: `Interest Test ${run}`, durationLabel: "1 week", scheduleLabel: "2 hours a day", totalTimeLabel: "10 hours", bestFor: [], position: 900 } });
  const dated = await prisma.deliveryFormat.create({ data: { programmeId, code: `t-int-dated-${run}`, name: `Dated Test ${run}`, durationLabel: "2 weeks", scheduleLabel: "2 hours a day", totalTimeLabel: "20 hours", bestFor: [], position: 901 } });
  formatId = format.id;
  datedFormatId = dated.id;
  const start = new Date(Date.now() + 30 * 86_400_000);
  const offering = await prisma.scheduledOffering.create({ data: { programmeId, deliveryFormatId: datedFormatId, modality: "live_online", timezone: "Asia/Kuala_Lumpur", startsOn: start, endsOn: new Date(start.getTime() + 4 * 86_400_000), status: "open" } });
  createdOfferingIds.push(offering.id);
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(async () => {
  const interestIds = (await prisma.trainingInterest.findMany({ where: { deliveryFormatId: { in: [formatId, datedFormatId] } }, select: { id: true } })).map((i) => i.id);
  await prisma.auditLog.deleteMany({ where: { entityType: "training_interest", entityId: { in: interestIds } } });
  await prisma.trainingInterest.deleteMany({ where: { id: { in: interestIds } } });
  if (createdOrderIds.length) {
    await prisma.auditLog.deleteMany({ where: { entityType: "order", entityId: { in: createdOrderIds } } });
    for (const id of createdOrderIds) await prisma.stripeEvent.deleteMany({ where: { payload: { path: ["data", "object", "client_reference_id"], equals: id } } }).catch(() => undefined);
    await prisma.payment.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  }
  await prisma.scheduledOffering.deleteMany({ where: { id: { in: createdOfferingIds } } });
  await prisma.deliveryFormat.deleteMany({ where: { id: { in: [formatId, datedFormatId] } } });
  if (createdSettingIds.length) {
    await prisma.auditLog.deleteMany({ where: { entityType: "interest_fee_setting", entityId: { in: createdSettingIds } } });
    await prisma.interestFeeSetting.deleteMany({ where: { id: { in: createdSettingIds } } });
  }
  for (const u of [person, other, pakistani]) await prisma.outboundEmail.deleteMany({ where: { toEmail: u.email } }).catch(() => undefined);
  for (const u of [person, other, pakistani, admin]) await deleteTestUser(u.email);
  await disconnectPrisma();
});

describe("the form rules", () => {
  it("needs an email and the consent tick; name, mobile and date of birth are optional but checked when given", () => {
    expect(validateInterestForm({ email: "", consent: true })).toMatchObject({ ok: false, fieldErrors: { email: expect.any(String) } });
    expect(validateInterestForm({ email: "not-an-email", consent: true })).toMatchObject({ ok: false, fieldErrors: { email: expect.any(String) } });
    expect(validateInterestForm({ email: "a@b.example", consent: false })).toMatchObject({ ok: false, fieldErrors: { consent: expect.any(String) } });
    expect(validateInterestForm({ email: "a@b.example", consent: true, mobile: "call me" })).toMatchObject({ ok: false, fieldErrors: { mobile: expect.any(String) } });
    expect(validateInterestForm({ email: "a@b.example", consent: true, dateOfBirth: "2999-01-01" })).toMatchObject({ ok: false, fieldErrors: { dateOfBirth: expect.any(String) } });
    expect(validateInterestForm({ email: "a@b.example", consent: true, dateOfBirth: "1990-02-31" })).toMatchObject({ ok: false, fieldErrors: { dateOfBirth: expect.any(String) } });
    const ok = validateInterestForm({ email: "  A@B.Example ", consent: true });
    expect(ok).toEqual({ ok: true, values: { email: "a@b.example", fullName: null, mobile: null, dateOfBirth: null, consent: true } });
  });
});

describe("the fee setting", () => {
  it("is seeded at USD 2.00, enabled; a new effective-dated row is audited, validated, and the history keeps every row", async () => {
    const now = new Date();
    const seeded = await enabledInterestSetting(now);
    expect(seeded).toMatchObject({ amountMinor: 200, currency: "USD", enabled: true });
    await expect(withTransaction((tx) => createInterestSetting(tx, { enabled: true, amountMinor: 0, currency: "USD", label: "", effectiveFrom: now, note: null }, admin.id, now))).rejects.toBeInstanceOf(InterestSettingValidationError);
    const later = new Date(now.getTime() + 3_600_000);
    const row = await withTransaction((tx) => createInterestSetting(tx, { enabled: false, amountMinor: 300, currency: "USD", label: "Register your interest", effectiveFrom: later, note: "test switch-off" }, admin.id, now));
    createdSettingIds.push(row.id);
    // Not in force yet: today's setting is unchanged; after `later` the feature is off.
    expect(await enabledInterestSetting(now)).toMatchObject({ amountMinor: 200 });
    expect(await enabledInterestSetting(new Date(later.getTime() + 1000))).toBeNull();
    expect((await listInterestHistory()).some((h) => h.id === row.id)).toBe(true);
    const audit = await listAuditForEntity(prisma, "interest_fee_setting", row.id);
    expect(audit.map((a) => a.action)).toEqual(["interest_fee.changed"]);
  });
});

describe("eligibility", () => {
  it("a format with an open date is not open for interest; one without is", async () => {
    const free = await formatIdsWithoutOpenDate([formatId, datedFormatId]);
    expect(free.has(formatId)).toBe(true);
    expect(free.has(datedFormatId)).toBe(false);
    await expect(startInterestRegistration({ userId: person.id, formatId: datedFormatId, form: form(person.email), gateway: fakeGateway() })).rejects.toMatchObject({ code: "interest_unavailable" });
    await expect(startInterestRegistration({ userId: person.id, formatId: randomUUID(), form: form(person.email), gateway: fakeGateway() })).rejects.toMatchObject({ code: "interest_unavailable" });
    expect(await prisma.trainingInterest.count({ where: { userId: person.id } })).toBe(0);
  });
});

describe("paying", () => {
  it("creates a pending interest order for the fee in force (never from the browser), refuses a second while it is held, and confirms ONLY when the signed webhook says paid", async () => {
    const gateway = fakeGateway();
    const started = await startInterestRegistration({ userId: person.id, formatId, form: form(person.email), gateway });
    expect(started.kind).toBe("checkout");
    if (started.kind !== "checkout") throw new Error("expected checkout");
    createdOrderIds.push(started.orderId);
    expect(started.url).toBe(`https://checkout.stripe.test/${started.orderId}`);
    expect(gateway.sessions[0]).toMatchObject({ amountMinor: 200, currency: "USD", customerEmail: person.email });
    expect(gateway.sessions[0]!.productName).toContain("non-refundable");

    const order = await prisma.order.findUniqueOrThrow({ where: { id: started.orderId } });
    expect(order).toMatchObject({ kind: "interest", status: "pending", offeringId: null, programmeId, userId: person.id });
    expect(Number(order.amountMinor)).toBe(200);
    const pending = await prisma.trainingInterest.findUniqueOrThrow({ where: { id: started.interestId } });
    expect(pending).toMatchObject({ status: "pending", orderId: order.id, email: person.email, fullName: "Ivy Interested", mobile: "+60 12 345 6789", consent: true, feeWaived: false, confirmedAt: null });
    expect(pending.dateOfBirth?.toISOString().slice(0, 10)).toBe("1990-05-17");

    // Not counted, not listed, until Stripe says so.
    expect(await listInterests({ kind: "all" }, { formatId })).toEqual([]);
    expect(await findInterestOrderForUser(order.id, person.id)).toMatchObject({ effectiveStatus: "pending" });
    expect(await findInterestOrderForUser(order.id, other.id)).toBeNull();
    await expect(startInterestRegistration({ userId: person.id, formatId, form: form(person.email), gateway })).rejects.toMatchObject({ code: "interest_order_pending" });

    const outcome = await payInterest(order.id);
    expect(outcome).toMatchObject({ duplicate: false, status: "processed" });
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ status: "paid" });
    const confirmed = await prisma.trainingInterest.findUniqueOrThrow({ where: { id: started.interestId } });
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.confirmedAt).not.toBeNull();
    expect((await listAuditForEntity(prisma, "training_interest", confirmed.id)).map((a) => a.action)).toEqual(["interest.confirmed"]);
    const mail = await latestEmail(person.email, "commerce.interest-registered");
    expect(mail?.subject).toContain("Your interest is registered");
    expect(await findInterestOrderForUser(order.id, person.id)).toMatchObject({ effectiveStatus: "paid" });

    // A replayed webhook changes nothing; a new attempt says "already registered".
    const body = sessionEvent("checkout.session.completed", order);
    await handleStripeWebhook(body, sign(body), fakeGateway());
    await handleStripeWebhook(body, sign(body), fakeGateway());
    expect((await listAuditForEntity(prisma, "training_interest", confirmed.id)).length).toBe(1);
    await expect(startInterestRegistration({ userId: person.id, formatId, form: form(person.email), gateway })).rejects.toMatchObject({ code: "interest_already_registered" });
    await expect(startInterestRegistration({ userId: person.id, formatId, form: form(person.email), gateway })).rejects.toBeInstanceOf(CommerceError);
  });

  it("an expired Stripe session expires the interest; a retry re-uses the row with a new order", async () => {
    const gateway = fakeGateway();
    const first = await startInterestRegistration({ userId: other.id, formatId, form: form(other.email), gateway });
    if (first.kind !== "checkout") throw new Error("expected checkout");
    createdOrderIds.push(first.orderId);
    const firstOrder = await prisma.order.findUniqueOrThrow({ where: { id: first.orderId } });
    const body = sessionEvent("checkout.session.expired", firstOrder);
    await handleStripeWebhook(body, sign(body), gateway);
    expect(await prisma.trainingInterest.findUniqueOrThrow({ where: { id: first.interestId } })).toMatchObject({ status: "expired" });
    expect(await prisma.order.findUniqueOrThrow({ where: { id: first.orderId } })).toMatchObject({ status: "expired" });

    const second = await startInterestRegistration({ userId: other.id, formatId, form: form(other.email, { fullName: "Otto Again" }), gateway });
    if (second.kind !== "checkout") throw new Error("expected checkout");
    createdOrderIds.push(second.orderId);
    expect(second.interestId).toBe(first.interestId); // one row per person per format
    expect(second.orderId).not.toBe(first.orderId);
    expect(await prisma.trainingInterest.findUniqueOrThrow({ where: { id: second.interestId } })).toMatchObject({ status: "pending", orderId: second.orderId, fullName: "Otto Again" });
    expect(await prisma.trainingInterest.count({ where: { userId: other.id, deliveryFormatId: formatId } })).toBe(1);

    // A hold that lapsed without a Stripe event also lets the person try again.
    await prisma.order.update({ where: { id: second.orderId }, data: { expiresAt: new Date(Date.now() - 60_000) } });
    const third = await startInterestRegistration({ userId: other.id, formatId, form: form(other.email), gateway });
    if (third.kind !== "checkout") throw new Error("expected checkout");
    createdOrderIds.push(third.orderId);
    expect(third.interestId).toBe(first.interestId);
  });

  it("a Stripe failure to open the session leaves nothing pending and nothing charged", async () => {
    const failing: PaymentGateway = { ...fakeGateway(), async createCheckoutSession() { throw new Error("stripe down"); } };
    const fresh = await createCertificateUser({ prefix: "int-fail", legalName: `Fay Fail ${run}` });
    try {
      await expect(startInterestRegistration({ userId: fresh.id, formatId, form: form(fresh.email), gateway: failing })).rejects.toThrow("stripe down");
      const row = await prisma.trainingInterest.findFirstOrThrow({ where: { userId: fresh.id } });
      expect(row.status).toBe("expired");
      const orders = await prisma.order.findMany({ where: { userId: fresh.id } });
      expect(orders.map((o) => o.status)).toEqual(["failed"]);
      createdOrderIds.push(...orders.map((o) => o.id));
    } finally {
      await prisma.trainingInterest.deleteMany({ where: { userId: fresh.id } });
      await prisma.auditLog.deleteMany({ where: { entityType: "order", entityId: { in: createdOrderIds } } });
      await prisma.order.deleteMany({ where: { userId: fresh.id } });
      await deleteTestUser(fresh.email);
    }
  });
});

describe("a participant in Pakistan", () => {
  it("registers at once without the fee — no order, no Stripe — and the row says so", async () => {
    const gateway = fakeGateway();
    const result = await startInterestRegistration({ userId: pakistani.id, formatId, form: form(pakistani.email), gateway });
    expect(result.kind).toBe("registered");
    expect(gateway.sessions).toHaveLength(0);
    const row = await prisma.trainingInterest.findFirstOrThrow({ where: { userId: pakistani.id } });
    expect(row).toMatchObject({ status: "confirmed", feeWaived: true, orderId: null });
    expect(row.confirmedAt).not.toBeNull();
    expect(await prisma.order.count({ where: { userId: pakistani.id } })).toBe(0);
    expect((await listAuditForEntity(prisma, "training_interest", row.id)).map((a) => a.action)).toEqual(["interest.registered"]);
    // Founder, 2026-10-03 (CR-2026-10-03-2252): the free path sends the confirmation email too — exactly one per interest.
    const mails = await prisma.outboundEmail.findMany({ where: { idempotencyKey: `interest-free:${row.id}` } });
    expect(mails).toHaveLength(1);
    expect(mails[0]).toMatchObject({ templateKey: "commerce.interest-registered-free", toEmail: pakistani.email.toLowerCase() });
    expect(mails[0]!.textBody).toContain("No fee applies to you");
    await expect(startInterestRegistration({ userId: pakistani.id, formatId, form: form(pakistani.email), gateway })).rejects.toMatchObject({ code: "interest_already_registered" });
  });
});

describe("who sees what", () => {
  it("an administrator sees every confirmed interest; a Trainer only those of their own trainings; unpaid rows never appear", async () => {
    const all = await listInterests({ kind: "all" }, { formatId });
    expect(all.map((r) => r.userId).sort()).toEqual([person.id, pakistani.id].sort());
    const mine = await listInterests({ kind: "expert", expertId }, { formatId });
    expect(mine.map((r) => r.userId).sort()).toEqual([person.id, pakistani.id].sort());
    const strangerId = randomUUID(); // a Trainer whose profile is linked to no training of this one
    expect(await listInterests({ kind: "expert", expertId: strangerId }, { formatId })).toEqual([]);
    expect(await interestCountsByFormat({ kind: "expert", expertId: strangerId })).toEqual(new Map());
    const row = all.find((r) => r.userId === person.id)!;
    expect(row).toMatchObject({ email: person.email, fullName: "Ivy Interested", mobile: "+60 12 345 6789", feeWaived: false, notifiedAt: null, programmeTitle, formatId });
    expect(row.dateOfBirth?.toISOString().slice(0, 10)).toBe("1990-05-17");
    expect((await listInterests({ kind: "all" }, { formatId, notified: "yes" })).length).toBe(0);
    expect((await listInterests({ kind: "all" }, { formatId, notified: "no" })).length).toBe(2);
    expect((await interestCountsByFormat({ kind: "all" })).get(formatId)).toEqual({ confirmed: 2, notified: 0 });
  });

  it("'Mark as notified' touches only rows in the caller's scope, once, with an audit row each", async () => {
    const rows = await listInterests({ kind: "all" }, { formatId });
    const ids = rows.map((r) => r.id);
    expect(await withTransaction((tx) => markInterestsNotified(tx, { kind: "expert", expertId: randomUUID() }, ids, admin.id))).toBe(0);
    expect(await withTransaction((tx) => markInterestsNotified(tx, { kind: "expert", expertId }, [ids[0]!, "not-a-uuid"], admin.id))).toBe(1);
    expect(await withTransaction((tx) => markInterestsNotified(tx, { kind: "expert", expertId }, [ids[0]!], admin.id))).toBe(0); // already marked
    expect(await withTransaction((tx) => markInterestsNotified(tx, { kind: "all" }, ids, admin.id))).toBe(1);
    const after = await listInterests({ kind: "all" }, { formatId });
    expect(after.every((r) => r.notifiedAt !== null)).toBe(true);
    for (const id of ids) expect((await listAuditForEntity(prisma, "training_interest", id)).filter((a) => a.action === "interest.notified")).toHaveLength(1);
    expect((await interestCountsByFormat({ kind: "all" })).get(formatId)).toEqual({ confirmed: 2, notified: 2 });
  });
});

describe("the person's own view, the overview and the order lists", () => {
  it("lists the person's interest, and notices when a date later opens for the format", async () => {
    const mine = await listInterestsForUser(person.id);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ programmeTitle, formatName: `Interest Test ${run}`, hasOpenDate: false, feeWaived: false });
    const start = new Date(Date.now() + 40 * 86_400_000);
    const o = await prisma.scheduledOffering.create({ data: { programmeId, deliveryFormatId: formatId, modality: "live_online", timezone: "Asia/Kuala_Lumpur", startsOn: start, endsOn: new Date(start.getTime() + 86_400_000), status: "open" } });
    createdOfferingIds.push(o.id);
    expect((await listInterestsForUser(person.id))[0]).toMatchObject({ hasOpenDate: true });
    // …and from then on nobody can register new interest in it.
    await expect(startInterestRegistration({ userId: pakistani.id, formatId, form: form(pakistani.email), gateway: fakeGateway() })).rejects.toMatchObject({ code: "interest_unavailable" });
    expect((await formatIdsWithoutOpenDate([formatId])).has(formatId)).toBe(false);
  });

  it("the formats overview shows dates and interest per format, in the caller's scope", async () => {
    const all = await listFormatsOverview({ kind: "all" });
    const training = all.find((t) => t.programmeId === programmeId)!;
    const f = training.formats.find((x) => x.formatId === formatId)!;
    expect(f).toMatchObject({ interestConfirmed: 2, interestNotified: 2, openDates: 1 });
    expect(training.formats.find((x) => x.formatId === datedFormatId)).toMatchObject({ openDates: 1, interestConfirmed: 0 });
    const sum = summariseFormats(all);
    expect(sum.formats).toBeGreaterThanOrEqual(2);
    expect(sum.interested).toBeGreaterThanOrEqual(2);
    expect(await listFormatsOverview({ kind: "expert", expertId: randomUUID() })).toEqual([]);
  });

  it("an interest order reads as 'Interest — <training>' for the person and the administrator, and filters by kind", async () => {
    const mine = await listOrdersForUser(person.id);
    expect(mine[0]).toMatchObject({ kind: "interest", programmeTitle: `Interest — ${programmeTitle}`, formatName: "Non-refundable interest fee", status: "paid" });
    const list = await listOrdersForAdmin({ kind: "interest", q: person.email });
    expect(list.items.length).toBeGreaterThanOrEqual(1);
    expect(list.items[0]).toMatchObject({ kind: "interest", programmeTitle: `Interest — ${programmeTitle}` });
  });

  it("the personal-data export carries the person's interests with the details they gave", async () => {
    const data = await buildDataExport(person.id);
    expect(data!.interests).toHaveLength(1);
    expect(data!.interests[0]).toMatchObject({ email: person.email, fullName: "Ivy Interested", mobile: "+60 12 345 6789", dateOfBirth: "1990-05-17", programmeTitle, status: "confirmed" });
  });
});

describe("protecting a format people are waiting for", () => {
  it("refuses to remove (or rename) a format that has registered interest", async () => {
    const formats = await prisma.deliveryFormat.findMany({ where: { programmeId, NOT: { id: formatId } }, orderBy: { position: "asc" } });
    const keep = formats.map((f) => ({ name: f.name, badge: f.badge ?? "", durationLabel: f.durationLabel, scheduleLabel: f.scheduleLabel, totalTimeLabel: f.totalTimeLabel, bestForText: (f.bestFor as string[]).join("\n") }));
    const attempt = withTransaction((tx) => replaceTrainingFormats(tx, programmeId, { kind: "all" }, keep, admin.id));
    await expect(attempt).rejects.toBeInstanceOf(TrainingRefusedError);
    await expect(attempt).rejects.toMatchObject({ code: "format_in_use" });
    expect(await prisma.deliveryFormat.count({ where: { id: formatId } })).toBe(1);
  });
});
