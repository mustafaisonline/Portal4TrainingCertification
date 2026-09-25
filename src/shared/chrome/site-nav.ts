/*
 * Site information architecture — the founder-reviewed navigation of the
 * wireframe, PORTED 2026-09-21 from project-artifacts/mockup/components/
 * PublicShell.tsx (ADR-045 PORT list, row 3). Labels, order and destinations
 * are carried over unchanged; the mockup file records the history of each.
 *
 * One source for the desktop nav, the mobile panel and the footer, so they
 * can never list different links by accident. Routes here are delivered by
 * later milestones (WIREFRAME_TO_PRODUCTION_PLAN.md §7: public pages in M3,
 * account in M5, verification in M6); PublicShell is mounted on a route only
 * once every link it renders resolves — tests/unit/site-nav.test.ts checks
 * that every href below has a page under app/.
 */

export type NavItem = { href: string; label: string };

export const primaryNav: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/hrd-corp", label: "HRD Corp" },
  { href: "/programs", label: "Trainings" }, // founder, 2026-09-26: was "Programme" → /DataBlueprint-AIVibeCoding
  { href: "/trainers", label: "Trainers" },
  { href: "/diagnostic", label: "Free Diagnostic" },
  { href: "/about-us", label: "About Us" },
  { href: "/reviews", label: "Reviews" }, // founder, 2026-09-23 (M5b D-10's 8th item)
  { href: "/verify", label: "Search Candidate" },
];

export const footerExplore: readonly NavItem[] = [
  { href: "/programs", label: "Trainings" }, // founder, 2026-09-26: was "Courses"
  { href: "/trainers", label: "Trainers" },
  { href: "/about-us", label: "About Us" },
  { href: "/schedule", label: "Schedule" },
  { href: "/for-organisations", label: "For Organisations" },
  { href: "/faq", label: "FAQ" },
  { href: "/reviews", label: "Reviews" }, // Milestone 5b (D-10)
  { href: "/contact-us", label: "Contact Us" },
];

/* Legal instruments — named because the product requires them; the
 * documents themselves are drafted by the founder and counsel, never by an
 * agent (plan §5 G0-12/G0-13). The pages state "not yet published" until
 * then. */
export const footerLegal: readonly NavItem[] = [
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/refund-policy", label: "Refund & cancellation policy" },
  { href: "/credential-integrity-policy", label: "Credential integrity policy" },
];

export const verifyLink: NavItem = { href: "/verify", label: "Search completion certificates" };

/** Active-page test for the nav. Trailing slashes are normalised; a nested
 *  path (`/programs/<slug>`, `/trainers/<slug>`) marks its parent item. */
export function isActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}
