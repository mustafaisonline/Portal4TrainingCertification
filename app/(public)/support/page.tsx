import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { PAYMENTS_NOT_CONFIGURED_MESSAGE } from "@/modules/commerce/messages";
import { paymentsConfigured } from "@/modules/commerce/stripe";
import { enabledSupportSetting } from "@/modules/commerce/support.repository";
import { findSupportOrderForUser, type SupportOrderView } from "@/modules/commerce/support.service";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { SupportForm } from "./SupportForm";

/*
 * /support — "Support the Academy" (founder decisions M1–M5, 2026-09-27):
 * the portal's equivalent of eCard's "Support eCardForever — Donate" card.
 * A small fixed payment that grants nothing, taken through the same Stripe
 * path as a registration, so card payments can be proven end to end —
 * Stripe test mode in development, the real go-live check in production.
 * Signed-in only (no profile gate, M4). Hidden entirely when the setting is
 * switched off (M5). With `?order=<id>` (Stripe's return) the page shows
 * SERVER TRUTH about that order, never the redirect.
 */
export const metadata: Metadata = { title: "Support the Academy" };
export const dynamic = "force-dynamic";

function OrderBanner({ order }: { order: SupportOrderView | null }) {
  if (!order) {
    return (
      <Card variant="panel" className="p-5 sm:p-6" data-testid="support-order-missing">
        <p className="text-body-lg font-medium">We could not find that order.</p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">If you have just paid, it appears under Orders &amp; receipts once Stripe confirms it.</p>
      </Card>
    );
  }
  if (order.effectiveStatus === "pending") {
    return (
      <>
        <meta httpEquiv="refresh" content="3" />
        <Card variant="panel" className="p-5 sm:p-6" data-testid="support-order-pending">
          <div className="mb-2"><Chip>Confirming with Stripe…</Chip></div>
          <p className="text-body-lg font-medium">Thank you — we are waiting for Stripe to confirm your payment.</p>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">This page refreshes on its own. Nothing else is needed from you.</p>
        </Card>
      </>
    );
  }
  if (order.effectiveStatus === "paid" || order.effectiveStatus === "refunded" || order.effectiveStatus === "partially_refunded") {
    return (
      <Card variant="feature" className="p-5! sm:p-8!" data-testid="support-order-paid">
        <div className="mb-2 flex flex-wrap gap-2">
          <Chip tone="primary">Paid</Chip>
          <Chip>Order {order.id.slice(0, 8).toUpperCase()}</Chip>
        </div>
        <p className="text-h1 mb-2">Thank you for supporting the Academy.</p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          {formatMoney(order.amountMinor, order.currency)} · paid {order.paidAt ? formatTimestamp(order.paidAt) : "just now"}
          {order.receiptUrl ? (
            <>
              {" · "}
              <a href={order.receiptUrl} className="text-[var(--color-primary)] underline underline-offset-4" target="_blank" rel="noopener">
                View receipt
              </a>
            </>
          ) : null}
        </p>
      </Card>
    );
  }
  return (
    <Card variant="panel" className="p-5 sm:p-6" data-testid="support-order-failed">
      <p className="text-body-lg font-medium">That payment was not completed ({order.effectiveStatus}).</p>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">Nothing was charged. You can try again below.</p>
    </Card>
  );
}

export default async function SupportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser("/support");
  const now = new Date();
  const setting = await enabledSupportSetting(now);
  const orderParam = typeof sp["order"] === "string" ? sp["order"] : null;
  const order = orderParam ? await findSupportOrderForUser(orderParam, user.id, now) : undefined;
  const cancelled = sp["cancelled"] === "1";

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Support</p>
        <h1 className="text-display mb-3" data-testid="support-title">
          {setting?.label ?? "Support the Academy"}
        </h1>
        {order !== undefined ? <div className="mb-8"><OrderBanner order={order} /></div> : null}
        {cancelled ? (
          <p role="status" data-testid="support-cancelled" className="text-body-sm mb-8 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground)] px-4 py-3">
            Payment was cancelled — nothing was charged.
          </p>
        ) : null}

        {setting ? (
          <Card variant="panel" className="p-6 sm:p-8" data-testid="support-card">
            <p className="text-body-lg mb-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
              Like what we do? A small one-off payment helps keep the Academy&rsquo;s free material free. Nothing is unlocked — it is simply a thank you.
            </p>
            <p className="text-display my-5 text-[var(--color-primary)]" data-testid="support-amount">
              {formatMoney(setting.amountMinor, setting.currency)}
            </p>
            <ul className="text-body-sm mb-6 list-disc pl-5 text-[var(--color-ink-quiet)]">
              <li>Secure card payment via Stripe</li>
              <li>Appears in your orders and receipts</li>
              <li>Pay as often as you like; no refund applies</li>
            </ul>
            <SupportForm payLabel={`Pay ${formatMoney(setting.amountMinor, setting.currency)}`} notConfiguredMessage={paymentsConfigured() ? null : PAYMENTS_NOT_CONFIGURED_MESSAGE} />
          </Card>
        ) : (
          <Card variant="panel" className="p-6 sm:p-8" data-testid="support-unavailable">
            <p className="text-body-lg font-medium">The support payment is not available at the moment.</p>
            <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">Thank you for the thought — the trainings are the best way to support the Academy.</p>
            <div className="mt-5">
              <Button href="/programs">Browse trainings</Button>
            </div>
          </Card>
        )}

        <p className="text-body-sm mt-8 text-[var(--color-ink-faint)]">
          Your orders and receipts:{" "}
          <Link href="/account/orders" className="text-[var(--color-primary)] underline underline-offset-4">
            Orders &amp; receipts
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
