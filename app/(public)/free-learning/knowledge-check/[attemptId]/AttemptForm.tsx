"use client";

import { useActionState, useRef, useState } from "react";
import { saveKnowledgeCheckPageAction, type KnowledgeCheckState } from "@/modules/free-learning/knowledge-check.actions";
import type { AttemptPage } from "@/modules/free-learning/knowledge-check.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormStatus } from "@/shared/ui/forms";

const LETTERS = ["A", "B", "C", "D", "E"];
const initial: KnowledgeCheckState = { status: "idle" };

/*
 * One page of a Knowledge Check. Answers are saved by the server action on
 * every page change. UX review 2026-09-27 D2: "Finish" first counts what is
 * still unanswered — the answers saved on other pages plus what is ticked on
 * this one — and asks before minting a permanent result when any remain.
 */
export function AttemptForm({ attemptId, page, size }: { attemptId: string; page: AttemptPage; size: number }) {
  const [state, action, pending] = useActionState(saveKnowledgeCheckPageAction, initial);
  const [unanswered, setUnanswered] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const finishRef = useRef<HTMLButtonElement>(null);

  const countUnanswered = () => {
    const form = formRef.current;
    const savedElsewhere = page.answered - page.questions.filter((q) => q.chosen !== null).length;
    const tickedHere = form ? page.questions.filter((q) => (new FormData(form).get(`q-${q.id}`) ?? null) !== null).length : 0;
    return Math.max(0, size - savedElsewhere - tickedHere);
  };

  const onFinishClick = () => {
    const n = countUnanswered();
    if (n === 0) finishRef.current?.click();
    else setUnanswered(n);
  };

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4" aria-label="Knowledge Check questions" data-testid="attempt-form">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="page" value={page.page} />
      <ol className="flex list-none flex-col gap-4 p-0">
        {page.questions.map((q) => (
          <li key={q.id}>
            <Card variant="panel" className="p-5" data-testid="attempt-question">
              <p className="text-label mb-1 text-[var(--color-ink-faint)]">{q.topicTitle}</p>
              <p className="text-body-lg mb-3 font-medium">
                <span className="text-[var(--color-ink-faint)]">{q.number}.</span> {q.stem}
              </p>
              <fieldset className="flex flex-col gap-2">
                <legend className="sr-only">Question {q.number}</legend>
                {q.options.map((o, i) => (
                  <label key={o.position} className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-plate)] border border-[var(--color-line)] px-3 py-2 text-body-sm hover:border-[var(--color-primary)]">
                    <input type="radio" name={`q-${q.id}`} value={o.position} defaultChecked={q.chosen === o.position} className="mt-1 accent-[var(--color-primary)]" onChange={() => setUnanswered(null)} />
                    <span>
                      <span className="text-[var(--color-ink-faint)]">{LETTERS[i]}.</span> {o.text}
                    </span>
                  </label>
                ))}
              </fieldset>
            </Card>
          </li>
        ))}
      </ol>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      {unanswered !== null ? (
        <Card variant="plate" className="p-4" role="alertdialog" aria-labelledby="finish-confirm-title" data-testid="attempt-finish-confirm">
          <p id="finish-confirm-title" className="text-body-sm mb-3 font-medium">
            {unanswered} of {size} {unanswered === 1 ? "question is" : "questions are"} unanswered and will count as wrong. Finish anyway?
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" name="intent" value="finish" disabled={pending} data-testid="attempt-finish-anyway">
              {pending ? "Saving…" : "Finish anyway"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setUnanswered(null)} data-testid="attempt-keep-answering">
              Keep answering
            </Button>
          </div>
        </Card>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {page.page > 1 ? (
          <Button type="submit" name="intent" value="previous" variant="secondary" disabled={pending} data-testid="attempt-previous">
            ← Save and go back
          </Button>
        ) : null}
        {page.page < page.pages ? (
          <Button type="submit" name="intent" value="next" disabled={pending} data-testid="attempt-next">
            Save and continue →
          </Button>
        ) : null}
        {/* The visible Finish decides; the hidden submit carries the intent when nothing is unanswered. */}
        <Button type="button" variant={page.page < page.pages ? "secondary" : "primary"} disabled={pending || unanswered !== null} onClick={onFinishClick} data-testid="attempt-finish">
          {pending ? "Saving…" : "Finish and see my result"}
        </Button>
        <button ref={finishRef} type="submit" name="intent" value="finish" className="hidden" tabIndex={-1} aria-hidden="true" />
      </div>
    </form>
  );
}
