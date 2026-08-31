"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Question } from "@/data/questions";
import { UNSURE_OPTION } from "@/data/questions";

/**
 * Signature component — Diagnostic Question Canvas (P05, §4).
 * One question per screen, scenario-based, "I'm not sure" always present as
 * an equal-weight, unpenalised option (never visually or semantically
 * distinguished from the real options — same card, same size, no muted
 * styling), Back always permitted, no timer, no score ever shown here.
 */
export function DiagnosticQuestionCanvas({
  question,
  selected,
  onSelect,
  onBack,
  onContinue,
  canGoBack,
}: {
  question: Question;
  selected: string | null;
  onSelect: (option: string) => void;
  onBack: () => void;
  onContinue: () => void;
  canGoBack: boolean;
}) {
  const allOptions = [...question.options, UNSURE_OPTION];

  return (
    <Card variant="panel" className="mx-auto max-w-[640px]">
      <p className="text-body-lg mb-6">{question.scenario}</p>
      <div className="mb-8 flex flex-col gap-3">
        {allOptions.map((option) => {
          const isSelected = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              aria-pressed={isSelected}
              className={`rounded-[var(--radius-plate)] border px-4 py-3 text-left text-body-sm transition-colors ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-ground)] text-[var(--color-ink)]"
                  : "border-[var(--color-line)] bg-[var(--color-ground)] text-[var(--color-ink-quiet)] hover:border-[var(--color-line-strong)]"
              }`}
            >
              {option}
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
    </Card>
  );
}
