// Server-only by construction: `next/headers` cannot be imported from a Client
// Component, so Next refuses this module in the browser bundle.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { safeReturnTo } from "@/shared/util/return-to";
import { auth } from "./auth";
import { activeRolesForUser, holdsRole, type ActiveRole, type Role, type RoleScope } from "./roles.repository";
import { findUserByAuthSubject } from "./users.repository";

/*
 * "Who is making this request?" — the ONE server-side answer (plan §6.3).
 *
 * Route code never touches Better Auth's session object; it gets our `users`
 * row plus the ACTIVE roles from `user_roles` (ADR-020). Memoised per request
 * with React `cache`, so a layout and its page share one lookup.
 */

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  country: string | null;
  emailVerified: boolean;
  /** TOTP enrolled and verified (Better Auth's flag on its own user row). */
  mfaEnabled: boolean;
  roles: ActiveRole[];
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await findUserByAuthSubject(session.user.id);
  if (!user) return null; // provider row without a mapping — treated as signed out
  const roles = await activeRolesForUser(user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    country: user.country,
    emailVerified: user.emailVerifiedAt !== null,
    mfaEnabled: session.user.twoFactorEnabled === true,
    roles,
  };
});

/** Redirects to sign-in (with a same-site return path) when signed out. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?return-to=${encodeURIComponent(safeReturnTo(returnTo))}`);
  return user;
}

export type Authorisation =
  | { ok: true; user: CurrentUser }
  | { ok: false; reason: "signed-out" }
  | { ok: false; reason: "forbidden"; user: CurrentUser }
  | { ok: false; reason: "mfa-required"; user: CurrentUser };

/**
 * Data-layer-style guard for a role (ADR-020). Privileged roles additionally
 * require MFA to be enrolled (plan §6.8; OQ-14 "Yes" default). Returns a
 * result rather than throwing so layouts can render the right response
 * (redirect, 403 page, or the MFA enrolment prompt).
 */
export async function authorise(role: Role, scope?: RoleScope): Promise<Authorisation> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "signed-out" };
  if (!holdsRole(user.roles, role, scope)) return { ok: false, reason: "forbidden", user };
  if (PRIVILEGED.has(role) && !user.mfaEnabled) return { ok: false, reason: "mfa-required", user };
  return { ok: true, user };
}

const PRIVILEGED: ReadonlySet<Role> = new Set<Role>(["platform_admin"]);

export { holdsRole };
