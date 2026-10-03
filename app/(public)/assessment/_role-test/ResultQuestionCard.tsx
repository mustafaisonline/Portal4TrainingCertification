import type { RoleResultQuestion } from "@/modules/assessment/attempts.repository";
import { Card } from "@/shared/ui/Card";

const LETTERS = ["A", "B", "C", "D", "E"];

/*
 * One question with the person's answer, the correct option and the MODEL ANSWER — used by the finished result and, for
 * Prepare for Interview, by a page whose results the person chose to view mid-test (CR-2026-10-03-2251). Presentational only.
 */
export function ResultQuestionCard({ q }: { q: RoleResultQuestion }) {
  return (
    <Card variant="panel" className="p-5" data-testid="result-question" data-outcome={q.chosen === null ? "unanswered" : q.correct ? "correct" : "wrong"}>
      <p className="text-label mb-1 text-[var(--color-ink-faint)]">{q.category}</p>
      <p className="text-body-lg mb-3 font-medium">
        <span className="text-[var(--color-ink-faint)]">{q.number}.</span> {q.stem}
      </p>
      <p className="text-body-sm mb-3 font-medium" data-testid="result-outcome">
        {q.chosen === null ? (
          <span className="text-[var(--color-ink-quiet)]">Not answered</span>
        ) : q.correct ? (
          <span className="text-[var(--color-success)]">Correct</span>
        ) : (
          <span className="text-[var(--color-danger)]">Not correct</span>
        )}
      </p>
      <ul className="flex list-none flex-col gap-2 p-0">
        {q.options.map((o, i) => (
          <li
            key={o.position}
            className={`text-body-sm rounded-[var(--radius-plate)] border px-3 py-2 ${o.isCorrect ? "border-[var(--color-success)]" : o.position === q.chosen ? "border-[var(--color-danger)]" : "border-[var(--color-line)]"}`}
            data-testid="result-option"
            data-correct={o.isCorrect ? "yes" : "no"}
            data-chosen={o.position === q.chosen ? "yes" : "no"}
          >
            <span className="text-[var(--color-ink-faint)]">{LETTERS[i]}.</span> {o.text}
            {o.isCorrect ? <span className="ml-2 font-medium text-[var(--color-success)]">— Correct answer</span> : null}
            {o.position === q.chosen ? <span className="ml-2 font-medium text-[var(--color-ink)]">— Your answer</span> : null}
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] p-4" data-testid="result-model-answer">
        <p className="text-label mb-2 text-[var(--color-ink-quiet)]">Model answer</p>
        <p className="text-body-sm whitespace-pre-line">{q.modelAnswer}</p>
      </div>
    </Card>
  );
}
