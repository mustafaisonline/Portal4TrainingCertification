"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/identity/session";
import { startCheckout } from "./checkout.service";
import { CommerceError, type CommerceErrorCode, PaymentsNotConfiguredError } from "./errors";
import { COMMERCE_MESSAGES, PAYMENTS_NOT_CONFIGURED_MESSAGE } from "./messages";

/*
 * "Pay with Stripe" — the checkout form's server action (ADR-004). The form
 * sends ONLY the offering id and the consent tick; region, currency and
 * amount are decided server-side (checkout.service.ts). On success the
 * person is redirected to Stripe's hosted page; every failure is a sentence
 * on the form, never a silent fallback.
 */

export type CheckoutFormState =
  | { status: "idle" }
  | { status: "error"; code: CommerceErrorCode | "payments_not_configured" | "signed_out" | "unexpected"; message: string };

export async function beginCheckoutAction(_prev: CheckoutFormState, formData: FormData): Promise<CheckoutFormState> {
  const offeringId = String(formData.get("offeringId") ?? "").trim();
  const consent = formData.get("consent") === "on";

  const user = await getCurrentUser();
  if (!user) return { status: "error", code: "signed_out", message: "Your session has ended. Please sign in again." };

  let url: string;
  try {
    ({ url } = await startCheckout({ userId: user.id, offeringId, consent }));
  } catch (err) {
    if (err instanceof CommerceError) {
      return { status: "error", code: err.code, message: COMMERCE_MESSAGES[err.code] };
    }
    if (err instanceof PaymentsNotConfiguredError) {
      console.error("[commerce] checkout attempted while payments are not configured:", err.message);
      return { status: "error", code: "payments_not_configured", message: PAYMENTS_NOT_CONFIGURED_MESSAGE };
    }
    console.error(`[commerce] checkout failed for user ${user.id}, offering ${offeringId}`, err);
    return { status: "error", code: "unexpected", message: "We could not start the payment. Nothing has been charged — please try again." };
  }
  // Outside the try: redirect() works by throwing.
  redirect(url);
}
