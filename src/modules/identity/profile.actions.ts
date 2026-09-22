"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { countryName } from "@/content/countries";
import { withTransaction } from "@/db/prisma";
import { auth } from "./auth";
import { EXPERIENCE_BANDS, HEARD_ABOUT, INDUSTRIES, missingForCheckout, removePhoto, savePhoto, saveProfile } from "./profile.repository";
import { validateProfile, type ProfileFieldErrors, type RawProfileForm } from "./profile-validation";
import { getCurrentUser } from "./session";

/*
 * Profile — the /account/profile form's server actions (Milestone 5a;
 * replaces the name/country action of 2026-09-21). `updateProfileAction`
 * validates every §3 field (profile-validation.ts), then writes the
 * `user_profiles` row, its audit row and the `users` name/country mirror in
 * ONE transaction (profile.repository). Inside that same transaction, as its
 * last step, the greeting name is pushed to Better Auth's user record so the
 * provider's session agrees with ours — if that call throws, our transaction
 * rolls back. The ID number is validated and handed to the repository, which
 * encrypts it; it is never logged, audited or echoed back.
 *
 * Email is read-only here (ADR-015: no email provider). Password changes stay
 * on /account/security.
 */

export type ProfileFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: ProfileFieldErrors }
  | { status: "saved"; missing: string[] };

const SESSION_ENDED = "Your session has ended. Please sign in again.";

const FIELD_NAMES = [
  "legalName", "displayName", "phoneDial", "phone", "addressLine1", "addressLine2", "city", "state", "postalCode", "countryCode", "timezone",
  "organisation", "jobTitle", "industry", "experienceBand", "linkedinUrl", "idType", "idNumber", "nationalityCode", "dateOfBirth", "marketingConsent", "heardAbout",
] as const;

export async function updateProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED, fieldErrors: {} };

  const raw: RawProfileForm = {};
  for (const name of FIELD_NAMES) {
    const v = formData.get(name);
    if (typeof v === "string") raw[name] = v;
  }
  const result = validateProfile(raw, { industries: INDUSTRIES, experienceBands: EXPERIENCE_BANDS, heardAbout: HEARD_ABOUT });
  if (!result.ok) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: result.fieldErrors };

  const requestHeaders = await headers();
  let missing: string[];
  try {
    missing = await withTransaction(async (tx) => {
      const view = await saveProfile(tx, user.id, result.input, countryName(result.input.countryCode));
      const greetingName = result.input.displayName?.trim() || result.input.legalName.trim();
      if (greetingName !== user.name) await auth.api.updateUser({ body: { name: greetingName }, headers: requestHeaders });
      return missingForCheckout(view);
    });
  } catch (err) {
    // The error object may describe the failure; the input never reaches the log.
    console.error(`[identity] profile save failed for user ${user.id}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "We could not save your changes. Please try again.", fieldErrors: {} };
  }

  // The layout (sidebar name), the dashboard greeting and the header menu all
  // show the name: re-render the whole signed-in tree.
  revalidatePath("/account", "layout");
  return { status: "saved", missing };
}

export type PhotoActionResult = { status: "saved" } | { status: "error"; message: string };

const PHOTO_MAX_BYTES = 300 * 1024;
const PHOTO_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Field `photo`: the browser-resized image (PhotoUploader). */
export async function uploadPhotoAction(formData: FormData): Promise<PhotoActionResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return { status: "error", message: "Choose an image first." };
  if (!PHOTO_MIMES.has(photo.type)) return { status: "error", message: "Use a JPEG, PNG or WebP image." };
  if (photo.size > PHOTO_MAX_BYTES) return { status: "error", message: "The image must be 300 KB or smaller." };

  try {
    const bytes = new Uint8Array(await photo.arrayBuffer());
    await withTransaction((tx) => savePhoto(tx, user.id, bytes, photo.type));
  } catch (err) {
    console.error(`[identity] photo upload failed for user ${user.id}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "We could not save the photo. Please try again." };
  }
  revalidatePath("/account", "layout");
  return { status: "saved" };
}

export async function removePhotoAction(): Promise<PhotoActionResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_ENDED };
  try {
    await withTransaction((tx) => removePhoto(tx, user.id));
  } catch (err) {
    console.error(`[identity] photo removal failed for user ${user.id}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "We could not remove the photo. Please try again." };
  }
  revalidatePath("/account", "layout");
  return { status: "saved" };
}
