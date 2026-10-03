"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { authorise } from "@/modules/identity/session";
import { emailDeliveryProblem, sendEmail } from "@/modules/notifications/email";
import { writeAudit } from "@/modules/platform/audit/repository";
import { EnquiryNotFoundError, getEnquiryForAdmin, isEnquiryStatus, setEnquiryStatus } from "./admin.repository";
import { enquiryReplyMessage } from "./emails";
import { enquiryReference } from "./enquiry-validation";

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

const REPLY_MIN = 5;
const REPLY_MAX = 5000;

/**
 * The team's reply (CR-2026-10-03-1226): sends the answer to the person from
 * Admin → Enquiries through the outbox, and marks the enquiry replied with an
 * audit row — in that order, so a failed send never marks anything replied.
 * Authorises `platform_admin` first (an action is its own HTTP endpoint).
 */
export async function replyToEnquiryAction(_prev: EnquiryActionState, formData: FormData): Promise<EnquiryActionState> {
  const gate = await authorise("platform_admin");
  if (!gate.ok) {
    return { status: "error", message: gate.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to reply to enquiries." };
  }
  const id = String(formData.get("enquiryId") ?? "").trim();
  const body = String(formData.get("reply") ?? "").replace(/\r\n/g, "\n").trim();
  if (body.length < REPLY_MIN) return { status: "error", message: `Write your reply first (at least ${REPLY_MIN} characters).` };
  if (body.length > REPLY_MAX) return { status: "error", message: `Please keep the reply under ${REPLY_MAX} characters.` };
  const enquiry = await getEnquiryForAdmin(id);
  if (!enquiry) return { status: "error", message: "This enquiry could not be found." };
  const problem = emailDeliveryProblem();
  if (problem) return { status: "error", message: `${problem} Nothing was sent and the enquiry was not marked replied.` };

  const sent = await sendEmail(enquiryReplyMessage({ to: enquiry.email, name: enquiry.name, reference: enquiryReference(enquiry.id), body, original: enquiry.message }));
  if (sent.status === "failed") {
    return { status: "error", message: "The email could not be sent just now. It is recorded in the outbox; nothing was marked as replied." };
  }
  try {
    await withTransaction(async (tx) => {
      await setEnquiryStatus(tx, id, gate.user.id, "replied");
      await writeAudit(tx, { actorUserId: gate.user.id, action: "enquiry.replied", entityType: "enquiry", entityId: id, after: { outboundEmailId: sent.id, characters: body.length } });
    });
    revalidatePath("/admin/enquiries");
    revalidatePath(`/admin/enquiries/${id}`);
    revalidatePath("/admin");
    return { status: "done", message: sent.status === "queued" ? `The mail server did not answer just now. The reply to ${enquiry.email} is queued and will be retried automatically.` : `Reply sent to ${enquiry.email}.` };
  } catch (err) {
    console.error("[enquiries] reply was sent but the status could not be saved", err);
    return { status: "error", message: "The reply was sent, but the enquiry could not be marked as replied. Use Mark replied." };
  }
}
