import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { themeInitScript } from "@/shared/chrome/theme";
import "./globals.css";

/*
 * Root layout. Fonts and theme bootstrap PORTED 2026-09-21 from
 * project-artifacts/mockup/app/layout.tsx (ADR-045). Fonts are self-hosted at
 * build time via next/font — built into Next.js, no new package, no runtime
 * font service. They expose the CSS variables that --font-body / --font-mono
 * in globals.css consume. The mockup's third face (Caveat, homepage hero
 * annotations only) is ported with that hero in M3, not here.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-jakarta",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  // 600 is needed because `text-mono text-display` inherits the display
  // role's weight; without it the browser synthesises a faux bold.
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
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
      className={`${jakarta.variable} ${plexMono.variable}`}
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
