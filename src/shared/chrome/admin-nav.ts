/*
 * Admin area navigation — Milestone 8 (MILESTONE_8_EXECUTION_PLAN.md §2
 * item 1). One list, the site-nav.ts / account-nav.ts pattern, read by the
 * sub-navigation bar in app/admin/layout.tsx (via ./AdminNav) and by
 * tests/unit/admin-nav.test.ts, which checks that every href has a page
 * under app/admin. Every screen the milestone delivers is listed here,
 * including Users and Audit log (plan §2 items 4 and 5), so the bar is
 * complete from the first render rather than growing item by item.
 */

export type AdminNavItem = { href: string; label: string };

export const adminNavItems: readonly AdminNavItem[] = [
  { href: "/admin", label: "Overview" },
  // Milestone 12: trainings (details, sections, curriculum, formats, fees, dates).
  { href: "/admin/trainings", label: "Trainings" },
  { href: "/admin/offerings", label: "Offerings" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/reports", label: "Reports" },
];

/** What a Trainer sees (Milestone 12, decisions L3/L7): the overview (their
 *  reduced dashboard) and the Trainings area. Every other admin screen
 *  answers 403 to them regardless of what the bar shows. */
export const trainerNavItems: readonly AdminNavItem[] = adminNavItems.filter((i) => i.href === "/admin" || i.href === "/admin/trainings");

/** Exact match for the overview (every other item is under /admin), nested
 *  match for the rest; trailing slashes are normalised. */
export function isAdminItemActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (href === "/admin") return path === "/admin";
  return path === href || path.startsWith(`${href}/`);
}
