"use client";

import { useEffect, useState } from "react";
import "./globals.css";

/*
 * Last-resort 500: replaces the ROOT layout when that layout itself fails
 * (Next docs: error.md "Global Error"). It must render its own <html> and
 * <body>, cannot use app/layout.tsx, metadata or next/font, and so imports
 * the global stylesheet directly for the design tokens; the type falls back
 * to the system stack named in globals.css because the font variables are
 * set by the (absent) root layout. Same content contract as app/error.tsx:
 * a correlation id, no stack, no message outside development.
 */
function shortId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [fallbackId] = useState(shortId);
  const correlationId = error.digest ?? fallbackId;

  useEffect(() => {
    console.error(`[global-error] ${correlationId}`, error);
  }, [error, correlationId]);

  return (
    <html lang="en">
      <body>
        <title>Something went wrong · Data &amp; AI Academy</title>
        <main className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-6">
          <p className="text-label mb-3 text-[var(--color-primary)]">500</p>
          <h1 className="text-display mb-3" data-testid="error-title">
            Something went wrong
          </h1>
          <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">The portal could not be shown. Please try again in a moment.</p>
          <p className="text-body-sm mb-8 text-[var(--color-ink-faint)]">
            Reference: <code className="text-mono" data-testid="error-correlation-id">{correlationId}</code>
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre className="mb-8 overflow-x-auto rounded-[var(--radius-plate)] border border-[var(--color-line)] p-4 text-left text-body-sm">
              {error.message}
            </pre>
          )}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-plate)] bg-[var(--color-action)] px-5 py-2.5 text-body-sm font-medium text-[var(--color-action-ink)] hover:bg-[var(--color-action-strong)]"
            >
              Try again
            </button>
            {/* A plain anchor: next/link needs the app router, which is what just failed. */}
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] px-5 py-2.5 text-body-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
