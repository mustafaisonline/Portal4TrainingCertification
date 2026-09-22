"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";

/*
 * HTTP 500 for a route segment (MILESTONE_9_EXECUTION_PLAN.md §2 item 4).
 * Error boundaries are Client Components (Next docs: error.md). The person
 * sees the portal's styling (classes as app/not-found.tsx), a correlation id
 * and two ways out — never a stack trace or, in production, a message.
 *
 * Correlation id: Next attaches `digest` to errors thrown on the server and
 * prints the same digest in the server log, so support can match the two.
 * A client-side error has no digest; a short random id is generated once so
 * the person can still quote something.
 */
function shortId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [fallbackId] = useState(shortId);
  const correlationId = error.digest ?? fallbackId;

  useEffect(() => {
    // Browser console only; the server has already logged the digest.
    console.error(`[error-boundary] ${correlationId}`, error);
  }, [error, correlationId]);

  return (
    <main className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-6">
      <p className="text-label mb-3 text-[var(--color-primary)]">500</p>
      <h1 className="text-display mb-3" data-testid="error-title">
        Something went wrong
      </h1>
      <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
        The page could not be shown. Nothing you submitted was lost silently — if you were paying or saving something, check your
        account before trying again.
      </p>
      <p className="text-body-sm mb-8 text-[var(--color-ink-faint)]">
        Reference: <code className="text-mono" data-testid="error-correlation-id">{correlationId}</code>
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mb-8 overflow-x-auto rounded-[var(--radius-plate)] border border-[var(--color-line)] p-4 text-left text-body-sm">
          {error.message}
        </pre>
      )}
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button type="button" onClick={() => retry()}>
          Try again
        </Button>
        <Button variant="secondary" href="/">
          Home
        </Button>
      </div>
    </main>
  );
}
