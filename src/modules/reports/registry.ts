import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { OFFERING_STATUS_LABEL } from "@/modules/catalogue/offerings/constants";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { formatCalendarDate } from "@/modules/certificates/dates";
import { REVIEW_MODERATION_LABEL } from "@/modules/reviews/constants";
import type { CsvCell } from "./csv";
import { monthLabel } from "./months";
import { certificatesSummary, enquiriesByStatus, registrationsPerOffering, revenueByMonth, reviewsByState } from "./queries";

/*
 * The report catalogue (Milestone 8 plan §2 item 6): one entry per table
 * the /admin/reports page shows and the CSV route serves, so the screen and
 * the download can never disagree about what a report contains. Each report
 * is built once as typed rows and projected twice — `display` (formatted
 * text for the table) and `rows` (raw values for the CSV: amounts as
 * major-unit numbers, dates as ISO strings) — from the same data.
 */

export const REPORT_KEYS = ["registrations-per-offering", "revenue-by-month", "certificates", "reviews", "enquiries"] as const;
export type ReportKey = (typeof REPORT_KEYS)[number];

export function isReportKey(value: string): value is ReportKey {
  return (REPORT_KEYS as readonly string[]).includes(value);
}

export type ReportTable = {
  key: ReportKey;
  title: string;
  description: string;
  headers: string[];
  /** Raw values for the CSV. */
  rows: CsvCell[][];
  /** Formatted text for the page; same shape as `rows`. */
  display: string[][];
  /** One line under the table when the data needs a caveat. */
  note?: string;
};

const ENQUIRY_STATUS_LABEL = { new: "New", replied: "Replied", closed: "Closed" } as const;

function major(minor: number): number {
  return Math.round(minor) / 100;
}

async function buildRegistrations(db: Db): Promise<ReportTable> {
  const rows = await registrationsPerOffering(db);
  return {
    key: "registrations-per-offering",
    title: "Registrations per offering",
    description: "Every scheduled date with its confirmed, cancelled and transferred registrations and the seats still available.",
    headers: ["Programme", "Format", "Starts", "Ends", "Status", "Capacity", "Confirmed", "Cancelled", "Transferred", "Seats left", "Offering id"],
    rows: rows.map((r) => [r.programmeTitle, r.formatName, r.startsOn, r.endsOn, r.status, r.capacity, r.confirmed, r.cancelled, r.transferred, r.seatsLeft, r.offeringId]),
    display: rows.map((r) => [
      r.programmeTitle,
      r.formatName,
      formatCalendarDate(r.startsOn),
      formatCalendarDate(r.endsOn),
      OFFERING_STATUS_LABEL[r.status as keyof typeof OFFERING_STATUS_LABEL] ?? r.status,
      r.capacity === null ? "—" : String(r.capacity),
      String(r.confirmed),
      String(r.cancelled),
      String(r.transferred),
      r.seatsLeft === null ? "—" : String(r.seatsLeft),
      r.offeringId,
    ]),
    note: "Transfers move the registration to the new date; the transferred column stays at zero until the data model records a chain (M4 note).",
  };
}

async function buildRevenue(db: Db): Promise<ReportTable> {
  const rows = await revenueByMonth({}, db);
  return {
    key: "revenue-by-month",
    title: "Revenue by month and currency",
    description: "Paid orders by the Malaysia-time month they were paid, succeeded refunds by the month they were made, and Stripe's processing fee where it was reported. No currency conversion.",
    headers: ["Month", "Currency", "Paid orders", "Gross", "Refunds", "Refunded amount", "Net of refunds", "Processing fees (known)", "Orders with fee known"],
    rows: rows.map((r) => [r.month, r.currency, r.paidOrders, major(r.grossMinor), r.refundCount, major(r.refundsMinor), major(r.netMinor), major(r.feesMinor), r.feesKnownOrders]),
    display: rows.map((r) => [
      monthLabel(r.month),
      r.currency,
      String(r.paidOrders),
      formatMoney(r.grossMinor, r.currency),
      String(r.refundCount),
      formatMoney(r.refundsMinor, r.currency),
      formatMoney(r.netMinor, r.currency),
      formatMoney(r.feesMinor, r.currency),
      `${r.feesKnownOrders} of ${r.paidOrders}`,
    ]),
    note: "Amounts are in the order's own currency in the CSV (major units, e.g. 4999.00). Fees are only those Stripe has reported; the remainder are unknown, not zero.",
  };
}

async function buildCertificates(now: Date, db: Db): Promise<ReportTable> {
  const s = await certificatesSummary(now, db);
  const lines: [string, number][] = [
    ["Issued (all time)", s.issued],
    ["Active", s.active],
    ["Renewal due (within 30 days of expiry)", s.renewalDue],
    ["Expired", s.expired],
    ["Revoked", s.revoked],
  ];
  return {
    key: "certificates",
    title: "Certificates of Completion",
    description: `Status computed on ${formatCalendarDate(s.today)} (Malaysia time). Active + renewal due + expired + revoked = issued.`,
    headers: ["Measure", "Count", "As of"],
    rows: lines.map(([label, n]) => [label, n, s.today]),
    display: lines.map(([label, n]) => [label, String(n), formatCalendarDate(s.today)]),
  };
}

async function buildReviews(db: Db): Promise<ReportTable> {
  const rows = await reviewsByState(db);
  return {
    key: "reviews",
    title: "Reviews by moderation state",
    description: "Submitted reviews by moderation decision, with how many are visible, hidden, consented to public display, and actually live on /reviews.",
    headers: ["Moderation", "Total", "Visible", "Hidden", "With public consent", "Live on /reviews"],
    rows: rows.map((r) => [REVIEW_MODERATION_LABEL[r.moderation], r.total, r.visible, r.hidden, r.withPublicConsent, r.live]),
    display: rows.map((r) => [REVIEW_MODERATION_LABEL[r.moderation], String(r.total), String(r.visible), String(r.hidden), String(r.withPublicConsent), String(r.live)]),
  };
}

async function buildEnquiries(db: Db): Promise<ReportTable> {
  const rows = await enquiriesByStatus(db);
  return {
    key: "enquiries",
    title: "Enquiries by status",
    description: "Contact and register-interest submissions by status and kind.",
    headers: ["Status", "Total", "General", "Organisation", "Programme interest"],
    rows: rows.map((r) => [ENQUIRY_STATUS_LABEL[r.status], r.total, r.general, r.organisation, r.programmeInterest]),
    display: rows.map((r) => [ENQUIRY_STATUS_LABEL[r.status], String(r.total), String(r.general), String(r.organisation), String(r.programmeInterest)]),
  };
}

export async function buildReport(key: ReportKey, now = new Date(), db: Db = getPrisma()): Promise<ReportTable> {
  switch (key) {
    case "registrations-per-offering":
      return buildRegistrations(db);
    case "revenue-by-month":
      return buildRevenue(db);
    case "certificates":
      return buildCertificates(now, db);
    case "reviews":
      return buildReviews(db);
    case "enquiries":
      return buildEnquiries(db);
  }
}

export function buildAllReports(now = new Date(), db: Db = getPrisma()): Promise<ReportTable[]> {
  return Promise.all(REPORT_KEYS.map((key) => buildReport(key, now, db)));
}
