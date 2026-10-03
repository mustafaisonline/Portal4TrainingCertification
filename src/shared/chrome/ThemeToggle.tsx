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

/**
 * CR-2026-10-03-2250 (founder, 2026-10-03): the light/dark switch no longer sits in the header (the notification bell
 * took its place). `variant="row"` is the labelled row used inside the burger menu, the avatar menu and the footer.
 * `testId` keeps the three instances apart.
 */
export function ThemeToggle({ className = "", variant = "icon", testId = "theme-toggle" }: { className?: string; variant?: "icon" | "row"; testId?: string }) {
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

  // CR-2026-10-03-2250: there can now be several switches on a page (burger menu, avatar menu, footer). They all follow
  // the page's real theme, so changing it in one updates the label of the others.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const now = root.getAttribute(THEME_ATTRIBUTE);
      if (now === "dark" || now === "light") setTheme(now);
    });
    observer.observe(root, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
    return () => observer.disconnect();
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
    return <span aria-hidden="true" className={variant === "row" ? `block h-11 ${className}` : `inline-block h-9 w-9 ${className}`} />;
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggle}
        data-testid={testId}
        className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-plate)] px-2 py-2 text-left text-body-sm text-[var(--color-ink-quiet)] transition-colors hover:bg-[var(--color-ground-raised)] hover:text-[var(--color-ink)] ${className}`}
      >
        {theme === "dark" ? <IconSun /> : <IconMoon />}
        <span>{label}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-testid={testId}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] ${className}`}
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
