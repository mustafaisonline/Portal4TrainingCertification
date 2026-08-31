import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "./ui/Button";

/**
 * Global public shell (§4): slim top bar, header with logo/nav/CTA, footer.
 * Nav links beyond the diagnostic CTA are inert in this milestone — no
 * screens exist behind them yet. "Data & AI Academy" is a working
 * placeholder name (Decision 2, approval message) — not a naming decision.
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
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <Link href="/" className="text-h2">
            Data &amp; AI Academy
          </Link>
          <nav className="hidden items-center gap-6 text-body-sm text-[var(--color-ink-quiet)] md:flex">
            <span>Learn</span>
            <span>Certification</span>
            <span>For organisations</span>
            <span>Knowledge library</span>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="text" href="#">
              Sign in
            </Button>
            <Button href="/diagnostic">Start free diagnostic</Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-12 text-body-sm text-[var(--color-ink-quiet)] sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-label mb-3">Sitemap</p>
            <p>Learn · Certification · Organisations</p>
          </div>
          <div>
            <p className="text-label mb-3">Accreditation</p>
            <p>Governance &amp; standards council</p>
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
          Mockup/Wireframe — Mockup Milestone 1. Not the production site.
        </div>
      </footer>
    </div>
  );
}
