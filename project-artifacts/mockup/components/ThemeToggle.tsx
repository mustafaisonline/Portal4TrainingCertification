"use client";

import { useEffect, useState } from "react";

/**
 * Light/dark theme toggle — a real, persisted product feature.
 *
 * PROMOTED 2026-09-07 from a dev/review-only affordance to a real toggle,
 * founder request ("give day and night mode options... on mobile at night
 * mode I hardly can see text"). What changed from the previous version:
 * 1. Persisted to `localStorage` (key `mockup:theme`) — a viewer's choice
 *    now survives a reload/revisit. This is a pure per-browser UI
 *    preference, not business-critical state (no product data, no
 *    workflow status), so localStorage is the right layer for it — the
 *    same distinction CLAUDE.md's persistence rule draws between "cache
 *    for performance/preferences" and state that needs a backend.
 * 2. Rendered inside `PublicShell`'s header (both the always-visible
 *    header row and the mobile menu panel — see that file) instead of a
 *    `fixed bottom-4 right-4 hidden sm:block` corner button. That
 *    `hidden sm:block` was the direct cause of "can't find it on mobile":
 *    the one control that could fix a bad theme was itself unreachable
 *    on the exact device class where it mattered most.
 * 3. Sun/moon icon instead of a plain "Theme" text label, and the
 *    aria-label states the action ("Switch to dark theme") rather than
 *    disclaiming itself as a non-product affordance.
 * The underlying mechanism is unchanged: sets `data-theme` on
 * `<html>`, which `app/globals.css`'s `:root[data-theme="dark"]` /
 * `:root[data-theme="light"]` blocks key off. See `app/layout.tsx` for
 * the small inline script that reads the persisted value before paint,
 * so a returning visitor doesn't see a flash of the wrong theme.
 */

const STORAGE_KEY = "mockup:theme";

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
  // (persisted or system) value, which would fight the no-FOUC script in
  // app/layout.tsx on first paint.
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Best-effort only — the toggle still works for this visit without
      // persistence if storage is unavailable (private browsing, etc.).
    }
  };

  if (!theme) {
    // Renders a stable-sized placeholder pre-mount so the header doesn't
    // shift layout once the real icon appears.
    return <span aria-hidden="true" className={`inline-block h-9 w-9 ${className}`} />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] ${className}`}
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
