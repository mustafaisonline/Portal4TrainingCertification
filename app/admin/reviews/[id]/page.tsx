import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/db/prisma";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { ReviewAvatar } from "@/modules/reviews/components/ReviewAvatar";
import { Stars } from "@/modules/reviews/components/Stars";
import { REVIEW_CATEGORY_LABEL, REVIEW_MODERATION_LABEL, REVIEW_VISIBILITY_LABEL } from "@/modules/reviews/constants";
import { getReviewForAdmin } from "@/modules/reviews/repository";
import { isPubliclyVisible } from "@/modules/reviews/visibility";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange, formatTimestamp } from "@/shared/util/dates";
import { ModerationActions } from "../ModerationActions";

/*
 * /admin/reviews/[id] — one review in full (requirements §7.4 "detail"):
 * every field, the moderation controls and the audit history for this row
 * from `audit_log`. Unknown id → 404.
 */
export const metadata: Metadata = { title: "Review" };

export const dynamic = "force-dynamic";

function describe(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v === null ? "null" : String(v)}`)
      .join(" · ");
  }
  return String(value);
}

export default async function AdminReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getReviewForAdmin(id);
  if (!review) notFound();
  const audit = await listAuditForEntity(getPrisma(), "review", review.id);
  const publicPhoto = isPubliclyVisible(review) && review.consentPhoto && review.hasPhoto ? `/api/reviews/${review.id}/photo` : null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/reviews" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Reviews
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Review</p>
        <div className="flex items-center gap-3">
          <ReviewAvatar name={review.displayNameSnapshot} src={publicPhoto} />
          <div>
            <h1 className="text-display" data-testid="admin-review-title">
              {review.displayNameSnapshot}
            </h1>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              {review.userName} · {review.userEmail}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card variant="panel" className="p-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip tone={review.moderationStatus === "approved" ? "primary" : "neutral"}>{REVIEW_MODERATION_LABEL[review.moderationStatus]}</Chip>
            <Chip tone={review.visibilityStatus === "visible" ? "primary" : "neutral"}>{REVIEW_VISIBILITY_LABEL[review.visibilityStatus]}</Chip>
            <Chip>{review.consentPublic ? "Public consent: yes" : "Public consent: no"}</Chip>
            {isPubliclyVisible(review) ? <Chip tone="primary">Live on /reviews</Chip> : null}
          </div>
          <Stars rating={review.rating} />
          <p className="text-body-sm mt-3 whitespace-pre-line text-[var(--color-ink)]" data-testid="admin-review-body">
            {review.body}
          </p>
          <div className="mt-6 border-t border-[var(--color-line)] pt-4">
            <ModerationActions
              reviewId={review.id}
              moderationStatus={review.moderationStatus}
              visibilityStatus={review.visibilityStatus}
              consentPublic={review.consentPublic}
            />
          </div>
        </Card>

        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-4">Details</h2>
          <dl className="text-body-sm grid gap-y-3">
            <div>
              <dt className="text-label mb-1">Programme</dt>
              <dd>{review.kind === "diagnostic" ? "Free diagnostic" : review.programmeTitle}</dd>
            </div>
            {review.offeringStartsOn && review.offeringEndsOn ? (
              <div>
                <dt className="text-label mb-1">Offering dates</dt>
                <dd>{formatDateRange(review.offeringStartsOn, review.offeringEndsOn)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-label mb-1">Kind</dt>
              <dd>{review.kind}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Category</dt>
              <dd>{review.category ? REVIEW_CATEGORY_LABEL[review.category] : "—"}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Photo consent</dt>
              <dd>{review.consentPhoto ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Submitted</dt>
              <dd>{formatTimestamp(review.submittedAt)}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Edited</dt>
              <dd>{review.editedAt ? formatTimestamp(review.editedAt) : "—"}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Moderated</dt>
              <dd>{review.moderatedAt ? formatTimestamp(review.moderatedAt) : "—"}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Moderation note</dt>
              <dd className="whitespace-pre-line">{review.moderationNote ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Registration</dt>
              <dd className="text-mono break-all">{review.registrationId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Review id</dt>
              <dd className="text-mono break-all">{review.id}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card variant="panel" className="overflow-x-auto p-0">
        <h2 className="text-h2 px-6 pt-6">History</h2>
        <table className="text-body-sm w-full min-w-[720px] border-collapse" data-testid="admin-review-audit">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["When", "Action", "Before", "After", "Reason"].map((c) => (
                <th key={c} scope="col" className="text-label px-6 py-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {audit.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                  No history recorded.
                </td>
              </tr>
            ) : (
              audit.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top">
                  <td className="px-6 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(a.createdAt)}</td>
                  <td className="px-6 py-3 text-[var(--color-ink)]">{a.action}</td>
                  <td className="px-6 py-3 text-[var(--color-ink-quiet)]">{describe(a.before)}</td>
                  <td className="px-6 py-3 text-[var(--color-ink-quiet)]">{describe(a.after)}</td>
                  <td className="px-6 py-3 text-[var(--color-ink-quiet)]">{a.reason ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
