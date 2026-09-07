import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Caveat,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Serif,
} from "next/font/google";
import "./globals.css";

/* No-flash theme script — 2026-09-07, added alongside promoting
   ThemeToggle from a dev-only affordance to a real, persisted one (see
   that component's header comment). Runs before hydration/paint: if the
   visitor previously chose a theme (localStorage), it's applied
   immediately via `data-theme`, so a returning dark-mode visitor doesn't
   see a flash of the light theme first. If no explicit choice exists yet,
   this does nothing — `app/globals.css`'s `prefers-color-scheme` media
   query already handles the system-preference case with no attribute
   needed. Inline and tiny by design: this has to run before first paint,
   which rules out a normal component. */
const themeInitScript = `(function(){try{var t=localStorage.getItem('mockup:theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

/*
 * Fonts are self-hosted at build time via next/font (built into Next.js —
 * no new package, no runtime font service). They expose CSS variables
 * consumed by --font-display / --font-body / --font-mono in globals.css,
 * with system stacks as fallback.
 *
 * IBM Plex superseded Newsreader + Inter portal-wide on 2026-09-02, after
 * Typography Experiment 1 was reviewed on P01 and approved. See
 * docs/design/TYPOGRAPHY_STRATEGY.md (Direction C). One superfamily gives
 * serif, sans and mono that were drawn together, so the three voices in
 * this product — editorial, interface and measured — finally relate.
 *
 * All three are loaded here rather than per-route: the masthead wordmark
 * needs the serif on every page, and the mono appears on course,
 * pricing and trainer pages.
 */
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-plex-serif",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  // 600 is needed because `text-mono text-display` (the trainer-profile
  // community-impact figures) inherits the display role's weight. Without
  // it the browser synthesises a faux bold, which smears a monospace face.
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});
/* Handwriting accent — same mechanism as the three faces above (self-hosted
   via next/font/google, no new package, no runtime font service), added
   2026-09-04 for the homepage hero's marginal handwritten-style annotations
   only ("Same Laptop. A Bigger Future.", "Work From Anywhere", "Your
   Journey Starts Here" — see app/page.tsx). Scoped to those few elements
   via `var(--font-hand)`, not adopted anywhere else in the type system. */
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  /* Required for the OG card in app/opengraph-image.tsx: Next.js resolves
     og:image to an absolute URL against this base. No real domain is settled
     yet, so it reads from the environment and falls back to localhost rather
     than hardcoding a domain that does not exist. SET THIS BEFORE LAUNCH —
     an og:image pointing at localhost will not render for anyone else. */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Data & AI Academy — Mockup",
  description:
    "Disposable Mockup/Wireframe artifact. Not the production application.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable} ${caveat.variable}`}
      // The no-flash script above sets `data-theme` on this element before
      // React hydrates, which the server-rendered markup never has (the
      // server doesn't know a visitor's stored preference) — an expected,
      // intentional mismatch on this one attribute, the same pattern every
      // no-flash dark-mode approach uses (e.g. next-themes). Without this,
      // React logs a hydration-mismatch warning for something that isn't a
      // bug; nothing else on the page is affected either way.
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
