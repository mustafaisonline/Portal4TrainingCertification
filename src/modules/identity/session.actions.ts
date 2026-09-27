"use server";

import { DEFAULT_RETURN_TO } from "@/shared/util/return-to";
import { landingPathFor } from "./roles.repository";
import { getCurrentUser } from "./session";

/**
 * Where the sign-in form sends a person once the provider has accepted the
 * credentials and no `return-to` was asked for (founder direction
 * 2026-09-27: an administrator lands on the admin dashboard). Resolved on
 * the server because roles live in `user_roles`, never in the browser; the
 * answer is a same-site path only.
 */
export async function landingAfterSignInAction(): Promise<string> {
  const user = await getCurrentUser();
  return user ? landingPathFor(user.roles) : DEFAULT_RETURN_TO;
}
