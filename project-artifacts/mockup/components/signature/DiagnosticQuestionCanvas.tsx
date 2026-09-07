"use client";

import type { CSSProperties } from "react";
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
 *
 * `onCancel` (2026-09-05, founder request): optional — when supplied, shows
 * a "Cancel test" affordance so a user can abandon a test mid-way, distinct
 * from `onBack` (which only steps back one question to change an answer).
 * Shared by both diagnostic entry points (this file's own header note); the
 * caller owns what "cancel" means (discard progress, where to land).
 *
 * RADIO INDICATOR added 2026-09-07, founder direction, from the same
 * supplied reference image as components/HomeDiagnostic.tsx's redesign
 * (see that file's header comment) — each option now shows an explicit
 * circle (filled when selected) rather than relying on border/background
 * colour alone to signal selection. This component is shared by both
 * diagnostic entry points (this homepage embed and app/diagnostic/page.tsx
 * directly), so the change applies to both — intentional, not a scope
 * expansion: the reference image showed this same question canvas.
 *
 * VISUAL REFINEMENT + `cardClassName`/`cardStyle` added 2026-09-07, same
 * reference image, second pass ("premium interactive selection card" /
 * "hover state: slight blue tint, blue border, subtle lift" / "selected
 * state: very light blue background"): options now have a real hover
 * state (previously only the border changed) and a distinct selected
 * background (previously identical to the unselected background). Also
 * switched `aria-pressed` (toggle-button semantics) for a proper
 * `role="radiogroup"`/`role="radio"`/`aria-checked` pattern — this is a
 * single-choice list, which radio semantics describe correctly and
 * toggle-button semantics didn't; no click/keyboard behaviour changed,
 * still plain focusable buttons (not full roving-tabindex arrow-key
 * navigation — every option remains individually Tab-reachable, which is
 * simpler and still fully keyboard-operable). `cardClassName`/`cardStyle`
 * are optional and additive: omitted, this component renders exactly as
 * before (so app/diagnostic/page.tsx, which doesn't pass them, is
 * unaffected); components/HomeDiagnostic.tsx now passes both to widen the
 * card and give it the reference's own border-radius without touching
 * this component's default for its other caller.
 */
export function DiagnosticQuestionCanvas({
  question,
  selected,
  onSelect,
  onBack,
  onContinue,
  canGoBack,
  onCancel,
  // Default reproduces the pre-2026-09-07 markup exactly (`mx-auto
  // max-w-[640px]`, nothing else) — a caller-supplied value REPLACES this
  // rather than appending, specifically so two `max-w-*` Tailwind classes
  // never land on the same element (see the header comment's Card `style`
  // note — the same conflicting-utility-class risk applies to any
  // Tailwind property, not just border-radius).
  cardClassName = "max-w-[640px]",
  cardStyle,
}: {
  question: Question;
  selected: string | null;
  onSelect: (option: string) => void;
  onBack: () => void;
  onContinue: () => void;
  canGoBack: boolean;
  onCancel?: () => void;
  /** Additive className appended to the wrapping Card — see header
   *  comment. Defaults to "" so existing callers are unaffected. */
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
            className="text-body-sm text-[var(--color-ink-faint)] underline underline-offset-4 hover:text-[var(--color-ink-quiet)]"
          >
            Cancel test
          </button>
        </div>
      )}
    </Card>
  );
}
