import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import Script from "next/script";
import { themeInitScript } from "@/shared/chrome/theme";
import "./globals.css";

/*
 * Root layout. Fonts and theme bootstrap PORTED 2026-09-21 from
 * project-artifacts/mockup/app/layout.tsx (ADR-045). Fonts are self-hosted:
 * the actual woff2 files live in the repository (src/fonts/, latin subset
 * only, matching the original next/font/google config) and are loaded via
 * next/font/local — no fetch to Google's servers at build time or runtime.
 * Switched 2026-09-28 (ADR-0XX) from next/font/google, which builds fine
 * but depends on reaching fonts.gstatic.com at every build; that dependency
 * caused real, intermittent CI failures. They still expose the same CSS
 * variables --font-jakarta / --font-plex-mono / --font-hand that globals.css
 * consumes — nothing downstream of this file changed.
 */
const jakarta = localFont({
  src: [
    { path: "../src/fonts/plus-jakarta-sans/PlusJakartaSans-Variable.woff2", weight: "400 800", style: "normal" },
    { path: "../src/fonts/plus-jakarta-sans/PlusJakartaSans-Variable-Italic.woff2", weight: "400 800", style: "italic" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "../src/fonts/ibm-plex-mono/IBMPlexMono-400.woff2", weight: "400", style: "normal" },
    { path: "../src/fonts/ibm-plex-mono/IBMPlexMono-500.woff2", weight: "500", style: "normal" },
    // 600 is needed because `text-mono text-display` inherits the display
    // role's weight; without it the browser synthesises a faux bold.
    { path: "../src/fonts/ibm-plex-mono/IBMPlexMono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});
/* Handwriting accent — same mechanism as the two faces above (self-hosted,
   no fetch to any font service). Ported 2026-09-21 with the homepage hero
   (M3); scoped to the hero's handwritten-style annotations via
   `var(--font-hand)`, not adopted anywhere else in the type system. */
const caveat = localFont({
  src: [{ path: "../src/fonts/caveat/Caveat-Variable.woff2", weight: "500 600", style: "normal" }],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute-URL base for social cards and canonical links. Read from the
  // environment (.env.example: APP_BASE_URL) — no domain is settled yet
  // (plan §7 M10), so nothing is hardcoded here.
  metadataBase: new URL(process.env["APP_BASE_URL"] ?? "http://localhost:3100"),
  title: {
    default: "Data & AI Academy",
    template: "%s · Data & AI Academy",
  },
  description: "Expert-led Data & AI training and certification.",
  // Nothing is indexable until launch cutover (plan §7 M10) lifts this.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${plexMono.variable} ${caveat.variable}`}
      // The no-flash script sets `data-theme` on this element before React
      // hydrates; the server can't know a visitor's stored preference. An
      // expected, intentional mismatch on this one attribute — the pattern
      // every no-flash dark-mode approach uses.
      suppressHydrationWarning
    >
      <body>
        {/* beforeInteractive: injected into <head> and run before hydration,
            so a returning dark-theme visitor never sees a light flash. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
