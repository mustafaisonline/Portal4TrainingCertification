import type { ReactNode } from "react";
import Link from "next/link";
import { countOpenEnquiries } from "@/modules/catalogue/enquiries/admin.repository";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { countCertificates } from "@/modules/certificates/repository";
import { authorise } from "@/modules/identity/session";
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

export default async function AdminPage() {
  const result = await authorise("platform_admin");
  if (!result.ok) return null; // the layout has already refused
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
          Signed in as <strong className="text-[var(--color-ink)]">{result.user.email}</strong> with administrator access. Figures below are live from the database.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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

        <Card variant="panel" data-testid="admin-card-registrations">
          <p className="text-label mb-2">Dates & seats</p>
          <h2 className="text-h2">Offerings</h2>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            <span data-testid="admin-registrations-upcoming">
              {upcomingRegistrations === 0 ? "No confirmed registrations on upcoming dates." : `${plural(upcomingRegistrations, "confirmed registration", "confirmed registrations")} on upcoming dates.`}
            </span>
          </p>
          <div className="mt-5">
            <Button href="/admin/offerings" data-testid="admin-offerings-link">
              Manage offerings
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
