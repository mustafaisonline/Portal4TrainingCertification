"use client";

import { useEffect, useState } from "react";
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, type Theme } from "./theme";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/ThemeToggle.tsx
 * (ADR-045 PORT list, row 3). Behaviour unchanged: sets `data-theme` on
 * `<html>`, which app/globals.css's `:root[data-theme="dark"]` block keys
 * off, and persists the choice. Storage key and attribute now come from
 * ./theme.ts (shared with the layout's no-flash script). Rendered in the
 * header at every width — never hidden on mobile, where a bad theme matters
 * most.
 */

function IconSun() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.4 19.6l1.6-1.6M18 6l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  // null until mounted — avoids assuming a theme before reading the real
  // (persisted or system) value, which would fight the no-flash script.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute(THEME_ATTRIBUTE);
    if (current === "dark" || current === "light") {
      setTheme(current);
      return;
    }
    // No explicit choice yet: reflect the system preference so the icon
    // offers the opposite of what the visitor is actually seeing.
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute(THEME_ATTRIBUTE, next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Best-effort only — the toggle still works for this visit without
      // persistence if storage is unavailable (private browsing, etc.).
    }
  };

  if (!theme) {
    // Stable-sized placeholder pre-mount so the header doesn't shift layout
    // once the real icon appears.
    return <span aria-hidden="true" className={`inline-block h-9 w-9 ${className}`} />;
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] ${className}`}
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
