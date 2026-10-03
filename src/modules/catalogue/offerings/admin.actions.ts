"use server";

import { revalidatePath } from "next/cache";
import { getPrisma, withTransaction } from "@/db/prisma";
import { emailAdminsDateScheduled } from "@/modules/catalogue/programmes/admin-emails";
import { notifyAdmins } from "@/modules/notifications/notifications.service";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { canManageTraining, type TrainingScope } from "@/modules/catalogue/programmes/admin.repository";
import {
  createOffering,
  DEFAULT_TIMEZONE,
  DELIVERY_MODALITIES,
  findOfferingById,
  isUuid,
  OFFERING_STATUSES,
  OfferingValidationError,
  updateOffering,
  type DeliveryModality,
  type OfferingFieldErrors,
  type OfferingStatus,
  type OfferingWriteInput,
} from "./repository";

/*
 * Admin offerings — the create / edit form's server actions (M4 plan §2 item
 * 2). Each one authorises `platform_admin` FIRST (the admin layout gates the
 * pages, but an action is its own HTTP endpoint and must gate itself — ADR-020),
 * parses the form into a typed `OfferingWriteInput`, and writes through the
 * repository inside one transaction with the audit row. Field errors come
 * from the repository's validation so the rules live in exactly one place.
 */

export type OfferingFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: OfferingFieldErrors }
  | { status: "saved"; id: string };

const CHECK_FIELDS = "Please check the highlighted fields.";

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function textOrNull(formData: FormData, name: string): string | null {
  return text(formData, name) || null;
}

/** Form strings → typed input. Enum and number parsing errors are reported as
 *  field errors here; everything else is the repository's job. */
function parseForm(formData: FormData): { input: OfferingWriteInput; fieldErrors: OfferingFieldErrors } {
  const fieldErrors: OfferingFieldErrors = {};

  const modalityRaw = text(formData, "modality");
  const modality = (DELIVERY_MODALITIES as readonly string[]).includes(modalityRaw) ? (modalityRaw as DeliveryModality) : null;
  if (!modality) fieldErrors.modality = "Choose how this offering is delivered.";

  const statusRaw = text(formData, "status");
  const status = (OFFERING_STATUSES as readonly string[]).includes(statusRaw) ? (statusRaw as OfferingStatus) : null;
  if (!status) fieldErrors.status = "Choose a status.";

  const capacityRaw = text(formData, "capacity");
  let capacity: number | null = null;
  if (capacityRaw) {
    capacity = /^\d+$/.test(capacityRaw) ? Number(capacityRaw) : Number.NaN;
    if (Number.isNaN(capacity)) fieldErrors.capacity = "Capacity must be a whole number, or left blank.";
  }

  return {
    fieldErrors,
    input: {
      programmeId: text(formData, "programmeId"),
      deliveryFormatId: textOrNull(formData, "deliveryFormatId"),
      modality: modality ?? "live_online",
      location: textOrNull(formData, "location"),
      timezone: text(formData, "timezone") || DEFAULT_TIMEZONE,
      startsOn: text(formData, "startsOn"),
      endsOn: text(formData, "endsOn"),
      capacity: Number.isNaN(capacity) ? null : capacity,
      status: status ?? "planned",
      scheduleNote: textOrNull(formData, "scheduleNote"),
      leadExpertId: textOrNull(formData, "leadExpertId"),
    },
  };
}

/* Milestone 12 (L7): an administrator may schedule any training; a Trainer
   only the trainings linked to their profile. The scope is re-checked on the
   programme of the offering being written, never taken from the form. */
async function refuseUnlessAllowed(): Promise<OfferingFormState | { userId: string; scope: TrainingScope; isAdmin: boolean }> {
  const access = await trainingAccess();
  if (!access.ok) {
    return {
      status: "error",
      message:
        access.reason === "signed-out"
          ? "Your session has ended. Please sign in again."
          : "You do not have permission to manage offerings.",
      fieldErrors: {},
    };
  }
  return { userId: access.user.id, scope: access.scope, isAdmin: access.isAdmin };
}

const NOT_YOURS: OfferingFormState = { status: "error", message: "You can only schedule dates for your own trainings.", fieldErrors: { programmeId: "Choose one of your trainings." } };

function revalidate() {
  revalidatePath("/admin/offerings");
  revalidatePath("/admin/trainings");
  revalidatePath("/admin");
  revalidatePath("/schedule");
  revalidatePath("/programs");
}

export async function createOfferingAction(_prev: OfferingFormState, formData: FormData): Promise<OfferingFormState> {
  const gate = await refuseUnlessAllowed();
  if ("status" in gate) return gate;

  // A Trainer's form does not send a status (the field is read-only for them): the server decides it.
  if (!gate.isAdmin) formData.set("status", "pending_review");
  const { input, fieldErrors } = parseForm(formData);
  if (Object.keys(fieldErrors).length) return { status: "error", message: CHECK_FIELDS, fieldErrors };
  if (!(await canManageTraining(getPrisma(), gate.scope, input.programmeId))) return NOT_YOURS;

  // CR-2026-10-03-2254 (founder: "Admin should login and give approval"): a Trainer's date is always saved as WAITING
  // FOR APPROVAL (`pending_review`) — hidden from the public schedule until an administrator sets it to planned or open.
  if (!gate.isAdmin) input.status = "pending_review";

  try {
    const created = await withTransaction((tx) => createOffering(tx, input, gate.userId));
    if (!gate.isAdmin) {
      // Tell the administrators (bell), never able to fail the save.
      const o = await findOfferingById(created.id).catch(() => null);
      void notifyAdmins({
        kind: "system",
        title: `A trainer scheduled a date${o?.programmeTitle ? ` for ${o.programmeTitle}` : ""}`,
        body: "It is waiting for your approval and is hidden from the public. Approve it by setting it to Planned or Open.",
        link: `/admin/offerings/${created.id}`,
        // One notice per training per hour, so scheduling several dates in a row does not flood the bell.
        dedupeKey: `offering-created:${input.programmeId}:${Math.floor(Date.now() / 3_600_000)}`,
      }).catch((err) => console.error("[offerings] admin notice failed", err instanceof Error ? err.message : err));
      // Founder, 2026-10-04: and an email to each administrator, to sign in and approve.
      void emailAdminsDateScheduled({ programmeId: input.programmeId, offeringId: created.id, programmeTitle: o?.programmeTitle ?? null, startsOn: input.startsOn }).catch((err) => console.error("[offerings] admin email failed", err instanceof Error ? err.message : err));
    }
    revalidate();
    return { status: "saved", id: created.id };
  } catch (err) {
    if (err instanceof OfferingValidationError) return { status: "error", message: CHECK_FIELDS, fieldErrors: err.fieldErrors };
    console.error("[offerings] create failed", err);
    return { status: "error", message: "We could not save the offering. Please try again.", fieldErrors: {} };
  }
}

export async function updateOfferingAction(_prev: OfferingFormState, formData: FormData): Promise<OfferingFormState> {
  const gate = await refuseUnlessAllowed();
  if ("status" in gate) return gate;

  const id = text(formData, "id");
  if (!isUuid(id)) return { status: "error", message: "This offering could not be found.", fieldErrors: {} };

  if (!gate.isAdmin) formData.set("status", "planned"); // placeholder so the form parses; replaced by the current status below
  const { input, fieldErrors } = parseForm(formData);
  if (Object.keys(fieldErrors).length) return { status: "error", message: CHECK_FIELDS, fieldErrors };
  // Both the offering's current training and the one it is being moved to
  // must be in scope — a Trainer cannot take over or give away a date.
  const existing = await findOfferingById(id);
  if (!existing) return { status: "error", message: "This offering could not be found.", fieldErrors: {} };
  if (!(await canManageTraining(getPrisma(), gate.scope, existing.programmeId)) || !(await canManageTraining(getPrisma(), gate.scope, input.programmeId))) return NOT_YOURS;

  // A Trainer cannot change a date's status (planned / open / full / completed / cancelled) — an administrator does.
  if (!gate.isAdmin) {
    input.status = existing.status;
    // An approved date cannot be carried by a Trainer to another training (it would land public, unreviewed).
    if (existing.status !== "pending_review" && input.programmeId !== existing.programmeId) return { status: "error", message: "Only an administrator can move a date that is already open to another training.", fieldErrors: { programmeId: "Ask an administrator to move this date." } };
  }

  try {
    const updated = await withTransaction((tx) => updateOffering(tx, id, input, gate.userId));
    if (!updated) return { status: "error", message: "This offering could not be found.", fieldErrors: {} };
    revalidate();
    return { status: "saved", id: updated.id };
  } catch (err) {
    if (err instanceof OfferingValidationError) return { status: "error", message: CHECK_FIELDS, fieldErrors: err.fieldErrors };
    console.error("[offerings] update failed", err);
    return { status: "error", message: "We could not save your changes. Please try again.", fieldErrors: {} };
  }
}

export type DeleteOfferingResult = { status: "idle" } | { status: "deleted" } | { status: "error"; message: string };

/** Founder, 2026-09-28: delete a date nothing references — platform
 *  administrators only. A date with orders, registrations or certificates
 *  is a record; cancel it instead. */
export async function deleteOfferingAction(_prev: DeleteOfferingResult, formData: FormData): Promise<DeleteOfferingResult> {
  const { authorise } = await import("@/modules/identity/session");
  const adminGate = await authorise("platform_admin");
  if (!adminGate.ok) return { status: "error", message: "Only a platform administrator can delete a date." };
  const id = text(formData, "id");
  if (!isUuid(id)) return { status: "error", message: "This offering could not be found." };
  let outcome: "deleted" | "not_found" | "in_use";
  try {
    const { deleteOffering } = await import("./repository");
    outcome = await withTransaction((tx) => deleteOffering(tx, id, adminGate.user.id));
  } catch (err) {
    console.error(`[offerings] deletion failed for ${id}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The date could not be deleted. Please try again." };
  }
  if (outcome === "not_found") return { status: "error", message: "This offering could not be found." };
  if (outcome === "in_use") return { status: "error", message: "This date has orders, registrations or certificates — those are records. Cancel the date instead of deleting it." };
  revalidate();
  return { status: "deleted" };
}
