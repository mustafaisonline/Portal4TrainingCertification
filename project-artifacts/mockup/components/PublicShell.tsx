"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "./ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { AccountMenu, MobileAccountActions } from "./account/AccountMenu";

/**
 * Global public shell — visual redesign 2026-08-31 (premium navy identity).
 *
 * - Exactly ONE CTA in the header, and it is course discovery — not the
 *   diagnostic (P01 spec HD-14). Nav promises no screen that does not
 *   exist: items route to P01 sections via absolute-path anchors.
 * - The logo mark is an ORIGINAL inline SVG (a capability line rising
 *   through data nodes) — nothing is copied from any reference material.
 * - "Data & AI Academy" remains a working placeholder name (open item
 *   HO-4 / WBS 4.4.1) — the reference image's brand name was deliberately
 *   NOT adopted, because naming is an open decision.
 *
 * LIGHT-THEME REDESIGN, 2026-09-06, founder direction, from a supplied
 * reference image: the `.night` scope removed from both header and
 * footer below. Until now they carried deep-navy editorial framing on
 * every public page (the original 2026-08-31 identity, in the comment
 * this replaces); the new reference uses a plain white header throughout.
 * Because this component is shared by every route, this one change
 * affects every page's header/footer immediately — accepted as part of
 * "foundations" (shared chrome) rather than held back for the
 * page-by-page propagation `/` alone has received so far. Nothing else
 * here changed: nav items, the logo mark and copy are untouched, and
 * every `var(--color-*)` reference below simply now resolves through the
 * plain (light) `:root` tokens instead of `.night`'s dark overrides.
 *
 * DARK-IDENTITY REDESIGN, 2026-09-07, founder direction, from a supplied
 * reference image + brief (WHOLE-PORTAL scope, chosen explicitly): header
 * and footer are `.night` again (deep navy, see app/globals.css), sticky
 * header now has an ACTIVE-PAGE state (`aria-current="page"` + a cyan
 * underline) via `usePathname`. This reverses the 2026-09-06 light
 * header/footer above — kept as history, not deleted. Nav labels, order
 * and destinations are UNCHANGED (founder chose "keep current nav,
 * restyle only": the reference's "For Organisations"/"Resources"/search
 * have no pages to go to, so none were added). The wordmark is now the
 * sans (Plus Jakarta Sans, 700) rather than the serif.
 *
 * BREAKPOINT MOVED lg → xl, 2026-09-07 (same redesign): Plus Jakarta Sans
 * is wider than IBM Plex was, and at exactly 1024px the six inline nav
 * items plus wordmark, Sign in and CTA no longer fit on one row (measured:
 * header grew to 110px tall with a three-line wordmark). The inline nav now
 * appears from 1280px; below that the hamburger panel carries the same
 * links. Wordmark/nav are also `whitespace-nowrap`.
 *
 * MOBILE MENU FIXED — 2026-09-07, founder-reported bug ("when I am opening
 * our portal on mobile its menu is not possible"). The primary `<nav>`
 * has always been `hidden ... lg:flex` — correct for desktop, but below
 * `lg` it simply vanished with no alternative, so every nav link (Home,
 * HRD Corp, Programme, Trainers, Free Diagnostic, About Us) was
 * unreachable on a phone or small tablet. Fixed with a standard hamburger
 * pattern: a toggle button (`lg:hidden`, so it only appears where the
 * inline nav is hidden) opens a collapsible panel with the same links,
 * stacked. This file is now a Client Component (`useState` for open/
 * closed) — the only change that required; every page that renders
 * `PublicShell` keeps working exactly as before, Client Components are
 * fine nested under Server Component pages. Nav link data is now a single
 * `navItems` array feeding both the desktop `<nav>` and the mobile panel,
 * so the two can never list different links by accident. The "Explore
 * courses" CTA and the "Sign in" link's existing `hidden sm:inline-flex`
 * visibility rule are UNCHANGED — this fixes nav-link reachability only,
 * not the documented "exactly one CTA in the header" rule from this
 * file's own top comment. */

/** Exported (2026-09-06) so app/diagnostic/page.tsx — which runs in its
 *  own stripped-back shell, not PublicShell — can reuse the exact same
 *  brand mark in its minimal header, rather than the mockup drifting to a
 *  second, near-identical mark or no mark at all. */
export function LogoMark() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-[var(--color-primary)]"
    >
      <rect
        x="1"
        y="1"
        width="28"
        height="28"
        rx="8"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      <path
        d="M8 21 L13.5 14.5 L17 17 L22 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="9" r="2.3" fill="currentColor" />
      <circle cx="8" cy="21" r="1.6" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}

/** Hamburger / close glyphs for the mobile menu toggle — original inline
 *  SVG, same stroke convention (round caps/joins) as every other icon in
 *  this codebase. */
function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Single source for the primary nav links — feeds both the desktop
 *  `<nav>` and the mobile panel (see this file's "MOBILE MENU FIXED"
 *  header comment). Content/order unchanged from before that fix. */
const navItems = [
  { href: "/", label: "Home" },
  { href: "/hrd-corp", label: "HRD Corp" },
  { href: "/DataBlueprint-AIVibeCoding", label: "Programme" },
  { href: "/trainers", label: "Trainers" },
  { href: "/diagnostic", label: "Free Diagnostic" },
  { href: "/about-us", label: "About Us" },
];

/** Active-page test for the nav. Trailing slashes are normalised (the Pages
 *  export uses `trailingSlash`), and `/courses/<slug>` counts as
 *  "Programme" since that hub links straight into those detail pages. */
function isActive(pathname: string, href: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (href === "/") return path === "/";
  if (href === "/DataBlueprint-AIVibeCoding") {
    return path === href || path.startsWith("/courses");
  }
  return path === href || path.startsWith(`${href}/`);
}

export function PublicShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="night sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-ground)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <LogoMark />
            <span className="leading-tight">
              {/* `.wordmark` (globals.css) owns the family, size, weight
                  and tracking — one place, since the masthead appears on
                  every page. Plus Jakarta Sans 700 since 2026-09-07 (was the
                  serif). */}
              <span className="wordmark block sm:whitespace-nowrap">Data &amp; AI Academy</span>
              <span className="text-label hidden whitespace-nowrap text-[0.6rem] sm:block">
                Training &amp; certification
              </span>
            </span>
          </Link>
          {/* Menu restructured 2026-09-02 by founder direction:
              "How it works" and "For organisations" removed; "Home" and
              "Contact Us" added; Programmes → Courses; About → About Us;
              Certification → Certifications. Six items — the documented
              maximum. The two removed anchors pointed at homepage sections
              that still exist and are still linked from elsewhere; only
              their nav entries went.

              2026-09-06, founder direction: "Contact Us" removed here
              (it already lives in the footer's Explore list, so nothing
              is lost) and "HRD Corp" added in its place — still six items.
              /hrd-corp was originally reached only via the homepage hero
              mark (HrdCorpBadge); this nav entry supersedes that
              discoverability decision, recorded in docs/HRD_CORP.md and
              docs/SITE_PAGES.md.

              2026-09-06, later the same day: "HRD Corp" moved to position 2
              (right after Home), founder direction — second-highest
              prominence in the nav, after the homepage itself.

              2026-09-06, later still: "Certifications" removed — founder
              direction, "We will work on Certification option in future."
              The page itself is disabled too (app/certifications/page.tsx
              now 404s via a flag), not deleted. Five items now; six is the
              documented maximum, not a fixed count. The footer's plain-text
              "Certifications" mention (not a link) was left as-is — it was
              never a working nav item and removing it is a separate call.

              2026-09-06, later still: "Courses" relabelled "Programme" and
              re-pointed to `/DataBlueprint-AIVibeCoding` (was `/courses`) —
              founder direction: "we are offering only one training." The
              hub page itself moved route (git history preserved via
              `git mv`); `/courses/[slug]` detail pages are UNCHANGED and
              still live under `/courses/`. Scoped narrowly: only this nav
              label changed to "Programme" — the header CTA ("Explore
              courses") and footer's "Courses" link keep their existing
              text, just re-pointed to the new URL, since the founder asked
              specifically for "the menu item."

              2026-09-07, founder direction: "Free Diagnostic" added before
              "About Us" (→ /diagnostic, the standalone walkthrough — see
              app/diagnostic/page.tsx). Six items now — the documented
              maximum, reached exactly rather than exceeded. Companion
              change the same day: the hero's own "Start Free Diagnostic
              (10 min)" CTA was removed (components/HomeHeroLight.tsx) now
              that the diagnostic has this permanent nav entry instead. */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 whitespace-nowrap text-body-sm text-[var(--color-ink-quiet)] xl:flex"
          >
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`border-b-2 py-1 transition-colors hover:text-[var(--color-ink)] ${
                    active
                      ? "border-[var(--color-cyan)] font-medium text-[var(--color-ink)]"
                      : "border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            {/* "Sign in" link when signed out; avatar menu when in the DEMO
                session (2026-09-20, components/account/AccountMenu.tsx). */}
            <AccountMenu />
            {/* "Explore courses" header CTA REMOVED 2026-09-07, founder
                direction ("from main header menu, remove Explore courses
                button") — both the `sm`+ header instance and its
                below-`sm` copy in the mobile panel. "Programme" in the nav
                (→ /DataBlueprint-AIVibeCoding) is the same destination, so
                nothing became unreachable. This supersedes the "exactly
                ONE CTA in the header" rule in this file's top comment: the
                header now carries no CTA at all. */}
            {/* Theme toggle — visible at every width (not just desktop, not
                buried in the mobile panel): see components/ThemeToggle.tsx's
                header comment for why this moved here from a
                `hidden sm:block` corner button. */}
            <ThemeToggle />
            {/* Mobile menu toggle — only where the inline `<nav>` above is
                hidden. See "MOBILE MENU FIXED" in this file's header
                comment. */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] text-[var(--color-ink)] xl:hidden"
            >
              {menuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
        {/* Mobile nav panel — collapses open/closed beneath the row above.
            Same `navItems` as the desktop nav, so the two can never list
            different links. Every link (and the CTA below) closes the
            panel on click, in case client-side navigation doesn't unmount
            this component (e.g. same-page anchors). */}
        {menuOpen && (
          <div id="mobile-nav" className="border-t border-[var(--color-line)] px-4 pb-4 pt-2 sm:px-6 xl:hidden">
            <nav aria-label="Primary, mobile" className="flex flex-col">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-[var(--radius-plate)] px-2 py-3 text-body-sm hover:bg-[var(--color-ground-raised)] hover:text-[var(--color-ink)] ${
                      active
                        ? "bg-[var(--color-ground-raised)] font-medium text-[var(--color-ink)]"
                        : "text-[var(--color-ink-quiet)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-2 flex flex-col gap-3 border-t border-[var(--color-line)] pt-4 sm:hidden">
              <MobileAccountActions onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      {/* Footer back to `.night` (deep navy) — 2026-09-07, see this file's
          header comment. Content unchanged. */}
      <footer
        className="night border-t border-[var(--color-line)]"
        // Inline, not a bg-* utility: `.night` sets `background` in
        // unlayered CSS, which outranks any Tailwind utility (the same trap
        // documented in docs/DESIGN_FOUNDATION.md). Midnight #061226 is the
        // brief's deepest surface, one step below the header's Deep Navy.
        style={{ background: "#061226" }}
      >
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-14 text-body-sm text-[var(--color-ink-quiet)] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <LogoMark />
              <span className="font-semibold text-[var(--color-ink)]">
                Data &amp; AI Academy
              </span>
            </div>
            <p className="max-w-[26ch]">
              Expert-led Data &amp; AI training and certification. Live
              learning, real capability.
            </p>
          </div>
          <div>
            <p className="text-label mb-3">Explore</p>
            {/* Vertical list, 2026-09-07 (was one wrapped line of inline
                links separated by "·"). Same six items, same order, same
                destinations; "Certifications" and "For organisations" stay
                plain text, exactly as before — they were never links. */}
            <ul className="flex flex-col gap-2">
              {[
                { href: "/DataBlueprint-AIVibeCoding", label: "Courses" },
                { href: "/trainers", label: "Trainers" },
                { href: "/about-us", label: "About Us" },
                { href: "/contact-us", label: "Contact Us" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="text-[var(--color-ink-faint)]">Certifications</li>
              <li className="text-[var(--color-ink-faint)]">For organisations</li>
            </ul>
          </div>
          {/* These three are named because the product genuinely requires
              them — but none has been drafted, and none may be written by an
              agent: they are legal instruments and business policy. Marked
              as pending rather than styled as working links, so the footer
              stops promising documents that do not exist. See
              docs/SITE_PAGES.md. */}
          <div>
            <p className="text-label mb-3">Legal</p>
            <p className="text-[var(--color-ink-faint)]">
              Terms · Privacy · Credential integrity policy
              <br />
              <span className="text-mono text-[0.7rem]">
                not yet published
              </span>
            </p>
          </div>
          <div>
            {/* 2026-09-20, founder requirement: anyone can verify a
                Certificate of COMPLETION at /verify (wireframe, sample
                records). The earned-credential lookup (P16) is a different
                thing and stays deferred, so its line is kept rather than
                replaced. */}
            <p className="text-label mb-3">Verify a certificate</p>
            <p className="mb-3">
              <Link
                href="/verify"
                className="underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
              >
                Search completion certificates
              </Link>
            </p>
            <p className="text-[var(--color-ink-faint)]">
              Credential verification
              <br />
              <span className="text-mono text-[0.7rem]">
                available once the first credential is issued
              </span>
            </p>
          </div>
        </div>
        <div className="border-t border-[var(--color-line)] px-6 py-4 text-center text-body-sm text-[var(--color-ink-faint)]">
          Mockup/Wireframe — P01 redesigned under DR-02. Not the production
          site.
          {/* Reviewer index for the account & payment wireframes added
              2026-09-20. Sign-out and checkout have no other entry point
              until authentication and a cart exist, so without this they
              could not be reached to be reviewed. Not product navigation. */}
          <p className="mt-2">
            Account &amp; payment wireframes:{" "}
            {[
              { href: "/sign-in", label: "Sign in" },
              { href: "/register", label: "Register" },
              { href: "/forgot-password", label: "Forgot password" },
              { href: "/sign-out", label: "Sign out" },
              { href: "/checkout", label: "Checkout" },
            ].map((l, i) => (
              <span key={l.href}>
                {i > 0 ? " · " : ""}
                <Link
                  href={l.href}
                  className="underline underline-offset-4 hover:text-[var(--color-ink)]"
                >
                  {l.label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </footer>
    </div>
  );
}
