"use client";

import { useEffect, useState } from "react";

/**
 * Dev/review affordance only — lets a reviewer flip light/dark without
 * changing OS settings. Deliberately in-memory: it does NOT read or write
 * localStorage. The approved localStorage boundary for this milestone is
 * scoped to diagnostic in-progress answers only (see MOCK_DATA_REGISTER.md);
 * this toggle stays out of that boundary entirely by never persisting.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() =>
        setTheme((current) =>
          (current ?? (document.documentElement.getAttribute("data-theme") as "light" | "dark" | null)) === "dark"
            ? "light"
            : "dark",
        )
      }
      className="text-label rounded-full border border-[var(--color-line-strong)] px-3 py-1.5 text-[var(--color-ink-quiet)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      aria-label="Toggle light/dark theme (review affordance, not part of the product)"
    >
      Theme
    </button>
  );
}
