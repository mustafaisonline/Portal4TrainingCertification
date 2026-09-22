import type { Metadata } from "next";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { listOrdersForUser, type OrderView } from "@/modules/commerce/registrations.service";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange, formatTimestamp } from "@/shared/util/dates";

/*
 * S07 — Orders & receipts, on REAL data (M4 plan §2 item 5).
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/orders/page.tsx
 * (ADR-045); the interim empty-state-only port is superseded. Changed: rows
 * are the person's `orders` with the amount OUR order recorded (server-priced),
 * the status as the webhook left it, and the Stripe receipt link when the
 * charge event has delivered one. Nothing is sampled or simulated.
 */
export const metadata: Metadata = { title: "Orders & receipts" };

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<OrderView["status"], string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  expired: "Expired",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await listOrdersForUser(user.id);
  const now = Date.now();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Orders &amp; receipts</p>
        <h1 className="text-display">Your orders</h1>
      </header>
      {orders.length === 0 ? (
        <Card variant="panel" className="p-6 sm:p-8">
          <h2 className="text-h1 mb-2">No orders yet.</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            Your orders and receipts appear here after you register.
          </p>
          <Button href="/schedule">Upcoming dates</Button>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((o) => {
            const pendingLive = o.status === "pending" && o.expiresAt.getTime() > now;
            const label = o.status === "pending" && !pendingLive ? STATUS_LABEL.expired : STATUS_LABEL[o.status];
            return (
              <li key={o.id}>
                <Card variant="panel" className="p-5 sm:p-6" data-testid="order-card">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Chip tone={o.status === "paid" ? "primary" : "neutral"}>{label}</Chip>
                        <Chip>Order {o.id.slice(0, 8).toUpperCase()}</Chip>
                      </div>
                      <p className="text-body-lg font-medium">{o.programmeTitle}</p>
                      <p className="text-body-sm text-[var(--color-ink)]">
                        {o.kind === "certificate_renewal"
                          ? `Certificate renewal${o.certificateCode ? ` · ${o.certificateCode}` : ""}`
                          : `${o.formatName} · ${formatDateRange(o.startsOn, o.endsOn)}`}
                      </p>
                      <p className="text-body-sm text-[var(--color-ink-quiet)]">
                        Placed {formatTimestamp(o.createdAt)}
                        {o.paidAt ? ` · Paid ${formatTimestamp(o.paidAt)}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="text-h2">{formatMoney(o.amountMinor, o.currency)}</p>
                      {o.receiptUrl ? (
                        <a href={o.receiptUrl} className="text-body-sm text-[var(--color-primary)] underline underline-offset-4" target="_blank" rel="noopener">
                          View receipt
                        </a>
                      ) : o.status === "paid" ? (
                        <p className="text-body-sm text-[var(--color-ink-faint)]">Receipt link arrives from Stripe shortly.</p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
