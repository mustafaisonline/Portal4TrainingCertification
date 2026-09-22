"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma, withTransaction } from "@/db/prisma";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import { getCurrentUser } from "@/modules/identity/session";
import { isReviewId } from "./constants";
import { findReviewableRegistration } from "./eligibility";
import { createReview, ReviewEditWindowError, ReviewNotFoundError, updateOwnReview } from "./repository";
import { validateReviewInput, type ReviewFieldErrors } from "./review-validation";

/*
 * Reviews — the participant's server actions (requirements §4 step 3, §9).
 * Order on every submit: session → ownership + eligibility (the registration
 * is in THIS person's reviewable list) → validation → rate limit → write in
 * one transaction with its audit row → revalidate → redirect back to
 * /reviews with `?submitted=<id>` (or `exists` / `edited`), where the page
 * states the outcome FROM THE DATABASE ROW. The client never fabricates
 * success, and the form is not left showing a message for a registration
 * that the re-rendered page no longer lists.
 *
 * Rate limit: 5 submissions per client per 10 minutes, counted in the
 * database (restart-safe) — the enquiry form's approach with its own prefix.
 */

export type ReviewFormState = { status: "idle" } | { status: "error"; message: string; fieldErrors: ReviewFieldErrors };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const CHECK_FIELDS = "Please check the highlighted fields.";
const SESSION_ENDED = "Your session has ended. Please sign in again.";

async function overLimit(clientKey: string): Promise<boolean> {
  const prisma = getPrisma();
  const key = `review:${clientKey}`;
  const now = Date.now();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!row || now - Number(row.lastRequest) > WINDOW_MS) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { id: key, key, count: 1, lastRequest: BigInt(now) },
      update: { count: 1, lastRequest: BigInt(now) },
    });
    return false;
  }
  if (row.count >= MAX_PER_WINDOW) return true;
  await prisma.authRateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return false;
}

async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0]!.trim();
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function rawInput(formData: FormData) {
  return {
    body: formData.get("body"),
    rating: text(formData, "rating"),
    category: text(formData, "category"),
    consentPublic: text(formData, "consentPublic"),
    consentPhoto: formData.get("consentPhoto") !== null,
  };
}

function revalidate() {
  revalidatePath("/reviews");
  revalidatePath("/account", "layout");
  revalidatePath("/admin/reviews");
}

export async function submitReviewAction(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED, fieldErrors: {} };

  const kind = text(formData, "kind") === "diagnostic" ? "diagnostic" : "registration";
  const registrationId = text(formData, "registrationId");

  // Ownership + eligibility before anything is validated or written.
  let target: { registrationId: string | null; programmeId: string; offeringId: string | null };
  if (kind === "registration") {
    const reviewable = await findReviewableRegistration(user.id, registrationId);
    if (!reviewable) {
      return { status: "error", message: "This registration cannot be reviewed from your account, or it has already been reviewed.", fieldErrors: {} };
    }
    target = { registrationId: reviewable.registrationId, programmeId: reviewable.programmeId, offeringId: reviewable.offeringId };
  } else {
    const flagship = await findFlagshipProgramme();
    if (!flagship) return { status: "error", message: "The diagnostic is not available right now.", fieldErrors: {} };
    target = { registrationId: null, programmeId: flagship.id, offeringId: null };
  }

  const validation = validateReviewInput(rawInput(formData));
  if (!validation.ok) return { status: "error", message: CHECK_FIELDS, fieldErrors: validation.fieldErrors };

  if (await overLimit(await clientKey())) {
    return { status: "error", message: "Too many submissions in a short time. Please try again in a few minutes.", fieldErrors: {} };
  }

  let outcome: { created: boolean; id: string };
  try {
    const result = await withTransaction((tx) => createReview(tx, { ...validation.value, ...target, userId: user.id, kind }));
    outcome = { created: result.created, id: result.review.id };
  } catch (err) {
    console.error(`[reviews] submit failed for user ${user.id}`, err);
    return { status: "error", message: "We could not save your review. Please try again.", fieldErrors: {} };
  }
  revalidate();
  redirect(`/reviews?${outcome.created ? "submitted" : "exists"}=${outcome.id}#your-reviews`);
}

export async function editReviewAction(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED, fieldErrors: {} };

  const reviewId = text(formData, "reviewId");
  if (!isReviewId(reviewId)) return { status: "error", message: "This review could not be found.", fieldErrors: {} };

  const validation = validateReviewInput(rawInput(formData));
  if (!validation.ok) return { status: "error", message: CHECK_FIELDS, fieldErrors: validation.fieldErrors };

  try {
    await withTransaction((tx) => updateOwnReview(tx, reviewId, user.id, validation.value));
  } catch (err) {
    if (err instanceof ReviewNotFoundError) return { status: "error", message: "This review could not be found.", fieldErrors: {} };
    if (err instanceof ReviewEditWindowError) {
      return { status: "error", message: "The 7-day window for editing this review has closed.", fieldErrors: {} };
    }
    console.error(`[reviews] edit failed for review ${reviewId}, user ${user.id}`, err);
    return { status: "error", message: "We could not save your changes. Please try again.", fieldErrors: {} };
  }
  revalidate();
  redirect(`/reviews?edited=${reviewId}#your-reviews`);
}
