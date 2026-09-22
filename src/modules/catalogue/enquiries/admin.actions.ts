"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { authorise } from "@/modules/identity/session";
import { EnquiryNotFoundError, isEnquiryStatus, setEnquiryStatus } from "./admin.repository";

/*
 * Enquiry status action (Milestone 8 plan §2 item 3): Mark replied · Close ·
 * Reopen are one action with a `status` field. It authorises
 * `platform_admin` FIRST — the admin layout gates the pages, but an action is
 * its own HTTP endpoint (ADR-020) — then writes through the repository in one
 * transaction with the audit row.
 */

export type EnquiryActionState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

const DONE_MESSAGE = { new: "Reopened.", replied: "Marked as replied.", closed: "Closed." } as const;

export async function setEnquiryStatusAction(_prev: EnquiryActionState, formData: FormData): Promise<EnquiryActionState> {
  const gate = await authorise("platform_admin");
  if (!gate.ok) {
    return {
      status: "error",
      message: gate.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to manage enquiries.",
    };
  }
  const id = String(formData.get("enquiryId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!isEnquiryStatus(status)) return { status: "error", message: "Choose replied, closed or new." };
  try {
    await withTransaction((tx) => setEnquiryStatus(tx, id, gate.user.id, status));
    revalidatePath("/admin/enquiries");
    revalidatePath(`/admin/enquiries/${id}`);
    revalidatePath("/admin");
    return { status: "done", message: DONE_MESSAGE[status] };
  } catch (err) {
    if (err instanceof EnquiryNotFoundError) return { status: "error", message: "This enquiry could not be found." };
    console.error("[enquiries] status change failed", err);
    return { status: "error", message: "We could not update the enquiry. Please try again." };
  }
}
