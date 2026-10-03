"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { authorise } from "@/modules/identity/session";
import { writeAudit } from "@/modules/platform/audit/repository";
import { retryFailedEmail } from "./outbox.service";
import { addSuppression, removeSuppression, SUPPRESSION_REASON_MAX } from "./suppression";

/*
 * Admin → Email actions (CR-2026-10-03-1225 slice 2): retry a failed email, add/remove an address on the do-not-send
 * list. Each authorises `platform_admin` FIRST (an action is its own HTTP endpoint, ADR-020) and leaves an audit row.
 */

export type EmailActionState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The action has already happened (mail retried, list changed): a failed audit write is logged loudly, never reported as a failed action. */
async function auditQuietly(entry: Parameters<typeof writeAudit>[1]): Promise<void> {
  try {
    await withTransaction((tx) => writeAudit(tx, entry));
  } catch (err) {
    console.error(`[email] audit row "${entry.action}" could not be written:`, err instanceof Error ? err.message : "unknown error");
  }
}

async function adminOnly(): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  const gate = await authorise("platform_admin");
  if (gate.ok) return { ok: true, userId: gate.user.id };
  return { ok: false, message: gate.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to manage email." };
}

export async function retryEmailAction(_prev: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const gate = await adminOnly();
  if (!gate.ok) return { status: "error", message: gate.message };
  const id = String(formData.get("emailId") ?? "").trim();
  if (!UUID_RE.test(id)) return { status: "error", message: "This email could not be found." };
  try {
    const result = await retryFailedEmail(id);
    if (!result.ok) return { status: "error", message: result.message };
    await auditQuietly({ actorUserId: gate.userId, action: "email.retried", entityType: "outbound_email", entityId: id, after: { status: result.status } });
    revalidatePath("/admin/email");
    if (result.status === "sent") return { status: "done", message: "Sent." };
    if (result.status === "queued") return { status: "done", message: "The mail server did not answer just now; it will be retried automatically." };
    return { status: "error", message: "It failed again — see the reason in the list." };
  } catch (err) {
    console.error("[email] retry failed", err);
    return { status: "error", message: "We could not retry this email. Please try again." };
  }
}

export async function addSuppressionAction(_prev: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const gate = await adminOnly();
  if (!gate.ok) return { status: "error", message: gate.message };
  const email = String(formData.get("email") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length > SUPPRESSION_REASON_MAX) return { status: "error", message: `Keep the reason under ${SUPPRESSION_REASON_MAX} characters.` };
  try {
    const added = await addSuppression(email, reason, gate.userId);
    if (!added) return { status: "error", message: "Enter one plain email address, like name@example.com." };
    if (added.created) await auditQuietly({ actorUserId: gate.userId, action: "email.suppression_added", entityType: "email_suppression", entityId: added.email, after: { reason: reason.slice(0, SUPPRESSION_REASON_MAX) } });
    revalidatePath("/admin/email");
    return { status: "done", message: added.created ? `${added.email} will no longer be sent any email.` : `${added.email} is already on the list.` };
  } catch (err) {
    console.error("[email] suppression add failed", err);
    return { status: "error", message: "We could not update the list. Please try again." };
  }
}

export async function removeSuppressionAction(_prev: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const gate = await adminOnly();
  if (!gate.ok) return { status: "error", message: gate.message };
  const id = String(formData.get("suppressionId") ?? "").trim();
  if (!UUID_RE.test(id)) return { status: "error", message: "This entry could not be found." };
  try {
    const removed = await removeSuppression(id);
    if (!removed) return { status: "error", message: "This entry could not be found." };
    await auditQuietly({ actorUserId: gate.userId, action: "email.suppression_removed", entityType: "email_suppression", entityId: removed.email });
    revalidatePath("/admin/email");
    return { status: "done", message: `${removed.email} was removed; email to it will be sent again.` };
  } catch (err) {
    console.error("[email] suppression remove failed", err);
    return { status: "error", message: "We could not update the list. Please try again." };
  }
}
