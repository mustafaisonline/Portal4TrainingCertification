"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { addQuestionAction, deleteQuestionAction, updateQuestionAction, type OrganisationActionState } from "@/modules/assessment/organisation.actions";
import { CATEGORY_MAX, MODEL_ANSWER_MAX, OPTION_MAX, OPTIONS_PER_QUESTION, STEM_MAX } from "@/modules/assessment/constants";
import { validateQuestionContent } from "@/modules/assessment/question-validation";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Field, FormStatus, TextAreaField } from "@/shared/ui/forms";

/*
 * The Questions tab's client parts: the add / edit form (validated in the
 * browser with the SAME `question-validation` the server uses, then again on
 * the server) and one question row with Edit and Delete. An organisation's
 * question is Pending approval until an administrator approves it; editing an
 * approved one sends it back to Pending; an approved one cannot be deleted.
 */

const initial: OrganisationActionState = { status: "idle" };
const LETTERS = ["A", "B", "C", "D", "E"] as const;

export type QuestionView = {
  id: string;
  category: string;
  stem: string;
  modelAnswer: string;
  status: "draft" | "pending" | "reviewed" | "rejected";
  options: { text: string; isCorrect: boolean }[];
};

const STATUS_LABEL: Record<QuestionView["status"], string> = { draft: "Draft", pending: "Pending approval", reviewed: "Approved", rejected: "Rejected" };

const sentence = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s) + (/[.!?]$/.test(s) ? "" : ".");

type FormProps =
  | { mode: "add"; roleId: string; roleName: string }
  | { mode: "edit"; question: QuestionView; onDone: () => void };

export function QuestionForm(props: FormProps) {
  const editing = props.mode === "edit" ? props.question : null;
  const [state, action, pending] = useActionState(props.mode === "add" ? addQuestionAction : updateQuestionAction, initial);
  const [category, setCategory] = useState(editing?.category ?? "");
  const [stem, setStem] = useState(editing?.stem ?? "");
  const [options, setOptions] = useState<string[]>(editing ? editing.options.map((o) => o.text) : Array(OPTIONS_PER_QUESTION).fill(""));
  const [correct, setCorrect] = useState<number>(editing ? editing.options.findIndex((o) => o.isCorrect) + 1 : 0);
  const [modelAnswer, setModelAnswer] = useState(editing?.modelAnswer ?? "");
  const [clientError, setClientError] = useState<string | null>(null);

  const onDone = props.mode === "edit" ? props.onDone : null;
  useEffect(() => {
    if (state.status !== "saved") return;
    if (onDone) {
      onDone();
      return;
    }
    // A question was added: a blank form for the next one.
    setCategory("");
    setStem("");
    setOptions(Array(OPTIONS_PER_QUESTION).fill(""));
    setCorrect(0);
    setModelAnswer("");
  }, [state, onDone]);

  return (
    <form
      action={action}
      aria-label={props.mode === "add" ? "Add a question" : "Edit the question"}
      data-testid={props.mode === "add" ? "org-question-form" : "org-question-edit-form"}
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        try {
          validateQuestionContent({ category, stem, options: options.map((text, i) => ({ text, isCorrect: correct === i + 1 })), modelAnswer });
          setClientError(null);
        } catch (err) {
          e.preventDefault();
          setClientError(sentence(err instanceof Error ? err.message : "Please check the question"));
        }
      }}
    >
      {props.mode === "add" ? <input type="hidden" name="roleId" value={props.roleId} /> : <input type="hidden" name="questionId" value={props.question.id} />}
      {props.mode === "edit" && props.question.status === "reviewed" ? (
        <p className="text-body-sm rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] p-3" data-testid="org-question-edit-warning">
          This question is approved. If you save changes it returns to <strong>Pending approval</strong> and is left out of the tests until an administrator approves it again.
        </p>
      ) : null}
      <Field label="Category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={CATEGORY_MAX} required hint="The topic the question belongs to, for example Data modelling. Candidates see a score for each category." />
      <TextAreaField label="Question" name="stem" value={stem} onChange={(e) => setStem(e.target.value)} rows={3} maxLength={STEM_MAX} required />
      <fieldset className="flex flex-col gap-4">
        <legend className="text-label mb-1">Five options — choose the one correct answer</legend>
        {LETTERS.map((letter, i) => (
          <div key={letter} className="flex flex-col gap-2">
            <Field label={`Option ${letter}`} name={`option-${i + 1}`} value={options[i] ?? ""} onChange={(e) => setOptions((o) => o.map((v, j) => (j === i ? e.target.value : v)))} maxLength={OPTION_MAX} required />
            <label className="text-body-sm flex items-center gap-2">
              <input type="radio" name="correct" value={i + 1} checked={correct === i + 1} onChange={() => setCorrect(i + 1)} className="h-4 w-4 accent-[var(--color-primary)]" />
              Option {letter} is the correct answer
            </label>
          </div>
        ))}
      </fieldset>
      <TextAreaField
        label="Model answer"
        name="modelAnswer"
        value={modelAnswer}
        onChange={(e) => setModelAnswer(e.target.value)}
        rows={5}
        maxLength={MODEL_ANSWER_MAX}
        required
        hint="The detailed answer a strong candidate would give in an interview. Candidates read it after the test."
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} data-testid={props.mode === "add" ? "org-question-submit" : "org-question-save"}>
          {pending ? "Saving…" : props.mode === "add" ? "Add question" : "Save changes"}
        </Button>
        {props.mode === "edit" ? (
          <Button type="button" variant="secondary" onClick={props.onDone} data-testid="org-question-cancel">
            Cancel
          </Button>
        ) : null}
        <span data-testid={props.mode === "add" ? "org-question-status" : "org-question-edit-status"}>
          {clientError ? <FormStatus tone="error">{clientError}</FormStatus> : null}
          {!clientError && state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
          {!clientError && state.status === "saved" && props.mode === "add" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
        </span>
      </div>
    </form>
  );
}

export function QuestionItem({ question }: { question: QuestionView }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteQuestionAction, initial);

  return (
    <li className="flex flex-col gap-3 border-b border-[var(--color-line)] py-5 first:pt-0 last:border-b-0 last:pb-0" data-testid="org-question" data-status={question.status}>
      <div className="flex flex-wrap items-center gap-2">
        <span data-testid="org-question-chip">
          <Chip tone={question.status === "reviewed" ? "primary" : "neutral"}>{STATUS_LABEL[question.status]}</Chip>
        </span>
        <Chip>{question.category}</Chip>
      </div>
      {editing ? (
        <QuestionForm mode="edit" question={question} onDone={() => setEditing(false)} />
      ) : (
        <>
          <p className="text-body-md font-medium" data-testid="org-question-stem">
            {question.stem}
          </p>
          <ol className="text-body-sm flex flex-col gap-1.5" aria-label="Options">
            {question.options.map((o, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-mono shrink-0" aria-hidden="true">
                  {LETTERS[i]}.
                </span>
                <span className={o.isCorrect ? "font-medium text-[var(--color-ink)]" : "text-[var(--color-ink-quiet)]"}>
                  <span className="sr-only">Option {LETTERS[i]}: </span>
                  {o.text}
                  {o.isCorrect ? <span className="ml-2 text-[var(--color-success)]">(correct answer)</span> : null}
                </span>
              </li>
            ))}
          </ol>
          <div className="rounded-[var(--radius-plate)] bg-[var(--color-ground-tint)] p-3">
            <p className="text-label mb-1">Model answer</p>
            <p className="text-body-sm whitespace-pre-line text-[var(--color-ink-quiet)]" data-testid="org-question-model-answer">
              {question.modelAnswer}
            </p>
          </div>
          {question.status === "rejected" ? <p className="text-body-sm text-[var(--color-ink-quiet)]">An administrator did not approve this question. Edit it and it goes back for approval.</p> : null}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setEditing(true)}
              data-testid="org-question-edit"
              className="text-body-sm py-1 text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
            >
              Edit
            </button>
            {question.status === "reviewed" ? (
              <span className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="org-question-edit-first">
                Approved questions cannot be deleted. Edit it first to take it out of the tests.
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={pending}
                data-testid="org-question-delete"
                className="text-body-sm py-1 text-[var(--color-ink-quiet)] underline underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-60"
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            )}
            {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
          </div>
        </>
      )}
      {confirming ? (
        <ConfirmDialog
          open={confirming}
          title="Delete this question?"
          body="The question and its model answer will be removed. This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Keep"
          onConfirm={() => {
            setConfirming(false);
            const data = new FormData();
            data.set("questionId", question.id);
            startTransition(() => action(data));
          }}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </li>
  );
}
