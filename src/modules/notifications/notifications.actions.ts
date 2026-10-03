"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/modules/identity/session";
import { markAllRead, setRead } from "./notifications.repository";

/*
 * Mark notifications read / unread (CR-2026-10-03-1228). Each action resolves the
 * signed-in person FIRST and only ever touches THEIR rows (the repository scopes
 * every write by userId), so ids that are not theirs change nothing.
 */

/** From the bell: the person opened one or more notifications. */
export async function markNotificationsRead(ids: string[]): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !Array.isArray(ids)) return { ok: false };
  await setRead(user.id, ids.filter((i): i is string => typeof i === "string"), true);
  revalidatePath("/account/notifications");
  return { ok: true };
}

const idOf = (formData: FormData) => String(formData.get("id") ?? "");

export async function markNotificationRead(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (user) await setRead(user.id, [idOf(formData)], true);
  revalidatePath("/account/notifications");
}

export async function markNotificationUnread(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (user) await setRead(user.id, [idOf(formData)], false);
  revalidatePath("/account/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (user) await markAllRead(user.id);
  revalidatePath("/account/notifications");
}
