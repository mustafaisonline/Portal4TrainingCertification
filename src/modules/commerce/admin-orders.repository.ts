import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid, MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import type { PriceRegion } from "@/modules/catalogue/programmes/types";
import { addDays, isIsoDate, zonedLocalToInstant } from "@/modules/certificates/dates";
import { listAuditForEntity, type AuditRecord } from "@/modules/platform/audit/repository";
import type { OrderKind, OrderStatus, RefundStatus, RegistrationStatus } from "./registrations.service";

/*
 * Orders & payments for administrators (Milestone 8 plan §2 item 2) —
 * READ-ONLY. Nothing here writes: refunds on behalf of a participant wait
 * for the amount rule in plan §5 A2 and are handled from the Stripe
 * dashboard until then (plan §3 G1). Filters are plain values so the page
 * can pass GET parameters straight through; dates are MYT calendar days
 * (the zone every other admin screen uses).
 */

export const ORDER_STATUSES = ["pending", "paid", "expired", "failed", "cancelled", "refunded", "partially_refunded"] as const satisfies readonly OrderStatus[];
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  expired: "Expired",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};
export const ORDER_KINDS = ["registration", "certificate_renewal"] as const satisfies readonly OrderKind[];
export const ORDER_KIND_LABEL: Record<OrderKind, string> = { registration: "Registration", certificate_renewal: "Certificate renewal" };
export const REFUND_REASON_LABEL: Record<"participant_cancellation" | "academy_cancellation" | "manual", string> = {
  participant_cancellation: "Participant cancellation",
  academy_cancellation: "Academy cancellation",
  manual: "Manual",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
export function isOrderKind(value: string): value is OrderKind {
  return (ORDER_KINDS as readonly string[]).includes(value);
}

export type AdminOrderFilters = {
  status?: OrderStatus;
  kind?: OrderKind;
  /** ISO 4217 code as stored (upper case). */
  currency?: string;
  /** Inclusive MYT calendar days (YYYY-MM-DD) on `created_at`. */
  from?: string;
  to?: string;
  /** An order id (uuid) or part of the buyer's email. */
  q?: string;
  page?: number;
  pageSize?: number;
};

export type AdminOrderListItem = {
  id: string;
  status: OrderStatus;
  kind: OrderKind;
  createdAt: Date;
  paidAt: Date | null;
  expiresAt: Date;
  amountMinor: number;
  currency: string;
  region: PriceRegion;
  userId: string;
  userEmail: string;
  userName: string;
  programmeTitle: string;
  formatName: string;
  startsOn: Date;
  endsOn: Date;
  registrationId: string | null;
  registrationStatus: RegistrationStatus | null;
  certificateCode: string | null;
  receiptUrl: string | null;
};

export type AdminOrderTotals = {
  count: number;
  byCurrency: { currency: string; count: number; amountMinor: number }[];
};

export type AdminOrderPage = {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  /** Over the whole filtered set, not just this page. */
  totals: AdminOrderTotals;
};

export const ADMIN_ORDERS_PAGE_SIZE = 25;

const listInclude = {
  user: { select: { email: true, name: true } },
  offering: { include: { programme: { select: { title: true } }, deliveryFormat: { select: { name: true } } } },
  payment: { select: { receiptUrl: true } },
  registration: { select: { id: true, status: true } },
  certificate: { select: { certificateId: true } },
} as const;

/** Start of the MYT calendar day as an instant; null for a bad date. */
function dayStart(iso: string): Date | null {
  return isIsoDate(iso) ? zonedLocalToInstant(`${iso}T00:00`) : null;
}

function whereFor(filters: AdminOrderFilters) {
  const q = filters.q?.trim();
  const from = filters.from ? dayStart(filters.from) : null;
  const to = filters.to && isIsoDate(filters.to) ? dayStart(addDays(filters.to, 1)) : null;
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(filters.currency ? { currency: filters.currency.toUpperCase() } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(q ? (isUuid(q) ? { id: q } : { user: { email: { contains: q, mode: "insensitive" as const } } }) : {}),
  };
}

export async function listOrdersForAdmin(filters: AdminOrderFilters = {}, db: Db = getPrisma()): Promise<AdminOrderPage> {
  const pageSize = Math.min(Math.max(filters.pageSize ?? ADMIN_ORDERS_PAGE_SIZE, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const where = whereFor(filters);
  const [total, rows, sums] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: listInclude }),
    db.order.groupBy({ by: ["currency"], where, _count: { _all: true }, _sum: { amountMinor: true }, orderBy: { currency: "asc" } }),
  ]);
  return {
    items: rows.map((o) => ({
      id: o.id,
      status: o.status,
      kind: o.kind,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      expiresAt: o.expiresAt,
      amountMinor: Number(o.amountMinor),
      currency: o.currency,
      region: o.region,
      userId: o.userId,
      userEmail: o.user.email,
      userName: o.user.name,
      programmeTitle: o.offering.programme.title,
      formatName: o.offering.deliveryFormat?.name ?? MODALITY_LABEL[o.offering.modality],
      startsOn: o.offering.startsOn,
      endsOn: o.offering.endsOn,
      registrationId: o.registration?.id ?? null,
      registrationStatus: o.registration?.status ?? null,
      certificateCode: o.certificate?.certificateId ?? null,
      receiptUrl: o.payment?.receiptUrl ?? null,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    totals: {
      count: total,
      byCurrency: sums.map((s) => ({ currency: s.currency, count: s._count._all, amountMinor: Number(s._sum.amountMinor ?? 0) })),
    },
  };
}

/** Distinct currencies that appear on any order — the filter's options. */
export async function listOrderCurrencies(db: Db = getPrisma()): Promise<string[]> {
  const rows = await db.order.findMany({ distinct: ["currency"], select: { currency: true }, orderBy: { currency: "asc" } });
  return rows.map((r) => r.currency);
}

/* ------------------------------------------------------------------ detail */

export type AdminRefundView = {
  id: string;
  amountMinor: number;
  percent: number;
  reason: keyof typeof REFUND_REASON_LABEL;
  status: RefundStatus;
  providerRefundId: string | null;
  requestedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminOrderDetail = AdminOrderListItem & {
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  payment: {
    id: string;
    provider: string;
    providerPaymentIntentId: string;
    providerChargeId: string | null;
    amountMinor: number;
    currency: string;
    receiptUrl: string | null;
    providerFeeMinor: number | null;
    status: string;
    createdAt: Date;
    refunds: AdminRefundView[];
  } | null;
  registration: {
    id: string;
    status: RegistrationStatus;
    transferUsed: boolean;
    transferredToRegistrationId: string | null;
    cancelledAt: Date | null;
    cancellationRefundPercent: number | null;
    createdAt: Date;
    /** The offering the registration is on NOW (a transfer moves it). */
    offeringId: string;
  } | null;
  renewal: { previousExpiresOn: Date; newExpiresOn: Date } | null;
  /** Audit rows for the order, its registration and its refunds, oldest first. */
  audit: AuditRecord[];
};

export async function getOrderForAdmin(id: string, db: Db = getPrisma()): Promise<AdminOrderDetail | null> {
  if (!isUuid(id)) return null;
  const o = await db.order.findUnique({
    where: { id },
    include: {
      ...listInclude,
      payment: { include: { refunds: { orderBy: { createdAt: "asc" } } } },
      registration: true,
      renewal: { select: { previousExpiresOn: true, newExpiresOn: true } },
    },
  });
  if (!o) return null;
  const refundIds = o.payment?.refunds.map((r) => r.id) ?? [];
  const [orderAudit, registrationAudit, ...refundAudit] = await Promise.all([
    listAuditForEntity(db, "order", o.id),
    o.registration ? listAuditForEntity(db, "registration", o.registration.id) : Promise.resolve([] as AuditRecord[]),
    ...refundIds.map((rid) => listAuditForEntity(db, "refund", rid)),
  ]);
  const audit = [...orderAudit, ...registrationAudit, ...refundAudit.flat()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return {
    id: o.id,
    status: o.status,
    kind: o.kind,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    expiresAt: o.expiresAt,
    amountMinor: Number(o.amountMinor),
    currency: o.currency,
    region: o.region,
    userId: o.userId,
    userEmail: o.user.email,
    userName: o.user.name,
    programmeTitle: o.offering.programme.title,
    formatName: o.offering.deliveryFormat?.name ?? MODALITY_LABEL[o.offering.modality],
    startsOn: o.offering.startsOn,
    endsOn: o.offering.endsOn,
    registrationId: o.registration?.id ?? null,
    registrationStatus: o.registration?.status ?? null,
    certificateCode: o.certificate?.certificateId ?? null,
    receiptUrl: o.payment?.receiptUrl ?? null,
    stripeCheckoutSessionId: o.stripeCheckoutSessionId,
    stripePaymentIntentId: o.stripePaymentIntentId,
    payment: o.payment
      ? {
          id: o.payment.id,
          provider: o.payment.provider,
          providerPaymentIntentId: o.payment.providerPaymentIntentId,
          providerChargeId: o.payment.providerChargeId,
          amountMinor: Number(o.payment.amountMinor),
          currency: o.payment.currency,
          receiptUrl: o.payment.receiptUrl,
          providerFeeMinor: o.payment.providerFeeMinor == null ? null : Number(o.payment.providerFeeMinor),
          status: o.payment.status,
          createdAt: o.payment.createdAt,
          refunds: o.payment.refunds.map((r) => ({
            id: r.id,
            amountMinor: Number(r.amountMinor),
            percent: r.percent,
            reason: r.reason,
            status: r.status,
            providerRefundId: r.providerRefundId,
            requestedByUserId: r.requestedByUserId,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
        }
      : null,
    registration: o.registration
      ? {
          id: o.registration.id,
          status: o.registration.status,
          transferUsed: o.registration.transferUsed,
          transferredToRegistrationId: o.registration.transferredToRegistrationId,
          cancelledAt: o.registration.cancelledAt,
          cancellationRefundPercent: o.registration.cancellationRefundPercent,
          createdAt: o.registration.createdAt,
          offeringId: o.registration.offeringId,
        }
      : null,
    renewal: o.renewal,
    audit,
  };
}
