import Link from "next/link";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/constants";
import { listUpcomingPublicOfferings } from "@/modules/catalogue/offerings/repository";
import { listPublishedProgrammes } from "@/modules/catalogue/programmes/repository";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { CERTIFICATE_STATUS_LABEL } from "@/modules/certificates/constants";
import { formatCalendarDate, todayIso } from "@/modules/certificates/dates";
import { listCertificatesForUser } from "@/modules/certificates/repository";
import { statusOf } from "@/modules/certificates/rules";
import { listOrdersForUser, listRegistrationsForUser, type OrderView } from "@/modules/commerce/registrations.service";
import { enabledSupportSetting } from "@/modules/commerce/support.repository";
import { ROLE_LABEL } from "@/modules/identity/admin-users.repository";
import { requireUser } from "@/modules/identity/session";
import { REGISTRATION_REVIEW_STATUS_LABEL, registrationReviewStatus } from "@/modules/reviews/eligibility";
import { findReviewByRegistration } from "@/modules/reviews/repository";
import { OfferingDateCard } from "@/shared/marketing/ProgrammeDates";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange, formatTimestamp } from "@/shared/util/dates";

/*
 * L01 — Participant Dashboard.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/page.tsx
 * (ADR-045) — its NOT-REGISTERED state only, at first around the ONE
 * flagship programme. REWORKED 2026-09-26 after Milestone 12 (founder:
 * "something totally wrong on this page … update accordingly"): trainings
 * are now data managed in the portal, any published training can have
 * open dates, and a person may hold several registrations — so the page
 * reads, in order: the person's upcoming registrations (all of them), the
 * open dates they can register for right now (across every published
 * training, minus the ones they already hold), the LATEST ORDER (this used
 * to be the literal text "No orders yet." whatever the orders table said —
 * a defect), the certificate, and the account facts with roles in words.
 * Nothing is sampled; every block has an honest empty state.
 */
export const dynamic = "force-dynamic";

const ORDER_STATUS_LABEL: Record<OrderView["status"], string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  expired: "Expired",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export default async function AccountPage() {
  const user = await requireUser("/account");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [registrations, orders, certificates, openDates, trainings, support] = await Promise.all([
    listRegistrationsForUser(user.id),
    listOrdersForUser(user.id),
    listCertificatesForUser(user.id),
    listUpcomingPublicOfferings(),
    listPublishedProgrammes(),
    enabledSupportSetting(new Date()), // the instant, not midnight: a switch made today must show today
  ]);

  // Confirmed registrations whose date has not ended, soonest first.
  const upcoming = registrations
    .filter((r) => r.status === "confirmed" && r.offering.endsOn.getTime() >= today.getTime())
    .sort((a, b) => a.offering.startsOn.getTime() - b.offering.startsOn.getTime());
  // The most recent confirmed registration carries the review prompt (M5b).
  const latest = registrations.filter((r) => r.status === "confirmed").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
  const latestReview = latest ? await findReviewByRegistration(latest.id) : null;
  const reviewStatus = latest ? registrationReviewStatus(latestReview, latest.offering.endsOn) : null;
  // Open dates the person is not already registered for.
  const heldOfferingIds = new Set(registrations.filter((r) => r.status === "confirmed").map((r) => r.offering.id));
  const bookable = openDates.filter((o) => o.status === "open" && !heldOfferingIds.has(o.id)).slice(0, 4);
  const latestOrder = orders[0] ?? null;
  const certificate = certificates[0] ?? null;
  const certificateStatus = certificate ? statusOf(certificate, todayIso(new Date())).status : null;
  const staff = user.roles.some((r) => r.role === "platform_admin" || r.role === "expert");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Dashboard</p>
        <h1 className="text-display" data-testid="welcome">
          Welcome, {user.name}
        </h1>
        {staff ? (
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            You also have {user.roles.some((r) => r.role === "platform_admin") ? "administrator" : "trainer"} access —{" "}
            <Link href="/admin" className="text-[var(--color-primary)] underline underline-offset-4" data-testid="dash-admin-link">
              open the admin area
            </Link>
            .
          </p>
        ) : null}
      </header>

      <section aria-labelledby="dash-regs">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="dash-regs" className="text-h1">
            Your registrations
          </h2>
          <Link href="/account/programmes" className="text-body-sm inline-block py-2 text-[var(--color-primary)] underline underline-offset-4">
            View all
          </Link>
        </div>
        {upcoming.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {upcoming.slice(0, 4).map((r) => (
              <li key={r.id}>
                <Card variant="panel" className="h-full p-5" data-testid="dash-registration">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Chip tone="primary">Confirmed</Chip>
                    <Chip>{MODALITY_LABEL[r.offering.modality]}</Chip>
                  </div>
                  <p className="text-body-lg font-medium">{r.offering.programmeTitle}</p>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    {r.offering.format?.name ?? MODALITY_LABEL[r.offering.modality]} · {formatDateRange(r.offering.startsOn, r.offering.endsOn)}
                    {r.offering.location ? ` · ${r.offering.location}` : ""}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        ) : latest ? (
          <Card variant="panel" className="p-5" data-testid="dash-latest-registration">
            <div className="mb-2 flex flex-wrap gap-2">
              <Chip>Completed</Chip>
              <Chip>{MODALITY_LABEL[latest.offering.modality]}</Chip>
            </div>
            <p className="text-body-lg font-medium">{latest.offering.programmeTitle}</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              {latest.offering.format?.name ?? MODALITY_LABEL[latest.offering.modality]} · {formatDateRange(latest.offering.startsOn, latest.offering.endsOn)}
            </p>
          </Card>
        ) : (
          <p className="text-body-sm text-[var(--color-ink-faint)]" data-testid="dash-no-registrations">
            You are not registered for a training yet.
          </p>
        )}
        {latest && reviewStatus ? (
          <p className="text-body-sm mt-3 text-[var(--color-ink-quiet)]">
            Reviews for {latest.offering.programmeTitle}:{" "}
            <span className="font-medium text-[var(--color-ink)]" data-testid="dash-review-status">
              {REGISTRATION_REVIEW_STATUS_LABEL[reviewStatus]}
            </span>
            {" · "}
            <Link href="/reviews" className="text-[var(--color-primary)] underline underline-offset-4">
              {reviewStatus === "required" ? "Share your experience" : "Reviews"}
            </Link>
          </p>
        ) : null}
      </section>

      <section aria-labelledby="dash-open">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="dash-open" className="text-h1">
            Open for registration
          </h2>
          <Link href="/schedule" className="text-body-sm inline-block py-2 text-[var(--color-primary)] underline underline-offset-4">
            Full schedule
          </Link>
        </div>
        {bookable.length > 0 ? (
          <ul className="flex flex-col gap-4" data-testid="dash-open-dates">
            {bookable.map((o) => (
              <li key={o.id}>
                <OfferingDateCard offering={o} enquiryHref={`/contact-us?kind=programme_interest&programme=${o.programmeSlug}`} />
              </li>
            ))}
          </ul>
        ) : (
          <Card variant="feature" className="p-5! sm:p-8!" data-testid="dash-browse">
            <p className="text-label mb-3 text-[var(--color-primary)]">Trainings</p>
            <h3 className="text-h1 mb-2">No open dates right now</h3>
            <p className="text-body-sm mb-5 max-w-[60ch] text-[var(--color-ink-quiet)]">
              {trainings.length > 0
                ? `${trainings.length === 1 ? "One training is" : `${trainings.length} trainings are`} published — register your interest and we will tell you the moment a date opens.`
                : "No training is published yet."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/programs">Browse trainings</Button>
              <Button variant="secondary" href="/contact-us?kind=programme_interest">
                Register interest
              </Button>
            </div>
          </Card>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="panel" className="p-5">
          <h2 className="text-h1 mb-3">Latest order</h2>
          {latestOrder ? (
            <div data-testid="dash-latest-order">
              <div className="mb-2 flex flex-wrap gap-2">
                <Chip tone={latestOrder.status === "paid" ? "primary" : "neutral"}>{ORDER_STATUS_LABEL[latestOrder.status]}</Chip>
                <Chip>{latestOrder.kind === "registration" ? "Registration" : "Certificate renewal"}</Chip>
              </div>
              <p className="text-body-lg font-medium">{latestOrder.programmeTitle}</p>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                {formatMoney(latestOrder.amountMinor, latestOrder.currency)} · {formatTimestamp(latestOrder.paidAt ?? latestOrder.createdAt)}
              </p>
            </div>
          ) : (
            <p className="text-body-sm text-[var(--color-ink-faint)]">No orders yet.</p>
          )}
          <Link href="/account/orders" className="text-body-sm -mb-2 mt-1 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4">
            Orders &amp; receipts
          </Link>
        </Card>
        <Card variant="panel" className="p-5">
          <h2 className="text-h1 mb-3">Your certificate</h2>
          {certificate && certificateStatus ? (
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="dash-certificate-status">
              Certificate: <span className="font-medium text-[var(--color-ink)]">{CERTIFICATE_STATUS_LABEL[certificateStatus]}</span>
              {certificateStatus === "revoked"
                ? ""
                : ` · ${certificateStatus === "expired" ? "expired" : "until"} ${formatCalendarDate(certificate.expiresOn)}`}
            </p>
          ) : (
            <p className="text-body-sm text-[var(--color-ink-quiet)]">Issued when you complete a training.</p>
          )}
          <Link href="/account/certificate" className="text-body-sm -mb-2 mt-1 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4">
            {certificate ? "View your certificate" : "About the certificate"}
          </Link>
        </Card>
      </div>

      {support ? (
        <Card variant="plate" className="flex flex-wrap items-center justify-between gap-4 p-5" data-testid="dash-support">
          <div>
            <p className="text-label mb-1 text-[var(--color-primary)]">Support</p>
            <p className="text-body-lg font-medium">{support.label}</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">A one-off {formatMoney(support.amountMinor, support.currency)} by card — a thank you that unlocks nothing.</p>
          </div>
          <Button variant="secondary" href="/support" data-testid="dash-support-link">
            Support the Academy
          </Button>
        </Card>
      ) : null}

      <Card variant="panel">
        <h2 className="text-h2 mb-4">Your account</h2>
        <dl className="text-body-sm grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-label mb-1">Email</dt>
            <dd data-testid="account-email">{user.email}</dd>
          </div>
          <div>
            <dt className="text-label mb-1">Email verification</dt>
            <dd data-testid="account-verified">{user.emailVerified ? <Chip tone="primary">Verified</Chip> : <Chip>Not verified</Chip>}</dd>
          </div>
          <div>
            <dt className="text-label mb-1">Password</dt>
            <dd>
              <Link href="/account/security" className="text-[var(--color-primary)] underline underline-offset-4">
                Change password
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-label mb-1">Roles</dt>
            <dd data-testid="account-roles" className="flex flex-wrap gap-2">
              {user.roles.map((r) => (
                <Chip key={`${r.role}:${r.scopeType}:${r.scopeId ?? ""}`}>{ROLE_LABEL[r.role]}</Chip>
              ))}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
