"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { authorise } from "@/modules/identity/session";
import { isReviewId } from "./constants";
import { hideReview, moderateReview, restoreReview, ReviewConsentError, ReviewNotFoundError } from "./repository";

/*
 * Admin moderation actions (requirements §7.4). Each one authorises
 * `platform_admin` FIRST — the admin layout gates the pages, but an action is
 * its own HTTP endpoint and must gate itself (ADR-020) — then writes through
 * the repository in one transaction with the audit row.
 */

export type AdminReviewActionState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

async function refuseUnlessAdmin(): Promise<AdminReviewActionState | { userId: string }> {
  const result = await authorise("platform_admin");
  if (!result.ok) {
    return {
      status: "error",
      message: result.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to moderate reviews.",
    };
  }
  return { userId: result.user.id };
}

function revalidate() {
  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/account", "layout");
}

function idFrom(formData: FormData): string | null {
  const id = String(formData.get("reviewId") ?? "").trim();
  return isReviewId(id) ? id : null;
}

function failure(err: unknown, verb: string): AdminReviewActionState {
  if (err instanceof ReviewNotFoundError) return { status: "error", message: "This review could not be found." };
  if (err instanceof ReviewConsentError) return { status: "error", message: "The learner asked to keep this private; it cannot be restored." };
  console.error(`[reviews] ${verb} failed`, err);
  return { status: "error", message: `We could not ${verb} the review. Please try again.` };
}

export async function moderateReviewAction(_prev: AdminReviewActionState, formData: FormData): Promise<AdminReviewActionState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const id = idFrom(formData);
  if (!id) return { status: "error", message: "This review could not be found." };
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected") return { status: "error", message: "Choose approve or reject." };
  const note = String(formData.get("note") ?? "").trim() || null;
  try {
    await withTransaction((tx) => moderateReview(tx, id, gate.userId, { status: decision, note }));
    revalidate();
    return { status: "done", message: decision === "approved" ? "Approved." : "Rejected." };
  } catch (err) {
    return failure(err, "moderate");
  }
}

export async function hideReviewAction(_prev: AdminReviewActionState, formData: FormData): Promise<AdminReviewActionState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const id = idFrom(formData);
  if (!id) return { status: "error", message: "This review could not be found." };
  try {
    await withTransaction((tx) => hideReview(tx, id, gate.userId));
    revalidate();
    return { status: "done", message: "Hidden from the public page." };
  } catch (err) {
    return failure(err, "hide");
  }
}

export async function restoreReviewAction(_prev: AdminReviewActionState, formData: FormData): Promise<AdminReviewActionState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const id = idFrom(formData);
  if (!id) return { status: "error", message: "This review could not be found." };
  try {
    await withTransaction((tx) => restoreReview(tx, id, gate.userId));
    revalidate();
    return { status: "done", message: "Restored." };
  } catch (err) {
    return failure(err, "restore");
  }
}
