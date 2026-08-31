import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data & AI Academy — Mockup",
  description:
    "Disposable Mockup/Wireframe artifact. Not the production application.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="fixed bottom-4 right-4 z-50 hidden sm:block">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
