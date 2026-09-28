"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { authorise } from "@/modules/identity/session";
import { CouponAdminError, createCoupon, deleteCoupon, setCouponStatus, updateCoupon } from "./coupons.repository";

/*
 * Admin coupon management (spec §2/§3/§12; N7). Every action re-checks
 * platform_admin server-side, runs in one transaction, and writes its audit
 * row in the repository. Trainers and participants get a refusal, never a
 * silent no-op.
 */

export type CouponActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

async function admin(): Promise<{ ok: true; userId: string } | { ok: false }> {
  const gate = await authorise("platform_admin");
  return gate.ok ? { ok: true, userId: gate.user.id } : { ok: false };
}

const REFUSED: CouponActionState = { status: "error", message: "Only a platform administrator can manage coupons." };

function fields(formData: FormData): { email: string; programmeId: string; discountPercent: number; expiresAt: Date | null } {
  const expiryRaw = String(formData.get("expiresAt") ?? "").trim();
  return {
    email: String(formData.get("email") ?? ""),
    programmeId: String(formData.get("programmeId") ?? "").trim(),
    discountPercent: Number.parseInt(String(formData.get("discountPercent") ?? ""), 10),
    // A date from the form means "valid through this date" — end of that day, UTC.
    expiresAt: expiryRaw ? new Date(`${expiryRaw}T23:59:59.999Z`) : null,
  };
}

export async function createCouponAction(_prev: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const gate = await admin();
  if (!gate.ok) return REFUSED;
  try {
    const coupon = await withTransaction((tx) => createCoupon(tx, { ...fields(formData), actorUserId: gate.userId }));
    revalidatePath("/admin/coupons");
    return { status: "success", message: `Coupon ${coupon.code} created for ${coupon.email} — ${coupon.discountPercent}% off ${coupon.programmeTitle}.` };
  } catch (err) {
    if (err instanceof CouponAdminError) return { status: "error", message: err.message };
    console.error("[commerce] coupon creation failed", err);
    return { status: "error", message: "The coupon could not be created. Nothing was saved — please try again." };
  }
}

export async function updateCouponAction(_prev: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const gate = await admin();
  if (!gate.ok) return REFUSED;
  const id = String(formData.get("id") ?? "").trim();
  try {
    const coupon = await withTransaction((tx) => updateCoupon(tx, { id, ...fields(formData), actorUserId: gate.userId }));
    revalidatePath("/admin/coupons");
    return { status: "success", message: `Coupon ${coupon.code} updated.` };
  } catch (err) {
    if (err instanceof CouponAdminError) return { status: "error", message: err.message };
    console.error(`[commerce] coupon ${id} update failed`, err);
    return { status: "error", message: "The coupon could not be updated — please try again." };
  }
}

export async function setCouponStatusAction(_prev: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const gate = await admin();
  if (!gate.ok) return REFUSED;
  const id = String(formData.get("id") ?? "").trim();
  const status = formData.get("status") === "disabled" ? "disabled" : "active";
  try {
    const coupon = await withTransaction((tx) => setCouponStatus(tx, { id, status, actorUserId: gate.userId }));
    revalidatePath("/admin/coupons");
    return { status: "success", message: `Coupon ${coupon.code} is now ${status}.` };
  } catch (err) {
    if (err instanceof CouponAdminError) return { status: "error", message: err.message };
    console.error(`[commerce] coupon ${id} status change failed`, err);
    return { status: "error", message: "The status could not be changed — please try again." };
  }
}

export async function deleteCouponAction(_prev: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const gate = await admin();
  if (!gate.ok) return REFUSED;
  const id = String(formData.get("id") ?? "").trim();
  try {
    await withTransaction((tx) => deleteCoupon(tx, { id, actorUserId: gate.userId }));
    revalidatePath("/admin/coupons");
    return { status: "success", message: "The unused coupon was deleted." };
  } catch (err) {
    if (err instanceof CouponAdminError) return { status: "error", message: err.message };
    console.error(`[commerce] coupon ${id} deletion failed`, err);
    return { status: "error", message: "The coupon could not be deleted — please try again." };
  }
}
