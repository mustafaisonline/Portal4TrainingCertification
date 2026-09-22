import { countCertificates } from "@/modules/certificates/repository";
import { authorise } from "@/modules/identity/session";
import { countPendingReviews } from "@/modules/reviews/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/* Admin landing — proves the gate in M2. Offerings (M4) are the first real
   operation; registrations, orders and certificate administration arrive in
   M8. Nothing from the wireframe's adminSamples.ts is shown. */
export default async function AdminPage() {
  const result = await authorise("platform_admin");
  if (!result.ok) return null; // the layout has already refused
  const [pendingReviews, certificateCount] = await Promise.all([countPendingReviews(), countCertificates()]);
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Admin</p>
        <h1 className="text-display" data-testid="admin-title">
          Operations
        </h1>
      </header>
      <Card variant="panel">
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Signed in as <strong className="text-[var(--color-ink)]">{result.user.email}</strong> with administrator
          access. Registrations, orders and certificate administration are delivered in the operations milestone.
        </p>
      </Card>
      <Card variant="panel">
        <p className="text-label mb-2">Dates & seats</p>
        <h2 className="text-h2">Offerings</h2>
        <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Schedule the dates people register for: programme, format, dates, capacity and status. Only what you
          create here appears on the public schedule.
        </p>
        <div className="mt-5">
          <Button href="/admin/offerings" data-testid="admin-offerings-link">
            Manage offerings
          </Button>
        </div>
      </Card>
      <Card variant="panel">
        <p className="text-label mb-2">Learner feedback</p>
        <h2 className="text-h2">Reviews</h2>
        <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Read what learners submit, approve what may be published, and hide anything that should not be public.
          <span data-testid="admin-reviews-pending">
            {" "}
            {pendingReviews === 0 ? "Nothing is waiting for a decision." : `${pendingReviews} ${pendingReviews === 1 ? "review is" : "reviews are"} waiting for a decision.`}
          </span>
        </p>
        <div className="mt-5">
          <Button href={pendingReviews > 0 ? "/admin/reviews?moderation=pending" : "/admin/reviews"} data-testid="admin-reviews-link">
            Moderate reviews
          </Button>
        </div>
      </Card>
      <Card variant="panel">
        <p className="text-label mb-2">Completion records</p>
        <h2 className="text-h2">Certificates</h2>
        <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Certificates of Completion are issued from an offering&apos;s participants screen. Find one by ID, name or email, correct a name, revoke, and set the renewal fee.
          <span data-testid="admin-certificates-issued">
            {" "}
            {certificateCount === 0 ? "None issued yet." : `${certificateCount} ${certificateCount === 1 ? "certificate" : "certificates"} issued.`}
          </span>
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/admin/certificates" data-testid="admin-certificates-link">
            Manage certificates
          </Button>
          <Button variant="secondary" href="/admin/certificates/fee" data-testid="admin-certificates-fee-link">
            Renewal fee
          </Button>
        </div>
      </Card>
    </div>
  );
}
