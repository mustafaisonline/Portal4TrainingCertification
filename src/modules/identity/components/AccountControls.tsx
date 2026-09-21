import { Button } from "@/shared/ui/Button";
import { holdsRole } from "../roles.repository";
import { getCurrentUser } from "../session";
import { AccountMenu } from "./AccountMenu";

/*
 * Header account controls — fills PublicShell's `accountSlot` /
 * `mobileAccountSlot`. Server component: reads the session once per request
 * through session.ts. Header variant, signed in: the avatar menu
 * (AccountMenu, ported 2026-09-21 with the account shell) fed from OUR
 * `users` row and `user_roles` — `isAdmin` is the platform_admin role, never
 * anything the provider returns. Signed out: the "Sign in" link. The mobile
 * panel keeps its plain buttons (too tight for an avatar at 375px).
 */
export async function AccountControls({ variant = "header" }: { variant?: "header" | "mobile" }) {
  const user = await getCurrentUser();
  if (variant === "mobile") {
    return user ? (
      <>
        <Button variant="secondary" href="/account">
          My account
        </Button>
        <Button variant="secondary" href="/sign-out">
          Sign out
        </Button>
      </>
    ) : (
      <Button variant="secondary" href="/sign-in">
        Sign in
      </Button>
    );
  }
  return user ? (
    <AccountMenu name={user.name} email={user.email} isAdmin={holdsRole(user.roles, "platform_admin")} />
  ) : (
    <Button variant="text" href="/sign-in" data-testid="header-sign-in">
      Sign in
    </Button>
  );
}
