"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QUESTION_COUNT_TIERS } from "@/data/questions";

/**
 * The "before you start" card — question-count tier selector, the Start
 * button, and the Certificate-of-Attempt disclaimer. Extracted 2026-09-06,
 * founder direction ("whatever context and content we update in this
 * section, take that to /diagnostic as well"), so this content lives in
 * exactly one place and both entry points — components/HomeDiagnostic.tsx
 * (embedded on the homepage) and app/diagnostic/page.tsx (the standalone
 * page's own idle stage) — can never drift apart. The heading block above
 * it (label, "Not sure where you stand?", description, the three honest
 * bullets) stays duplicated in each caller instead: the homepage keeps it
 * visible across every stage (2026-09-05 founder request), while the
 * standalone page's version is its own page-level `<h1>` — different
 * enough in role that sharing it would fight both.
 *
 * Only "10" (Basic) is real — data/questions.ts has exactly 10 hand-written
 * questions, no 50/100/200 bank exists (see docs/MOCK_DATA_REGISTER.md).
 * What clicking an unavailable tier does depends on where this renders:
 * - Homepage: `onUnavailableTier` navigates to the full /diagnostic page —
 *   there is somewhere more dedicated to send that visitor.
 * - /diagnostic itself: `onUnavailableTier` is omitted, so those tiers stay
 *   genuinely disabled — there is nowhere further to send them from here.
 */
export function DiagnosticStartCard({
  onStart,
  onUnavailableTier,
}: {
  onStart: () => void;
  onUnavailableTier?: () => void;
}) {
  return (
    <Card variant="feature">
      <p className="text-label mb-3">Number of questions</p>
      <div className="mb-6 flex flex-wrap gap-2.5">
        {QUESTION_COUNT_TIERS.map(({ count, tier }) => {
          const isAvailable = count === 10;
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
