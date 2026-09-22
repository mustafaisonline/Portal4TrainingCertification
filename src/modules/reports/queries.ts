import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/constants";
import { RENEWAL_WINDOW_DAYS } from "@/modules/certificates/constants";
import { addDays, dateColumnToIso, isoToDateColumn, todayIso } from "@/modules/certificates/dates";
import { monthKeyOf, monthRange, REPORT_TIMEZONE } from "./months";

/*
 * Report queries (Milestone 8 plan §2 item 6) and the overview board's
 * counts (item 1). Server-computed from the tables on every request — no
 * materialised figures, no cache (Rule 6 is trivially met: nothing here is
 * state). Amounts stay in MINOR units and the order's own currency; there is
 * no FX conversion (plan §3 G5). Every function takes `now` (or none) and a
 * `Db` so the integration test can check the figures against direct
 * aggregates on its own fixtures.
 */

/* --------------------------------------------- registrations per offering */

export type RegistrationsPerOfferingRow = {
  offeringId: string;
  programmeTitle: string;
  formatName: string;
  modality: string;
  startsOn: string;
  endsOn: string;
  status: string;
  capacity: number | null;
  confirmed: number;
  cancelled: number;
  transferred: number;
  /** capacity − confirmed; null when the offering has no capacity. */
  seatsLeft: number | null;
};

export async function registrationsPerOffering(db: Db = getPrisma()): Promise<RegistrationsPerOfferingRow[]> {
  const [offerings, counts] = await Promise.all([
    db.scheduledOffering.findMany({
      include: { programme: { select: { title: true } }, deliveryFormat: { select: { name: true } } },
      orderBy: [{ startsOn: "desc" }, { createdAt: "desc" }],
    }),
    db.registration.groupBy({ by: ["offeringId", "status"], _count: { _all: true } }),
  ]);
  const byOffering = new Map<string, { confirmed: number; cancelled: number; transferred: number }>();
  for (const c of counts) {
    const entry = byOffering.get(c.offeringId) ?? { confirmed: 0, cancelled: 0, transferred: 0 };
    entry[c.status] += c._count._all;
    byOffering.set(c.offeringId, entry);
  }
  return offerings.map((o) => {
    const n = byOffering.get(o.id) ?? { confirmed: 0, cancelled: 0, transferred: 0 };
    return {
      offeringId: o.id,
      programmeTitle: o.programme.title,
      formatName: o.deliveryFormat?.name ?? MODALITY_LABEL[o.modality],
      modality: MODALITY_LABEL[o.modality],
      startsOn: dateColumnToIso(o.startsOn),
      endsOn: dateColumnToIso(o.endsOn),
      status: o.status,
      capacity: o.capacity,
      ...n,
      seatsLeft: o.capacity === null ? null : o.capacity - n.confirmed,
    };
  });
}

/* ------------------------------------------------------- revenue by month */

export type RevenueByMonthRow = {
  /** `YYYY-MM` in Asia/Kuala_Lumpur. */
  month: string;
  currency: string;
  /** Orders whose `paid_at` falls in the month (any later refund state). */
  paidOrders: number;
  grossMinor: number;
  /** Succeeded refunds by the refund's own `created_at` month. */
  refundCount: number;
  refundsMinor: number;
  /** gross − refunds. */
  netMinor: number;
  /** Processing fees recorded on the month's payments, where Stripe reported
   *  them; `feesKnownOrders` says how many of `paidOrders` carry one. */
  feesMinor: number;
  feesKnownOrders: number;
};

export type RevenueByMonthOptions = {
  /** Restrict to one `YYYY-MM` (the overview's "this month"). */
  month?: string;
  tz?: string;
};

/**
 * Paid orders grouped by the MYT month of `paid_at` and by currency, with
 * succeeded refunds netted by the month they were created (a refund made in
 * October against a September order reduces October). Grouping happens in
 * memory: the database cannot group by a zone-shifted month, and the row
 * counts are small at this stage of the product.
 */
export async function revenueByMonth(opts: RevenueByMonthOptions = {}, db: Db = getPrisma()): Promise<RevenueByMonthRow[]> {
  const tz = opts.tz ?? REPORT_TIMEZONE;
  const range = opts.month ? monthRange(opts.month, tz) : null;
  const inRange = range ? { gte: range.start, lt: range.end } : undefined;
  const [orders, refunds] = await Promise.all([
    db.order.findMany({
      where: { paidAt: inRange ? inRange : { not: null } },
      select: { paidAt: true, currency: true, amountMinor: true, payment: { select: { providerFeeMinor: true } } },
    }),
    db.refund.findMany({
      where: { status: "succeeded", ...(inRange ? { createdAt: inRange } : {}) },
      select: { createdAt: true, amountMinor: true, payment: { select: { currency: true } } },
    }),
  ]);
  const rows = new Map<string, RevenueByMonthRow>();
  const rowFor = (month: string, currency: string) => {
    const key = `${month}|${currency}`;
    let row = rows.get(key);
    if (!row) {
      row = { month, currency, paidOrders: 0, grossMinor: 0, refundCount: 0, refundsMinor: 0, netMinor: 0, feesMinor: 0, feesKnownOrders: 0 };
      rows.set(key, row);
    }
    return row;
  };
  for (const o of orders) {
    if (!o.paidAt) continue;
    const row = rowFor(monthKeyOf(o.paidAt, tz), o.currency);
    row.paidOrders += 1;
    row.grossMinor += Number(o.amountMinor);
    if (o.payment?.providerFeeMinor != null) {
      row.feesMinor += Number(o.payment.providerFeeMinor);
      row.feesKnownOrders += 1;
    }
  }
  for (const r of refunds) {
    const row = rowFor(monthKeyOf(r.createdAt, tz), r.payment.currency);
    row.refundCount += 1;
    row.refundsMinor += Number(r.amountMinor);
  }
  for (const row of rows.values()) row.netMinor = row.grossMinor - row.refundsMinor;
  return [...rows.values()].sort((a, b) => (a.month === b.month ? a.currency.localeCompare(b.currency) : b.month.localeCompare(a.month)));
}

/* ---------------------------------------------------------- certificates */

export type CertificatesSummary = {
  /** The MYT calendar date the statuses were computed against. */
  today: string;
  issued: number;
  active: number;
  renewalDue: number;
  expired: number;
  revoked: number;
};

/** Counts by computed status — the same date predicates the admin list's
 *  status filter applies (certificates/repository.ts `statusWhere`; rules.ts
 *  `statusOf`): revoked wins; expired the day after `expires_on`; renewal due
 *  from RENEWAL_WINDOW_DAYS before expiry through the expiry date. */
export async function certificatesSummary(now = new Date(), db: Db = getPrisma()): Promise<CertificatesSummary> {
  const today = todayIso(now);
  const t = isoToDateColumn(today);
  const windowEnd = isoToDateColumn(addDays(today, RENEWAL_WINDOW_DAYS));
  const [issued, revoked, expired, renewalDue, active] = await Promise.all([
    db.certificate.count(),
    db.certificate.count({ where: { revokedAt: { not: null } } }),
    db.certificate.count({ where: { revokedAt: null, expiresOn: { lt: t } } }),
    db.certificate.count({ where: { revokedAt: null, expiresOn: { gte: t, lte: windowEnd } } }),
    db.certificate.count({ where: { revokedAt: null, expiresOn: { gt: windowEnd } } }),
  ]);
  return { today, issued, active, renewalDue, expired, revoked };
}

/* --------------------------------------------------------------- reviews */

export type ReviewsByStateRow = {
  moderation: "pending" | "approved" | "rejected";
  total: number;
  visible: number;
  hidden: number;
  /** Learner consented to public display. */
  withPublicConsent: number;
  /** Approved, visible and consented — what /reviews shows. */
  live: number;
};

export async function reviewsByState(db: Db = getPrisma()): Promise<ReviewsByStateRow[]> {
  const groups = await db.review.groupBy({ by: ["moderationStatus", "visibilityStatus", "consentPublic"], _count: { _all: true } });
  const rows: Record<ReviewsByStateRow["moderation"], ReviewsByStateRow> = {
    pending: { moderation: "pending", total: 0, visible: 0, hidden: 0, withPublicConsent: 0, live: 0 },
    approved: { moderation: "approved", total: 0, visible: 0, hidden: 0, withPublicConsent: 0, live: 0 },
    rejected: { moderation: "rejected", total: 0, visible: 0, hidden: 0, withPublicConsent: 0, live: 0 },
  };
  for (const g of groups) {
    const row = rows[g.moderationStatus];
    const n = g._count._all;
    row.total += n;
    if (g.visibilityStatus === "visible") row.visible += n;
    else row.hidden += n;
    if (g.consentPublic) row.withPublicConsent += n;
    if (g.moderationStatus === "approved" && g.visibilityStatus === "visible" && g.consentPublic) row.live += n;
  }
  return [rows.pending, rows.approved, rows.rejected];
}

/* ------------------------------------------------------------- enquiries */

export type EnquiriesByStatusRow = {
  status: "new" | "replied" | "closed";
  total: number;
  general: number;
  organisation: number;
  programmeInterest: number;
};

export async function enquiriesByStatus(db: Db = getPrisma()): Promise<EnquiriesByStatusRow[]> {
  const groups = await db.enquiry.groupBy({ by: ["status", "kind"], _count: { _all: true } });
  const rows: Record<EnquiriesByStatusRow["status"], EnquiriesByStatusRow> = {
    new: { status: "new", total: 0, general: 0, organisation: 0, programmeInterest: 0 },
    replied: { status: "replied", total: 0, general: 0, organisation: 0, programmeInterest: 0 },
    closed: { status: "closed", total: 0, general: 0, organisation: 0, programmeInterest: 0 },
  };
  for (const g of groups) {
    const row = rows[g.status];
    const n = g._count._all;
    row.total += n;
    if (g.kind === "general") row.general += n;
    else if (g.kind === "organisation") row.organisation += n;
    else row.programmeInterest += n;
  }
  return [rows.new, rows.replied, rows.closed];
}

/* ------------------------------------------------------- overview extras */

/** Confirmed registrations on offerings that start today (MYT) or later. */
export async function confirmedUpcomingRegistrations(now = new Date(), db: Db = getPrisma()): Promise<number> {
  const t = isoToDateColumn(todayIso(now));
  return db.registration.count({ where: { status: "confirmed", offering: { startsOn: { gte: t } } } });
}

export type JobRunSummary = { ranAt: Date; after: unknown };

/** The newest `job.run` audit row for a job id, or null when it has never
 *  run — the reminders job writes one per run (M7). */
export async function lastJobRun(jobId: string, db: Db = getPrisma()): Promise<JobRunSummary | null> {
  const row = await db.auditLog.findFirst({
    where: { action: "job.run", entityType: "job", entityId: jobId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, after: true },
  });
  return row ? { ranAt: row.createdAt, after: row.after } : null;
}
