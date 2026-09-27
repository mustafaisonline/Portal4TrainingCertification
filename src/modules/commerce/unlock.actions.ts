"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withTransaction } from "@/db/prisma";
import { zonedLocalToInstant } from "@/modules/certificates/dates";
import { authorise, getCurrentUser } from "@/modules/identity/session";
import { CommerceError, PaymentsNotConfiguredError } from "./errors";
import { COMMERCE_MESSAGES, PAYMENTS_NOT_CONFIGURED_MESSAGE } from "./messages";
import { createUnlockSetting, UnlockSettingValidationError } from "./unlock.repository";
import { startUnlockCheckout } from "./unlock.service";

/*
 * Knowledge Check unlock (Milestone 14 Phase 5): the result page's Pay
 * button (signed-in; only the attempt's owner; creates the pending order and
 * redirects to Stripe — every failure is a sentence on the form) and the
 * administrator's setting change (Admin → Orders → Unlock fee).
 */

export type UnlockPayState = { status: "idle" } | { status: "error"; message: string };

export async function beginUnlockPaymentAction(_prev: UnlockPayState, formData: FormData): Promise<UnlockPayState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };
  const attemptId = String(formData.get("attemptId") ?? "").trim();
  let url: string;
  try {
    ({ url } = await startUnlockCheckout({ userId: user.id, attemptId }));
  } catch (err) {
    if (err instanceof CommerceError) return { status: "error", message: COMMERCE_MESSAGES[err.code] };
    if (err instanceof PaymentsNotConfiguredError) {
      console.error("[commerce] unlock payment attempted while payments are not configured:", err.message);
      return { status: "error", message: PAYMENTS_NOT_CONFIGURED_MESSAGE };
    }
    console.error(`[commerce] unlock payment failed for user ${user.id}, attempt ${attemptId}`, err);
    return { status: "error", message: "We could not start the payment. Nothing has been charged — please try again." };
  }
  redirect(url);
}

export type UnlockSettingState = { status: "idle" } | { status: "error"; message: string; fieldErrors?: Record<string, string> } | { status: "done"; message: string };

function parseMinor(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export async function changeUnlockSettingAction(_prev: UnlockSettingState, formData: FormData): Promise<UnlockSettingState> {
  const result = await authorise("platform_admin");
  if (!result.ok) return { status: "error", message: result.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to change this setting." };
  const now = new Date();
  const amountMinor = parseMinor(String(formData.get("amount") ?? "").trim());
  const effectiveRaw = String(formData.get("effectiveFrom") ?? "").trim();
  const effectiveFrom = effectiveRaw ? (zonedLocalToInstant(effectiveRaw) ?? new Date(Number.NaN)) : now;
  if (amountMinor === null) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { amountMinor: "Enter an amount with up to two decimals, e.g. 10.00." } };
  const input = { enabled: formData.get("enabled") === "on", amountMinor, currency: String(formData.get("currency") ?? "").trim(), label: String(formData.get("label") ?? "").trim(), effectiveFrom, note: String(formData.get("note") ?? "").trim() || null };
  try {
    const saved = await withTransaction((tx) => createUnlockSetting(tx, input, result.user.id, now));
    revalidatePath("/admin/orders/unlock");
    revalidatePath("/admin/orders");
    revalidatePath("/free-learning", "layout");
    return { status: "done", message: `${saved.enabled ? "Enabled" : "Disabled"} — ${saved.label}, ${saved.currency} ${(saved.amountMinor / 100).toFixed(2)}, from ${saved.effectiveFrom.toISOString()}.` };
  } catch (err) {
    if (err instanceof UnlockSettingValidationError) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: err.fieldErrors };
    console.error("[commerce] unlock setting change failed", err);
    return { status: "error", message: "We could not save the setting. Please try again." };
  }
}
