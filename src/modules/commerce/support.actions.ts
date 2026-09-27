"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withTransaction } from "@/db/prisma";
import { zonedLocalToInstant } from "@/modules/certificates/dates";
import { authorise, getCurrentUser } from "@/modules/identity/session";
import { CommerceError, PaymentsNotConfiguredError } from "./errors";
import { COMMERCE_MESSAGES, PAYMENTS_NOT_CONFIGURED_MESSAGE } from "./messages";
import { createSupportSetting, SupportSettingValidationError } from "./support.repository";
import { startSupportCheckout } from "./support.service";

/*
 * "Support the Academy" (2026-09-27, decisions M1–M5): two server actions.
 *   beginSupportPaymentAction — the /support page's Pay button: signed-in
 *     only, no profile gate (M4); creates the pending order and redirects
 *     to Stripe's hosted page. Every failure is a sentence on the form.
 *   changeSupportSettingAction — Admin → Orders → Support payment (M5):
 *     appends an effective-dated setting (on/off, amount, currency, label).
 */

export type SupportPayState = { status: "idle" } | { status: "error"; message: string };

export async function beginSupportPaymentAction(_prev: SupportPayState, _formData: FormData): Promise<SupportPayState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };
  let url: string;
  try {
    ({ url } = await startSupportCheckout({ userId: user.id }));
  } catch (err) {
    if (err instanceof CommerceError) return { status: "error", message: COMMERCE_MESSAGES[err.code] };
    if (err instanceof PaymentsNotConfiguredError) {
      console.error("[commerce] support payment attempted while payments are not configured:", err.message);
      return { status: "error", message: PAYMENTS_NOT_CONFIGURED_MESSAGE };
    }
    console.error(`[commerce] support payment failed for user ${user.id}`, err);
    return { status: "error", message: "We could not start the payment. Nothing has been charged — please try again." };
  }
  redirect(url);
}

export type SupportSettingState = { status: "idle" } | { status: "error"; message: string; fieldErrors?: Record<string, string> } | { status: "done"; message: string };

/** "12.50" → 1250; null when not a money amount with up to two decimals. */
function parseMinor(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export async function changeSupportSettingAction(_prev: SupportSettingState, formData: FormData): Promise<SupportSettingState> {
  const result = await authorise("platform_admin");
  if (!result.ok) return { status: "error", message: result.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to change this setting." };
  const now = new Date();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amountMinor = parseMinor(amountRaw);
  const effectiveRaw = String(formData.get("effectiveFrom") ?? "").trim();
  const effectiveFrom = effectiveRaw ? (zonedLocalToInstant(effectiveRaw) ?? new Date(Number.NaN)) : now;
  const input = {
    enabled: formData.get("enabled") === "on",
    amountMinor: amountMinor ?? -1,
    currency: String(formData.get("currency") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    effectiveFrom,
    note: String(formData.get("note") ?? "").trim() || null,
  };
  if (amountMinor === null) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { amountMinor: "Enter an amount with up to two decimals, e.g. 2.00." } };
  try {
    const saved = await withTransaction((tx) => createSupportSetting(tx, input, result.user.id, now));
    revalidatePath("/admin/orders/support");
    revalidatePath("/admin/orders");
    revalidatePath("/support");
    revalidatePath("/account");
    revalidatePath("/programs");
    return { status: "done", message: `${saved.enabled ? "Enabled" : "Disabled"} — ${saved.label}, ${saved.currency} ${(saved.amountMinor / 100).toFixed(2)}, from ${saved.effectiveFrom.toISOString()}.` };
  } catch (err) {
    if (err instanceof SupportSettingValidationError) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: err.fieldErrors };
    console.error("[commerce] support setting change failed", err);
    return { status: "error", message: "We could not save the setting. Please try again." };
  }
}
