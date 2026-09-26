import type { ReactNode } from "react";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { countOpenEnquiries } from "@/modules/catalogue/enquiries/admin.repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { FEE_REGIONS } from "@/modules/catalogue/programmes/constants";
import { listTrainings, type TrainingListItem } from "@/modules/catalogue/programmes/admin.repository";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { countCertificates } from "@/modules/certificates/repository";
import { currentMonthKey, monthLabel } from "@/modules/reports/months";
import { certificatesSummary, confirmedUpcomingRegistrations, lastJobRun, revenueByMonth } from "@/modules/reports/queries";
import { countPendingReviews } from "@/modules/reviews/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * Admin overview — the status board (Milestone 8 plan §2 item 1). Every
 * figure is read from the tables on this request; nothing is cached or
 * remembered. Each card links to the screen that acts on it. The
 * data-testids the earlier milestones' e2e specs rely on (offerings,
 * reviews, certificates) are kept.
 *
 * Milestone 12 (founder request 2026-09-26): three launch cards at the top
 * — Trainings (add / edit), Schedule (dates) and Fees (the four rows per
 * training) — and a REDUCED board for a Trainer (L3): their trainings,
 * dates and fees only, nothing operational.
 */
export const dynamic = "force-dynamic";

const REMINDER_JOB_ID = "certificate-reminders";

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function Stat({ label, value, testId, children }: { label: string; value: ReactNode; testId: string; children?: ReactNode }) {
  return (
    <div>
      <p className="text-label mb-1 text-[var(--color-ink-quiet)]">{label}</p>
      <p className="text-h2 text-[var(--color-ink)]" data-testid={testId}>
        {value}
      </p>
      {children}
    </div>
  );
}

/** The three launch cards (M12 WP4) — shown to administrators and Trainers
 *  alike, over the caller's scope. */
function LaunchCards({ trainings, isAdmin }: { trainings: TrainingListItem[]; isAdmin: boolean }) {
  const published = trainings.filter((t) => t.status === "published").length;
  const drafts = trainings.filter((t) => t.status === "unlisted").length;
  const openDates = trainings.reduce((n, t) => n + t.openDates, 0);
  const withoutDates = trainings.filter((t) => t.status === "published" && t.openDates === 0);
  const incompleteFees = trainings.filter((t) => t.feeCount < FEE_REGIONS.length);
  return (
    <>
      <Card variant="panel" data-testid="admin-card-trainings">
        <p className="text-label mb-2">Catalogue</p>
        <h2 className="text-h2">{isAdmin ? "Trainings" : "My trainings"}</h2>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
          <span data-testid="admin-trainings-counts">
            {trainings.length === 0 ? "No trainings yet." : `${plural(published, "published training", "published trainings")} · ${plural(drafts, "draft", "drafts")}.`}
          </span>
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/admin/trainings" data-testid="admin-trainings-link">
            Manage trainings
          </Button>
          <Button variant="secondary" href="/admin/trainings/new" data-testid="admin-trainings-new-link">
            Add a training
          </Button>
        </div>
      </Card>

      <Card variant="panel" data-testid="admin-card-schedule">
        <p className="text-label mb-2">Dates & seats</p>
        <h2 className="text-h2">Schedule</h2>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
          <span data-testid="admin-schedule-open">{openDates === 0 ? "No open dates." : `${plural(openDates, "open date", "open dates")} taking registrations.`}</span>
          {withoutDates.length > 0 ? <span data-testid="admin-schedule-missing"> {plural(withoutDates.length, "published training has", "published trainings have")} no open date.</span> : null}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/admin/offerings" data-testid="admin-offerings-link">
            Manage offerings
          </Button>
          <Button variant="secondary" href="/admin/offerings/new" data-testid="admin-schedule-new-link">
            Add a date
          </Button>
        </div>
      </Card>

      <Card variant="panel" data-testid="admin-card-fees">
        <p className="text-label mb-2">Fee structure</p>
        <h2 className="text-h2">Fees</h2>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
          <span data-testid="admin-fees-incomplete">
            {incompleteFees.length === 0
              ? `Every training has its ${FEE_REGIONS.length} fee rows.`
              : `${plural(incompleteFees.length, "training is", "trainings are")} missing fee rows: ${incompleteFees
                  .slice(0, 3)
                  .map((t) => `${t.title} (${t.feeCount}/${FEE_REGIONS.length})`)
                  .join(", ")}${incompleteFees.length > 3 ? ", …" : ""}.`}
          </span>
        </p>
        <div className="mt-5">
          <Button href={incompleteFees[0] ? `/admin/trainings/${incompleteFees[0].id}/fees` : "/admin/trainings"} data-testid="admin-fees-link">
            {incompleteFees[0] ? "Set fees" : "Review fees"}
          </Button>
        </div>
      </Card>
    </>
  );
}

export default async function AdminPage() {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin")}`);
    forbidden();
  }
  const trainings = await listTrainings(access.scope);

  if (!access.isAdmin) {
    return (
      <div className="flex flex-col gap-8" data-testid="trainer-dashboard">
        <header>
          <p className="text-label mb-2 text-[var(--color-primary)]">Trainer</p>
          <h1 className="text-display" data-testid="admin-title">
            Your trainings
          </h1>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            Signed in as <strong className="text-[var(--color-ink)]">{access.user.email}</strong> as a trainer. You see the trainings linked to your profile; an administrator publishes them.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <LaunchCards trainings={trainings} isAdmin={false} />
        </div>
      </div>
    );
  }

  const now = new Date();
  const month = currentMonthKey(now);
  const [pendingReviews, openEnquiries, certificateCount, certificates, upcomingRegistrations, revenue, reminderRun] = await Promise.all([
    countPendingReviews(),
    countOpenEnquiries(),
    countCertificates(),
    certificatesSummary(now),
    confirmedUpcomingRegistrations(now),
    revenueByMonth({ month }),
    lastJobRun(REMINDER_JOB_ID),
  ]);
  const reminderAfter = (reminderRun?.after ?? null) as { queued?: number; considered?: number } | null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Admin</p>
        <h1 className="text-display" data-testid="admin-title">
          Operations
        </h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
          Signed in as <strong className="text-[var(--color-ink)]">{access.user.email}</strong> with administrator access. Figures below are live from the database.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <LaunchCards trainings={trainings} isAdmin />

        <Card variant="panel" data-testid="admin-card-registrations">
          <p className="text-label mb-2">Upcoming</p>
          <h2 className="text-h2">Registrations</h2>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            <span data-testid="admin-registrations-upcoming">
              {upcomingRegistrations === 0 ? "No confirmed registrations on upcoming dates." : `${plural(upcomingRegistrations, "confirmed registration", "confirmed registrations")} on upcoming dates.`}
            </span>
          </p>
          <div className="mt-5">
            <Button variant="secondary" href="/admin/offerings" data-testid="admin-registrations-link">
              See the dates
            </Button>
          </div>
        </Card>

        <Card variant="panel" data-testid="admin-card-reviews">
          <p className="text-label mb-2">Learner feedback</p>
          <h2 className="text-h2">Reviews</h2>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            <span data-testid="admin-reviews-pending">
              {pendingReviews === 0 ? "Nothing is waiting for a decision." : `${pendingReviews} ${pendingReviews === 1 ? "review is" : "reviews are"} waiting for a decision.`}
            </span>
          </p>
          <div className="mt-5">
            <Button href={pendingReviews > 0 ? "/admin/reviews?moderation=pending" : "/admin/reviews"} data-testid="admin-reviews-link">
              Moderate reviews
            </Button>
          </div>
        </Card>

        <Card variant="panel" data-testid="admin-card-enquiries">
          <p className="text-label mb-2">Contact & interest</p>
          <h2 className="text-h2">Enquiries</h2>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            <span data-testid="admin-enquiries-open">{openEnquiries === 0 ? "No new enquiries." : `${plural(openEnquiries, "new enquiry", "new enquiries")} to reply to.`}</span>
          </p>
          <div className="mt-5">
            <Button href={openEnquiries > 0 ? "/admin/enquiries?status=new" : "/admin/enquiries"} data-testid="admin-enquiries-link">
              Open enquiries
            </Button>
          </div>
        </Card>

        <Card variant="panel" data-testid="admin-card-certificates">
          <p className="text-label mb-2">Completion records</p>
          <h2 className="text-h2">Certificates</h2>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            <span data-testid="admin-certificates-issued">{certificateCount === 0 ? "None issued yet." : `${plural(certificateCount, "certificate", "certificates")} issued.`}</span>{" "}
            <span data-testid="admin-certificates-expiring">
              {certificates.renewalDue === 0 ? "None expire within 30 days." : `${certificates.renewalDue} ${certificates.renewalDue === 1 ? "expires" : "expire"} within 30 days.`}
            </span>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/admin/certificates" data-testid="admin-certificates-link">
              Manage certificates
            </Button>
            <Button variant="secondary" href="/admin/certificates?status=renewal_due" data-testid="admin-certificates-expiring-link">
              Renewal due
            </Button>
            <Button variant="secondary" href="/admin/certificates/fee" data-testid="admin-certificates-fee-link">
              Renewal fee
            </Button>
          </div>
        </Card>

        <Card variant="panel" data-testid="admin-card-revenue">
          <p className="text-label mb-2">{monthLabel(month)} · Malaysia time</p>
          <h2 className="text-h2">Revenue this month</h2>
          <div className="mt-2 flex flex-col gap-1" data-testid="admin-revenue-month">
            {revenue.length === 0 ? (
              <p className="text-body-sm text-[var(--color-ink-quiet)]">No paid orders yet this month.</p>
            ) : (
              revenue.map((r) => (
                <p key={r.currency} className="text-body-sm text-[var(--color-ink-quiet)]">
                  <strong className="text-[var(--color-ink)]">{formatMoney(r.netMinor, r.currency)}</strong> net of refunds · {plural(r.paidOrders, "paid order", "paid orders")}
                  {r.refundCount > 0 ? ` · ${plural(r.refundCount, "refund", "refunds")}` : ""}
                </p>
              ))
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/admin/orders" data-testid="admin-orders-link">
              Orders & payments
            </Button>
            <Button variant="secondary" href="/admin/reports" data-testid="admin-reports-link">
              Reports
            </Button>
          </div>
        </Card>

        <Card variant="panel" data-testid="admin-card-reminders">
          <p className="text-label mb-2">Scheduled job</p>
          <h2 className="text-h2">Renewal reminders</h2>
          <div className="mt-2">
            <Stat
              label="Last run"
              testId="admin-reminder-run"
              value={reminderRun ? formatTimestamp(reminderRun.ranAt) : "Not yet"}
            >
              {reminderRun && reminderAfter ? (
                <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
                  {typeof reminderAfter.queued === "number" ? `${plural(reminderAfter.queued, "reminder", "reminders")} queued` : null}
                  {typeof reminderAfter.considered === "number" ? ` · ${plural(reminderAfter.considered, "certificate", "certificates")} considered` : null}
                </p>
              ) : (
                <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">The reminders job has not recorded a run.</p>
              )}
            </Stat>
          </div>
          <div className="mt-5">
            <Button variant="secondary" href="/admin/audit" data-testid="admin-audit-link">
              Audit log
            </Button>
          </div>
        </Card>
      </div>

      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        Also:{" "}
        <Link href="/admin/users" className="text-[var(--color-primary)] underline underline-offset-4">
          Users & roles
        </Link>
        {" · "}
        <Link href="/admin/audit" className="text-[var(--color-primary)] underline underline-offset-4">
          Audit log
        </Link>
        {" · "}
        <Link href="/admin/reports" className="text-[var(--color-primary)] underline underline-offset-4">
          Reports & CSV
        </Link>
      </p>
    </div>
  );
}
