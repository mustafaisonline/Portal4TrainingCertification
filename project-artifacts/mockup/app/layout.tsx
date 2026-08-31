import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Newsreader } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

/*
 * Fonts are self-hosted at build time via next/font (built into Next.js —
 * no new package, no runtime font service). Newsreader carries the
 * editorial serif display voice; Inter is the UI/body workhorse. Both
 * expose CSS variables consumed by --font-display / --font-body in
 * globals.css, with system stacks as fallback.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Data & AI Academy — Mockup",
  description:
    "Disposable Mockup/Wireframe artifact. Not the production application.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body>
        {children}
        <div className="fixed bottom-4 right-4 z-50 hidden sm:block">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
