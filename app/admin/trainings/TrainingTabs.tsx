"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** The six tabs of a training's workspace (M12 WP2), same treatment as the
 *  admin sub-navigation bar. */
export const TRAINING_TABS = [
  { suffix: "", label: "Details" },
  { suffix: "/content", label: "Content" },
  { suffix: "/modules", label: "Curriculum" },
  { suffix: "/formats", label: "Formats" },
  { suffix: "/fees", label: "Fees" },
  { suffix: "/dates", label: "Dates" },
] as const;

export function TrainingTabs({ id }: { id: string }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const base = `/admin/trainings/${id}`;
  return (
    <nav aria-label="Training sections" data-testid="training-tabs">
      <ul className="-mx-4 flex gap-1 overflow-x-auto border-b border-[var(--color-line)] px-4 pb-2 sm:-mx-6 sm:px-6">
        {TRAINING_TABS.map((tab) => {
          const href = `${base}${tab.suffix}`;
          const active = pathname === href;
          return (
            <li key={tab.label} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                data-testid={`training-tab-${tab.label.toLowerCase()}`}
                className={`block rounded-[var(--radius-plate)] px-3 py-2 text-body-sm whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[var(--color-ground-raised)] font-medium text-[var(--color-ink)] shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
                    : "text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-raised)] hover:text-[var(--color-ink)]"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
