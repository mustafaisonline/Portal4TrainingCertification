"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { footerExplore, footerLegal, primaryNav, verifyLink } from "@/shared/chrome/site-nav";
import { initialsOf } from "@/shared/util/initials";

/** The header items, then the footer items the header does not already list, then the legal links — the menu carries ALL of them (founder, 2026-10-01). */
const MENU_LINKS = primaryNav;
const MORE_LINKS = [...footerExplore.filter((l) => !primaryNav.some((p) => p.href === l.href)), verifyLink];

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/account/
 * AccountMenu.tsx (ADR-045). Changed: no demo session and no `demoParticipant`
 * — the signed-in person's name, email and role flags arrive as props from
 * the server component (AccountControls), which read them from OUR `users`
 * and `user_roles` rows; initials are computed from the name. "Sign out" is
 * a plain link to /sign-out, which performs the real sign-out. The
 * signed-out branch and `MobileAccountActions` were not ported —
 * AccountControls renders those. The `hidden sm:block` wrapper is gone:
 * PublicShell already hides the slot below `sm`.
 *
 * RESTRUCTURED 2026-09-28 (founder: "In burger menu, we need … Name … Email
 * … Line … User Dashboard … Trainer Dashboard … Admin Dashboard … Line …
 * Sign-Out"): the per-tab links from account-nav.ts (Profile, My Trainings,
 * Certifications, …) are gone from this menu — they live inside /account
 * itself, reached now through the single "User Dashboard" entry. Trainer
 * Dashboard and Admin Dashboard both point at /admin, already scoped to
 * what each role may see (Milestone 12); either, both or neither shows,
 * depending on the signed-in person's roles.
 */

const itemClass =
  "block rounded-[var(--radius-plate)] px-3 py-2 text-body-sm text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-tint)] hover:text-[var(--color-ink)]";

export function AccountMenu({
  name,
  email,
  isTrainer,
  isOrganisation = false,
  isAdmin,
  hasPhoto = false,
  photoVersion = 0,
}: {
  name: string;
  email: string;
  isTrainer: boolean;
  /** Holds the Organisation role (CR-2026-10-01-1711). */
  isOrganisation?: boolean;
  isAdmin: boolean;
  /** Milestone 5a: show the profile photo (from the session-gated route)
   *  instead of the initials. `photoVersion` busts the browser cache. */
  hasPhoto?: boolean;
  photoVersion?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // CR-2026-10-02-2012 (founder: "Show Name instead of account"): the header
  // button shows the person's first name; the full name stays in the menu and
  // in the accessible name.
  const firstName = name.trim().split(/\s+/)[0] || "Account";

  return (
    // CR-2026-10-02-2013: below `sm` the wrapper is not positioned, so the open
    // menu anchors to the sticky header and spans its width (a 16rem panel
    // anchored to a phone-sized avatar would run off the left edge).
    <div ref={ref} className="static sm:relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Account menu for ${name}`}
        data-testid="header-account"
        className="flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] py-1 pl-1 pr-1 text-body-sm md:pr-3 text-[var(--color-ink)] hover:border-[var(--color-primary)]"
      >
        <span
          aria-hidden="true"
          data-testid="header-avatar"
          className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-[var(--color-action)] text-[0.7rem] font-semibold text-[var(--color-action-ink)]"
        >
          {hasPhoto ? (
            // A plain <img>: the bytes are session-gated, not an optimisable asset.
            <img src={`/api/me/photo?v=${photoVersion}`} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(name)
          )}
        </span>
        <span className="hidden max-w-[16ch] truncate md:inline" data-testid="header-account-name">
          {firstName}
        </span>
      </button>
      {open && (
        <div
          data-testid="account-menu"
          className="absolute inset-x-4 top-full z-20 mt-2 max-h-[80vh] overflow-y-auto sm:inset-x-auto sm:right-0 sm:w-64 rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] p-2 shadow-[0_10px_30px_rgba(16,24,40,0.18)]"
        >
          <p className="px-3 pb-2 pt-1">
            <span className="block text-body-sm font-medium text-[var(--color-ink)]">{name}</span>
            <span className="block truncate text-body-sm text-[var(--color-ink-quiet)]">{email}</span>
          </p>
          <ul className="border-t border-[var(--color-line)] pt-1">
            <li>
              <Link href="/account" onClick={() => setOpen(false)} className={itemClass}>
                User Dashboard
              </Link>
            </li>
            {isTrainer && (
              <li>
                <Link href="/admin" onClick={() => setOpen(false)} className={itemClass}>
                  Trainer Dashboard
                </Link>
              </li>
            )}
            {isOrganisation && (
              <li>
                <Link href="/organisation" onClick={() => setOpen(false)} className={itemClass} data-testid="menu-organisation-dashboard">
                  Organisation Dashboard
                </Link>
              </li>
            )}
            {isAdmin && (
              <li>
                <Link href="/admin" onClick={() => setOpen(false)} className={itemClass}>
                  Admin Dashboard
                </Link>
              </li>
            )}
          </ul>
          {/* Every header and footer item, so this menu is complete on its own (founder, 2026-10-01). */}
          <nav aria-label="Site menu" className="mt-1 border-t border-[var(--color-line)] pt-1" data-testid="account-menu-links">
            <p className="text-label px-3 pb-1 pt-2">Menu</p>
            <ul>
              {MENU_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className={itemClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-label px-3 pb-1 pt-3">More</p>
            <ul>
              {MORE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className={itemClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-label px-3 pb-1 pt-3">Legal</p>
            <ul>
              {footerLegal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className={itemClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href="/sign-out"
            onClick={() => setOpen(false)}
            className={`${itemClass} mt-1 border-t border-[var(--color-line)]`}
          >
            Sign out
          </Link>
        </div>
      )}
    </div>
  );
}
