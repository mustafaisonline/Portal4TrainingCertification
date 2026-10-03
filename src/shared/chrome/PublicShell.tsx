"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { LogoMark } from "./LogoMark";
import { ProductMenu } from "./ProductMenu";
import type { ProductMenuData } from "./product-menu-data";
import { ThemeToggle } from "./ThemeToggle";
import { footerExplore, footerLegal, headerBarLinks, isActive, primaryNav, siteSearch, verifyLink } from "./site-nav";

/** Footer links the primary nav does not already list — the burger menu carries ALL footer links (founder, 2026-10-01). */
const footerMoreLinks = footerExplore.filter((l) => !primaryNav.some((p) => p.href === l.href));

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

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

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
  productMenu,
}: {
  children: ReactNode;
  /** Header account controls (sign-in link / account menu) — supplied by the
   *  identity module from M2 onward. Rendered in the header row from `sm`. */
  accountSlot?: ReactNode;
  /** The same controls for the mobile panel, where the header row is too
   *  tight at 375px. */
  mobileAccountSlot?: ReactNode;
  /** CR-2026-10-04-0110: what the desktop "Product" panel lists (built per request by the layout); without it the button is not shown. */
  productMenu?: ProductMenuData;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="night sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-ground)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <LogoMark />
            <span className="leading-tight">
              <span className="wordmark block sm:whitespace-nowrap">DataAI Nexus</span>
              <span className="text-label hidden whitespace-nowrap text-[0.6rem] sm:block">
                Learn, Train, Assess &amp; Certify
              </span>
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-5 whitespace-nowrap text-body-sm text-[var(--color-ink-quiet)] lg:flex xl:gap-7"
          >
            {/* CR-2026-10-04-0110 (founder): Home · Product ▾ · Reviews · About Us. The Product panel lists everything else by category. */}
            {(() => {
              const barLink = (item: { href: string; label: string }) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`border-b-2 py-1 transition-colors hover:text-[var(--color-ink)] ${active ? "border-[var(--color-cyan)] font-medium text-[var(--color-ink)]" : "border-transparent"}`}
                  >
                    {item.label}
                  </Link>
                );
              };
              return (
                <>
                  {barLink(headerBarLinks.before)}
                  {productMenu ? <ProductMenu data={productMenu} /> : null}
                  {headerBarLinks.after.map(barLink)}
                </>
              );
            })()}
          </nav>
          {/* M14 P17: the search bar replaces the "Search Candidate" item.
              Tried as its own full-width second row 2026-09-28 (founder item 7),
              reverted the same day — founder: "Its new location is not looking
              good. Bring it back to the previous location", beside Reviews. */}
          {/* 1024–1279 px: the four items fit only without the input, so the search
              is a magnifier that opens /search (its own box); the input returns at 1280 px. */}
          <Link
            href="/search"
            aria-label={siteSearch.label}
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] text-[var(--color-ink)] lg:grid xl:hidden"
            data-testid="site-search-link"
          >
            <IconSearch />
          </Link>
          <form role="search" action={siteSearch.action} method="get" className="hidden min-w-0 items-center xl:flex" data-testid="site-search">
            <label htmlFor="site-search-q" className="sr-only">
              {siteSearch.label}
            </label>
            <input
              id="site-search-q"
              type="search"
              name="q"
              placeholder={siteSearch.placeholder}
              autoComplete="off"
              maxLength={200}
              // w-44/w-48 (founder, 2026-09-28: "Reduce the size of the Search
              // Bar") — was w-56/w-64.
              className="text-body-sm w-44 rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3 py-1.5 text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] xl:w-48"
            />
          </form>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* CR-2026-10-02-2013: shown on phones too (was `hidden sm:inline-flex`). */}
            {accountSlot ? <span className="inline-flex">{accountSlot}</span> : null}
            {/* CR-2026-10-03-2250: the theme switch moved into the menus and the footer; the bell took its place. */}
            {/* Menu toggle — every width (founder, 2026-10-04: "Bell Notice, Burger Menu"). On a laptop it opens a compact menu of the secondary links; on a phone the full navigation. */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] text-[var(--color-ink)]"
            >
              {menuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
        {/* Mobile nav panel — same items as the desktop nav. Every link closes
            the panel on click, in case client-side navigation doesn't unmount
            this component (e.g. same-page anchors). */}
        {menuOpen && (
          /* CR-2026-10-02-2016 (founder: "on mobile buger menu is not scrollable"):
            the header is sticky, so a panel taller than the screen could not be
            reached by page scroll. Cap it to the viewport below the 4.5rem header
            bar (dvh follows the mobile browser bar) and scroll inside it;
            overscroll-contain keeps the page behind from scrolling. */
          <div id="mobile-nav" className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-[var(--color-line)] px-4 pb-4 pt-2 sm:px-6 lg:absolute lg:right-6 lg:top-full lg:w-80 lg:rounded-b-[var(--radius-panel)] lg:border lg:border-t-0 lg:bg-[var(--color-ground)] lg:px-3 lg:shadow-[0_18px_40px_rgba(0,0,0,0.28)]" data-testid="menu-panel">
            <form role="search" action={siteSearch.action} method="get" className="mb-2 flex items-center gap-2 lg:hidden" data-testid="site-search-mobile">
              <label htmlFor="site-search-q-mobile" className="sr-only">
                {siteSearch.label}
              </label>
              <input
                id="site-search-q-mobile"
                type="search"
                name="q"
                placeholder={siteSearch.placeholder}
                autoComplete="off"
                maxLength={200}
                className="text-body-sm w-full rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3 py-2 text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </form>
            <nav aria-label="Primary, mobile" className="flex flex-col lg:hidden">
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
            {/* Founder, 2026-10-01: every footer link is also in the burger menu. */}
            <nav aria-label="More, mobile" className="mt-2 flex flex-col border-t border-[var(--color-line)] pt-2" data-testid="mobile-footer-links">
              <p className="text-label px-2 pb-1 pt-1">More</p>
              {[...footerMoreLinks, verifyLink].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="rounded-[var(--radius-plate)] px-2 py-3 text-body-sm text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-raised)] hover:text-[var(--color-ink)]"
                >
                  {item.label}
                </Link>
              ))}
              <p className="text-label px-2 pb-1 pt-3">Legal</p>
              {footerLegal.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="rounded-[var(--radius-plate)] px-2 py-3 text-body-sm text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-raised)] hover:text-[var(--color-ink)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 border-t border-[var(--color-line)] pt-2" data-testid="mobile-appearance">
              <p className="text-label px-2 pb-1 pt-1">Appearance</p>
              <ThemeToggle variant="row" testId="theme-toggle-menu" />
            </div>
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
              <span className="font-semibold text-[var(--color-ink)]">DataAI Nexus</span>
            </div>
            <p className="max-w-[26ch]">
              Expert-led Data &amp; AI training and certification. Live learning, real capability.
            </p>
            {/* CR-2026-10-03-2250: also here, so a signed-out visitor on a laptop (no burger, no avatar menu) can still choose a theme. */}
            <div className="mt-4 max-w-[26ch]">
              <ThemeToggle variant="row" testId="theme-toggle-footer" />
            </div>
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
              Certificate verification
              <br />
              <span className="text-mono text-[0.7rem]">available once the first certificate is issued</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
