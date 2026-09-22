import type { Metadata } from "next";
import Link from "next/link";
import { listProgrammesForAdmin } from "@/modules/catalogue/programmes/repository";
import { ReviewAvatar } from "@/modules/reviews/components/ReviewAvatar";
import { Stars } from "@/modules/reviews/components/Stars";
import {
  REVIEW_MODERATION_LABEL,
  REVIEW_MODERATION_STATUSES,
  REVIEW_VISIBILITY_LABEL,
  REVIEW_VISIBILITY_STATUSES,
  type ReviewModerationStatus,
  type ReviewVisibilityStatus,
} from "@/modules/reviews/constants";
import { listReviewsForAdmin, type AdminReviewFilters } from "@/modules/reviews/repository";
import { isPubliclyVisible } from "@/modules/reviews/visibility";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { inputClass } from "@/shared/ui/forms";
import { formatCalendarDate, formatDateRange } from "@/shared/util/dates";
import { ModerationActions } from "./ModerationActions";

/*
 * /admin/reviews — moderation list (requirements §7.4). The admin layout
 * gates the route (platform_admin); each action re-authorises itself.
 * Search, filters, sort and pagination are plain GET parameters so a
 * filtered view is a URL. Email is shown here and nowhere public.
 */
export const metadata: Metadata = { title: "Reviews" };

export const dynamic = "force-dynamic";

const columns = ["Learner", "Programme", "Rating", "Review", "Submitted", "Consent", "Moderation", "Visibility", "Actions"];

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : null);
  const ratingRaw = param("rating");
  const filters: AdminReviewFilters = {
    q: param("q") ?? undefined,
    moderation: pick(param("moderation"), REVIEW_MODERATION_STATUSES),
    visibility: pick(param("visibility"), REVIEW_VISIBILITY_STATUSES),
    consent: pick(param("consent"), ["yes", "no"] as const),
    programmeId: param("programme") ?? undefined,
    rating: ratingRaw && /^[1-5]$/.test(ratingRaw) ? Number(ratingRaw) : undefined,
    sort: pick(param("sort"), ["newest", "oldest"] as const) ?? "newest",
    page: Math.max(1, Number.parseInt(param("page") ?? "1", 10) || 1),
  };
  const [result, programmes] = await Promise.all([listReviewsForAdmin(filters), listProgrammesForAdmin()]);

  const query = (page: number) => {
    const q = new URLSearchParams();
    if (filters.q) q.set("q", filters.q);
    if (filters.moderation) q.set("moderation", filters.moderation);
    if (filters.visibility) q.set("visibility", filters.visibility);
    if (filters.consent) q.set("consent", filters.consent);
    if (filters.programmeId) q.set("programme", filters.programmeId);
    if (filters.rating) q.set("rating", String(filters.rating));
    if (filters.sort && filters.sort !== "newest") q.set("sort", filters.sort);
    if (page > 1) q.set("page", String(page));
    const s = q.toString();
    return s ? `/admin/reviews?${s}` : "/admin/reviews";
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Operations
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Learner feedback</p>
        <h1 className="text-display" data-testid="admin-reviews-title">
          Reviews
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          New reviews wait here until approved. Only reviews the learner agreed to publish, that are approved and not hidden, appear on the public page.
        </p>
      </header>

      <Card variant="panel" className="p-5">
        <form method="get" action="/admin/reviews" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter reviews">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="f-q" className="text-label">
              Search
            </label>
            <input id="f-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Name, email or words in the review" className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-moderation" className="text-label">
              Moderation
            </label>
            <select id="f-moderation" name="moderation" defaultValue={filters.moderation ?? ""} className={inputClass}>
              <option value="">Any</option>
              {REVIEW_MODERATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REVIEW_MODERATION_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-visibility" className="text-label">
              Visibility
            </label>
            <select id="f-visibility" name="visibility" defaultValue={filters.visibility ?? ""} className={inputClass}>
              <option value="">Any</option>
              {REVIEW_VISIBILITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REVIEW_VISIBILITY_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-consent" className="text-label">
              Public consent
            </label>
            <select id="f-consent" name="consent" defaultValue={filters.consent ?? ""} className={inputClass}>
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-programme" className="text-label">
              Programme
            </label>
            <select id="f-programme" name="programme" defaultValue={filters.programmeId ?? ""} className={inputClass}>
              <option value="">Any</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-rating" className="text-label">
              Rating
            </label>
            <select id="f-rating" name="rating" defaultValue={filters.rating ? String(filters.rating) : ""} className={inputClass}>
              <option value="">Any</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={String(n)}>
                  {n} {n === 1 ? "star" : "stars"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-sort" className="text-label">
              Sort
            </label>
            <select id="f-sort" name="sort" defaultValue={filters.sort} className={inputClass}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
            <Button type="submit">Apply</Button>
            <Button variant="text" href="/admin/reviews">
              Clear
            </Button>
            <span className="text-body-sm ml-auto text-[var(--color-ink-quiet)]" data-testid="admin-reviews-count">
              {result.total} {result.total === 1 ? "review" : "reviews"}
            </span>
          </div>
        </form>
      </Card>

      {result.items.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="admin-reviews-empty">
            No reviews match
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">Nothing has been submitted with these filters.</p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[1100px] border-collapse" data-testid="admin-reviews-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {columns.map((c) => (
                  <th key={c} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.items.map((r) => {
                const publicPhoto = isPubliclyVisible(r) && r.consentPhoto && r.hasPhoto ? `/api/reviews/${r.id}/photo` : null;
                return (
                  <tr key={r.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="admin-review-row">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <ReviewAvatar name={r.displayNameSnapshot} src={publicPhoto} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--color-ink)]" data-testid="admin-review-name">
                            {r.displayNameSnapshot}
                          </p>
                          {r.userName !== r.displayNameSnapshot ? <p className="text-[var(--color-ink-quiet)]">{r.userName}</p> : null}
                          <p className="break-all text-[var(--color-ink-quiet)]">{r.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-quiet)]">
                      <p className="text-[var(--color-ink)]">{r.kind === "diagnostic" ? "Free diagnostic" : r.programmeTitle}</p>
                      {r.offeringStartsOn && r.offeringEndsOn ? <p className="whitespace-nowrap">{formatDateRange(r.offeringStartsOn, r.offeringEndsOn)}</p> : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Stars rating={r.rating} />
                    </td>
                    <td className="max-w-[320px] px-4 py-3 text-[var(--color-ink)]">
                      <p>{r.excerpt}</p>
                      <Link href={`/admin/reviews/${r.id}`} className="mt-1 inline-block text-[var(--color-primary)] underline underline-offset-4" aria-label={`Open review by ${r.displayNameSnapshot}`}>
                        Open
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">
                      {formatCalendarDate(r.submittedAt)}
                      {r.editedAt ? <p className="text-[var(--color-ink-faint)]">edited</p> : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]" data-testid="admin-review-consent">
                      {r.consentPublic ? "Yes" : "No"}
                      {r.consentPublic ? <p className="text-[var(--color-ink-faint)]">{r.consentPhoto ? "with photo" : "no photo"}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <Chip tone={r.moderationStatus === "approved" ? "primary" : "neutral"}>{REVIEW_MODERATION_LABEL[r.moderationStatus]}</Chip>
                    </td>
                    <td className="px-4 py-3">
                      <Chip tone={r.visibilityStatus === "visible" ? "primary" : "neutral"}>{REVIEW_VISIBILITY_LABEL[r.visibilityStatus]}</Chip>
                    </td>
                    <td className="px-4 py-3">
                      <ModerationActions
                        reviewId={r.id}
                        moderationStatus={r.moderationStatus}
                        visibilityStatus={r.visibilityStatus}
                        consentPublic={r.consentPublic}
                        compact
                      />
                    </td>
                  </tr>
                );
              })}
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
