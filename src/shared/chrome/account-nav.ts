/*
 * Signed-in area navigation — PORTED 2026-09-21 from the `items` list in
 * project-artifacts/mockup/components/account/AccountFrame.tsx (ADR-045).
 * Split into its own module (the site-nav.ts pattern) so the sidebar
 * (AccountFrame), the header account menu (identity/components/AccountMenu)
 * and the e2e test read ONE list and can never disagree about which screens
 * exist.
 *
 * RE-ORDERED 2026-09-27 — Milestone 13, founder decisions 5–7 (MILESTONE_13_
 * EXECUTION_PLAN.md §1.3): Profile first (Security folded into it), the
 * "Trainings" catalogue tab removed (the public Trainings page and the
 * schedule replace it), "My registrations" → "My Trainings", "Certificate"
 * → "Certifications", the Dashboard tab removed (N2 a — /account now opens
 * Profile). The header menu shows exactly this list in this order.
 */

export type AccountNavItem = { href: string; label: string };

export const accountNavItems: readonly AccountNavItem[] = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/trainings", label: "My Trainings" },
  { href: "/account/certifications", label: "Certifications" },
  // Milestone 5b: the reviews screen lives at the public /reviews (the same
  // page shows the person's own forms when signed in, inside the account
  // frame since M13), so this is the one item outside /account.
  { href: "/reviews", label: "Reviews" },
  { href: "/account/orders", label: "Orders & receipts" },
  // CR-2026-10-04-0112: the person's Agentic AI plan, credits and downloads.
  { href: "/account/downloads", label: "My Agentic AI" },
  { href: "/account/skills", label: "Skills profile" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/help", label: "Help" },
];

/** Exact match or nested path (a screen's sub-pages keep its item current);
 *  trailing slashes are normalised. */
export function isAccountItemActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === href || path.startsWith(`${href}/`);
}
