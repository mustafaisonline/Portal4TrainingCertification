"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignInGate } from "@/components/account/SignInGate";
import { useDemoSession } from "@/lib/demoSession";

/**
 * Trainer / administrator area — WIREFRAME, 2026-09-20, founder direction
 * (review finding: "no trainer/admin side at all"). Frames the operations
 * screens the participant side depends on.
 *
 * ⚠ NO ROLES EXIST. The demo account is a participant; there is no admin
 * identity, permission or server-side check. This area is gated by the same
 * demo-session flag as /account so a reviewer can walk it, and says so in a
 * banner. The real product needs scoped RBAC (ADR-020) and every action here
 * must be audited (ADR-022). Every table shows SAMPLE rows; every action
 * button is disabled.
 */
const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/offerings", label: "Dates & seats" },
  { href: "/admin/registrations", label: "Registrations & attendance" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/settings", label: "Fees & settings" },
  { href: "/admin/emails", label: "Emails" },
];

export function AdminFrame({ children }: { children: ReactNode }) {
  const state = useDemoSession();
  const pathname = (usePathname() ?? "/admin").replace(/\/+$/, "") || "/admin";
  if (state === "unknown") return <div className="min-h-[60vh] bg-[var(--color-ground-tint)]" aria-hidden="true" />;
  if (state === "out") {
    return <SignInGate title="Trainer & admin area" body="Sign in with the demo account to walk the operations wireframe. In the real product this area needs an administrator or trainer role." returnTo="/admin" />;
  }
  return (
    <>
      <div className="border-b border-[var(--color-line)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]">
        <p role="note" className="text-body-sm mx-auto max-w-[1280px] px-4 py-2 sm:px-6">
          <strong className="font-semibold">Trainer / admin wireframe — sample data.</strong>{" "}
          No roles or permissions exist yet; every action is disabled.
        </p>
      </div>
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-[1280px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10 lg:py-12">
          <nav aria-label="Admin" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <p className="text-label mb-3 hidden lg:block">Operations</p>
            <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {items.map((it) => {
                const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
                return (
                  <li key={it.href} className="shrink-0">
                    <Link href={it.href} aria-current={active ? "page" : undefined} className={`block whitespace-nowrap rounded-[var(--radius-plate)] px-3 py-2 text-body-sm transition-colors ${active ? "bg-[var(--color-ground-raised)] font-medium text-[var(--color-ink)] shadow-[0_1px_0_var(--color-line)]" : "text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-raised)] hover:text-[var(--color-ink)]"}`}>
                      {it.label}
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
