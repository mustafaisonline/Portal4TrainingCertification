import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "./ui/Button";

/**
 * Global public shell — visual redesign 2026-08-31 (premium navy identity).
 *
 * - Header and footer carry the `.night` token scope: deep-navy editorial
 *   framing on every public page, in light and dark themes alike.
 * - Exactly ONE CTA in the header, and it is programme discovery — not the
 *   diagnostic (P01 spec HD-14). Nav promises no screen that does not
 *   exist: items route to P01 sections via absolute-path anchors.
 * - The logo mark is an ORIGINAL inline SVG (a capability line rising
 *   through data nodes) — nothing is copied from any reference material.
 * - "Data & AI Academy" remains a working placeholder name (open item
 *   HO-4 / WBS 4.4.1) — the reference image's brand name was deliberately
 *   NOT adopted, because naming is an open decision.
 */

function LogoMark() {
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
              <span className="block text-[1.05rem] font-semibold tracking-tight">
                Data &amp; AI Academy
              </span>
              <span className="text-label hidden text-[0.6rem] sm:block">
                Training &amp; certification
              </span>
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-body-sm text-[var(--color-ink-quiet)] lg:flex"
          >
            <Link href="/#programmes" className="hover:text-[var(--color-ink)]">
              Programmes
            </Link>
            <Link href="/#delivery" className="hover:text-[var(--color-ink)]">
              How it works
            </Link>
            <Link href="/#credential" className="hover:text-[var(--color-ink)]">
              Certification
            </Link>
            <Link
              href="/#organisations"
              className="hover:text-[var(--color-ink)]"
            >
              For organisations
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden sm:inline-flex">
              <Button variant="text" href="#">
                Sign in
              </Button>
            </span>
            <Button href="/#programmes">Explore programmes</Button>
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
            <p>Programmes · Certification · For organisations</p>
          </div>
          <div>
            <p className="text-label mb-3">Legal</p>
            <p>Terms · Privacy · Credential integrity policy</p>
          </div>
          <div>
            <p className="text-label mb-3">Verify a credential</p>
            <p>Public verification lookup</p>
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
