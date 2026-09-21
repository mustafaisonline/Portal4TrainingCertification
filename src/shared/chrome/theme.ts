/*
 * Theme preference — shared between the no-flash script in app/layout.tsx
 * (runs before paint) and ThemeToggle (runs after hydration), so the two can
 * never disagree on the storage key or the attribute.
 *
 * A viewer's theme is a per-browser UI preference, not business state, so
 * localStorage is the correct layer (CLAUDE.md persistence rule: cache and
 * preferences may live client-side; product data may not). Key renamed from
 * the mockup's `mockup:theme` on port — the prefix named the artifact.
 */
export const THEME_STORAGE_KEY = "p4tc:theme";
export const THEME_ATTRIBUTE = "data-theme";

export type Theme = "light" | "dark";

/** Inline, tiny by design: it must run before first paint, which rules out a
 *  component. Applies a previously chosen theme via `data-theme`; when none
 *  is stored it does nothing and app/globals.css's `prefers-color-scheme`
 *  media query handles the system preference. */
export const themeInitScript =
  `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');` +
  `if(t==='light'||t==='dark'){document.documentElement.setAttribute('${THEME_ATTRIBUTE}',t);}}catch(e){}})();`;
