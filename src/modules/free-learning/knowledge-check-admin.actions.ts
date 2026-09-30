"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { authorise } from "@/modules/identity/session";
import { KnowledgeCheckError, revokeKnowledgeCheck } from "./knowledge-check.repository";

/*
 * Administrator action on a Free Assessment Check certificate (Milestone 15,
 * Requirement 3). Authorises `platform_admin` FIRST — the admin layout gates
 * the page, but an action is its own HTTP endpoint and must gate itself
 * (ADR-020) — then revokes in one transaction with its audit row. The
 * Assessment Check ID and the reason are the only values a form supplies.
 */

export type RevokeKnowledgeCheckState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "done"; message: string };

export async function revokeKnowledgeCheckAction(_prev: RevokeKnowledgeCheckState, formData: FormData): Promise<RevokeKnowledgeCheckState> {
  const gate = await authorise("platform_admin");
  if (!gate.ok) {
    return { status: "error", message: gate.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to manage certificates." };
  }
  const publicId = String(formData.get("publicId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "");
  try {
    const done = await withTransaction((tx) => revokeKnowledgeCheck(tx, { publicId, adminUserId: gate.user.id, reason }));
    revalidatePath("/verify", "layout");
    revalidatePath("/admin/free-learning/results");
    revalidatePath("/account/certifications");
    return { status: "done", message: `Certificate of Achievement ${done.publicId} revoked.` };
  } catch (err) {
    if (err instanceof KnowledgeCheckError) {
      if (err.reason === "invalid_reason") return { status: "error", message: "Please check the highlighted field.", fieldErrors: { reason: "Give a reason of 3 to 500 characters." } };
      if (err.reason === "already_revoked") return { status: "error", message: "This certificate is already revoked." };
      if (err.reason === "not_passed") return { status: "error", message: "This result did not pass, so there is no certificate to revoke." };
      if (err.reason === "not_found") return { status: "error", message: "This Free Assessment Check result could not be found." };
    }
    console.error(`[knowledge-check] revoke failed for ${publicId}`, err);
    return { status: "error", message: "We could not revoke the certificate. Please try again." };
  }
}
