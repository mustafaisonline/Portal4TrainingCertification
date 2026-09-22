import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isReviewId } from "./constants";
import { findReviewByRegistration, listReviewsForUser, type ReviewRecord } from "./repository";
import { isPubliclyVisible, reviewRequirement, type ReviewRequirement } from "./visibility";

/*
 * Who may review what (requirements §4 step 1, §8). A registration is
 * reviewable when it is CONFIRMED, its offering has ended (the calendar day
 * after `ends_on`, UTC — the columns are dates) and no review exists for it.
 * Completion recording (M6/M8) will tighten this to "completion recorded";
 * until then the end date is the honest proxy the requirements name.
 */

export type ReviewableRegistration = {
  registrationId: string;
  offeringId: string;
  programmeId: string;
  programmeTitle: string;
  formatName: string | null;
  startsOn: Date;
  endsOn: Date;
};

function todayUtc(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function listReviewableRegistrations(userId: string, now = new Date(), db: Db = getPrisma()): Promise<ReviewableRegistration[]> {
  const rows = await db.registration.findMany({
    where: { userId, status: "confirmed", review: null, offering: { endsOn: { lt: todayUtc(now) } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      offeringId: true,
      offering: {
        select: { programmeId: true, startsOn: true, endsOn: true, programme: { select: { title: true } }, deliveryFormat: { select: { name: true } } },
      },
    },
  });
  return rows.map((r) => ({
    registrationId: r.id,
    offeringId: r.offeringId,
    programmeId: r.offering.programmeId,
    programmeTitle: r.offering.programme.title,
    formatName: r.offering.deliveryFormat?.name ?? null,
    startsOn: r.offering.startsOn,
    endsOn: r.offering.endsOn,
  }));
}

/** One reviewable registration, or null when it is not this person's or not
 *  (yet / any longer) reviewable — the server action's ownership + eligibility check. */
export async function findReviewableRegistration(userId: string, registrationId: string, now = new Date()): Promise<ReviewableRegistration | null> {
  if (!isReviewId(registrationId)) return null;
  const all = await listReviewableRegistrations(userId, now);
  return all.find((r) => r.registrationId === registrationId) ?? null;
}

export async function getOwnReviews(userId: string): Promise<ReviewRecord[]> {
  return listReviewsForUser(userId);
}

/**
 * The status word the account screens show for a registration
 * (requirements §7.2): Required · Submitted · Awaiting review · Published,
 * plus "Not yet" while the programme has not ended.
 */
export type RegistrationReviewStatus = "not_yet" | "required" | "awaiting_review" | "published" | "submitted";

export const REGISTRATION_REVIEW_STATUS_LABEL: Record<RegistrationReviewStatus, string> = {
  not_yet: "After the programme ends",
  required: "Required",
  awaiting_review: "Awaiting review",
  published: "Published",
  submitted: "Submitted",
};

export function registrationReviewStatus(review: ReviewRecord | null, offeringEndsOn: Date, now = new Date()): RegistrationReviewStatus {
  if (review) {
    if (review.moderationStatus === "pending") return "awaiting_review";
    if (isPubliclyVisible(review)) return "published";
    return "submitted";
  }
  return offeringEndsOn.getTime() < todayUtc(now).getTime() ? "required" : "not_yet";
}

/** The author's own view of a review's outcome (the /reviews "your reviews" list). */
export type OwnReviewStatus = "awaiting_review" | "published" | "private" | "not_published";

export const OWN_REVIEW_STATUS_LABEL: Record<OwnReviewStatus, string> = {
  awaiting_review: "Awaiting review",
  published: "Published",
  private: "Private",
  not_published: "Not published",
};

export function ownReviewStatus(review: ReviewRecord): OwnReviewStatus {
  if (!review.consentPublic) return "private";
  if (review.moderationStatus === "pending") return "awaiting_review";
  if (isPubliclyVisible(review)) return "published";
  return "not_published";
}

/**
 * The certificate gate (requirements §8) — M6's certificate route calls this
 * AFTER the ownership check and BEFORE rendering anything. A hidden, rejected
 * or private review still satisfies it.
 */
export async function reviewRequirementForRegistration(
  registrationId: string,
  opts: { certificateIssuedAt?: Date | null } = {},
): Promise<ReviewRequirement> {
  const review = await findReviewByRegistration(registrationId);
  return reviewRequirement(review, opts);
}
