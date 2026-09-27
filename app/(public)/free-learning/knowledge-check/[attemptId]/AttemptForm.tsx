"use client";

import { useActionState } from "react";
import { saveKnowledgeCheckPageAction, type KnowledgeCheckState } from "@/modules/free-learning/knowledge-check.actions";
import type { AttemptPage } from "@/modules/free-learning/knowledge-check.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormStatus } from "@/shared/ui/forms";

const LETTERS = ["A", "B", "C", "D", "E"];
const initial: KnowledgeCheckState = { status: "idle" };

export function AttemptForm({ attemptId, page }: { attemptId: string; page: AttemptPage }) {
  const [state, action, pending] = useActionState(saveKnowledgeCheckPageAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Knowledge Check questions" data-testid="attempt-form">
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
                    <input type="radio" name={`q-${q.id}`} value={o.position} defaultChecked={q.chosen === o.position} className="mt-1 accent-[var(--color-primary)]" />
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
        <Button type="submit" name="intent" value="finish" variant={page.page < page.pages ? "secondary" : "primary"} disabled={pending} data-testid="attempt-finish">
          {pending ? "Saving…" : "Finish and see my result"}
        </Button>
      </div>
    </form>
  );
}
