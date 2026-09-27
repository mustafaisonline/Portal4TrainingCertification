"use client";

import { useActionState } from "react";
import { setAllQuestionsStatusAction, setQuestionStatusAction, type QuestionAdminState } from "@/modules/free-learning/quiz.actions";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { FormStatus } from "@/shared/ui/forms";

export type ReviewQuestion = {
  id: string;
  position: number;
  stem: string;
  explanation: string | null;
  status: "draft" | "reviewed";
  reviewedAt: string | null;
  reviewedBy: { name: string } | null;
  options: { position: number; text: string; isCorrect: boolean }[];
};

const LETTERS = ["A", "B", "C", "D", "E"];
const initial: QuestionAdminState = { status: "idle" };

function StatusForm({ topicId, questionId, next, label, testId }: { topicId: string; questionId?: string; next: "draft" | "reviewed"; label: string; testId: string }) {
  const [state, action, pending] = useActionState(questionId ? setQuestionStatusAction : setAllQuestionsStatusAction, initial);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="topicId" value={topicId} />
      {questionId ? <input type="hidden" name="questionId" value={questionId} /> : null}
      <input type="hidden" name="status" value={next} />
      <Button type="submit" variant={next === "reviewed" ? "primary" : "secondary"} disabled={pending} data-testid={testId}>
        {pending ? "Saving…" : label}
      </Button>
      {state.status === "error" ? (
        <span role="alert" className="text-body-sm text-[var(--color-danger)]">
          {state.message}
        </span>
      ) : null}
      {state.status === "done" && !questionId ? <FormStatus tone="success">{state.message}</FormStatus> : null}
    </form>
  );
}

export function QuestionReview({ topicId, questions }: { topicId: string; questions: ReviewQuestion[] }) {
  const drafts = questions.filter((q) => q.status === "draft").length;
  return (
    <div className="flex flex-col gap-4" data-testid="question-review">
      <div className="flex flex-wrap items-center gap-3">
        {drafts > 0 ? <StatusForm topicId={topicId} next="reviewed" label={`Mark all ${drafts} draft${drafts === 1 ? "" : "s"} reviewed`} testId="questions-review-all" /> : null}
        {questions.length - drafts > 0 ? <StatusForm topicId={topicId} next="draft" label="Return all to draft" testId="questions-draft-all" /> : null}
      </div>
      <ol className="flex list-none flex-col gap-4 p-0">
        {questions.map((q) => (
          <li key={q.id}>
            <Card variant="panel" className="p-5" data-testid="review-question" data-status={q.status} data-position={q.position}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Chip tone={q.status === "reviewed" ? "primary" : "neutral"}>{q.status === "reviewed" ? "Reviewed" : "Draft"}</Chip>
                {q.reviewedAt && q.reviewedBy ? (
                  <span className="text-body-sm text-[var(--color-ink-faint)]">
                    by {q.reviewedBy.name}, {new Date(q.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                ) : null}
              </div>
              <p className="text-body-lg mb-3 font-medium">
                <span className="text-[var(--color-ink-faint)]">{q.position}.</span> {q.stem}
              </p>
              <ol className="mb-3 flex list-none flex-col gap-1 p-0 text-body-sm">
                {q.options.map((o, i) => (
                  <li key={o.position} className={o.isCorrect ? "font-medium text-[var(--color-success)]" : "text-[var(--color-ink-quiet)]"} data-testid={o.isCorrect ? "review-correct" : undefined}>
                    {LETTERS[i]}. {o.text}
                    {o.isCorrect ? " ✓" : ""}
                  </li>
                ))}
              </ol>
              {q.explanation ? <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">Explanation: {q.explanation}</p> : null}
              <StatusForm
                topicId={topicId}
                questionId={q.id}
                next={q.status === "reviewed" ? "draft" : "reviewed"}
                label={q.status === "reviewed" ? "Back to draft" : "Mark reviewed"}
                testId="review-toggle"
              />
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
