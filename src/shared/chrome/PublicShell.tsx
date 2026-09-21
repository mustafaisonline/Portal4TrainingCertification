"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { LogoMark } from "./LogoMark";
import { ThemeToggle } from "./ThemeToggle";
import { footerExplore, footerLegal, isActive, primaryNav, verifyLink } from "./site-nav";

/*
 * Global public shell — header, mobile menu and footer.
 *
 * PORTED 2026-09-21 from project-artifacts/mockup/components/PublicShell.tsx
 * (ADR-045 PORT list, row 3: "Chrome — minus the 'Wireframe index' and mockup
 * footer strip"). Carried over: the `.night` header/footer identity, sticky
 * header with active-page state, the `xl` breakpoint for the inline nav (Plus
 * Jakarta Sans is too wide for seven items at 1024px), the hamburger panel,
 * the theme toggle visible at every width, the footer's four columns.
 *
 * Deliberately NOT ported (NEVER-PORT list): the demo-session account menu
 * (`AccountMenu`, `MobileAccountActions`, `lib/demoSession`), the
 * "Mockup/Wireframe — not the production site" strip and the reviewer
 * "Wireframe index". Account controls arrive with real identity in M2 through
 * the `accountSlot` / `mobileAccountSlot` props, so this file never learns
 * about sessions.
 *
 * Nav data lives in ./site-nav.ts — one source for desktop, mobile and
 * footer.
 */

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

export function PublicShell({
  children,
  accountSlot,
  mobileAccountSlot,
}: {
  children: ReactNode;
  /** Header account controls (sign-in link / account menu) — supplied by the
   *  identity module from M2 onward. Rendered in the header row from `sm`. */
  accountSlot?: ReactNode;
  /** The same controls for the mobile panel, where the header row is too
   *  tight at 375px. */
  mobileAccountSlot?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="night sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-ground)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <LogoMark />
            <span className="leading-tight">
              <span className="wordmark block sm:whitespace-nowrap">Data &amp; AI Academy</span>
              <span className="text-label hidden whitespace-nowrap text-[0.6rem] sm:block">
                Training &amp; certification
              </span>
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 whitespace-nowrap text-body-sm text-[var(--color-ink-quiet)] xl:flex"
          >
            {primaryNav.map((item) => {
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
            {accountSlot ? <span className="hidden sm:inline-flex">{accountSlot}</span> : null}
            <ThemeToggle />
            {/* Mobile menu toggle — only where the inline <nav> is hidden. */}
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
        {/* Mobile nav panel — same items as the desktop nav. Every link closes
            the panel on click, in case client-side navigation doesn't unmount
            this component (e.g. same-page anchors). */}
        {menuOpen && (
          <div id="mobile-nav" className="border-t border-[var(--color-line)] px-4 pb-4 pt-2 sm:px-6 xl:hidden">
            <nav aria-label="Primary, mobile" className="flex flex-col">
              {primaryNav.map((item) => {
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
            {mobileAccountSlot ? (
              <div className="mt-2 flex flex-col gap-3 border-t border-[var(--color-line)] pt-4 sm:hidden">
                {mobileAccountSlot}
              </div>
            ) : null}
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer
        className="night border-t border-[var(--color-line)]"
        // Inline, not a bg-* utility: `.night` sets `background` in unlayered
        // CSS, which outranks any Tailwind utility. Midnight #061226 is the
        // deepest surface, one step below the header's Deep Navy.
        style={{ background: "#061226" }}
      >
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-14 text-body-sm text-[var(--color-ink-quiet)] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <LogoMark />
              <span className="font-semibold text-[var(--color-ink)]">Data &amp; AI Academy</span>
            </div>
            <p className="max-w-[26ch]">
              Expert-led Data &amp; AI training and certification. Live learning, real capability.
            </p>
          </div>
          <div>
            <p className="text-label mb-3">Explore</p>
            <ul className="flex flex-col gap-2">
              {footerExplore.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="underline-offset-4 hover:text-[var(--color-ink)] hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-label mb-3">Legal</p>
            <ul className="flex flex-col gap-2">
              {footerLegal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="underline-offset-4 hover:text-[var(--color-ink)] hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-mono mt-2 text-[0.7rem] text-[var(--color-ink-faint)]">not yet published</p>
          </div>
          <div>
            <p className="text-label mb-3">Verify a certificate</p>
            <p className="mb-3">
              <Link href={verifyLink.href} className="underline-offset-4 hover:text-[var(--color-ink)] hover:underline">
                {verifyLink.label}
              </Link>
            </p>
            <p className="text-[var(--color-ink-faint)]">
              Credential verification
              <br />
              <span className="text-mono text-[0.7rem]">available once the first credential is issued</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
