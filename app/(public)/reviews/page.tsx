import type { Metadata } from "next";
import Link from "next/link";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import { getProfile } from "@/modules/identity/profile.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { ReviewAvatar } from "@/modules/reviews/components/ReviewAvatar";
import { formatMonthYear, Stars } from "@/modules/reviews/components/Stars";
import { REVIEW_EDIT_WINDOW_DAYS } from "@/modules/reviews/constants";
import { getOwnReviews, listReviewableRegistrations, OWN_REVIEW_STATUS_LABEL, ownReviewStatus } from "@/modules/reviews/eligibility";
import { editWindowOpen, findReviewById, listPublicReviews, type PublicReview, type ReviewRecord } from "@/modules/reviews/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange } from "@/shared/util/dates";
import { ReviewForm } from "./ReviewForm";

/*
 * /reviews — Learner reviews (Milestone 5b; requirements §7.1–§7.2).
 * Server component. Guests: intro, the public list and "Log in to share a
 * review". Signed in: the registrations they may review (each with the
 * form, headed by THEIR profile name and avatar), the optional private
 * diagnostic note, their own reviews with status (and an Edit link within
 * 7 days), then the public list. The public list is selected with the ONE
 * visibility rule (`publicWhere()`); bodies are rendered as text.
 * `?submitted=` / `?exists=` / `?edited=` name a review the person just
 * saved — the message is derived from that row, never from client state.
 */
export const metadata: Metadata = {
  title: "Reviews",
  description: "Real experiences from learners building their knowledge, developing their skills, and earning certifications through our platform.",
};

export const dynamic = "force-dynamic";

const INTRO = "Real experiences from learners building their knowledge, developing their skills, and earning certifications through our platform.";

function Outcome({ kind, review }: { kind: "submitted" | "exists" | "edited"; review: ReviewRecord }) {
  const tail = review.consentPublic
    ? "Your review has been submitted and will appear once it has been reviewed."
    : "Your review has been recorded. It will stay private.";
  const text =
    kind === "submitted"
      ? `Thank you for sharing your experience! ${tail}`
      : kind === "edited"
        ? `Your changes have been saved. ${review.consentPublic ? "Your review will be read again before it is published." : "It will stay private."}`
        : `You have already shared a review for this programme — it is listed below. ${tail}`;
  return (
    <Card variant="feature" className="p-5! sm:p-6!">
      <p role="status" className="text-body-lg font-medium text-[var(--color-ink)]" data-testid="review-outcome">
        {text}
      </p>
    </Card>
  );
}

function PublicReviewCard({ review }: { review: PublicReview }) {
  const src = review.consentPhoto && review.hasPhoto ? `/api/reviews/${review.id}/photo` : null;
  return (
    <li>
      <Card variant="panel" className="flex h-full flex-col gap-3 p-5" data-testid="public-review">
        <div className="flex items-center gap-3">
          <ReviewAvatar name={review.displayNameSnapshot} src={src} />
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-[var(--color-ink)]" data-testid="public-review-name">
              {review.displayNameSnapshot}
            </p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">{review.programmeTitle}</p>
          </div>
        </div>
        <Stars rating={review.rating} />
        <p className="text-body-sm whitespace-pre-line text-[var(--color-ink)]">{review.body}</p>
        <p className="text-body-sm mt-auto text-[var(--color-ink-faint)]">{formatMonthYear(review.submittedAt)}</p>
      </Card>
    </li>
  );
}

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : null);
  const page = Math.max(1, Number.parseInt(param("page") ?? "1", 10) || 1);
  const user = await getCurrentUser();

  const publicPage = await listPublicReviews({ page });

  let signedIn: {
    name: string;
    hasPhoto: boolean;
    photoVersion: number;
    reviewable: Awaited<ReturnType<typeof listReviewableRegistrations>>;
    own: ReviewRecord[];
    flagshipTitle: string | null;
    outcome: { kind: "submitted" | "exists" | "edited"; review: ReviewRecord } | null;
    editing: ReviewRecord | null;
  } | null = null;

  if (user) {
    const [profile, reviewable, own, flagship] = await Promise.all([
      getProfile(user.id),
      listReviewableRegistrations(user.id),
      getOwnReviews(user.id),
      findFlagshipProgramme(),
    ]);
    const name = profile?.displayName?.trim() || profile?.legalName?.trim() || user.name;
    const outcomeKind = (["submitted", "exists", "edited"] as const).find((k) => param(k));
    const outcomeReview = outcomeKind ? await findReviewById(param(outcomeKind)!) : null;
    const editId = param("edit");
    const editing = editId ? await findReviewById(editId) : null;
    signedIn = {
      name,
      hasPhoto: profile?.hasPhoto ?? false,
      photoVersion: profile?.photoUpdatedAt?.getTime() ?? 0,
      reviewable,
      own,
      flagshipTitle: flagship?.title ?? null,
      // Ownership: only the person's own row can be named in the URL.
      outcome: outcomeKind && outcomeReview && outcomeReview.userId === user.id ? { kind: outcomeKind, review: outcomeReview } : null,
      editing: editing && editing.userId === user.id && editWindowOpen(editing.submittedAt) ? editing : null,
    };
  }

  const header = signedIn
    ? { name: signedIn.name, photoSrc: signedIn.hasPhoto ? `/api/me/photo?v=${signedIn.photoVersion}` : null, hasPhoto: signedIn.hasPhoto }
    : null;

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[1080px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Learner reviews</p>
        <h1 className="mb-3 text-display" data-testid="reviews-title">
          Reviews
        </h1>
        <p className="text-body-lg mb-10 max-w-[60ch] text-[var(--color-ink-quiet)]">{INTRO}</p>

        {!signedIn ? (
          <div className="mb-12">
            <Button href="/sign-in?return-to=/reviews" data-testid="reviews-sign-in">
              Log in to share a review
            </Button>
          </div>
        ) : (
          <div className="mb-12 flex flex-col gap-8">
            {signedIn.outcome ? <Outcome kind={signedIn.outcome.kind} review={signedIn.outcome.review} /> : null}

            {signedIn.editing && header ? (
              <section aria-labelledby="edit-review" id="edit">
                <h2 id="edit-review" className="text-h1 mb-4">
                  Edit your review
                </h2>
                <Card variant="panel" className="p-5 sm:p-6">
                  <ReviewForm
                    mode="edit"
                    kind={signedIn.editing.kind}
                    reviewId={signedIn.editing.id}
                    header={{
                      ...header,
                      programmeTitle: signedIn.editing.programmeTitle,
                      dates:
                        signedIn.editing.offeringStartsOn && signedIn.editing.offeringEndsOn
                          ? formatDateRange(signedIn.editing.offeringStartsOn, signedIn.editing.offeringEndsOn)
                          : null,
                    }}
                    initialValues={{
                      body: signedIn.editing.body,
                      rating: signedIn.editing.rating,
                      category: signedIn.editing.category,
                      consentPublic: signedIn.editing.consentPublic,
                      consentPhoto: signedIn.editing.consentPhoto,
                    }}
                  />
                </Card>
              </section>
            ) : null}

            <section aria-labelledby="share-experience">
              <h2 id="share-experience" className="text-h1 mb-2">
                Share your experience
              </h2>
              {signedIn.reviewable.length === 0 ? (
                <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="nothing-to-review">
                  A review can be shared once a programme you registered for has ended.
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {signedIn.reviewable.map((r) => (
                    <li key={r.registrationId} id={`registration-${r.registrationId}`} className="scroll-mt-24">
                      <Card variant="panel" className="p-5 sm:p-6" data-testid="reviewable-registration">
                        {header ? (
                          <ReviewForm
                            mode="create"
                            kind="registration"
                            registrationId={r.registrationId}
                            header={{ ...header, programmeTitle: r.programmeTitle, dates: formatDateRange(r.startsOn, r.endsOn) }}
                          />
                        ) : null}
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {header && signedIn.flagshipTitle ? (
              <details className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] px-5 py-4">
                <summary className="text-body-sm cursor-pointer font-medium" data-testid="diagnostic-review-toggle">
                  Tried the free diagnostic? Share a private note
                </summary>
                <p className="text-body-sm mt-2 mb-4 text-[var(--color-ink-quiet)]">
                  This is not tied to a certificate. It is private unless you choose otherwise.
                </p>
                <ReviewForm mode="create" kind="diagnostic" header={{ ...header, programmeTitle: "Free diagnostic", dates: null }} />
              </details>
            ) : null}

            <section aria-labelledby="your-reviews-heading" id="your-reviews" className="scroll-mt-24">
              <h2 id="your-reviews-heading" className="text-h1 mb-4">
                Your reviews
              </h2>
              {signedIn.own.length === 0 ? (
                <p className="text-body-sm text-[var(--color-ink-quiet)]">You have not shared a review yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {signedIn.own.map((r) => {
                    const status = ownReviewStatus(r);
                    const canEdit = editWindowOpen(r.submittedAt);
                    return (
                      <li key={r.id}>
                        <Card variant="plate" className="p-4" data-testid="own-review">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Chip tone={status === "published" ? "primary" : "neutral"}>{OWN_REVIEW_STATUS_LABEL[status]}</Chip>
                            <span className="text-body-sm text-[var(--color-ink-quiet)]">
                              {r.kind === "diagnostic" ? "Free diagnostic" : r.programmeTitle}
                              {r.offeringStartsOn && r.offeringEndsOn ? ` · ${formatDateRange(r.offeringStartsOn, r.offeringEndsOn)}` : ""}
                              {" · "}
                              {formatMonthYear(r.submittedAt)}
                            </span>
                          </div>
                          <Stars rating={r.rating} />
                          <p className="text-body-sm mt-2 whitespace-pre-line text-[var(--color-ink)]">{r.body}</p>
                          {canEdit ? (
                            <Link
                              href={`/reviews?edit=${r.id}#edit`}
                              className="text-body-sm mt-3 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4"
                            >
                              Edit
                            </Link>
                          ) : (
                            <p className="text-body-sm mt-3 text-[var(--color-ink-faint)]">
                              Edits are possible for {REVIEW_EDIT_WINDOW_DAYS} days after submitting.
                            </p>
                          )}
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}

        <section aria-labelledby="public-reviews-heading" id="public-reviews" className="scroll-mt-24">
          <h2 id="public-reviews-heading" className="text-h1 mb-4">
            What learners say
          </h2>
          {publicPage.items.length === 0 ? (
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="reviews-empty">
              No reviews have been published yet.
            </p>
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {publicPage.items.map((r) => (
                  <PublicReviewCard key={r.id} review={r} />
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {publicPage.page > 1 ? (
                  <Button variant="secondary" href={`/reviews?page=${publicPage.page - 1}#public-reviews`}>
                    Newer
                  </Button>
                ) : null}
                {publicPage.hasMore ? (
                  <Button variant="secondary" href={`/reviews?page=${publicPage.page + 1}#public-reviews`} data-testid="reviews-load-more">
                    Load more
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
