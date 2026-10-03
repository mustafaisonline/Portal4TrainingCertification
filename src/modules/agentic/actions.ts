"use server";

import { redirect } from "next/navigation";
import { withTransaction } from "@/db/prisma";
import { findAgenticItemBySlug } from "@/content/agentic/catalogue";
import { CommerceError, PaymentsNotConfiguredError } from "@/modules/commerce/errors";
import { COMMERCE_MESSAGES, PAYMENTS_NOT_CONFIGURED_MESSAGE } from "@/modules/commerce/messages";
import { getCurrentUser } from "@/modules/identity/session";
import { startAgenticCheckout } from "./checkout";
import { claimWithCredit } from "./entitlements";

/*
 * Agentic AI server actions (CR-2026-10-04-0112): buy a product (one agent/skill, the 10-pack, a pass) — every failure is a
 * sentence on the form, success redirects to Stripe — and spend a pack credit on an item. Both need a signed-in person; the
 * product, kind and amount come from OUR catalogue (the form sends only a SKU string we validate).
 */

export type AgenticFormState = { status: "idle" } | { status: "error"; message: string };

export async function buyAgenticAction(_prev: AgenticFormState, formData: FormData): Promise<AgenticFormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };
  const sku = String(formData.get("sku") ?? "").trim();
  const acknowledged = formData.get("acknowledged") === "yes";
  let url: string;
  try {
    ({ url } = await startAgenticCheckout({ userId: user.id, sku, acknowledged }));
  } catch (err) {
    if (err instanceof CommerceError) return { status: "error", message: COMMERCE_MESSAGES[err.code] };
    if (err instanceof PaymentsNotConfiguredError) {
      console.error("[agentic] payment attempted while payments are not configured:", err.message);
      return { status: "error", message: PAYMENTS_NOT_CONFIGURED_MESSAGE };
    }
    console.error(`[agentic] payment failed for user ${user.id}, sku ${sku}`, err);
    return { status: "error", message: "We could not start the payment. Nothing has been charged — please try again." };
  }
  redirect(url);
}

/** Spend one credit on an item, then start its download. */
export async function claimAgenticAction(_prev: AgenticFormState, formData: FormData): Promise<AgenticFormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };
  const slug = String(formData.get("slug") ?? "").trim();
  if (!findAgenticItemBySlug(slug)) return { status: "error", message: "That download is not available." };
  try {
    const result = await withTransaction((tx) => claimWithCredit(tx, user.id, slug));
    if (!result.ok) return { status: "error", message: "You have no credits left. Buy a 10-pack or get a plan to download more." };
  } catch (err) {
    console.error(`[agentic] credit claim failed for user ${user.id}, item ${slug}`, err);
    return { status: "error", message: "We could not use your credit. Nothing was spent — please try again." };
  }
  redirect(`/api/agentic/download/${slug}`);
}
