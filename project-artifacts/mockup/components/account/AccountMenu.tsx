"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { demoParticipant } from "@/data/demoParticipant";
import { endDemoSession, useDemoSession } from "@/lib/demoSession";

/**
 * Header account controls — 2026-09-20. Signed out (or still resolving):
 * the "Sign in" link, exactly as before. Signed in to the DEMO session
 * (lib/demoSession.ts): an avatar menu per the specification's authenticated
 * top bar ("Profile · Billing · Settings · Sign out").
 *
 * Two exports because the header has two homes for these: the desktop row
 * (`AccountMenu`, from `sm` up) and the mobile panel (`MobileAccountActions`),
 * where the row is too tight for an avatar at 375px.
 */

const menuLinks = [
  { href: "/account", label: "My account" },
  { href: "/account/programme", label: "Programme" },
  { href: "/account/programmes", label: "My registrations" },
  { href: "/account/certificate", label: "Certificate" },
  { href: "/account/orders", label: "Orders & receipts" },
  { href: "/account/profile", label: "Profile & security" },
];

function useSignOut() {
  const router = useRouter();
  return () => {
    endDemoSession();
    router.push("/sign-out");
  };
}

export function AccountMenu() {
  const state = useDemoSession();
  const signOut = useSignOut();
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

  if (state !== "in") {
    return (
      <span className="hidden sm:inline-flex">
        <Button variant="text" href="/sign-in">
          Sign in
        </Button>
      </span>
    );
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Account menu for ${demoParticipant.name}`}
        className="flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] py-1 pl-1 pr-3 text-body-sm text-[var(--color-ink)] hover:border-[var(--color-primary)]"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-action)] text-[0.7rem] font-semibold text-[var(--color-action-ink)]"
        >
          {demoParticipant.initials}
        </span>
        <span className="hidden md:inline">Account</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] p-2 shadow-[0_10px_30px_rgba(16,24,40,0.18)]">
          <p className="px-3 pb-2 pt-1">
            <span className="block text-body-sm font-medium text-[var(--color-ink)]">
              {demoParticipant.name}
            </span>
            <span className="text-label text-[0.6rem]">Demo session</span>
          </p>
          <ul className="border-t border-[var(--color-line)] pt-1">
            {menuLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-[var(--radius-plate)] px-3 py-2 text-body-sm text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-tint)] hover:text-[var(--color-ink)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="mt-1 block w-full rounded-[var(--radius-plate)] border-t border-[var(--color-line)] px-3 py-2 text-left text-body-sm text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-tint)] hover:text-[var(--color-ink)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function MobileAccountActions({ onNavigate }: { onNavigate: () => void }) {
  const state = useDemoSession();
  const signOut = useSignOut();
  if (state !== "in") {
    return (
      <Button variant="secondary" href="/sign-in" onClick={onNavigate}>
        Sign in
      </Button>
    );
  }
  return (
    <>
      <Button variant="secondary" href="/account" onClick={onNavigate}>
        My account
      </Button>
      <Button
        variant="secondary"
        type="button"
        onClick={() => {
          onNavigate();
          signOut();
        }}
      >
        Sign out
      </Button>
    </>
  );
}
