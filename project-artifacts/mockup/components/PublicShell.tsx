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

/**
 * Wordmark — redesigned 2026-09-01 (audit finding: the masthead was set in
 * the UI font at 16.8px and read as a nav label, not a mark).
 *
 * Now a typographic mark: the display serif, with a hairline rule and a
 * monospace descriptor beneath — the "measured voice" the design
 * specification asks for. Deliberately no logo glyph: an institution's
 * authority comes from its name set properly, and a geometric line-art
 * icon was itself part of the generic-tech read.
 */
function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-block leading-none">
      <span className="text-wordmark block">Data &amp; AI Academy</span>
      {!compact && (
        <span className="mt-1.5 flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-px w-6 bg-[var(--color-line-strong)]"
          />
          <span className="text-mono text-[0.6rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            Training &amp; Certification
          </span>
        </span>
      )}
    </span>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="night sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-ground)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="min-w-0">
            {/* Descriptor line hides below sm so the wordmark + CTA fit at
                375px without overflow. */}
            <span className="hidden sm:block">
              <Wordmark />
            </span>
            <span className="block sm:hidden">
              <Wordmark compact />
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-body-sm text-[var(--color-ink-quiet)] lg:flex"
          >
            <Link href="/programmes" className="hover:text-[var(--color-ink)]">
              Programmes
            </Link>
            <Link href="/#delivery" className="hover:text-[var(--color-ink)]">
              How it works
            </Link>
            <Link href="/trainers" className="hover:text-[var(--color-ink)]">
              Trainers
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
            <Button href="/programmes">
              <span className="hidden sm:inline">Explore programmes</span>
              <span className="sm:hidden">Programmes</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="night border-t border-[var(--color-line)]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-14 text-body-sm text-[var(--color-ink-quiet)] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 text-[var(--color-ink)]">
              <Wordmark />
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
                href="/programmes"
                className="underline underline-offset-4 hover:text-[var(--color-ink)]"
              >
                Programmes
              </Link>{" "}
              ·{" "}
              <Link
                href="/trainers"
                className="underline underline-offset-4 hover:text-[var(--color-ink)]"
              >
                Trainers
              </Link>{" "}
              · Certification · For organisations
            </p>
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
