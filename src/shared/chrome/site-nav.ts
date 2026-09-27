/*
 * Site information architecture — the founder-reviewed navigation of the
 * wireframe, PORTED 2026-09-21 from project-artifacts/mockup/components/
 * PublicShell.tsx (ADR-045 PORT list, row 3).
 *
 * RESTRUCTURED 2026-09-27 — Milestone 14 Phase 1 (founder's "Keep only these
 * menu items in Header", decisions P15–P17): Home · Trainings & HRD Corp
 * (the two pages merged at /programs) · Free Training & Certification
 * (/free-learning, was "Free Diagnostic" at /diagnostic) · Trainers ·
 * Reviews · a SEARCH BAR ("Search Candidates or Training" → /search) ·
 * the burger. About Us is footer-only. The retired routes redirect
 * (next.config.ts).
 *
 * One source for the desktop nav, the mobile panel and the footer, so they
 * can never list different links by accident; tests/unit/site-nav.test.ts
 * checks that every href below has a page under app/.
 */

export type NavItem = { href: string; label: string };

export const primaryNav: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Trainings & HRD Corp" },
  { href: "/free-learning", label: "Free Training & Certification" },
  { href: "/trainers", label: "Trainers" },
  { href: "/reviews", label: "Reviews" }, // founder, 2026-09-23 (M5b D-10's 8th item)
];

/** The header search bar (M14 P17): one input for certificates (by ID or
 *  listed holder name) and published trainings; results on /search. */
export const siteSearch = { action: "/search", placeholder: "Search Candidates or Training", label: "Find a candidate or a training" } as const;

export const footerExplore: readonly NavItem[] = [
  { href: "/programs", label: "Trainings & HRD Corp" },
  { href: "/free-learning", label: "Free Training & Certification" },
  { href: "/trainers", label: "Trainers" },
  { href: "/about-us", label: "About Us" }, // footer only since 2026-09-27 (P15)
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
