import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { isIsoDate } from "@/modules/certificates/dates";
import {
  isOrderKind,
  isOrderStatus,
  listOrderCurrencies,
  listOrdersForAdmin,
  ORDER_KIND_LABEL,
  ORDER_KINDS,
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
  type AdminOrderFilters,
} from "@/modules/commerce/admin-orders.repository";
import { authorise } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { inputClass } from "@/shared/ui/forms";
import { formatDateRange, formatTimestamp } from "@/shared/util/dates";

/*
 * /admin/orders — every order with filters and the totals of the filtered
 * set (Milestone 8 plan §2 item 2). READ-ONLY: refunds are viewed here and
 * made from the Stripe dashboard until the refund-on-behalf rule is approved
 * (plan §5 A2, §3 G1). Plain GET parameters, as /admin/reviews. Email is
 * shown here and never publicly.
 */
export const metadata: Metadata = { title: "Orders" };

export const dynamic = "force-dynamic";

const columns = ["Placed", "Buyer", "Programme", "Kind", "Amount", "Status", "Registration", ""];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const gate = await authorise("platform_admin");
  if (!gate.ok) forbidden(); // M12: a Trainer may enter /admin but not this screen (403, never a blank page)
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : null);
  const statusRaw = param("status");
  const kindRaw = param("kind");
  const fromRaw = param("from");
  const toRaw = param("to");
  const filters: AdminOrderFilters = {
    status: statusRaw && isOrderStatus(statusRaw) ? statusRaw : undefined,
    kind: kindRaw && isOrderKind(kindRaw) ? kindRaw : undefined,
    currency: param("currency")?.toUpperCase() || undefined,
    from: fromRaw && isIsoDate(fromRaw) ? fromRaw : undefined,
    to: toRaw && isIsoDate(toRaw) ? toRaw : undefined,
    q: param("q") || undefined,
    page: Math.max(1, Number.parseInt(param("page") ?? "1", 10) || 1),
  };
  const [result, currencies] = await Promise.all([listOrdersForAdmin(filters), listOrderCurrencies()]);

  const query = (n: number) => {
    const q = new URLSearchParams();
    if (filters.q) q.set("q", filters.q);
    if (filters.status) q.set("status", filters.status);
    if (filters.kind) q.set("kind", filters.kind);
    if (filters.currency) q.set("currency", filters.currency);
    if (filters.from) q.set("from", filters.from);
    if (filters.to) q.set("to", filters.to);
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Payments</p>
        <h1 className="text-display" data-testid="admin-orders-title">
          Orders
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          Every order the portal created, paid or not, with its payment, refunds and registration. This screen is read-only: refunds on behalf of a participant are made from the
          Stripe dashboard for now and appear here once the webhook records them.
        </p>
      </header>

      <Card variant="panel" className="p-5">
        <form method="get" action="/admin/orders" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter orders">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="f-q" className="text-label">
              Search
            </label>
            <input id="f-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Buyer email or order id" className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-status" className="text-label">
              Status
            </label>
            <select id="f-status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
              <option value="">Any</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-kind" className="text-label">
              Kind
            </label>
            <select id="f-kind" name="kind" defaultValue={filters.kind ?? ""} className={inputClass}>
              <option value="">Any</option>
              {ORDER_KINDS.map((k) => (
                <option key={k} value={k}>
                  {ORDER_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-currency" className="text-label">
              Currency
            </label>
            <select id="f-currency" name="currency" defaultValue={filters.currency ?? ""} className={inputClass}>
              <option value="">Any</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-from" className="text-label">
              Placed from
            </label>
            <input id="f-from" name="from" type="date" defaultValue={filters.from ?? ""} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-to" className="text-label">
              Placed to
            </label>
            <input id="f-to" name="to" type="date" defaultValue={filters.to ?? ""} className={inputClass} />
          </div>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
            <Button type="submit">Apply</Button>
            <Button variant="text" href="/admin/orders">
              Clear
            </Button>
            <span className="text-body-sm ml-auto text-right text-[var(--color-ink-quiet)]" data-testid="admin-orders-totals">
              <span data-testid="admin-orders-count">
                {result.totals.count} {result.totals.count === 1 ? "order" : "orders"}
              </span>
              {result.totals.byCurrency.map((t) => (
                <span key={t.currency}>
                  {" · "}
                  {formatMoney(t.amountMinor, t.currency)}
                </span>
              ))}
            </span>
          </div>
        </form>
      </Card>

      {result.items.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="admin-orders-empty">
            No orders match
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">Nothing has been placed with these filters.</p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[1000px] border-collapse" data-testid="admin-orders-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {columns.map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Open</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.items.map((o) => (
                <tr key={o.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="order-row" data-order-id={o.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">
                    {formatTimestamp(o.createdAt)}
                    {o.paidAt ? <p className="text-[var(--color-ink-faint)]">paid {formatTimestamp(o.paidAt)}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-ink)]">{o.userName}</p>
                    <p className="break-all text-[var(--color-ink-quiet)]" data-testid="order-buyer-email">
                      {o.userEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]">
                    <p className="text-[var(--color-ink)]">{o.programmeTitle}</p>
                    <p className="whitespace-nowrap">
                      {o.formatName} · {formatDateRange(o.startsOn, o.endsOn)}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">
                    {ORDER_KIND_LABEL[o.kind]}
                    {o.certificateCode ? <p className="text-mono text-[var(--color-ink-faint)]">{o.certificateCode}</p> : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink)]" data-testid="order-amount">
                    {formatMoney(o.amountMinor, o.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={o.status === "paid" ? "primary" : "neutral"}>{ORDER_STATUS_LABEL[o.status]}</Chip>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{o.registrationStatus ? o.registrationStatus : "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/admin/orders/${o.id}`} className="text-[var(--color-primary)] underline underline-offset-4" aria-label={`Open order for ${o.userEmail}`} data-testid="order-open">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {result.pageCount > 1 ? (
        <nav aria-label="Pages" className="flex flex-wrap items-center gap-3">
          {result.page > 1 ? (
            <Button variant="secondary" href={query(result.page - 1)}>
              Previous
            </Button>
          ) : null}
          <span className="text-body-sm text-[var(--color-ink-quiet)]">
            Page {result.page} of {result.pageCount}
          </span>
          {result.page < result.pageCount ? (
            <Button variant="secondary" href={query(result.page + 1)}>
              Next
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
