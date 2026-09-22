"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { AdminUserNotFoundError, grantPlatformAdmin, revokePlatformAdmin, RoleChangeRefusedError } from "./admin-users.repository";
import { authorise } from "./session";

/*
 * Role actions on /admin/users/[id] (M8 plan §2 item 4). Each one authorises
 * `platform_admin` FIRST — the admin layout gates the page, but an action is
 * its own HTTP endpoint and must gate itself (ADR-020) — then writes the
 * role row and its audit row in one transaction. The actor is the signed-in
 * administrator, never a form field.
 */

export type AdminUserActionState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

async function refuseUnlessAdmin(): Promise<AdminUserActionState | { userId: string }> {
  const result = await authorise("platform_admin");
  if (!result.ok) {
    return {
      status: "error",
      message: result.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to manage roles.",
    };
  }
  return { userId: result.user.id };
}

function targetFrom(formData: FormData): string | null {
  const id = String(formData.get("userId") ?? "").trim();
  return isUuid(id) ? id : null;
}

function revalidate(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/audit");
  revalidatePath("/admin");
}

function failure(err: unknown, verb: string): AdminUserActionState {
  if (err instanceof RoleChangeRefusedError) return { status: "error", message: err.message };
  if (err instanceof AdminUserNotFoundError) return { status: "error", message: "This person could not be found." };
  console.error(`[admin-users] ${verb} failed`, err);
  return { status: "error", message: `We could not ${verb} administrator access. Please try again.` };
}

/** Fields: `userId` (uuid). */
export async function grantAdminAction(_prev: AdminUserActionState, formData: FormData): Promise<AdminUserActionState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const userId = targetFrom(formData);
  if (!userId) return { status: "error", message: "This person could not be found." };
  try {
    const granted = await withTransaction((tx) => grantPlatformAdmin(tx, userId, gate.userId));
    revalidate(userId);
    return { status: "done", message: granted ? "Platform administrator access granted." : "This person already holds administrator access." };
  } catch (err) {
    return failure(err, "grant");
  }
}

/** Fields: `userId` (uuid), `confirm` = "yes". */
export async function revokeAdminAction(_prev: AdminUserActionState, formData: FormData): Promise<AdminUserActionState> {
  const gate = await refuseUnlessAdmin();
  if ("status" in gate) return gate;
  const userId = targetFrom(formData);
  if (!userId) return { status: "error", message: "This person could not be found." };
  if (String(formData.get("confirm") ?? "") !== "yes") return { status: "error", message: "Tick the confirmation before revoking." };
  try {
    const revoked = await withTransaction((tx) => revokePlatformAdmin(tx, userId, gate.userId));
    revalidate(userId);
    return { status: "done", message: revoked ? "Platform administrator access revoked." : "This person is not an administrator." };
  } catch (err) {
    return failure(err, "revoke");
  }
}
