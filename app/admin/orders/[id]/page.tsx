import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { dateColumnToIso, formatCalendarDate } from "@/modules/certificates/dates";
import { getOrderForAdmin, ORDER_KIND_LABEL, ORDER_STATUS_LABEL, REFUND_REASON_LABEL } from "@/modules/commerce/admin-orders.repository";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange, formatTimestamp } from "@/shared/util/dates";

/*
 * /admin/orders/[id] — one order in full (Milestone 8 plan §2 item 2): the
 * buyer, the payment with Stripe's fee and receipt, every refund, the
 * registration with its cancellation / transfer facts, the certificate when
 * the order is a renewal, and the audit trail across the order, its
 * registration and its refunds. READ-ONLY (plan §3 G1). Unknown id → 404.
 */
export const metadata: Metadata = { title: "Order" };

export const dynamic = "force-dynamic";

function describe(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v === null ? "null" : typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" · ");
  }
  return String(value);
}

function Row({ label, children, testId }: { label: string; children: React.ReactNode; testId?: string }) {
  return (
    <div>
      <dt className="text-label mb-1">{label}</dt>
      <dd data-testid={testId}>{children}</dd>
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();
  const payment = order.payment;
  const registration = order.registration;

  return (
    <div className="flex flex-col gap-6" data-testid="order-detail" data-order-id={order.id}>
      <header>
        <Link href="/admin/orders" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Orders
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">{ORDER_KIND_LABEL[order.kind]}</p>
        <h1 className="text-display" data-testid="order-detail-title">
          {formatMoney(order.amountMinor, order.currency)}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span data-testid="order-detail-status">
            <Chip tone={order.status === "paid" ? "primary" : "neutral"}>{ORDER_STATUS_LABEL[order.status]}</Chip>
          </span>
          <Chip>{order.region}</Chip>
          <span className="text-mono text-body-sm break-all text-[var(--color-ink-quiet)]">{order.id}</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-4">Order</h2>
          <dl className="text-body-sm grid gap-y-3">
            <Row label="Buyer" testId="order-detail-buyer">
              <p className="font-medium text-[var(--color-ink)]">{order.userName}</p>
              <p className="break-all text-[var(--color-ink-quiet)]">{order.userEmail}</p>
              <Link href={`/admin/users/${order.userId}`} className="text-[var(--color-primary)] underline underline-offset-4">
                Open user
              </Link>
            </Row>
            <Row label="Programme">
              {order.programmeTitle}
              <p className="text-[var(--color-ink-quiet)]">
                {order.formatName} · {formatDateRange(order.startsOn, order.endsOn)}
              </p>
            </Row>
            <Row label="Placed">{formatTimestamp(order.createdAt)}</Row>
            <Row label="Paid">{order.paidAt ? formatTimestamp(order.paidAt) : "—"}</Row>
            <Row label="Checkout expires">{formatTimestamp(order.expiresAt)}</Row>
            <Row label="Stripe checkout session">
              <span className="text-mono break-all">{order.stripeCheckoutSessionId ?? "—"}</span>
            </Row>
            {order.kind === "certificate_renewal" ? (
              <Row label="Certificate" testId="order-detail-certificate">
                <span className="text-mono">{order.certificateCode ?? "—"}</span>
                {order.renewal ? (
                  <p className="text-[var(--color-ink-quiet)]">
                    Expiry moved {formatCalendarDate(dateColumnToIso(order.renewal.previousExpiresOn))} → {formatCalendarDate(dateColumnToIso(order.renewal.newExpiresOn))}
                  </p>
                ) : null}
              </Row>
            ) : null}
          </dl>
        </Card>

        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-4">Payment</h2>
          {payment ? (
            <dl className="text-body-sm grid gap-y-3" data-testid="order-detail-payment">
              <Row label="Amount">{formatMoney(payment.amountMinor, payment.currency)}</Row>
              <Row label="Processing fee" testId="order-detail-fee">
                {payment.providerFeeMinor === null ? "Not yet reported by Stripe" : formatMoney(payment.providerFeeMinor, payment.currency)}
              </Row>
              <Row label="Payment status">{payment.status}</Row>
              <Row label="Receipt">
                {payment.receiptUrl ? (
                  <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] underline underline-offset-4" data-testid="order-detail-receipt">
                    Open Stripe receipt
                  </a>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Payment intent">
                <span className="text-mono break-all">{payment.providerPaymentIntentId}</span>
              </Row>
              <Row label="Charge">
                <span className="text-mono break-all">{payment.providerChargeId ?? "—"}</span>
              </Row>
              <Row label="Recorded">{formatTimestamp(payment.createdAt)}</Row>
            </dl>
          ) : (
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="order-detail-payment">
              No payment recorded — the order was never paid.
            </p>
          )}
          <div className="mt-6 border-t border-[var(--color-line)] pt-4">
            <h3 className="text-label mb-3">Refunds</h3>
            {payment && payment.refunds.length > 0 ? (
              <ul className="text-body-sm flex flex-col gap-2" data-testid="order-detail-refunds">
                {payment.refunds.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1" data-testid="order-refund">
                    <span className="font-medium text-[var(--color-ink)]">{formatMoney(r.amountMinor, payment.currency)}</span>
                    <span className="text-[var(--color-ink-quiet)]">
                      {r.percent}% · {REFUND_REASON_LABEL[r.reason]} · {r.status}
                    </span>
                    <span className="text-[var(--color-ink-faint)]">{formatTimestamp(r.createdAt)}</span>
                    {r.providerRefundId ? <span className="text-mono text-[var(--color-ink-faint)]">{r.providerRefundId}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="order-detail-refunds">
                No refunds.
              </p>
            )}
            <p className="text-body-sm mt-3 text-[var(--color-ink-faint)]" data-testid="order-detail-refund-note">
              Refunds on behalf of a participant are made from the Stripe dashboard for now; the webhook records them here.
            </p>
          </div>
        </Card>

        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-4">Registration</h2>
          {registration ? (
            <dl className="text-body-sm grid gap-y-3" data-testid="order-detail-registration">
              <Row label="Status" testId="order-detail-registration-status">
                {registration.status}
              </Row>
              <Row label="Created">{formatTimestamp(registration.createdAt)}</Row>
              <Row label="Free transfer">{registration.transferUsed ? "Used" : "Available"}</Row>
              <Row label="Cancelled">{registration.cancelledAt ? formatTimestamp(registration.cancelledAt) : "—"}</Row>
              <Row label="Cancellation refund tier">{registration.cancellationRefundPercent === null ? "—" : `${registration.cancellationRefundPercent}%`}</Row>
              <Row label="Transferred to">
                <span className="text-mono break-all">{registration.transferredToRegistrationId ?? "—"}</span>
              </Row>
              <Row label="Registration id">
                <span className="text-mono break-all">{registration.id}</span>
              </Row>
              <Row label="Current offering">
                <Link href={`/admin/offerings/${registration.offeringId}`} className="text-[var(--color-primary)] underline underline-offset-4">
                  Open offering
                </Link>
              </Row>
            </dl>
          ) : (
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="order-detail-registration">
              {order.kind === "certificate_renewal" ? "A renewal order has no registration of its own." : "No registration — one is created only when the payment is confirmed."}
            </p>
          )}
        </Card>

        <Card variant="panel" className="overflow-x-auto p-0">
          <h2 className="text-h2 px-6 pt-6">History</h2>
          <table className="text-body-sm w-full min-w-[640px] border-collapse" data-testid="order-detail-audit">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {["When", "Action", "Before", "After"].map((c) => (
                  <th key={c} scope="col" className="text-label px-6 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.audit.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                    No history recorded.
                  </td>
                </tr>
              ) : (
                order.audit.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top">
                    <td className="px-6 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(a.createdAt)}</td>
                    <td className="px-6 py-3 text-[var(--color-ink)]">{a.action}</td>
                    <td className="px-6 py-3 text-[var(--color-ink-quiet)]">{describe(a.before)}</td>
                    <td className="px-6 py-3 text-[var(--color-ink-quiet)]">{describe(a.after)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
