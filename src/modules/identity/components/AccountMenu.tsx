"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { accountNavItems } from "@/shared/chrome/account-nav";
import { initialsOf } from "@/shared/util/initials";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/account/
 * AccountMenu.tsx (ADR-045). Changed: no demo session and no `demoParticipant`
 * — the signed-in person's name, email and admin flag arrive as props from the
 * server component (AccountControls), which read them from OUR `users` and
 * `user_roles` rows; initials are computed from the name. The menu lists the
 * sidebar's screens (account-nav.ts, one source) and, for a platform_admin,
 * the one admin screen that exists (/admin). "Sign out" is a plain link to
 * /sign-out, which performs the real sign-out. The signed-out branch and
 * `MobileAccountActions` were not ported — AccountControls renders those.
 * The `hidden sm:block` wrapper is gone: PublicShell already hides the slot
 * below `sm`.
 */

const adminLinks = [{ href: "/admin", label: "Admin dashboard" }];

const itemClass =
  "block rounded-[var(--radius-plate)] px-3 py-2 text-body-sm text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-tint)] hover:text-[var(--color-ink)]";

export function AccountMenu({
  name,
  email,
  isAdmin,
  hasPhoto = false,
  photoVersion = 0,
}: {
  name: string;
  email: string;
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Account menu for ${name}`}
        data-testid="header-account"
        className="flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] py-1 pl-1 pr-3 text-body-sm text-[var(--color-ink)] hover:border-[var(--color-primary)]"
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
        <span className="hidden md:inline">Account</span>
      </button>
      {open && (
        <div
          data-testid="account-menu"
          className="absolute right-0 top-full z-20 mt-2 w-60 rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] p-2 shadow-[0_10px_30px_rgba(16,24,40,0.18)]"
        >
          <p className="px-3 pb-2 pt-1">
            <span className="block text-body-sm font-medium text-[var(--color-ink)]">{name}</span>
            <span className="block truncate text-body-sm text-[var(--color-ink-quiet)]">{email}</span>
          </p>
          <ul className="border-t border-[var(--color-line)] pt-1">
            {accountNavItems.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className={itemClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <ul className="mt-1 border-t border-[var(--color-line)] pt-1">
              {adminLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className={itemClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
