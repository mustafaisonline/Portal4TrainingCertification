"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withTransaction } from "@/db/prisma";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { zonedLocalToInstant } from "@/modules/certificates/dates";
import { authorise, getCurrentUser } from "@/modules/identity/session";
import { CommerceError, PaymentsNotConfiguredError } from "./errors";
import { validateInterestForm, type InterestFormField } from "./interest-rules";
import { createInterestSetting, InterestSettingValidationError, markInterestsNotified } from "./interest.repository";
import { startInterestRegistration } from "./interest.service";
import { COMMERCE_MESSAGES, PAYMENTS_NOT_CONFIGURED_MESSAGE } from "./messages";

/*
 * "Register your interest" server actions (CR-2026-10-01-2138):
 *  - the person's form → validated here, then the service records it and sends
 *    a card payer to Stripe (every failure is a sentence on the form);
 *  - the administrator's fee setting (Admin → Orders → Interest fee);
 *  - the Trainer's / administrator's "Mark as notified" on the Users Interest tab.
 */

export type RegisterInterestState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<InterestFormField, string>> }
  | { status: "registered"; message: string };

export async function registerInterestAction(_prev: RegisterInterestState, formData: FormData): Promise<RegisterInterestState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };
  const formatId = String(formData.get("formatId") ?? "").trim();
  const parsed = validateInterestForm({
    email: String(formData.get("email") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    consent: formData.get("consent") === "on",
  });
  if (!parsed.ok) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: parsed.fieldErrors };

  let result;
  try {
    result = await startInterestRegistration({ userId: user.id, formatId, form: parsed.values });
  } catch (err) {
    if (err instanceof CommerceError) return { status: "error", message: COMMERCE_MESSAGES[err.code] };
    if (err instanceof PaymentsNotConfiguredError) {
      console.error("[commerce] interest payment attempted while payments are not configured:", err.message);
      return { status: "error", message: PAYMENTS_NOT_CONFIGURED_MESSAGE };
    }
    console.error(`[commerce] interest registration failed for user ${user.id}, format ${formatId}`, err);
    return { status: "error", message: "We could not start the registration. Nothing has been charged — please try again." };
  }
  revalidatePath("/account/trainings");
  if (result.kind === "registered") return { status: "registered", message: "Your interest is registered — no fee applies to you. The trainer will email you when this format is scheduled." };
  redirect(result.url);
}

export type InterestSettingState = { status: "idle" } | { status: "error"; message: string; fieldErrors?: Record<string, string> } | { status: "done"; message: string };

function parseMinor(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export async function changeInterestSettingAction(_prev: InterestSettingState, formData: FormData): Promise<InterestSettingState> {
  const result = await authorise("platform_admin");
  if (!result.ok) return { status: "error", message: result.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to change this setting." };
  const now = new Date();
  const amountMinor = parseMinor(String(formData.get("amount") ?? "").trim());
  const effectiveRaw = String(formData.get("effectiveFrom") ?? "").trim();
  const effectiveFrom = effectiveRaw ? (zonedLocalToInstant(effectiveRaw) ?? new Date(Number.NaN)) : now;
  if (amountMinor === null) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { amountMinor: "Enter an amount with up to two decimals, e.g. 2.00." } };
  const input = { enabled: formData.get("enabled") === "on", amountMinor, currency: String(formData.get("currency") ?? "").trim(), label: String(formData.get("label") ?? "").trim(), effectiveFrom, note: String(formData.get("note") ?? "").trim() || null };
  try {
    const saved = await withTransaction((tx) => createInterestSetting(tx, input, result.user.id, now));
    revalidatePath("/admin/orders/interest");
    revalidatePath("/admin/orders");
    revalidatePath("/programs", "layout");
    return { status: "done", message: `${saved.enabled ? "Enabled" : "Disabled"} — ${saved.label}, ${saved.currency} ${(saved.amountMinor / 100).toFixed(2)}, from ${saved.effectiveFrom.toISOString()}.` };
  } catch (err) {
    if (err instanceof InterestSettingValidationError) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: err.fieldErrors };
    console.error("[commerce] interest fee setting change failed", err);
    return { status: "error", message: "We could not save the setting. Please try again." };
  }
}

export type NotifiedState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

/** "Mark as notified" — only the rows of trainings the caller manages are touched (the scope is applied in the repository, not trusted from the form). */
export async function markNotifiedAction(_prev: NotifiedState, formData: FormData): Promise<NotifiedState> {
  const access = await trainingAccess();
  if (!access.ok) return { status: "error", message: access.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to do this." };
  const ids = formData.getAll("id").map(String);
  if (ids.length === 0) return { status: "error", message: "Tick at least one person first." };
  try {
    const changed = await withTransaction((tx) => markInterestsNotified(tx, access.scope, ids, access.user.id));
    revalidatePath("/admin/interest");
    revalidatePath("/admin/formats");
    revalidatePath("/account/trainings");
    return { status: "done", message: changed === 0 ? "Nothing to change — they were already marked as notified." : `Marked ${changed} ${changed === 1 ? "person" : "people"} as notified.` };
  } catch (err) {
    console.error("[commerce] mark interest notified failed", err);
    return { status: "error", message: "We could not save that. Please try again." };
  }
}
