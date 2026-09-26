"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems, isAdminItemActive, type AdminNavItem } from "./admin-nav";

/*
 * Sub-navigation bar for /admin/* (Milestone 8 plan §2 item 1): a horizontal
 * row that scrolls sideways on narrow screens, the same treatment the
 * account frame gives its item row on mobile. The list comes from
 * ./admin-nav.ts; access is enforced server-side in app/admin/layout.tsx,
 * which renders this bar only once the gate has passed.
 */
export function AdminNav({ items = adminNavItems }: { items?: readonly AdminNavItem[] }) {
  const pathname = usePathname() ?? "/admin";
  return (
    <nav aria-label="Admin" data-testid="admin-nav">
      <ul className="-mx-4 flex gap-1 overflow-x-auto border-b border-[var(--color-line)] px-4 pb-2 sm:-mx-6 sm:px-6">
        {items.map((item) => {
          const active = isAdminItemActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-testid="admin-nav-item"
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
  );
}
