"use client";

import { useActionState, useRef, useState } from "react";
import { saveRoleAnswersAction, type RoleTestState } from "@/modules/assessment/role-test.actions";
import type { AttemptPage } from "@/modules/assessment/attempts.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormStatus } from "@/shared/ui/forms";
import { AttemptTimer } from "../../free-learning/knowledge-check/[attemptId]/AttemptTimer";
import { ResultQuestionCard } from "./ResultQuestionCard";

const LETTERS = ["A", "B", "C", "D", "E"];
const initial: RoleTestState = { status: "idle" };

/*
 * One page of a role test (Prepare for Interview and Organisation Interview
 * Screening share it). The same behaviour as the Free Assessment Check's page
 * (`AttemptForm`): answers are saved by the server action on every page change;
 * "Finish" first counts what is still unanswered and asks before finishing; the
 * countdown (the shared `AttemptTimer`, `role="timer"`) counts down from the
 * SERVER's remaining time and submits the form with the finish intent at zero —
 * the server then refuses the late save and scores the test as it stands.
 *
 * Interview practice (`practice`, CR-2026-10-03-2251) has NO countdown (`remainingMs` is null) and adds "Save and exit" and
 * "View results of this page": the page's answers are saved, then locked, and the page shows each question with the correct
 * answer and the model answer. A viewed page is read-only and still counts in the final score.
 */
export function RoleTestForm({ attemptId, page, size, remainingMs, practice }: { attemptId: string; page: AttemptPage; size: number; remainingMs: number | null; practice: boolean }) {
  const [state, action, pending] = useActionState(saveRoleAnswersAction, initial);
  const [unanswered, setUnanswered] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const finishRef = useRef<HTMLButtonElement>(null);

  const countUnanswered = () => {
    const form = formRef.current;
    const savedElsewhere = page.answered - page.questions.filter((q) => q.chosen !== null).length;
    // A viewed page has no radio buttons: its (locked) saved answers are what count.
    const tickedHere = page.viewed ? page.questions.filter((q) => q.chosen !== null).length : form ? page.questions.filter((q) => (new FormData(form).get(`q-${q.id}`) ?? null) !== null).length : 0;
    return Math.max(0, size - savedElsewhere - tickedHere);
  };

  const onFinishClick = () => {
    const n = countUnanswered();
    if (n === 0) finishRef.current?.click();
    else setUnanswered(n);
  };

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4" aria-label="Test questions" data-testid="attempt-form">
      {remainingMs !== null ? <AttemptTimer remainingMs={remainingMs} onExpire={() => finishRef.current?.click()} /> : null}
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="page" value={page.page} />
      {page.viewed ? (
        <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="page-viewed-note">
          You have viewed the results of this page, so its answers are locked. It still counts in your final score.
        </p>
      ) : null}
      <ol className="flex list-none flex-col gap-4 p-0">
        {page.questions.map((q) => (
          <li key={q.id}>
            {q.revealed ? (
              <ResultQuestionCard q={q.revealed} />
            ) : (
            <Card variant="panel" className="p-5" data-testid="attempt-question">
              <p className="text-label mb-1 text-[var(--color-ink-faint)]" data-testid="attempt-category">
                {q.category}
              </p>
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
            )}
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
        {practice && !page.viewed ? (
          <>
            <Button type="submit" name="intent" value="view" variant="secondary" disabled={pending} aria-describedby="view-results-hint" data-testid="attempt-view-results">
              View results of this page
            </Button>
            <span id="view-results-hint" className="text-body-sm basis-full text-[var(--color-ink-quiet)]" data-testid="view-results-hint">
              &ldquo;View results of this page&rdquo; saves it and shows the correct answers. You cannot change this page&rsquo;s answers afterwards.
            </span>
          </>
        ) : null}
        {practice ? (
          <Button type="submit" name="intent" value="exit" variant="secondary" disabled={pending} data-testid="attempt-save-exit">
            Save and exit
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
