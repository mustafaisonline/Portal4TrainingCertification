import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "./ui/Button";

/**
 * Global public shell — redesigned 2026-08-31 under DR-02 and the P01
 * specification (docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md, H0).
 *
 * - Exactly ONE CTA in the header, and it is programme discovery — not the
 *   diagnostic (spec HD-14, §9.2).
 * - Navigation is intent-led and promises no screen that does not exist:
 *   items route to P01 sections via absolute-path anchors so they work
 *   from any page using this shell.
 * - The former "Accreditation — Governance & standards council" footer
 *   column is REMOVED — named as a defect by DR-02 §12 and the P01 brief.
 *   Credential verification stays: it is a trust surface, not an
 *   accreditation claim.
 * - "Data & AI Academy" remains a working placeholder name (open item
 *   HO-4 / WBS 4.4.1) — not a naming decision.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="border-b border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-end px-6 py-1.5 text-label">
          <span>EN</span>
        </div>
      </div>
      <header className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-ground)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="text-h2 min-w-0">
            Data &amp; AI Academy
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 text-body-sm text-[var(--color-ink-quiet)] lg:flex"
          >
            <Link href="/#programmes" className="hover:text-[var(--color-primary)]">
              Programmes
            </Link>
            <Link href="/#delivery" className="hover:text-[var(--color-primary)]">
              How it works
            </Link>
            <Link href="/#credential" className="hover:text-[var(--color-primary)]">
              Certification
            </Link>
            <Link href="/#organisations" className="hover:text-[var(--color-primary)]">
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
      <footer className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-12 text-body-sm text-[var(--color-ink-quiet)] sm:grid-cols-3">
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
