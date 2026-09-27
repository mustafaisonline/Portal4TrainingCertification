"use client";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/signature/DiagnosticStartCard.tsx
 * (ADR-045). Reduced 2026-09-27 to the ten-question diagnostic only — see
 * the component note below.
 */

import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/**
 * The "before you start" card — the Start button and the plain terms. Lives
 * in exactly one place so both entry points — the homepage band and the
 * standalone /free-learning/diagnostic page's idle stage — can never drift.
 *
 * Founder, 2026-09-27: the diagnostic is ten questions, full stop — the
 * 50 / 100 / 200 "(soon)" tiers and the Certificate-of-Attempt sentence are
 * gone. "This test is just for anyone to test their basic concepts." The
 * longer free checks are the Knowledge Check (50 / 100 / 200, account holders).
 * `onUnavailableTier` and `questionCount` stay in the signature for the
 * callers; nothing reads them now.
 */
export function DiagnosticStartCard({
  onStart,
}: {
  onStart: () => void;
  onUnavailableTier?: () => void;
  /** Number of questions actually available (repository count). */
  questionCount?: number;
}) {
  return (
    <Card variant="feature">
      <p className="text-label mb-3">Ten questions · about ten minutes</p>
      <p className="text-body-sm mb-6 max-w-[52ch] text-[var(--color-ink-quiet)]" data-testid="diagnostic-basics">
        A quick check of basic data and AI concepts — not a score, not a credential. For a longer free test with a
        verifiable result, take the Knowledge Check once you have an account.
      </p>
      <Button onClick={onStart}>Start free diagnostic (10 min)</Button>
      <p className="mt-4 text-body-sm text-[var(--color-ink-faint)]">
        Always free, no account needed — and your answers stay in your browser: we do not save your diagnostic
        results.
      </p>
    </Card>
  );
}
