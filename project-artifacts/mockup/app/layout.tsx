import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

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
 * needs the serif on every page, and the mono appears on programme,
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
      className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        {children}
        <div className="fixed bottom-4 right-4 z-50 hidden sm:block">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
