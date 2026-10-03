import { Button } from "@/shared/ui/Button";
import { getProfile } from "../profile.repository";
import { holdsRole, isOrganisationUser } from "../roles.repository";
import { getCurrentUser } from "../session";
import { latestNotifications, unreadCount } from "@/modules/notifications/notifications.repository";
import { MobileUnreadBadge } from "@/modules/notifications/components/MobileUnreadBadge";
import { NotificationBell } from "@/modules/notifications/components/NotificationBell";
import { AccountMenu } from "./AccountMenu";

/*
 * Header account controls — fills PublicShell's `accountSlot` /
 * `mobileAccountSlot`. Server component: reads the session once per request
 * through session.ts. Header variant, signed in: the avatar menu
 * (AccountMenu, ported 2026-09-21 with the account shell) fed from OUR
 * `users` row and `user_roles` — `isAdmin` is the platform_admin role, never
 * anything the provider returns. Signed out: the "Sign in" link.
 * Milestone 5a: the profile photo, when there is one, replaces the initials
 * (the menu loads it from the session-gated /api/me/photo route).
 *
 * RESTRUCTURED 2026-09-28 (founder: "In burger menu, we need … Name … Email
 * … Line … User Dashboard … Trainer Dashboard … Admin Dashboard … Line …
 * Sign-Out"): both the desktop dropdown (AccountMenu) and this component's
 * mobile branch now show the same structure — the earlier per-tab account
 * links (Profile, My Trainings, …) are gone from here; they live inside
 * /account itself. `isTrainer` is the `expert` role — a Trainer's own
 * reduced /admin, already scoped by role (Milestone 12), simply had no
 * menu entry pointing at it before.
 */
export async function AccountControls({ variant = "header" }: { variant?: "header" | "mobile" }) {
  const user = await getCurrentUser();
  if (variant === "mobile") {
    if (!user) {
      return (
        <Button variant="secondary" href="/sign-in">
          Sign in
        </Button>
      );
    }
    const isTrainer = holdsRole(user.roles, "expert");
    const isAdmin = holdsRole(user.roles, "platform_admin");
    const isOrganisation = isOrganisationUser(user.roles);
    return (
      <div className="flex flex-col gap-1" data-testid="mobile-account-menu">
        <p className="px-1 pb-1">
          <span className="block text-body-sm font-medium text-[var(--color-ink)]">{user.name}</span>
          <span className="block truncate text-body-sm text-[var(--color-ink-quiet)]">{user.email}</span>
        </p>
        <div className="flex flex-col gap-1 border-t border-[var(--color-line)] pt-2">
          <Button variant="secondary" href="/account">
            User Dashboard
          </Button>
          {isTrainer && (
            <Button variant="secondary" href="/admin">
              Trainer Dashboard
            </Button>
          )}
          {isOrganisation && (
            <Button variant="secondary" href="/organisation" data-testid="mobile-organisation-dashboard">
              Organisation Dashboard
            </Button>
          )}
          {isAdmin && (
            <Button variant="secondary" href="/admin">
              Admin Dashboard
            </Button>
          )}
        </div>
        <Button variant="secondary" href="/sign-out" className="mt-2 border-t border-[var(--color-line)] pt-2">
          Sign out
        </Button>
      </div>
    );
  }
  if (!user) {
    // CR-2026-10-02-2013: the header slot now shows on phones for the avatar; the signed-out text link stays
    // `sm`-up only (the burger menu carries "Sign in" for phones) so the 320 px header does not overflow.
    return (
      <span className="hidden sm:inline-flex">
        <Button variant="text" href="/sign-in" data-testid="header-sign-in">
          Sign in
        </Button>
      </span>
    );
  }
  const [profile, unread, latest] = await Promise.all([getProfile(user.id), unreadCount(user.id), latestNotifications(user.id)]);
  return (
    <div className="relative flex items-center gap-2">
      {/* CR-2026-10-03-1228: the bell sits beside the avatar (sm and up); on phones the count is a badge on the avatar. */}
      <NotificationBell initialUnread={unread} initialLatest={latest.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))} />
      <AccountMenu
        name={user.name}
        email={user.email}
        isTrainer={holdsRole(user.roles, "expert")}
        isOrganisation={isOrganisationUser(user.roles)}
        isAdmin={holdsRole(user.roles, "platform_admin")}
        hasPhoto={profile?.hasPhoto ?? false}
        photoVersion={profile?.photoUpdatedAt?.getTime() ?? 0}
      />
      <MobileUnreadBadge initialUnread={unread} />
    </div>
  );
}
