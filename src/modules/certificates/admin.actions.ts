"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { authorise } from "@/modules/identity/session";
import { isIsoDate, zonedLocalToInstant } from "./dates";
import { createFeeSetting, FEE_DEFAULT_CURRENCY } from "./fee.repository";
import { recordCompletion } from "./issuance.service";
import { CertificateNotFoundError, CertificateStateError, CertificateValidationError, correctHolderName, revokeCertificate } from "./repository";

/*
 * Administrator actions (M6 plan §5 "Admin"). Each one authorises
 * `platform_admin` FIRST — the admin layout gates the pages, but an action
 * is its own HTTP endpoint and must gate itself (ADR-020) — then writes
 * through the service / repository in one transaction with the audit row.
 * The recorded completion date, the revocation reason and the fee are the
 * ONLY values a form supplies; everything else is read from our rows.
 */

export type AdminCertificateActionState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "done"; message: string; certificateId?: string };

async function refuseUnlessAdmin(): Promise<AdminCertificateActionState | { userId: string }> {
  const result = await authorise("platform_admin");
  if (!result.ok) {
    return {
      status: "error",
      message: result.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to manage certificates.",
    };
  }
  return { userId: result.user.id };
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function revalidateCertificate(offeringId?: string) {
  revalidatePath("/verify", "layout");
  revalidatePath("/account/certificate");
  revalidatePath("/account", "layout");
  revalidatePath("/admin/certificates", "layout");
  revalidatePath("/admin");
  if (offeringId) revalidatePath(`/admin/offerings/${offeringId}/participants`);
}

const COMPLETION_REFUSALS: Record<string, string> = {
  registration_not_found: "This registration could not be found.",
  registration_not_confirmed: "Only a confirmed registration can be marked as completed.",
  offering_not_ended: "Completion can be recorded from the day after the offering ends.",
  completed_on_out_of_range: "The completion date must be between the offering's first day and today.",
  profile_incomplete: "This participant has not entered their legal name on their profile yet, so the certificate cannot name them. Ask them to complete their profile first.",
  id_generation_failed: "A unique certificate ID could not be generated. Please try again.",
};

/** Fields: `registrationId` (uuid), `completedOn` (YYYY-MM-DD). */
export async function recordCompletionAction(_prev: AdminCertificateActionState, formData: FormData): Promise<AdminCertificateActionState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const registrationId = text(formData, "registrationId");
  const completedOn = text(formData, "completedOn");
  if (!isUuid(registrationId)) return { status: "error", message: COMPLETION_REFUSALS["registration_not_found"]! };
  if (!isIsoDate(completedOn)) return { status: "error", message: "Enter the completion date.", fieldErrors: { completedOn: "Enter a date as YYYY-MM-DD." } };
  try {
    const { certificate, created } = await recordCompletion({ registrationId, completedOn, adminUserId: gate.userId });
    revalidateCertificate(certificate.offeringId);
    return {
      status: "done",
      certificateId: certificate.id,
      message: created ? `Completion recorded. Certificate ${certificate.certificateId} issued.` : `Certificate ${certificate.certificateId} was already issued for this registration.`,
    };
  } catch (err) {
    if (err instanceof CertificateStateError) {
      const message = COMPLETION_REFUSALS[err.code] ?? "Completion could not be recorded.";
      return err.code === "completed_on_out_of_range" ? { status: "error", message, fieldErrors: { completedOn: message } } : { status: "error", message };
    }
    console.error(`[certificates] record completion failed for registration ${registrationId}`, err);
    return { status: "error", message: "We could not record the completion. Please try again." };
  }
}

/** Fields: `certificateId` (row uuid), `reason` (3–500 characters). */
export async function revokeCertificateAction(_prev: AdminCertificateActionState, formData: FormData): Promise<AdminCertificateActionState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const id = text(formData, "certificateId");
  if (!isUuid(id)) return { status: "error", message: "This certificate could not be found." };
  const reason = String(formData.get("reason") ?? "");
  try {
    const certificate = await withTransaction((tx) => revokeCertificate(tx, id, gate.userId, reason));
    revalidateCertificate(certificate.offeringId);
    return { status: "done", certificateId: certificate.id, message: `Certificate ${certificate.certificateId} revoked.` };
  } catch (err) {
    if (err instanceof CertificateValidationError) return { status: "error", message: "Please check the highlighted field.", fieldErrors: err.fieldErrors };
    if (err instanceof CertificateNotFoundError) return { status: "error", message: "This certificate could not be found." };
    if (err instanceof CertificateStateError && err.code === "already_revoked") return { status: "error", message: "This certificate is already revoked." };
    console.error(`[certificates] revoke failed for certificate ${id}`, err);
    return { status: "error", message: "We could not revoke the certificate. Please try again." };
  }
}

/** Fields: `certificateId` (row uuid), `holderName`. */
export async function correctHolderNameAction(_prev: AdminCertificateActionState, formData: FormData): Promise<AdminCertificateActionState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const id = text(formData, "certificateId");
  if (!isUuid(id)) return { status: "error", message: "This certificate could not be found." };
  const holderName = String(formData.get("holderName") ?? "");
  try {
    const certificate = await withTransaction((tx) => correctHolderName(tx, id, gate.userId, holderName));
    revalidateCertificate(certificate.offeringId);
    return { status: "done", certificateId: certificate.id, message: `Holder name saved: ${certificate.holderName}.` };
  } catch (err) {
    if (err instanceof CertificateValidationError) return { status: "error", message: "Please check the highlighted field.", fieldErrors: err.fieldErrors };
    if (err instanceof CertificateNotFoundError) return { status: "error", message: "This certificate could not be found." };
    console.error(`[certificates] name correction failed for certificate ${id}`, err);
    return { status: "error", message: "We could not save the name. Please try again." };
  }
}

/** "10.00" | "10" | "10,50" → 1050; null when not a money amount with ≤ 2 decimals. */
function parseMoneyToMinor(value: string): number | null {
  const m = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(value.replace(/\s/g, ""));
  if (!m) return null;
  const cents = (m[2] ?? "").padEnd(2, "0");
  return Number(m[1]) * 100 + Number(cents);
}

/**
 * Fields: `amount` (decimal string, e.g. "10.00"), `currency` (3 letters,
 * default USD), `effectiveFrom` (datetime-local value, read in
 * Asia/Kuala_Lumpur, or an ISO instant; blank = now), `note` (optional).
 */
export async function changeFeeAction(_prev: AdminCertificateActionState, formData: FormData): Promise<AdminCertificateActionState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const fieldErrors: Record<string, string> = {};
  const amountMinor = parseMoneyToMinor(text(formData, "amount"));
  if (amountMinor === null) fieldErrors["amountMinor"] = "Enter the amount as a number with up to two decimals, e.g. 10.00.";
  const currency = (text(formData, "currency") || FEE_DEFAULT_CURRENCY).toUpperCase();
  const effectiveRaw = text(formData, "effectiveFrom");
  const effectiveFrom = effectiveRaw ? zonedLocalToInstant(effectiveRaw) : new Date();
  if (!effectiveFrom) fieldErrors["effectiveFrom"] = "Enter the date and time the fee takes effect.";
  if (Object.keys(fieldErrors).length) return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  const note = text(formData, "note") || null;
  try {
    const setting = await withTransaction((tx) => createFeeSetting(tx, { amountMinor: amountMinor!, currency, effectiveFrom: effectiveFrom!, note }, gate.userId));
    revalidateCertificate();
    return { status: "done", message: `Renewal fee set to ${setting.currency} ${(setting.amountMinor / 100).toFixed(2)} from ${setting.effectiveFrom.toISOString()}.` };
  } catch (err) {
    if (err instanceof CertificateValidationError) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: err.fieldErrors };
    console.error("[certificates] fee change failed", err);
    return { status: "error", message: "We could not save the fee. Please try again." };
  }
}
