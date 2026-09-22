import type { Metadata } from "next";
import Link from "next/link";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { refundAmountMinor, refundPercentFor } from "@/modules/commerce/refund-policy";
import { startsInFuture } from "@/modules/commerce/capacity";
import {
  findOrderForUser,
  listRegistrationsForUser,
  listTransferTargets,
  type OrderView,
  type RegistrationView,
} from "@/modules/commerce/registrations.service";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange } from "@/shared/util/dates";
import { RegistrationActions } from "./RegistrationActions";

/*
 * L02 reframed — My registrations, on REAL data (M4 plan §2 item 5).
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/programmes/
 * page.tsx (ADR-045); the interim empty-state-only port of the same day is
 * superseded. Changed: registrations come from `registrations` (written
 * ONLY by the paid-webhook transaction); each card shows the refund the
 * policy returns today and offers cancel / transfer (server actions). With
 * `?order=<id>` — where Stripe sends the person back — the page shows SERVER
 * TRUTH about that order (plan §6.1): "confirming" with a 3-second refresh
 * while it is still pending, the registration once the webhook has written
 * it, and an honest message if it expired or failed. The redirect alone
 * never confirms anything. The mockup's ConfirmationView (sessionStorage) was
 * NEVER ported.
 */
export const metadata: Metadata = { title: "My registrations" };

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<RegistrationView["status"], string> = {
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  transferred: "Transferred",
};

function OrderBanner({ order, now }: { order: OrderView | null; now: Date }) {
  if (!order) {
    return (
      <Card variant="panel" className="p-5 sm:p-6">
        <p className="text-body-lg font-medium">We could not find that order.</p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">If you have just paid, your registration appears below once Stripe confirms it.</p>
      </Card>
    );
  }
  const pendingLive = order.status === "pending" && order.expiresAt.getTime() > now.getTime();
  if (pendingLive) {
    return (
      <>
        {/* Server truth only: the page re-asks the database, it never assumes. */}
        <meta httpEquiv="refresh" content="3" />
        <Card variant="panel" className="p-5 sm:p-6" data-testid="order-pending">
          <p className="text-body-lg font-medium" role="status">
            Payment received? We are confirming with Stripe — this page refreshes.
          </p>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            {order.programmeTitle} · {order.formatName} · {formatDateRange(order.startsOn, order.endsOn)} · {formatMoney(order.amountMinor, order.currency)}
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-faint)]">
            Your place is confirmed only when Stripe reports the payment as complete. If you closed the Stripe page without paying, the hold
            lapses and nothing is charged.
          </p>
        </Card>
      </>
    );
  }
  if (order.status === "paid" || order.status === "refunded" || order.status === "partially_refunded") {
    return (
      <Card variant="feature" className="p-5! sm:p-8!" data-testid="order-paid">
        <p className="text-label mb-2 text-[var(--color-success)]">Payment confirmed</p>
        <h2 className="text-h1 mb-1" role="status">
          You are registered
        </h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          {order.programmeTitle} · {order.formatName} · {formatDateRange(order.startsOn, order.endsOn)}. A confirmation email has been queued;
          joining details follow before the first session.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" href="/account/orders">
            Orders &amp; receipts
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <Card variant="panel" className="p-5 sm:p-6" data-testid="order-not-paid">
      <p className="text-body-lg font-medium" role="status">
        {order.status === "failed" ? "This payment could not be started." : "This payment was not completed in time."}
      </p>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        The seat was released and nothing was charged. You can register again from the schedule.
      </p>
      <div className="mt-4">
        <Button href="/schedule">Upcoming dates</Button>
      </div>
    </Card>
  );
}

async function RegistrationCard({ registration, now }: { registration: RegistrationView; now: Date }) {
  const o = registration.offering;
  const active = registration.status === "confirmed";
  const future = startsInFuture(o, now);
  const percent = refundPercentFor(o.startsOn, now);
  const fee = registration.payment?.providerFeeMinor ?? null;
  const refundAmount = refundAmountMinor(registration.order.amountMinor, percent, fee ?? 0);
  const currency = registration.order.currency;
  const refundSentence =
    percent === 0
      ? "If you cancel today no refund is due under the refund policy."
      : fee === null
        ? `If you cancel today you receive a ${percent} % refund less the payment-processing fee (up to ${formatMoney(refundAmount, currency)}).`
        : `If you cancel today you receive a ${percent} % refund less the ${formatMoney(fee, currency)} payment-processing fee: ${formatMoney(refundAmount, currency)}.`;
  const targets = active && future && !registration.transferUsed ? await listTransferTargets(registration, now) : [];

  return (
    <Card variant="panel" className="p-5 sm:p-6" data-testid="registration-card">
      <div className="mb-2 flex flex-wrap gap-2">
        <Chip tone={active ? "primary" : "neutral"}>{STATUS_LABEL[registration.status]}</Chip>
        <Chip>{MODALITY_LABEL[o.modality]}</Chip>
        {registration.transferUsed && active && <Chip>Transferred once</Chip>}
      </div>
      <p className="text-body-lg font-medium">{o.programmeTitle}</p>
      <p className="text-body-sm text-[var(--color-ink)]">
        {o.format?.name ?? MODALITY_LABEL[o.modality]} · {formatDateRange(o.startsOn, o.endsOn)}
        {o.location && ` · ${o.location}`}
      </p>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        Paid {formatMoney(registration.order.amountMinor, registration.order.currency)}
        {registration.payment?.receiptUrl ? (
          <>
            {" · "}
            <a href={registration.payment.receiptUrl} className="underline underline-offset-4" target="_blank" rel="noopener">
              Receipt
            </a>
          </>
        ) : null}
      </p>
      {registration.status === "cancelled" && (
        <p className="text-body-sm mt-2 text-[var(--color-ink-faint)]">
          Cancelled{registration.cancelledAt ? ` on ${formatDateRange(registration.cancelledAt, registration.cancelledAt)}` : ""}
          {registration.cancellationRefundPercent !== null ? ` · ${registration.cancellationRefundPercent} % refund` : ""}
          {registration.refunds.map((r) => ` · ${formatMoney(r.amountMinor, registration.order.currency)} ${r.status === "succeeded" ? "refunded" : r.status === "failed" ? "refund needs attention" : "refund pending"}`)}
        </p>
      )}
      {active && future && (
        <p className="text-body-sm mt-3 text-[var(--color-ink-quiet)]" data-testid="refund-now">
          {refundSentence}{" "}
          <Link href="/refund-policy" className="underline underline-offset-4">
            Policy
          </Link>
        </p>
      )}
      {active && (
        <RegistrationActions
          registrationId={registration.id}
          refundSentence={refundSentence}
          canCancel={active}
          canTransfer={active && future && !registration.transferUsed}
          transferUsed={registration.transferUsed}
          targets={targets.map((t) => ({
            id: t.id,
            label: `${t.format?.name ?? MODALITY_LABEL[t.modality]} · ${formatDateRange(t.startsOn, t.endsOn)}${t.location ? ` · ${t.location}` : ""}`,
          }))}
        />
      )}
    </Card>
  );
}

export default async function MyRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/account/programmes");
  const sp = await searchParams;
  const orderParam = typeof sp["order"] === "string" ? sp["order"] : null;
  const now = new Date();
  const [registrations, order] = await Promise.all([
    listRegistrationsForUser(user.id),
    orderParam ? findOrderForUser(orderParam, user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">My registrations</p>
        <h1 className="text-display">Your registrations</h1>
      </header>

      {orderParam ? <OrderBanner order={order} now={now} /> : null}

      {registrations.length === 0 ? (
        <Card variant="panel" className="p-6 sm:p-8">
          <h2 className="text-h1 mb-2">You are not registered for a programme yet</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            Register for the programme to see your sessions, materials and certificate here.
          </p>
          <Button href="/schedule">Upcoming dates</Button>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {registrations.map((r) => (
            <li key={r.id}>
              <RegistrationCard registration={r} now={now} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
