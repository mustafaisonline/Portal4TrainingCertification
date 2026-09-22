import type { ReviewModerationStatus, ReviewVisibilityStatus } from "./constants";

/*
 * The ONE place the public-visibility rule and the certificate-gate rule
 * live (requirements §7.1, §8). Pure: no database import. The repository's
 * public query spreads `publicWhere()` so the SQL filter and the in-memory
 * check can never drift apart.
 */

export type ReviewVisibilityFields = {
  consentPublic: boolean;
  moderationStatus: ReviewModerationStatus;
  visibilityStatus: ReviewVisibilityStatus;
};

/** consent_public AND approved AND visible — nothing else is ever public. */
export function isPubliclyVisible(r: ReviewVisibilityFields): boolean {
  return r.consentPublic === true && r.moderationStatus === "approved" && r.visibilityStatus === "visible";
}

/** The Prisma `where` fragment for the same rule. */
export function publicWhere() {
  return { consentPublic: true, moderationStatus: "approved", visibilityStatus: "visible" } as const;
}

/**
 * D-7: certificates issued before the feature shipped are not gated. The
 * date is the day the feature went live (Milestone 5b, 2026-09-22).
 */
export const REVIEWS_FEATURE_SINCE = new Date("2026-09-22T00:00:00Z");

export type ReviewRequirement = "satisfied" | "required" | "not_applicable";

/**
 * Does a registration still owe a review before its certificate can be
 * downloaded (requirements §8; brief §8.2)? ANY review row satisfies it —
 * hidden, rejected or private reviews included: the requirement is that the
 * person shared their experience, not that it was published.
 */
export function reviewRequirement(
  review: ReviewVisibilityFields | { id: string } | null,
  opts: { certificateIssuedAt?: Date | null; featureSince?: Date } = {},
): ReviewRequirement {
  const since = opts.featureSince ?? REVIEWS_FEATURE_SINCE;
  if (opts.certificateIssuedAt && opts.certificateIssuedAt.getTime() < since.getTime()) return "not_applicable";
  return review ? "satisfied" : "required";
}
