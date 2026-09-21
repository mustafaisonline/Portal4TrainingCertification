"use client";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/signature/DiagnosticStartCard.tsx
 * (ADR-045). Changes on port: `QUESTION_COUNT_TIERS` comes from
 * `@/shared/signature/diagnostic`; the available tier is matched against an
 * optional `questionCount` prop (the real seeded count, from the repository)
 * rather than a literal — omitted, it falls back to the smallest tier, which
 * is what the mockup hard-coded. Copy and markup unchanged.
 */

import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { QUESTION_COUNT_TIERS } from "./diagnostic";

/**
 * The "before you start" card — question-count tier selector, the Start
 * button, and the Certificate-of-Attempt disclaimer. Lives in exactly one
 * place so both entry points — the homepage embed and the standalone
 * /diagnostic page's idle stage — can never drift apart.
 *
 * Only the smallest tier is backed by the seeded question set. What clicking
 * an unavailable tier does depends on where this renders:
 * - Homepage: `onUnavailableTier` navigates to the full /diagnostic page.
 * - /diagnostic itself: `onUnavailableTier` is omitted, so those tiers stay
 *   genuinely disabled — there is nowhere further to send them from here.
 */
export function DiagnosticStartCard({
  onStart,
  onUnavailableTier,
  questionCount,
}: {
  onStart: () => void;
  onUnavailableTier?: () => void;
  /** Number of questions actually available (repository count). */
  questionCount?: number;
}) {
  const availableCount = questionCount ?? QUESTION_COUNT_TIERS[0].count;
  return (
    <Card variant="feature">
      <p className="text-label mb-3">Number of questions</p>
      <div className="mb-6 flex flex-wrap gap-2.5">
        {QUESTION_COUNT_TIERS.map(({ count, tier }) => {
          const isAvailable = count === availableCount;
          const clickable = isAvailable || Boolean(onUnavailableTier);
          const toneClasses = isAvailable
            ? "border-[var(--color-primary)] text-[var(--color-primary)]"
            : clickable
              ? "border-[var(--color-line)] text-[var(--color-ink-faint)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              : "cursor-not-allowed border-[var(--color-line)] text-[var(--color-ink-faint)] opacity-60";
          return (
            <button
              key={count}
              type="button"
              disabled={!clickable}
              onClick={isAvailable ? onStart : onUnavailableTier}
              aria-disabled={!clickable}
              title={
                isAvailable
                  ? "Start the free 10-question diagnostic"
                  : onUnavailableTier
                    ? "Not available inline — continue on the full diagnostic page"
                    : "Coming soon — not yet available"
              }
              className={`text-label inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-colors ${toneClasses}`}
            >
              {count} · {tier}
              {!isAvailable && (
                <span className="text-[0.65rem] normal-case tracking-normal">
                  (soon)
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Button onClick={onStart}>Start free diagnostic (10 min)</Button>
      <p className="mt-4 text-body-sm text-[var(--color-ink-faint)]">
        The diagnostic itself is always free — no account needed. A
        Certificate of Attempt for a strong result is a separate, optional
        step: it needs a free account and a one-time USD 10 fee. See
        &ldquo;Certificate of attempt&rdquo; on your result page for
        details.
      </p>
    </Card>
  );
}
