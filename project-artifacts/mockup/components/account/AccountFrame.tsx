"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { demoParticipant } from "@/data/demoParticipant";
import { SignInGate } from "./SignInGate";
import { endDemoSession, useDemoSession } from "@/lib/demoSession";

/**
 * Frame for every /account/* screen — 2026-09-20. Sidebar on desktop, a
 * scrolling tab row on mobile, and a persistent banner saying this is a
 * demo session over sample data.
 *
 * The "not signed in" branch (SignInGate) is a client-side check on the
 * demo flag (lib/demoSession.ts) — NOT access control. The page files are
 * static and fetchable by anyone; the real product enforces access on the
 * server.
 */

const items = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/programme", label: "Programme" },
  { href: "/account/programmes", label: "My registrations" },
  { href: "/account/certificate", label: "Certificate" },
  { href: "/account/orders", label: "Orders & receipts" },
  { href: "/account/skills", label: "Skills profile" },
  { href: "/account/profile", label: "Profile & security" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/help", label: "Help" },
];

function isActive(pathname: string, href: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  // Exact match for "/account" and "/account/programme" — the latter is a
  // string prefix of "/account/programmes", which is a different screen.
  return href === "/account" || href === "/account/programme"
    ? path === href
    : path === href || path.startsWith(`${href}/`);
}

export function AccountFrame({ children }: { children: ReactNode }) {
  const state = useDemoSession();
  const pathname = usePathname() ?? "/account";
  const router = useRouter();

  if (state === "unknown") {
    return <div className="min-h-[60vh] bg-[var(--color-ground-tint)]" aria-hidden="true" />;
  }

  if (state === "out") {
    return (
      <SignInGate
        title="You are not signed in"
        body="Sign in to see the programme, your registration, orders and profile. This wireframe has a demo account — its details are pre-filled on the sign-in page."
      />
    );
  }

  return (
    <>
      <div className="border-b border-[var(--color-line)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]">
        <p
          role="note"
          className="text-body-sm mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6"
        >
          <span>
            <strong className="font-semibold">Demo session — sample data.</strong>{" "}
            A wireframe: no real account exists, and every date, order and
            payment here is illustrative.
          </span>
          <button
            type="button"
            onClick={() => {
              endDemoSession();
              router.push("/sign-out");
            }}
            className="underline underline-offset-4 hover:opacity-80"
          >
            End demo session
          </button>
        </p>
      </div>
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10 lg:py-12">
          <nav aria-label="Account" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <p className="text-label mb-3 hidden lg:block">{demoParticipant.name}</p>
            <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`block whitespace-nowrap rounded-[var(--radius-plate)] px-3 py-2 text-body-sm transition-colors ${
                        active
                          ? "bg-[var(--color-ground-raised)] font-medium text-[var(--color-ink)] shadow-[0_1px_0_var(--color-line)]"
                          : "text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-raised)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </>
  );
}
