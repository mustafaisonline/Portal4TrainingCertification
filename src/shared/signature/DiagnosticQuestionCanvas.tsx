"use client";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/signature/DiagnosticQuestionCanvas.tsx
 * (ADR-045). Changes on port: `question` is typed against the repository's
 * question shape (`DiagnosticQuestion` — scenario + options) instead of the
 * mockup's `data/questions` constant type; `UNSURE_OPTION` now comes from
 * `@/shared/signature/diagnostic`. Markup, props and behaviour unchanged.
 */

import type { CSSProperties } from "react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { UNSURE_OPTION, type DiagnosticQuestion } from "./diagnostic";

/**
 * Signature component — Diagnostic Question Canvas (P05, §4).
 * One question per screen, scenario-based, "I'm not sure" always present as
 * an equal-weight, unpenalised option (never visually or semantically
 * distinguished from the real options — same card, same size, no muted
 * styling), Back always permitted, no timer, no score ever shown here.
 *
 * `onCancel`: optional — when supplied, shows a "Cancel test" affordance so a
 * user can abandon a test mid-way, distinct from `onBack` (which only steps
 * back one question to change an answer). The caller owns what "cancel"
 * means (discard progress, where to land).
 *
 * Options use a proper `role="radiogroup"`/`role="radio"`/`aria-checked`
 * pattern — a single-choice list — as plain focusable buttons (every option
 * remains individually Tab-reachable). `cardClassName`/`cardStyle` are
 * optional and additive: omitted, this component renders its default.
 */
export function DiagnosticQuestionCanvas({
  question,
  selected,
  onSelect,
  onBack,
  onContinue,
  canGoBack,
  onCancel,
  // A caller-supplied value REPLACES this rather than appending, specifically
  // so two `max-w-*` Tailwind classes never land on the same element.
  cardClassName = "max-w-[640px]",
  cardStyle,
}: {
  question: DiagnosticQuestion;
  selected: string | null;
  onSelect: (option: string) => void;
  onBack: () => void;
  onContinue: () => void;
  canGoBack: boolean;
  onCancel?: () => void;
  /** Replaces the default width class on the wrapping Card — see above. */
  cardClassName?: string;
  /** Inline style on the wrapping Card, e.g. a one-off border-radius the
   *  shared "panel" variant doesn't provide — see Card's own `style` doc
   *  comment for why inline rather than another Tailwind class. */
  cardStyle?: CSSProperties;
}) {
  const allOptions = [...question.options, UNSURE_OPTION];

  return (
    <Card
      variant="panel"
      className={`mx-auto ${cardClassName}`}
      style={cardStyle}
    >
      <p className="text-body-lg mb-6">{question.scenario}</p>
      <div
        role="radiogroup"
        aria-label={question.scenario}
        className="mb-8 flex flex-col gap-3"
      >
        {allOptions.map((option) => {
          const isSelected = selected === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option)}
              className={`flex items-center gap-3 rounded-[var(--radius-plate)] border px-4 py-3 text-left text-body-sm transition-all ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/[0.06] text-[var(--color-ink)]"
                  : "border-[var(--color-line)] bg-[var(--color-ground)] text-[var(--color-ink-quiet)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.04] hover:shadow-[0_4px_14px_rgba(16,24,40,0.06)]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  isSelected
                    ? "border-[var(--color-primary)]"
                    : "border-[var(--color-line-strong)]"
                }`}
              >
                {isSelected && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                )}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <Button
          variant="text"
          onClick={onBack}
          disabled={!canGoBack}
          className={canGoBack ? "" : "invisible"}
        >
          Back
        </Button>
        <Button onClick={onContinue} disabled={!selected}>
          Continue
        </Button>
      </div>
      {onCancel && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-body-sm py-2 text-[var(--color-ink-faint)] underline underline-offset-4 hover:text-[var(--color-ink-quiet)]"
          >
            Cancel test
          </button>
        </div>
      )}
    </Card>
  );
}
