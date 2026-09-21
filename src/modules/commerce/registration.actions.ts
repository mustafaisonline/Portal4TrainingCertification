"use server";

import { revalidatePath } from "next/cache";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { getCurrentUser } from "@/modules/identity/session";
import { CommerceError, PaymentsNotConfiguredError } from "./errors";
import { COMMERCE_MESSAGES, PAYMENTS_NOT_CONFIGURED_MESSAGE } from "./messages";
import { cancelRegistration, transferRegistration } from "./registrations.service";

/*
 * My registrations — "Cancel registration" and "Transfer to another date"
 * (M4 plan §2 item 6). Both take the registration id from the form and the
 * person from the session; ownership is checked by the service. Results are
 * sentences on the screen; the list re-renders from the database.
 */

export type RegistrationActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; message: string };

export async function cancelRegistrationAction(_prev: RegistrationActionState, formData: FormData): Promise<RegistrationActionState> {
  const registrationId = String(formData.get("registrationId") ?? "").trim();
  if (formData.get("confirm") !== "yes") {
    return { status: "error", message: "Please confirm the cancellation." };
  }
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };

  try {
    const result = await cancelRegistration({ registrationId, userId: user.id });
    revalidatePath("/account", "layout");
    const refund =
      result.refundStatus === "none"
        ? "Under the refund policy no refund is due for this cancellation."
        : `A refund of ${formatMoney(result.refundAmountMinor, result.currency)} (${result.refundPercent} %) has been ${result.refundStatus === "succeeded" ? "issued" : "requested"}; banks usually show it within 5–10 working days.`;
    return { status: "done", message: `Your registration has been cancelled. ${refund}` };
  } catch (err) {
    revalidatePath("/account", "layout");
    if (err instanceof CommerceError) return { status: "error", message: COMMERCE_MESSAGES[err.code] };
    if (err instanceof PaymentsNotConfiguredError) {
      console.error("[commerce] refund attempted while payments are not configured:", err.message);
      return { status: "error", message: `${COMMERCE_MESSAGES.refund_failed} (${PAYMENTS_NOT_CONFIGURED_MESSAGE})` };
    }
    console.error(`[commerce] cancellation failed for registration ${registrationId}, user ${user.id}`, err);
    return { status: "error", message: "We could not cancel the registration. Please try again." };
  }
}

export async function transferRegistrationAction(_prev: RegistrationActionState, formData: FormData): Promise<RegistrationActionState> {
  const registrationId = String(formData.get("registrationId") ?? "").trim();
  const targetOfferingId = String(formData.get("targetOfferingId") ?? "").trim();
  if (!targetOfferingId) return { status: "error", message: "Choose the date to transfer to." };
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };

  try {
    await transferRegistration({ registrationId, targetOfferingId, userId: user.id });
    revalidatePath("/account", "layout");
    return { status: "done", message: "Your registration has been transferred to the new date. This was your one free transfer." };
  } catch (err) {
    if (err instanceof CommerceError) return { status: "error", message: COMMERCE_MESSAGES[err.code] };
    console.error(`[commerce] transfer failed for registration ${registrationId}, user ${user.id}`, err);
    return { status: "error", message: "We could not transfer the registration. Please try again." };
  }
}
