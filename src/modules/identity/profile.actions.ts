"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { withTransaction } from "@/db/prisma";
import { auth } from "./auth";
import { getCurrentUser } from "./session";
import { updateUserProfile } from "./users.repository";

/*
 * Profile & security — the "Personal details" form's server action (account
 * shell, 2026-09-21; the wireframe's form was inert). Validates, updates OUR
 * `users` row with its audit row in one transaction (users.repository), and
 * — inside that same transaction, as its last step — pushes the new name to
 * Better Auth's user record so the provider's session agrees with ours. If
 * the provider call throws, our transaction rolls back and the person sees
 * an error; the two records can never end up committed in disagreement.
 * Email is read-only here (a change needs a verification email; no provider
 * is wired — auth.ts). Password changes stay on /account/security.
 */

export type ProfileFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Partial<Record<"name" | "country", string>> }
  | { status: "saved" };

const NAME_MIN = 2;
const NAME_MAX = 200;
const COUNTRY_MAX = 100;

export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();

  const fieldErrors: Partial<Record<"name" | "country", string>> = {};
  if (name.length < NAME_MIN || name.length > NAME_MAX) fieldErrors.name = "Please enter your full name.";
  if (country.length > COUNTRY_MAX) fieldErrors.country = `Use at most ${COUNTRY_MAX} characters.`;
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Your session has ended. Please sign in again.", fieldErrors: {} };
  }

  const nameChanged = name !== user.name;
  const countryChanged = (country || null) !== user.country;
  if (!nameChanged && !countryChanged) return { status: "saved" };

  const requestHeaders = await headers();
  try {
    await withTransaction(async (tx) => {
      const updated = await updateUserProfile(tx, user.id, { name, country: country || null });
      if (!updated) throw new Error("user row missing");
      if (nameChanged) await auth.api.updateUser({ body: { name }, headers: requestHeaders });
    });
  } catch (err) {
    console.error("[identity] profile update failed", err);
    return { status: "error", message: "We could not save your changes. Please try again.", fieldErrors: {} };
  }

  // The layout (sidebar name), the dashboard greeting and the header menu all
  // show the name: re-render the whole signed-in tree.
  revalidatePath("/account", "layout");
  return { status: "saved" };
}
