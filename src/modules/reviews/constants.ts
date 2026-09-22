/*
 * Reviews — pure vocabulary (Milestone 5b, LEARNER_FEEDBACK_REQUIREMENTS.md
 * §5–§6). No database import: client components (the review form) read the
 * labels and limits from here (tests/unit/boundaries.test.ts allows a
 * module named `constants`).
 */

export const REVIEW_BODY_MIN = 20;
export const REVIEW_BODY_MAX = 2000;
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
/** D-6: the author may edit within this many days of submitting. */
export const REVIEW_EDIT_WINDOW_DAYS = 7;

export const REVIEW_CATEGORIES = [
  "programme_experience",
  "course_content",
  "certification_process",
  "user_experience",
  "technical_issue",
  "other",
] as const;
export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

export const REVIEW_CATEGORY_LABEL: Record<ReviewCategory, string> = {
  programme_experience: "Programme experience",
  course_content: "Course content",
  certification_process: "Certification process",
  user_experience: "User experience",
  technical_issue: "Technical issue",
  other: "Other",
};

export const REVIEW_KINDS = ["registration", "diagnostic"] as const;
export type ReviewKind = (typeof REVIEW_KINDS)[number];

export const REVIEW_MODERATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewModerationStatus = (typeof REVIEW_MODERATION_STATUSES)[number];
export const REVIEW_MODERATION_LABEL: Record<ReviewModerationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const REVIEW_VISIBILITY_STATUSES = ["visible", "hidden"] as const;
export type ReviewVisibilityStatus = (typeof REVIEW_VISIBILITY_STATUSES)[number];
export const REVIEW_VISIBILITY_LABEL: Record<ReviewVisibilityStatus, string> = {
  visible: "Visible",
  hidden: "Hidden",
};

export function isReviewCategory(value: string): value is ReviewCategory {
  return (REVIEW_CATEGORIES as readonly string[]).includes(value);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A malformed id is "not found", never a database error. */
export function isReviewId(value: string): boolean {
  return UUID_RE.test(value);
}
