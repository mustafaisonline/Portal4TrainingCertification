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
 * SWAPPED 2026-09-28, morning (founder: "Bring [For Organisations] in the
 * Header as Menu Item, Replace it with Trainers"): the header's "Trainers"
 * item was replaced by "For Organisations"; Trainers stayed reachable from
 * the footer.
 *
 * RESTRUCTURED AGAIN 2026-09-28, same day ("New more change"): (2) "Free
 * Training & Certification" splits into two pages/menu items, **Free
 * Trainings** and **Free Certifications** (DR-04 permits the second name);
 * (4) "Trainings & HRD Corp" renamed **Paid Trainings**; (5) the
 * "For Organisations" page is retired — its content merges into Paid
 * Trainings, so the header item is removed too, with nothing put in its
 * place (the net effect of splitting one Free item into two is the header
 * stays at five items including Home). Trainers remains footer-only,
 * unchanged by this second round.
 *
 * RENAMED AND REORDERED 2026-09-28, later the same day (founder's "New
 * change" items 3–4): "Free Trainings" is now **Free Knowledge Hub** and
 * "Paid Trainings" is now **Professional Trainings**, which also moved to
 * sit next to Free Certifications instead of leading the bar. Both URLs are
 * unchanged (label ≠ URL, the same precedent as "Paid Trainings" living at
 * /programs). Still later the same day: "Free Knowledge Hub" shortened to
 * **Knowledge Hub**, and that page absorbed the topics list while Free
 * Certifications absorbed the Knowledge Check start screen ("no need for
 * two pages").
 *
 * One source for the desktop nav, the mobile panel and the footer, so they
 * can never list different links by accident; tests/unit/site-nav.test.ts
 * checks that every href below has a page under app/.
 */

export type NavItem = { href: string; label: string };

export const primaryNav: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/free-trainings", label: "Knowledge Hub" },
  { href: "/free-certifications", label: "Free Certifications" },
  { href: "/programs", label: "Professional Trainings" },
  { href: "/reviews", label: "Reviews" }, // founder, 2026-09-23 (M5b D-10's 8th item)
];

/** The header search bar (M14 P17): one input for certificates (by ID or
 *  listed holder name) and published trainings; results on /search. */
export const siteSearch = { action: "/search", placeholder: "Search Candidates or Training", label: "Find a candidate or a training" } as const;

export const footerExplore: readonly NavItem[] = [
  { href: "/free-trainings", label: "Knowledge Hub" },
  { href: "/free-certifications", label: "Free Certifications" },
  { href: "/programs", label: "Professional Trainings" },
  // Founder, 2026-09-28 evening: the /trainers directory is retired — both
  // pages were the one trainer's content, so the footer item goes straight
  // to the dedicated page at the top-level slug (/trainers redirects there).
  { href: "/mustafa-qizilbash", label: "Trainer" },
  { href: "/about-us", label: "About Us" }, // footer only since 2026-09-27 (P15)
  { href: "/schedule", label: "Schedule" },
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
 *  path (`/programs/<slug>`) marks its parent item. */
export function isActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}
