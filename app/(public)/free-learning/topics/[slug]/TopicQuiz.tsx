"use client";

import Link from "next/link";
import { useActionState } from "react";
import { checkTopicAnswersAction, type QuizCheckState } from "@/modules/free-learning/quiz.actions";
import type { ReaderQuestionPage } from "@/modules/free-learning/quiz.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormStatus } from "@/shared/ui/forms";

/*
 * The topic self-check (Milestone 14 Phase 3; founder: "100 questions with
 * 10 questions pagination … Submit on each page to see which answers they
 * have given correct or wrong"). One page of reviewed questions, five
 * options each, radio buttons; Submit asks the server (the correct options
 * are NOT in this page's HTML); the result marks each question right or
 * wrong, shows the correct option and the explanation. Nothing is stored.
 */

const LETTERS = ["A", "B", "C", "D", "E"];
const initial: QuizCheckState = { status: "idle" };

export function TopicQuiz({ topicSlug, page }: { topicSlug: string; page: ReaderQuestionPage }) {
  const [state, action, pending] = useActionState(checkTopicAnswersAction, initial);
  const resultFor = (id: string) => (state.status === "checked" ? state.results.find((r) => r.questionId === id) ?? null : null);

  return (
    <section aria-labelledby="topic-quiz-h" className="mt-8" data-testid="topic-quiz">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="topic-quiz-h" className="text-h1">
          Self-check
        </h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="quiz-range">
          Questions {page.from}–{page.to} of {page.total}
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4" aria-label="Self-check questions">
        <input type="hidden" name="topic" value={topicSlug} />
        {/* Every question on the page, so an unanswered one is marked "not
            answered" rather than silently left out of the score. */}
        <input type="hidden" name="questions" value={page.questions.map((q) => q.id).join(",")} />
        <ol className="flex list-none flex-col gap-4 p-0">
          {page.questions.map((q) => {
            const r = resultFor(q.id);
            return (
              <li key={q.id}>
                <Card variant="panel" className="p-5" data-testid="quiz-question" data-result={r ? (r.correct ? "correct" : "wrong") : "unanswered"}>
                  <p className="text-body-lg mb-3 font-medium">
                    <span className="text-[var(--color-ink-faint)]">{q.position}.</span> {q.stem}
                  </p>
                  <fieldset className="flex flex-col gap-2" disabled={state.status === "checked"}>
                    <legend className="sr-only">Question {q.position}</legend>
                    {q.options.map((o, i) => {
                      const isCorrect = r ? r.correctPosition === o.position : false;
                      const isChosen = r ? r.chosen === o.position : false;
                      return (
                        <label
                          key={o.position}
                          className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-plate)] border px-3 py-2 text-body-sm ${
                            r && isCorrect
                              ? "border-[var(--color-success)] bg-[var(--color-ground-raised)]"
                              : r && isChosen && !isCorrect
                                ? "border-[var(--color-danger)]"
                                : "border-[var(--color-line)] hover:border-[var(--color-primary)]"
                          }`}
                        >
                          <input type="radio" name={`q-${q.id}`} value={o.position} className="mt-1 accent-[var(--color-primary)]" />
                          <span>
                            <span className="text-[var(--color-ink-faint)]">{LETTERS[i]}.</span> {o.text}
                          </span>
                        </label>
                      );
                    })}
                  </fieldset>
                  {r ? (
                    <p className="text-body-sm mt-3" role="status" data-testid="quiz-verdict">
                      {r.chosen === null ? (
                        <span className="text-[var(--color-ink-quiet)]">Not answered — the correct answer is {LETTERS[r.correctPosition - 1]}.</span>
                      ) : r.correct ? (
                        <span className="font-medium text-[var(--color-success)]">Correct.</span>
                      ) : (
                        <span className="font-medium text-[var(--color-danger)]">Wrong — the correct answer is {LETTERS[r.correctPosition - 1]}.</span>
                      )}
                      {r.explanation ? <span className="block text-[var(--color-ink-quiet)]">{r.explanation}</span> : null}
                    </p>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ol>

        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "checked" ? (
          <FormStatus tone="success">
            <span data-testid="quiz-score">
              You got {state.score} of {state.of} right on this page.
            </span>
          </FormStatus>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {state.status !== "checked" ? (
            <Button type="submit" disabled={pending} data-testid="quiz-submit">
              {pending ? "Checking…" : "Submit answers"}
            </Button>
          ) : (
            <Button href={`/free-learning/topics/${topicSlug}?page=${page.page}#topic-quiz-h`} variant="secondary" data-testid="quiz-retry">
              Try this page again
            </Button>
          )}
          {page.page > 1 ? (
            <Link href={`/free-learning/topics/${topicSlug}?page=${page.page - 1}#topic-quiz-h`} className="text-body-sm text-[var(--color-primary)] underline underline-offset-4" data-testid="quiz-prev">
              ← Previous 10
            </Link>
          ) : null}
          {page.page < page.pages ? (
            <Link href={`/free-learning/topics/${topicSlug}?page=${page.page + 1}#topic-quiz-h`} className="text-body-sm text-[var(--color-primary)] underline underline-offset-4" data-testid="quiz-next">
              Next 10 →
            </Link>
          ) : null}
        </div>
      </form>
    </section>
  );
}
