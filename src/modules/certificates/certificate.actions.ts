"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { PaymentsNotConfiguredError } from "@/modules/commerce/errors";
import { getCurrentUser } from "@/modules/identity/session";
import { startRenewalCheckout } from "./renewal.service";
import { CertificateNotFoundError, CertificateStateError, setListed } from "./repository";

/*
 * The holder's server actions (M6 plan §5 "Holder"). Order on every call:
 * session → ownership (inside the repository / service, under the row
 * lock) → write with its audit row → revalidate. The browser never supplies
 * an amount: the renewal fee is read from the setting in force.
 */

export type CertificateActionState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

const SESSION_ENDED = "Your session has ended. Please sign in again.";
const NOT_FOUND = "This certificate could not be found in your account.";

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function revalidateHolder() {
  revalidatePath("/account/certificate");
  revalidatePath("/account", "layout");
  revalidatePath("/verify");
  revalidatePath("/admin/certificates");
}

/** Fields: `certificateId` (row uuid), `listed` ("true" | "false"). */
export async function setListingAction(_prev: CertificateActionState, formData: FormData): Promise<CertificateActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const id = text(formData, "certificateId");
  const listedRaw = text(formData, "listed");
  if (!isUuid(id)) return { status: "error", message: NOT_FOUND };
  if (listedRaw !== "true" && listedRaw !== "false") return { status: "error", message: "Choose whether to appear in public name search." };
  const listed = listedRaw === "true";
  try {
    await withTransaction((tx) => setListed(tx, id, user.id, listed));
  } catch (err) {
    if (err instanceof CertificateNotFoundError) return { status: "error", message: NOT_FOUND };
    console.error(`[certificates] listing change failed for certificate ${id}, user ${user.id}`, err);
    return { status: "error", message: "We could not save your choice. Please try again." };
  }
  revalidateHolder();
  return {
    status: "done",
    message: listed
      ? "Your name can now be found in public certificate search. You can turn this off at any time."
      : "Your name is no longer shown in public certificate search. Your certificate link still works.",
  };
}

const RENEWAL_REFUSALS: Record<string, string> = {
  revoked: "This certificate has been revoked and cannot be renewed.",
  window_closed: "Renewal opens 30 days before the certificate expires.",
  order_pending: "A renewal payment for this certificate is already in progress. Finish it or wait for it to expire.",
  fee_unavailable: "The renewal fee is not available right now. Please try again later.",
};

/** Field: `certificateId` (row uuid). Redirects to Stripe Checkout on success. */
export async function startRenewalAction(_prev: CertificateActionState, formData: FormData): Promise<CertificateActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  const id = text(formData, "certificateId");
  if (!isUuid(id)) return { status: "error", message: NOT_FOUND };

  let url: string;
  try {
    ({ url } = await startRenewalCheckout({ certificateId: id, userId: user.id }));
  } catch (err) {
    if (err instanceof PaymentsNotConfiguredError) {
      return { status: "error", message: "Payments are not configured on this environment yet, so a renewal cannot be started. Nothing has been charged." };
    }
    if (err instanceof CertificateNotFoundError) return { status: "error", message: NOT_FOUND };
    if (err instanceof CertificateStateError) {
      return { status: "error", message: RENEWAL_REFUSALS[err.code] ?? "This certificate cannot be renewed right now." };
    }
    console.error(`[certificates] renewal checkout failed for certificate ${id}, user ${user.id}`, err);
    return { status: "error", message: "We could not start the payment. Nothing has been charged. Please try again." };
  }
  revalidateHolder();
  redirect(url);
}
