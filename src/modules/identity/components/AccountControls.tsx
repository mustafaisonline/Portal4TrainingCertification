import { Button } from "@/shared/ui/Button";
import { getCurrentUser } from "../session";

/*
 * Header account controls — fills PublicShell's `accountSlot` /
 * `mobileAccountSlot`. Server component: reads the session once per request
 * through session.ts. Replaces the mockup's demo `AccountMenu` (never
 * ported). The full avatar menu arrives with the participant account in M5.
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
    <span className="flex items-center gap-1">
      <Button variant="text" href="/account" data-testid="header-account">
        My account
      </Button>
      <Button variant="text" href="/sign-out">
        Sign out
      </Button>
    </span>
  ) : (
    <Button variant="text" href="/sign-in" data-testid="header-sign-in">
      Sign in
    </Button>
  );
}
