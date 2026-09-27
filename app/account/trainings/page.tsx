import type { Metadata } from "next";
import Link from "next/link";
import { attendanceForUser } from "@/modules/attendance/repository";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { listCertificatesForUser } from "@/modules/certificates/repository";
import { startsInFuture } from "@/modules/commerce/capacity";
import { refundAmountMinor, refundPercentFor } from "@/modules/commerce/refund-policy";
import { findOrderForUser, listRegistrationsForUser, type OrderView, type RegistrationView } from "@/modules/commerce/registrations.service";
import { requireUser } from "@/modules/identity/session";
import { REGISTRATION_REVIEW_STATUS_LABEL, registrationReviewStatus } from "@/modules/reviews/eligibility";
import { listReviewsForUser, type ReviewRecord } from "@/modules/reviews/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange } from "@/shared/util/dates";
import { RegistrationActions } from "./RegistrationActions";

/*
 * My Trainings — /account/trainings (Milestone 13 WP2; founder decisions
 * 2026-09-27). Was "My registrations" at /account/programmes (M4 plan §2
 * item 5; that path redirects here). Two sections on the person's PAID
 * registrations: "Yet to attend" (the date has not ended) with Cancel —
 * the refund the policy returns today is stated first — and "Attended" (the
 * date has passed, founder decision 9; whether the person was in the room
 * is the attendance record, shown when it exists). An attended training
 * opens its detail page with the certificate. No Transfer button (N1).
 * Cancelled registrations stay listed below with their refund facts.
 *
 * With `?order=<id>` — where Stripe sends the person back — the page shows
 * SERVER TRUTH about that order (M4 plan §6.1): "confirming" with a
 * 3-second refresh while it is still pending, the registration once the
 * webhook has written it, and an honest message if it expired or failed.
 * The redirect alone never confirms anything.
 */
export const metadata: Metadata = { title: "My Trainings" };

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
            {order.programmeTitle} · {order.formatName}{order.startsOn && order.endsOn ? ` · ${formatDateRange(order.startsOn, order.endsOn)}` : ""} · {formatMoney(order.amountMinor, order.currency)}
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
          {order.programmeTitle} · {order.formatName}{order.startsOn && order.endsOn ? ` · ${formatDateRange(order.startsOn, order.endsOn)}` : ""}. A confirmation email has been queued;
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

type Attendance = { attended: boolean; updatedAt: Date } | null;

function AttendanceChip({ attendance }: { attendance: Attendance }) {
  // Chip does not forward data attributes; the span carries the test id.
  return (
    <span data-testid="training-attendance">
      {attendance ? (
        <Chip tone={attendance.attended ? "primary" : "neutral"}>{attendance.attended ? "Attended" : "Recorded as not attended"}</Chip>
      ) : (
        <Chip>Attendance not recorded</Chip>
      )}
    </span>
  );
}

function TrainingCard({
  registration,
  review,
  attendance,
  hasCertificate,
  section,
  now,
}: {
  registration: RegistrationView;
  review: ReviewRecord | null;
  attendance: Attendance;
  hasCertificate: boolean;
  section: "upcoming" | "attended" | "closed";
  now: Date;
}) {
  const o = registration.offering;
  const active = registration.status === "confirmed";
  // M5b: the review status for a confirmed registration; "Share your
  // experience" once the programme has ended and no review exists.
  const reviewStatus = active ? registrationReviewStatus(review, o.endsOn, now) : null;
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

  return (
    <Card variant="panel" className="p-5 sm:p-6" data-testid="training-card" data-section={section} data-registration={registration.id}>
      <div className="mb-2 flex flex-wrap gap-2">
        <Chip tone={active ? "primary" : "neutral"}>{STATUS_LABEL[registration.status]}</Chip>
        <Chip>{MODALITY_LABEL[o.modality]}</Chip>
        {section === "attended" ? <AttendanceChip attendance={attendance} /> : null}
      </div>
      <p className="text-body-lg font-medium">
        {section === "attended" ? (
          <Link href={`/account/trainings/${registration.id}`} className="hover:text-[var(--color-primary)]" data-testid="training-detail-link">
            {o.programmeTitle}
          </Link>
        ) : (
          o.programmeTitle
        )}
      </p>
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
      {section === "attended" ? (
        <p className="text-body-sm mt-3 text-[var(--color-ink-quiet)]" data-testid="training-certificate-status">
          {hasCertificate ? "Certificate of Completion issued" : "Certificate: not yet issued — the Academy records completion after the training."}
          {" · "}
          <Link href={`/account/trainings/${registration.id}`} className="text-[var(--color-primary)] underline underline-offset-4">
            Training details
          </Link>
        </p>
      ) : null}
      {reviewStatus ? (
        <p className="text-body-sm mt-3 text-[var(--color-ink-quiet)]" data-testid="registration-review-status">
          {reviewStatus === "required" ? (
            <Link href={`/reviews#registration-${registration.id}`} className="text-[var(--color-primary)] underline underline-offset-4">
              Share your experience
            </Link>
          ) : (
            <>
              Review: <span className="text-[var(--color-ink)]">{REGISTRATION_REVIEW_STATUS_LABEL[reviewStatus]}</span>
            </>
          )}
        </p>
      ) : null}
      {active && future && (
        <p className="text-body-sm mt-3 text-[var(--color-ink-quiet)]" data-testid="refund-now">
          {refundSentence}{" "}
          <Link href="/refund-policy" className="underline underline-offset-4">
            Policy
          </Link>
        </p>
      )}
      {/* Cancel only (N1: no Transfer button); the component keeps its
          transfer branch dormant for the M4 service that still exists. */}
      {active && section === "upcoming" && (
        <RegistrationActions registrationId={registration.id} refundSentence={refundSentence} canCancel canTransfer={false} transferUsed={registration.transferUsed} targets={[]} />
      )}
    </Card>
  );
}

export default async function MyTrainingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/account/trainings");
  const sp = await searchParams;
  const orderParam = typeof sp["order"] === "string" ? sp["order"] : null;
  const now = new Date();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const [registrations, order, reviews, attendance, certificates] = await Promise.all([
    listRegistrationsForUser(user.id),
    orderParam ? findOrderForUser(orderParam, user.id) : Promise.resolve(null),
    listReviewsForUser(user.id),
    attendanceForUser(user.id),
    listCertificatesForUser(user.id),
  ]);
  const reviewByRegistration = new Map(reviews.filter((r) => r.registrationId).map((r) => [r.registrationId!, r]));
  const certified = new Set(certificates.map((c) => c.registrationId));

  // Founder decision 9: the date has passed → "Attended"; otherwise "Yet to attend".
  const confirmed = registrations.filter((r) => r.status === "confirmed");
  const upcoming = confirmed.filter((r) => r.offering.endsOn.getTime() >= today.getTime()).sort((a, b) => a.offering.startsOn.getTime() - b.offering.startsOn.getTime());
  const attended = confirmed.filter((r) => r.offering.endsOn.getTime() < today.getTime()).sort((a, b) => b.offering.startsOn.getTime() - a.offering.startsOn.getTime());
  const closed = registrations.filter((r) => r.status !== "confirmed");

  const card = (r: RegistrationView, section: "upcoming" | "attended" | "closed") => (
    <li key={r.id}>
      <TrainingCard registration={r} review={reviewByRegistration.get(r.id) ?? null} attendance={attendance.get(r.id) ?? null} hasCertificate={certified.has(r.id)} section={section} now={now} />
    </li>
  );

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">My Trainings</p>
        <h1 className="text-display">Your trainings</h1>
      </header>

      {orderParam ? <OrderBanner order={order} now={now} /> : null}

      {registrations.length === 0 ? (
        <Card variant="panel" className="p-6 sm:p-8" data-testid="trainings-empty">
          <h2 className="text-h1 mb-2">You have not registered for a training yet</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            Pick a date on the schedule and pay; the training appears here under &ldquo;Yet to attend&rdquo;.
          </p>
          <Button href="/schedule">See dates and register</Button>
        </Card>
      ) : (
        <>
          <section aria-labelledby="trainings-upcoming">
            <h2 id="trainings-upcoming" className="text-h1 mb-4">
              Yet to attend
            </h2>
            {upcoming.length > 0 ? (
              <ul className="flex flex-col gap-4" data-testid="trainings-upcoming">
                {upcoming.map((r) => card(r, "upcoming"))}
              </ul>
            ) : (
              <p className="text-body-sm text-[var(--color-ink-faint)]" data-testid="trainings-upcoming-empty">
                Nothing coming up.{" "}
                <Link href="/schedule" className="text-[var(--color-primary)] underline underline-offset-4">
                  See dates and register
                </Link>
                .
              </p>
            )}
          </section>

          <section aria-labelledby="trainings-attended">
            <h2 id="trainings-attended" className="text-h1 mb-4">
              Attended
            </h2>
            {attended.length > 0 ? (
              <ul className="flex flex-col gap-4" data-testid="trainings-attended">
                {attended.map((r) => card(r, "attended"))}
              </ul>
            ) : (
              <p className="text-body-sm text-[var(--color-ink-faint)]" data-testid="trainings-attended-empty">
                No training has taken place yet.
              </p>
            )}
          </section>

          {closed.length > 0 ? (
            <section aria-labelledby="trainings-closed">
              <h2 id="trainings-closed" className="text-h1 mb-4">
                Cancelled
              </h2>
              <ul className="flex flex-col gap-4" data-testid="trainings-closed">
                {closed.map((r) => card(r, "closed"))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
