import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { EnquiryNotFoundError, countOpenEnquiries, getEnquiryForAdmin, listEnquiriesForAdmin, setEnquiryStatus } from "@/modules/catalogue/enquiries/admin.repository";
import { createEnquiry } from "@/modules/catalogue/enquiries/repository";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import type { ProgrammeRecord } from "@/modules/catalogue/programmes/types";
import { getOrderForAdmin, listOrderCurrencies, listOrdersForAdmin } from "@/modules/commerce/admin-orders.repository";
import { grantRole } from "@/modules/identity/roles.repository";
import { listAuditForEntity, writeAudit } from "@/modules/platform/audit/repository";
import { toCsv } from "@/modules/reports/csv";
import { currentMonthKey, isMonthKey, monthKeyOf, monthLabel, monthRange } from "@/modules/reports/months";
import {
  certificatesSummary,
  confirmedUpcomingRegistrations,
  enquiriesByStatus,
  lastJobRun,
  registrationsPerOffering,
  revenueByMonth,
  reviewsByState,
} from "@/modules/reports/queries";
import { buildAllReports, buildReport, REPORT_KEYS } from "@/modules/reports/registry";
import { todayIso } from "@/modules/certificates/dates";
import { completeProfile, uniqueEmail } from "../helpers/identity-db";

/*
 * Milestone 8 part 1 — admin operations against the REAL test database
 * (MILESTONE_8_EXECUTION_PLAN.md §4 criteria 3, 4, 5): the orders read
 * model with its filters and totals, the enquiry status change with its
 * audit row, and every report figure compared with a direct Prisma
 * aggregate over the same rows. Fixtures are written directly (the webhook
 * path is covered by commerce.test.ts) and removed in afterAll.
 */

const prisma = getPrisma();
const run = randomUUID().slice(0, 8);

let flagship: ProgrammeRecord;
let buyer: { id: string; email: string };
let admin: { id: string; email: string };
let offeringId: string;
let paidOrderId: string;
let refundedOrderId: string;
let pendingUsdOrderId: string;
let refundId: string;
let enquiryId: string;
const now = new Date();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

beforeAll(async () => {
  const p = await findFlagshipProgramme();
  if (!p) throw new Error("seeded flagship programme required");
  flagship = p;

  const buyerRow = await prisma.user.create({ data: { email: uniqueEmail("m8-buyer"), name: "M8 Buyer", country: "Malaysia" } });
  buyer = { id: buyerRow.id, email: buyerRow.email };
  await completeProfile(buyer.id);
  const adminRow = await prisma.user.create({ data: { email: uniqueEmail("m8-admin"), name: "M8 Admin", country: "Malaysia" } });
  admin = { id: adminRow.id, email: adminRow.email };
  await withTransaction((tx) => grantRole(tx, { userId: admin.id, role: "platform_admin", grantedByUserId: null, reason: "test" }));

  const offering = await prisma.scheduledOffering.create({
    data: {
      programmeId: flagship.id,
      deliveryFormatId: flagship.deliveryFormats[0]?.id ?? null,
      modality: "live_online",
      timezone: "Asia/Kuala_Lumpur",
      startsOn: daysFromNow(40),
      endsOn: daysFromNow(42),
      capacity: 10,
      status: "open",
      scheduleNote: `m8-${run}`,
    },
  });
  offeringId = offering.id;

  // Order A — paid, confirmed registration, fee known.
  const a = await prisma.order.create({
    data: {
      userId: buyer.id,
      offeringId,
      programmeId: flagship.id,
      kind: "registration",
      status: "paid",
      region: "malaysia",
      currency: "MYR",
      amountMinor: BigInt(499900),
      expiresAt: new Date(now.getTime() + 3600_000),
      paidAt: now,
      stripeCheckoutSessionId: `cs_test_${run}_a`,
    },
  });
  paidOrderId = a.id;
  await prisma.payment.create({
    data: { orderId: a.id, providerPaymentIntentId: `pi_test_${run}_a`, amountMinor: a.amountMinor, currency: "MYR", status: "succeeded", providerFeeMinor: BigInt(15197), receiptUrl: "https://receipts.stripe.test/a" },
  });
  await prisma.registration.create({ data: { userId: buyer.id, offeringId, orderId: a.id, status: "confirmed" } });
  await withTransaction((tx) => writeAudit(tx, { actorUserId: buyer.id, action: "order.created", entityType: "order", entityId: a.id, after: { status: "pending" } }));

  // Order B — paid then partially refunded (succeeded refund), registration cancelled.
  const b = await prisma.order.create({
    data: {
      userId: buyer.id,
      offeringId,
      programmeId: flagship.id,
      kind: "registration",
      status: "partially_refunded",
      region: "malaysia",
      currency: "MYR",
      amountMinor: BigInt(499900),
      expiresAt: new Date(now.getTime() + 3600_000),
      paidAt: now,
      stripeCheckoutSessionId: `cs_test_${run}_b`,
    },
  });
  refundedOrderId = b.id;
  const paymentB = await prisma.payment.create({
    data: { orderId: b.id, providerPaymentIntentId: `pi_test_${run}_b`, amountMinor: b.amountMinor, currency: "MYR", status: "partially_refunded" },
  });
  const regB = await prisma.registration.create({
    data: { userId: buyer.id, offeringId, orderId: b.id, status: "cancelled", cancelledAt: now, cancellationRefundPercent: 50 },
  });
  const refund = await prisma.refund.create({
    data: { paymentId: paymentB.id, amountMinor: BigInt(242352), percent: 50, reason: "participant_cancellation", status: "succeeded", requestedByUserId: buyer.id, providerRefundId: `re_test_${run}` },
  });
  refundId = refund.id;
  await withTransaction(async (tx) => {
    await writeAudit(tx, { actorUserId: buyer.id, action: "registration.cancelled", entityType: "registration", entityId: regB.id, before: { status: "confirmed" }, after: { status: "cancelled" } });
    await writeAudit(tx, { actorUserId: null, action: "refund.updated", entityType: "refund", entityId: refund.id, before: { status: "pending" }, after: { status: "succeeded" } });
  });

  // Order C — pending, USD, never paid.
  const c = await prisma.order.create({
    data: {
      userId: buyer.id,
      offeringId,
      programmeId: flagship.id,
      kind: "registration",
      status: "pending",
      region: "international",
      currency: "USD",
      amountMinor: BigInt(129900),
      expiresAt: new Date(now.getTime() + 1800_000),
      stripeCheckoutSessionId: `cs_test_${run}_c`,
    },
  });
  pendingUsdOrderId = c.id;

  const enquiry = await createEnquiry({
    kind: "organisation",
    name: `M8 Enquirer ${run}`,
    email: uniqueEmail("m8-enquiry"),
    organisation: "Test Org",
    message: `Integration test enquiry ${run} — please ignore.`,
    programmeId: flagship.id,
    sourcePath: "/for-organisations",
  });
  enquiryId = enquiry.id;
});

afterAll(async () => {
  const orderIds = [paidOrderId, refundedOrderId, pendingUsdOrderId].filter(Boolean);
  const paymentIds = (await prisma.payment.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((p) => p.id);
  const registrationIds = (await prisma.registration.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((r) => r.id);
  await prisma.$transaction([
    prisma.refund.deleteMany({ where: { paymentId: { in: paymentIds } } }),
    prisma.registration.deleteMany({ where: { id: { in: registrationIds } } }),
    prisma.payment.deleteMany({ where: { id: { in: paymentIds } } }),
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.enquiry.deleteMany({ where: { id: enquiryId } }),
    prisma.scheduledOffering.deleteMany({ where: { id: offeringId } }),
    prisma.auditLog.deleteMany({ where: { entityId: { in: [...orderIds, ...paymentIds, ...registrationIds, refundId, enquiryId, buyer.id, admin.id].filter(Boolean) } } }),
    prisma.auditLog.deleteMany({ where: { actorUserId: { in: [buyer.id, admin.id] } } }),
    prisma.consent.deleteMany({ where: { userId: { in: [buyer.id, admin.id] } } }),
    prisma.userProfile.deleteMany({ where: { userId: { in: [buyer.id, admin.id] } } }),
    prisma.userRole.deleteMany({ where: { userId: { in: [buyer.id, admin.id] } } }),
    prisma.user.deleteMany({ where: { id: { in: [buyer.id, admin.id] } } }),
  ]);
  await disconnectPrisma();
});

/* ================================================================== orders */

describe("orders for administrators (plan §2 item 2)", () => {
  it("search by buyer email lists the person's orders newest first with totals over the filtered set by currency", async () => {
    const page = await listOrdersForAdmin({ q: buyer.email });
    expect(page.total).toBe(3);
    expect(page.items.map((o) => o.id).sort()).toEqual([paidOrderId, refundedOrderId, pendingUsdOrderId].sort());
    expect(page.totals.count).toBe(3);
    expect(page.totals.byCurrency).toEqual([
      { currency: "MYR", count: 2, amountMinor: 999800 },
      { currency: "USD", count: 1, amountMinor: 129900 },
    ]);
    const paid = page.items.find((o) => o.id === paidOrderId)!;
    expect(paid).toMatchObject({ status: "paid", kind: "registration", userEmail: buyer.email, registrationStatus: "confirmed", receiptUrl: "https://receipts.stripe.test/a", certificateCode: null });
    expect(paid.programmeTitle).toBe(flagship.title);
  });

  it("filters by status, kind, currency, date range and order id; the totals follow the filter", async () => {
    const paid = await listOrdersForAdmin({ q: buyer.email, status: "paid" });
    expect(paid.items.map((o) => o.id)).toEqual([paidOrderId]);
    expect(paid.totals).toEqual({ count: 1, byCurrency: [{ currency: "MYR", count: 1, amountMinor: 499900 }] });

    const usd = await listOrdersForAdmin({ q: buyer.email, currency: "usd" });
    expect(usd.items.map((o) => o.id)).toEqual([pendingUsdOrderId]);

    const renewals = await listOrdersForAdmin({ q: buyer.email, kind: "certificate_renewal" });
    expect(renewals.total).toBe(0);
    expect(renewals.totals).toEqual({ count: 0, byCurrency: [] });

    const byId = await listOrdersForAdmin({ q: refundedOrderId });
    expect(byId.items.map((o) => o.id)).toEqual([refundedOrderId]);

    const today = todayIso(now);
    const inRange = await listOrdersForAdmin({ q: buyer.email, from: today, to: today });
    expect(inRange.total).toBe(3);
    const tomorrow = todayIso(new Date(now.getTime() + 86_400_000));
    const afterToday = await listOrdersForAdmin({ q: buyer.email, from: tomorrow });
    expect(afterToday.total).toBe(0);
    const badDates = await listOrdersForAdmin({ q: buyer.email, from: "not-a-date", to: "2026-13-40" });
    expect(badDates.total).toBe(3); // unparseable bounds are ignored, not an error

    expect(await listOrderCurrencies()).toEqual(expect.arrayContaining(["MYR", "USD"]));
  });

  it("the detail carries the payment with its fee, the refunds, the registration's cancellation facts and the merged audit trail", async () => {
    const detail = await getOrderForAdmin(refundedOrderId);
    expect(detail).not.toBeNull();
    expect(detail!.payment).toMatchObject({ providerPaymentIntentId: `pi_test_${run}_b`, providerFeeMinor: null, status: "partially_refunded" });
    expect(detail!.payment!.refunds).toHaveLength(1);
    expect(detail!.payment!.refunds[0]).toMatchObject({ amountMinor: 242352, percent: 50, reason: "participant_cancellation", status: "succeeded", providerRefundId: `re_test_${run}` });
    expect(detail!.registration).toMatchObject({ status: "cancelled", cancellationRefundPercent: 50, transferUsed: false });
    expect(detail!.audit.map((a) => a.action)).toEqual(["registration.cancelled", "refund.updated"]);

    const paid = await getOrderForAdmin(paidOrderId);
    expect(paid!.payment!.providerFeeMinor).toBe(15197);
    expect(paid!.audit.map((a) => a.action)).toEqual(["order.created"]);

    const pending = await getOrderForAdmin(pendingUsdOrderId);
    expect(pending!.payment).toBeNull();
    expect(pending!.registration).toBeNull();

    expect(await getOrderForAdmin("not-a-uuid")).toBeNull();
    expect(await getOrderForAdmin(randomUUID())).toBeNull();
  });
});

/* =============================================================== enquiries */

describe("enquiry status changes (plan §2 item 3, §4 criterion 3)", () => {
  it("lists and finds the enquiry with its programme title; counts it as open while new", async () => {
    const page = await listEnquiriesForAdmin({ q: run });
    expect(page.items.map((e) => e.id)).toEqual([enquiryId]);
    expect(page.items[0]).toMatchObject({ status: "new", kind: "organisation", programmeTitle: flagship.title, sourcePath: "/for-organisations" });
    const byStatus = await listEnquiriesForAdmin({ q: run, status: "closed" });
    expect(byStatus.total).toBe(0);
    const byKind = await listEnquiriesForAdmin({ q: run, kind: "general" });
    expect(byKind.total).toBe(0);
    expect(await countOpenEnquiries()).toBeGreaterThanOrEqual(1);
    expect((await getEnquiryForAdmin(enquiryId))?.id).toBe(enquiryId);
    expect(await getEnquiryForAdmin("nope")).toBeNull();
  });

  it("replied → closed → reopened, each with an audit row carrying before/after; a no-op change writes nothing", async () => {
    const replied = await withTransaction((tx) => setEnquiryStatus(tx, enquiryId, admin.id, "replied"));
    expect(replied.status).toBe("replied");
    // The same status again: nothing changes, nothing is audited.
    await withTransaction((tx) => setEnquiryStatus(tx, enquiryId, admin.id, "replied"));
    const closed = await withTransaction((tx) => setEnquiryStatus(tx, enquiryId, admin.id, "closed"));
    expect(closed.status).toBe("closed");
    const reopened = await withTransaction((tx) => setEnquiryStatus(tx, enquiryId, admin.id, "new"));
    expect(reopened.status).toBe("new");

    const audit = await listAuditForEntity(prisma, "enquiry", enquiryId);
    expect(audit.map((a) => [a.action, a.actorUserId, a.before, a.after])).toEqual([
      ["enquiry.status_changed", admin.id, { status: "new" }, { status: "replied" }],
      ["enquiry.status_changed", admin.id, { status: "replied" }, { status: "closed" }],
      ["enquiry.status_changed", admin.id, { status: "closed" }, { status: "new" }],
    ]);
    expect((await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiryId } })).status).toBe("new");
  });

  it("refuses an unknown enquiry", async () => {
    await expect(withTransaction((tx) => setEnquiryStatus(tx, randomUUID(), admin.id, "closed"))).rejects.toBeInstanceOf(EnquiryNotFoundError);
    await expect(withTransaction((tx) => setEnquiryStatus(tx, "garbage", admin.id, "closed"))).rejects.toBeInstanceOf(EnquiryNotFoundError);
  });
});

/* ================================================================= reports */

describe("reports equal direct aggregates on the same rows (plan §4 criterion 4)", () => {
  it("MYT months: key, label, range and the boundary instant", () => {
    expect(isMonthKey("2026-09")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(monthLabel("2026-09")).toBe("Sep 2026");
    const { start, end } = monthRange("2026-09");
    expect(start.toISOString()).toBe("2026-08-31T16:00:00.000Z"); // 1 Sep 00:00 MYT (UTC+8)
    expect(end.toISOString()).toBe("2026-09-30T16:00:00.000Z");
    expect(monthKeyOf(new Date("2026-08-31T16:00:00.000Z"))).toBe("2026-09");
    expect(monthKeyOf(new Date("2026-08-31T15:59:59.000Z"))).toBe("2026-08");
    expect(currentMonthKey(now)).toBe(monthKeyOf(now));
  });

  it("revenue by month: gross, refunds, net and known fees per currency match Prisma aggregates over the month", async () => {
    const month = currentMonthKey(now);
    const { start, end } = monthRange(month);
    const rows = await revenueByMonth({ month });
    const myr = rows.find((r) => r.month === month && r.currency === "MYR");
    expect(myr).toBeDefined();

    const orders = await prisma.order.aggregate({ where: { currency: "MYR", paidAt: { gte: start, lt: end } }, _count: { _all: true }, _sum: { amountMinor: true } });
    const refunds = await prisma.refund.aggregate({ where: { status: "succeeded", payment: { currency: "MYR" }, createdAt: { gte: start, lt: end } }, _count: { _all: true }, _sum: { amountMinor: true } });
    const fees = await prisma.payment.aggregate({ where: { currency: "MYR", providerFeeMinor: { not: null }, order: { paidAt: { gte: start, lt: end } } }, _count: { _all: true }, _sum: { providerFeeMinor: true } });
    expect(myr!.paidOrders).toBe(orders._count._all);
    expect(myr!.grossMinor).toBe(Number(orders._sum.amountMinor ?? 0));
    expect(myr!.refundCount).toBe(refunds._count._all);
    expect(myr!.refundsMinor).toBe(Number(refunds._sum.amountMinor ?? 0));
    expect(myr!.netMinor).toBe(myr!.grossMinor - myr!.refundsMinor);
    expect(myr!.feesMinor).toBe(Number(fees._sum.providerFeeMinor ?? 0));
    expect(myr!.feesKnownOrders).toBe(fees._count._all);
    // The fixtures are inside those figures.
    expect(myr!.paidOrders).toBeGreaterThanOrEqual(2);
    expect(myr!.refundsMinor).toBeGreaterThanOrEqual(242352);
    expect(myr!.feesMinor).toBeGreaterThanOrEqual(15197);
    // The pending USD order was never paid, so it contributes nothing.
    const usd = rows.find((r) => r.month === month && r.currency === "USD");
    const usdPaid = await prisma.order.count({ where: { currency: "USD", paidAt: { gte: start, lt: end } } });
    expect(usd?.paidOrders ?? 0).toBe(usdPaid);

    // The all-months view contains the same row for this month.
    const all = await revenueByMonth();
    expect(all.find((r) => r.month === month && r.currency === "MYR")).toEqual(myr);
  });

  it("registrations per offering: the fixture offering shows one confirmed, one cancelled, nine seats left", async () => {
    const rows = await registrationsPerOffering();
    const row = rows.find((r) => r.offeringId === offeringId);
    expect(row).toMatchObject({ programmeTitle: flagship.title, status: "open", capacity: 10, confirmed: 1, cancelled: 1, transferred: 0, seatsLeft: 9 });
    const confirmed = await prisma.registration.count({ where: { offeringId, status: "confirmed" } });
    expect(row!.confirmed).toBe(confirmed);
    expect(await confirmedUpcomingRegistrations(now)).toBe(await prisma.registration.count({ where: { status: "confirmed", offering: { startsOn: { gte: new Date(`${todayIso(now)}T00:00:00Z`) } } } }));
  });

  it("certificates summary: the four states sum to the issued total and match direct counts", async () => {
    const s = await certificatesSummary(now);
    expect(s.today).toBe(todayIso(now));
    expect(s.issued).toBe(await prisma.certificate.count());
    expect(s.active + s.renewalDue + s.expired + s.revoked).toBe(s.issued);
    expect(s.revoked).toBe(await prisma.certificate.count({ where: { revokedAt: { not: null } } }));
  });

  it("reviews by state and enquiries by status match groupBy counts", async () => {
    const reviews = await reviewsByState();
    expect(reviews.map((r) => r.moderation)).toEqual(["pending", "approved", "rejected"]);
    for (const row of reviews) {
      expect(row.total).toBe(await prisma.review.count({ where: { moderationStatus: row.moderation } }));
      expect(row.visible + row.hidden).toBe(row.total);
      expect(row.live).toBe(await prisma.review.count({ where: { moderationStatus: row.moderation, visibilityStatus: "visible", consentPublic: true } }));
    }
    const enquiries = await enquiriesByStatus();
    expect(enquiries.map((r) => r.status)).toEqual(["new", "replied", "closed"]);
    for (const row of enquiries) {
      expect(row.total).toBe(await prisma.enquiry.count({ where: { status: row.status } }));
      expect(row.general + row.organisation + row.programmeInterest).toBe(row.total);
    }
    expect(enquiries[0]!.organisation).toBeGreaterThanOrEqual(1);
  });

  it("last job run reads the newest job.run audit row, or null", async () => {
    const jobId = `m8-test-job-${run}`;
    expect(await lastJobRun(jobId)).toBeNull();
    await withTransaction(async (tx) => {
      await writeAudit(tx, { actorUserId: null, action: "job.run", entityType: "job", entityId: jobId, after: { queued: 1 } });
      await writeAudit(tx, { actorUserId: null, action: "job.run", entityType: "job", entityId: jobId, after: { queued: 2 } });
    });
    try {
      const run2 = await lastJobRun(jobId);
      expect(run2?.after).toEqual({ queued: 2 });
    } finally {
      await prisma.auditLog.deleteMany({ where: { entityType: "job", entityId: jobId } });
    }
  });

  it("every report in the catalogue builds, has as many display cells as CSV cells, and its CSV starts with the header row", async () => {
    const all = await buildAllReports(now);
    expect(all.map((t) => t.key)).toEqual([...REPORT_KEYS]);
    for (const table of all) {
      expect(table.rows.length).toBe(table.display.length);
      for (let i = 0; i < table.rows.length; i += 1) {
        expect(table.rows[i]!.length, `${table.key} row ${i}`).toBe(table.headers.length);
        expect(table.display[i]!.length, `${table.key} display ${i}`).toBe(table.headers.length);
      }
      const csv = toCsv(table.headers, table.rows);
      expect(csv.split("\r\n")[0]).toBe(table.headers.join(","));
    }
    const enquiries = await buildReport("enquiries", now);
    expect(toCsv(enquiries.headers, enquiries.rows).startsWith("Status,Total,General,Organisation,Programme interest\r\nNew,")).toBe(true);
  });
});
