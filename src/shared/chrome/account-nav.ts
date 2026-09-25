/*
 * Signed-in area navigation — PORTED 2026-09-21 from the `items` list in
 * project-artifacts/mockup/components/account/AccountFrame.tsx (ADR-045).
 * Labels, order and destinations unchanged. Split into its own module (the
 * site-nav.ts pattern) so the sidebar (AccountFrame), the header avatar menu
 * (identity/components/AccountMenu) and the e2e test read ONE list and can
 * never disagree about which screens exist.
 */

export type AccountNavItem = { href: string; label: string };

export const accountNavItems: readonly AccountNavItem[] = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/programme", label: "Trainings" }, // founder, 2026-09-26: was "Programme"
  { href: "/account/programmes", label: "My registrations" },
  { href: "/account/certificate", label: "Certificate" },
  // Milestone 5b: the reviews screen lives at the public /reviews (the same
  // page shows the person's own forms when signed in), so this is the one
  // item outside /account.
  { href: "/reviews", label: "Reviews" },
  { href: "/account/orders", label: "Orders & receipts" },
  { href: "/account/skills", label: "Skills profile" },
  { href: "/account/profile", label: "Profile & security" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/help", label: "Help" },
];

/** Exact match for "/account" and "/account/programme" — the latter is a
 *  string prefix of "/account/programmes", which is a different screen. */
export function isAccountItemActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return href === "/account" || href === "/account/programme"
    ? path === href
    : path === href || path.startsWith(`${href}/`);
}
