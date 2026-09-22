import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";
import {
  isReviewId,
  REVIEW_EDIT_WINDOW_DAYS,
  type ReviewCategory,
  type ReviewKind,
  type ReviewModerationStatus,
  type ReviewVisibilityStatus,
} from "./constants";
import type { ReviewInput } from "./review-validation";
import { isPubliclyVisible, publicWhere } from "./visibility";

/*
 * Reviews repository (Milestone 5b; MILESTONE_5B_EXECUTION_PLAN.md §1–§3).
 * Every write takes the caller's transaction and writes its audit row in it
 * (ADR-022). Audit snapshots carry statuses and flags only — NEVER the body,
 * the email or the moderation note's text beyond `reason`.
 *
 * The public read path selects with `publicWhere()` ONLY (requirements §7.1)
 * and returns public-safe fields — no email, no user id.
 */

export class ReviewConsentError extends Error {
  constructor(reviewId: string) {
    super(`Review ${reviewId} cannot be restored: the learner did not consent to public display.`);
    this.name = "ReviewConsentError";
  }
}

export class ReviewEditWindowError extends Error {
  constructor(reviewId: string) {
    super(`Review ${reviewId} can no longer be edited: the ${REVIEW_EDIT_WINDOW_DAYS}-day window has closed.`);
    this.name = "ReviewEditWindowError";
  }
}

export class ReviewNotFoundError extends Error {
  constructor(reviewId: string) {
    super(`Review ${reviewId} not found.`);
    this.name = "ReviewNotFoundError";
  }
}

/** A review as its author and the admin see it (never rendered publicly). */
export type ReviewRecord = {
  id: string;
  userId: string;
  registrationId: string | null;
  programmeId: string;
  programmeTitle: string;
  offeringId: string | null;
  offeringStartsOn: Date | null;
  offeringEndsOn: Date | null;
  kind: ReviewKind;
  body: string;
  rating: number | null;
  category: ReviewCategory | null;
  consentPublic: boolean;
  consentPhoto: boolean;
  moderationStatus: ReviewModerationStatus;
  visibilityStatus: ReviewVisibilityStatus;
  moderatedByUserId: string | null;
  moderatedAt: Date | null;
  moderationNote: string | null;
  displayNameSnapshot: string;
  submittedAt: Date;
  editedAt: Date | null;
};

const recordInclude = {
  programme: { select: { title: true } },
  offering: { select: { startsOn: true, endsOn: true } },
} as const;

type RecordRow = NonNullable<Awaited<ReturnType<typeof loadRecord>>>;

function loadRecord(db: Db, id: string) {
  return db.review.findUnique({ where: { id }, include: recordInclude });
}

function toRecord(r: RecordRow): ReviewRecord {
  return {
    id: r.id,
    userId: r.userId,
    registrationId: r.registrationId,
    programmeId: r.programmeId,
    programmeTitle: r.programme.title,
    offeringId: r.offeringId,
    offeringStartsOn: r.offering?.startsOn ?? null,
    offeringEndsOn: r.offering?.endsOn ?? null,
    kind: r.kind,
    body: r.body,
    rating: r.rating,
    category: r.category,
    consentPublic: r.consentPublic,
    consentPhoto: r.consentPhoto,
    moderationStatus: r.moderationStatus,
    visibilityStatus: r.visibilityStatus,
    moderatedByUserId: r.moderatedByUserId,
    moderatedAt: r.moderatedAt,
    moderationNote: r.moderationNote,
    displayNameSnapshot: r.displayNameSnapshot,
    submittedAt: r.submittedAt,
    editedAt: r.editedAt,
  };
}

export async function findReviewById(id: string, db: Db = getPrisma()): Promise<ReviewRecord | null> {
  if (!isReviewId(id)) return null;
  const row = await loadRecord(db, id);
  return row ? toRecord(row) : null;
}

export async function findReviewByRegistration(registrationId: string, db: Db = getPrisma()): Promise<ReviewRecord | null> {
  if (!isReviewId(registrationId)) return null;
  const row = await db.review.findUnique({ where: { registrationId }, include: recordInclude });
  return row ? toRecord(row) : null;
}

/** The person's own reviews, newest first. */
export async function listReviewsForUser(userId: string, db: Db = getPrisma()): Promise<ReviewRecord[]> {
  const rows = await db.review.findMany({ where: { userId }, orderBy: { submittedAt: "desc" }, include: recordInclude });
  return rows.map(toRecord);
}

/* ------------------------------------------------------------------ create */

export type CreateReviewInput = ReviewInput & {
  userId: string;
  kind: ReviewKind;
  /** Required for `kind = registration`; null for the diagnostic. */
  registrationId: string | null;
  programmeId: string;
  offeringId: string | null;
};

export type CreateReviewResult = { review: ReviewRecord; created: boolean };

/** D-5: display name, falling back to the legal name, then the identity row. */
async function snapshotName(tx: Tx, userId: string): Promise<string> {
  const profile = await tx.userProfile.findUnique({ where: { userId }, select: { displayName: true, legalName: true } });
  const display = profile?.displayName?.trim();
  if (display) return display;
  const legal = profile?.legalName?.trim();
  if (legal) return legal;
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
  return user.name;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/**
 * One review per registration (unique `registration_id`): a second submit
 * for the same registration returns the existing row with `created: false`
 * — resubmits after a network error are idempotent (requirements §10).
 */
export async function createReview(tx: Tx, input: CreateReviewInput): Promise<CreateReviewResult> {
  if (input.kind === "registration" && !input.registrationId) throw new Error("a registration review needs a registrationId");
  if (input.registrationId) {
    const existing = await tx.review.findUnique({ where: { registrationId: input.registrationId }, include: recordInclude });
    if (existing) return { review: toRecord(existing), created: false };
  }
  const displayNameSnapshot = await snapshotName(tx, input.userId);
  try {
    const row = await tx.review.create({
      data: {
        userId: input.userId,
        registrationId: input.registrationId,
        programmeId: input.programmeId,
        offeringId: input.offeringId,
        kind: input.kind,
        body: input.body,
        rating: input.rating,
        category: input.category,
        consentPublic: input.consentPublic,
        consentPhoto: input.consentPublic && input.consentPhoto,
        displayNameSnapshot,
      },
      include: recordInclude,
    });
    await writeAudit(tx, {
      actorUserId: input.userId,
      action: "review.submitted",
      entityType: "review",
      entityId: row.id,
      after: {
        kind: row.kind,
        registrationId: row.registrationId,
        programmeId: row.programmeId,
        rating: row.rating,
        category: row.category,
        consentPublic: row.consentPublic,
        consentPhoto: row.consentPhoto,
        moderationStatus: row.moderationStatus,
        visibilityStatus: row.visibilityStatus,
        bodyLength: row.body.length,
      },
    });
    return { review: toRecord(row), created: true };
  } catch (err) {
    // Two submits raced past the pre-check: the constraint won; return the winner.
    if (isUniqueViolation(err) && input.registrationId) {
      const existing = await tx.review.findUnique({ where: { registrationId: input.registrationId }, include: recordInclude });
      if (existing) return { review: toRecord(existing), created: false };
    }
    throw err;
  }
}

/* -------------------------------------------------------------------- edit */

export function editWindowOpen(submittedAt: Date, now = new Date()): boolean {
  return now.getTime() - submittedAt.getTime() < REVIEW_EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * D-6: the author may change their own review within 7 days of submitting.
 * Any edit sends it back to `pending` so nothing reaches the public list
 * without being read again. Ownership is checked here, not only in the action.
 */
export async function updateOwnReview(tx: Tx, reviewId: string, userId: string, input: ReviewInput, now = new Date()): Promise<ReviewRecord> {
  const before = isReviewId(reviewId) ? await tx.review.findUnique({ where: { id: reviewId } }) : null;
  if (!before || before.userId !== userId) throw new ReviewNotFoundError(reviewId);
  if (!editWindowOpen(before.submittedAt, now)) throw new ReviewEditWindowError(reviewId);
  const row = await tx.review.update({
    where: { id: reviewId },
    data: {
      body: input.body,
      rating: input.rating,
      category: input.category,
      consentPublic: input.consentPublic,
      consentPhoto: input.consentPublic && input.consentPhoto,
      moderationStatus: "pending",
      moderatedByUserId: null,
      moderatedAt: null,
      moderationNote: null,
      editedAt: now,
    },
    include: recordInclude,
  });
  await writeAudit(tx, {
    actorUserId: userId,
    action: "review.edited",
    entityType: "review",
    entityId: row.id,
    before: {
      rating: before.rating,
      category: before.category,
      consentPublic: before.consentPublic,
      consentPhoto: before.consentPhoto,
      moderationStatus: before.moderationStatus,
      bodyLength: before.body.length,
    },
    after: {
      rating: row.rating,
      category: row.category,
      consentPublic: row.consentPublic,
      consentPhoto: row.consentPhoto,
      moderationStatus: row.moderationStatus,
      bodyLength: row.body.length,
    },
  });
  return toRecord(row);
}

/* ------------------------------------------------------------------ public */

/** Public-safe: no email, no user id, no moderation detail. */
export type PublicReview = {
  id: string;
  displayNameSnapshot: string;
  programmeTitle: string;
  rating: number | null;
  body: string;
  submittedAt: Date;
  consentPhoto: boolean;
  /** The reviewer's profile has a photo (the route still re-checks consent). */
  hasPhoto: boolean;
};

export type PublicReviewPage = { items: PublicReview[]; page: number; pageSize: number; hasMore: boolean };

export const PUBLIC_PAGE_SIZE = 12;

export async function listPublicReviews(opts: { page?: number; pageSize?: number } = {}, db: Db = getPrisma()): Promise<PublicReviewPage> {
  const pageSize = Math.min(Math.max(opts.pageSize ?? PUBLIC_PAGE_SIZE, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const rows = await db.review.findMany({
    where: publicWhere(),
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
    select: {
      id: true,
      displayNameSnapshot: true,
      rating: true,
      body: true,
      submittedAt: true,
      consentPhoto: true,
      programme: { select: { title: true } },
      user: { select: { profile: { select: { photoMime: true } } } },
    },
  });
  const items = rows.slice(0, pageSize).map((r) => ({
    id: r.id,
    displayNameSnapshot: r.displayNameSnapshot,
    programmeTitle: r.programme.title,
    rating: r.rating,
    body: r.body,
    submittedAt: r.submittedAt,
    consentPhoto: r.consentPhoto,
    hasPhoto: r.user.profile?.photoMime != null,
  }));
  return { items, page, pageSize, hasMore: rows.length > pageSize };
}

/** The reviewer's photo, ONLY when the review is public and they consented
 *  to the photo (requirements §7.3). Anything else → null → 404. */
export async function getPublicReviewPhoto(reviewId: string, db: Db = getPrisma()): Promise<{ bytes: Uint8Array; mime: string; updatedAt: Date } | null> {
  if (!isReviewId(reviewId)) return null;
  const row = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      consentPublic: true,
      consentPhoto: true,
      moderationStatus: true,
      visibilityStatus: true,
      user: { select: { profile: { select: { photo: true, photoMime: true, photoUpdatedAt: true } } } },
    },
  });
  if (!row || !isPubliclyVisible(row) || !row.consentPhoto) return null;
  const profile = row.user.profile;
  if (!profile?.photo || !profile.photoMime) return null;
  return { bytes: profile.photo, mime: profile.photoMime, updatedAt: profile.photoUpdatedAt ?? new Date(0) };
}

/* ------------------------------------------------------------------- admin */

export type AdminReviewListItem = ReviewRecord & {
  userName: string;
  /** Admin only — never reaches a public page. */
  userEmail: string;
  hasPhoto: boolean;
  excerpt: string;
};

export type AdminReviewFilters = {
  q?: string;
  moderation?: ReviewModerationStatus;
  visibility?: ReviewVisibilityStatus;
  consent?: "yes" | "no";
  programmeId?: string;
  rating?: number;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

export type AdminReviewPage = { items: AdminReviewListItem[]; total: number; page: number; pageSize: number; pageCount: number };

export const ADMIN_PAGE_SIZE = 25;
const EXCERPT_LENGTH = 120;

export function excerptOf(body: string, length = EXCERPT_LENGTH): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  return oneLine.length <= length ? oneLine : `${oneLine.slice(0, length - 1).trimEnd()}…`;
}

export async function listReviewsForAdmin(filters: AdminReviewFilters = {}, db: Db = getPrisma()): Promise<AdminReviewPage> {
  const pageSize = Math.min(Math.max(filters.pageSize ?? ADMIN_PAGE_SIZE, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const q = filters.q?.trim();
  const where = {
    ...(filters.moderation ? { moderationStatus: filters.moderation } : {}),
    ...(filters.visibility ? { visibilityStatus: filters.visibility } : {}),
    ...(filters.consent ? { consentPublic: filters.consent === "yes" } : {}),
    ...(filters.programmeId && isReviewId(filters.programmeId) ? { programmeId: filters.programmeId } : {}),
    ...(filters.rating ? { rating: filters.rating } : {}),
    ...(q
      ? {
          OR: [
            { body: { contains: q, mode: "insensitive" as const } },
            { displayNameSnapshot: { contains: q, mode: "insensitive" as const } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: [{ submittedAt: filters.sort === "oldest" ? "asc" : "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { ...recordInclude, user: { select: { name: true, email: true, profile: { select: { photoMime: true } } } } },
    }),
  ]);
  return {
    items: rows.map((r) => ({
      ...toRecord(r),
      userName: r.user.name,
      userEmail: r.user.email,
      hasPhoto: r.user.profile?.photoMime != null,
      excerpt: excerptOf(r.body),
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getReviewForAdmin(id: string, db: Db = getPrisma()): Promise<AdminReviewListItem | null> {
  if (!isReviewId(id)) return null;
  const r = await db.review.findUnique({
    where: { id },
    include: { ...recordInclude, user: { select: { name: true, email: true, profile: { select: { photoMime: true } } } } },
  });
  if (!r) return null;
  return { ...toRecord(r), userName: r.user.name, userEmail: r.user.email, hasPhoto: r.user.profile?.photoMime != null, excerpt: excerptOf(r.body) };
}

/** D-4: the admin landing shows how many reviews await a decision. */
export async function countPendingReviews(db: Db = getPrisma()): Promise<number> {
  return db.review.count({ where: { moderationStatus: "pending" } });
}

export type ModerationInput = { status: "approved" | "rejected"; note?: string | null };

export async function moderateReview(tx: Tx, id: string, adminUserId: string, input: ModerationInput, now = new Date()): Promise<ReviewRecord> {
  const before = isReviewId(id) ? await tx.review.findUnique({ where: { id } }) : null;
  if (!before) throw new ReviewNotFoundError(id);
  const note = input.note?.trim().slice(0, 1000) || null;
  const row = await tx.review.update({
    where: { id },
    data: { moderationStatus: input.status, moderatedByUserId: adminUserId, moderatedAt: now, moderationNote: note },
    include: recordInclude,
  });
  await writeAudit(tx, {
    actorUserId: adminUserId,
    action: "review.moderated",
    entityType: "review",
    entityId: id,
    before: { moderationStatus: before.moderationStatus },
    after: { moderationStatus: row.moderationStatus },
    reason: note,
  });
  return toRecord(row);
}

export async function hideReview(tx: Tx, id: string, adminUserId: string): Promise<ReviewRecord> {
  const before = isReviewId(id) ? await tx.review.findUnique({ where: { id } }) : null;
  if (!before) throw new ReviewNotFoundError(id);
  if (before.visibilityStatus === "hidden") return toRecord(await tx.review.findUniqueOrThrow({ where: { id }, include: recordInclude }));
  const row = await tx.review.update({ where: { id }, data: { visibilityStatus: "hidden" }, include: recordInclude });
  await writeAudit(tx, {
    actorUserId: adminUserId,
    action: "review.hidden",
    entityType: "review",
    entityId: id,
    before: { visibilityStatus: before.visibilityStatus },
    after: { visibilityStatus: row.visibilityStatus },
  });
  return toRecord(row);
}

/** Restore never overrides the learner's choice: consent_public = false → refused. */
export async function restoreReview(tx: Tx, id: string, adminUserId: string): Promise<ReviewRecord> {
  const before = isReviewId(id) ? await tx.review.findUnique({ where: { id } }) : null;
  if (!before) throw new ReviewNotFoundError(id);
  if (!before.consentPublic) throw new ReviewConsentError(id);
  if (before.visibilityStatus === "visible") return toRecord(await tx.review.findUniqueOrThrow({ where: { id }, include: recordInclude }));
  const row = await tx.review.update({ where: { id }, data: { visibilityStatus: "visible" }, include: recordInclude });
  await writeAudit(tx, {
    actorUserId: adminUserId,
    action: "review.restored",
    entityType: "review",
    entityId: id,
    before: { visibilityStatus: before.visibilityStatus },
    after: { visibilityStatus: row.visibilityStatus },
  });
  return toRecord(row);
}
