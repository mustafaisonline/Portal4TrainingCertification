import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "./ui/Button";

/**
 * Global public shell — visual redesign 2026-08-31 (premium navy identity).
 *
 * - Header and footer carry the `.night` token scope: deep-navy editorial
 *   framing on every public page, in light and dark themes alike.
 * - Exactly ONE CTA in the header, and it is course discovery — not the
 *   diagnostic (P01 spec HD-14). Nav promises no screen that does not
 *   exist: items route to P01 sections via absolute-path anchors.
 * - The logo mark is an ORIGINAL inline SVG (a capability line rising
 *   through data nodes) — nothing is copied from any reference material.
 * - "Data & AI Academy" remains a working placeholder name (open item
 *   HO-4 / WBS 4.4.1) — the reference image's brand name was deliberately
 *   NOT adopted, because naming is an open decision.
 */

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

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="night sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-ground)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <LogoMark />
            <span className="leading-tight">
              {/* `.wordmark` (globals.css) owns the family, size, weight
                  and tracking — one place, since the masthead appears on
                  every page. Set in the serif, which the type scale now
                  reserves for this and the P01 hero alone. */}
              <span className="wordmark block">Data &amp; AI Academy</span>
              <span className="text-label hidden text-[0.6rem] sm:block">
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
              never a working nav item and removing it is a separate call. */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-body-sm text-[var(--color-ink-quiet)] lg:flex"
          >
            <Link href="/" className="hover:text-[var(--color-ink)]">
              Home
            </Link>
            <Link href="/hrd-corp" className="hover:text-[var(--color-ink)]">
              HRD Corp
            </Link>
            <Link href="/courses" className="hover:text-[var(--color-ink)]">
              Courses
            </Link>
            <Link href="/trainers" className="hover:text-[var(--color-ink)]">
              Trainers
            </Link>
            <Link href="/about-us" className="hover:text-[var(--color-ink)]">
              About Us
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden sm:inline-flex">
              <Button variant="text" href="#">
                Sign in
              </Button>
            </span>
            <Button href="/courses">Explore courses</Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="night border-t border-[var(--color-line)]">
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
            <p>
              <Link
                href="/courses"
                className="underline underline-offset-4 hover:text-[var(--color-ink)]"
              >
                Courses
              </Link>{" "}
              ·{" "}
              <Link
                href="/trainers"
                className="underline underline-offset-4 hover:text-[var(--color-ink)]"
              >
                Trainers
              </Link>{" "}
              ·{" "}
              <Link
                href="/about-us"
                className="underline underline-offset-4 hover:text-[var(--color-ink)]"
              >
                About Us
              </Link>{" "}
              ·{" "}
              <Link
                href="/contact-us"
                className="underline underline-offset-4 hover:text-[var(--color-ink)]"
              >
                Contact Us
              </Link>{" "}
              · Certifications · For organisations
            </p>
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
            <p className="text-label mb-3">Verify a credential</p>
            <p className="text-[var(--color-ink-faint)]">
              Public verification lookup
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
        </div>
      </footer>
    </div>
  );
}
