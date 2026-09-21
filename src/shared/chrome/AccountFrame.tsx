"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { accountNavItems, isAccountItemActive } from "./account-nav";

/*
 * Frame for /account/* — sidebar on desktop, scrolling tab row on mobile.
 * Structure PORTED 2026-09-21 from project-artifacts/mockup/components/
 * account/AccountFrame.tsx (ADR-045); the full item list arrived with the
 * account shell port the same day (./account-nav.ts). The demo banner and
 * the client-side sign-in gate were NOT ported (access is enforced
 * server-side in app/account/layout.tsx), and the name shown is the signed-in
 * person's, passed in by the layout.
 */
export function AccountFrame({ userName, children }: { userName: string; children: ReactNode }) {
  const pathname = usePathname() ?? "/account";
  return (
    <div className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-14">
        <nav aria-label="Account" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="text-label mb-3 hidden lg:block">{userName}</p>
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
            {accountNavItems.map((item) => {
              const active = isAccountItemActive(pathname, item.href);
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-[var(--radius-plate)] px-3 py-2 text-body-sm whitespace-nowrap transition-colors ${
                      active
                        ? "bg-[var(--color-ground-raised)] font-medium text-[var(--color-ink)] shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
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
    </div>
  );
}
