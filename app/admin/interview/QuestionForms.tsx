"use client";

import { startTransition, useActionState, useState } from "react";
import { createQuestionAction, deleteQuestionAction, setQuestionStatusAction, updateQuestionAction, type AdminAssessmentState } from "@/modules/assessment/admin.actions";
import { CATEGORY_MAX, EDITABLE_STATUSES, MODEL_ANSWER_MAX, OPTION_MAX, OPTIONS_PER_QUESTION, SOURCE_MAX, STEM_MAX, type RoleQuestionStatus } from "@/modules/assessment/constants";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Field, FormStatus, SelectField, TextAreaField } from "@/shared/ui/forms";

/*
 * Question forms and cards of /admin/interview/[roleId] and the approvals
 * queue (CR-2026-10-01-1711). A question has a category (the per-topic
 * breakdown), a stem, exactly FIVE options with ONE correct, and a detailed
 * model answer. Fields only — the rules are in the assessment repositories.
 */

const initial: AdminAssessmentState = { status: "idle" };
const LETTERS = ["A", "B", "C", "D", "E"] as const;

export type BankQuestion = {
  id: string;
  roleId: string;
  roleName: string;
  organisationName: string | null;
  category: string;
  stem: string;
  modelAnswer: string;
  source: string | null;
  status: RoleQuestionStatus;
  reviewedByName: string | null;
  options: { position: number; text: string; isCorrect: boolean }[];
};

const STATUS_LABEL: Record<RoleQuestionStatus, string> = { draft: "Draft", pending: "Pending approval", reviewed: "Reviewed", rejected: "Rejected" };

function Status({ state, testId }: { state: AdminAssessmentState; testId: string }) {
  if (state.status === "idle") return null;
  return (
    <span data-testid={testId}>
      <FormStatus tone={state.status === "done" ? "success" : "error"}>{state.message}</FormStatus>
    </span>
  );
}

type Values = { category: string; stem: string; options: string[]; correct: number; modelAnswer: string; source: string; status: "draft" | "reviewed" };

const blank: Values = { category: "", stem: "", options: ["", "", "", "", ""], correct: -1, modelAnswer: "", source: "", status: "draft" };

function valuesOf(q: BankQuestion): Values {
  const options = Array.from({ length: OPTIONS_PER_QUESTION }, (_, i) => q.options.find((o) => o.position === i + 1)?.text ?? "");
  return { category: q.category, stem: q.stem, options, correct: q.options.findIndex((o) => o.isCorrect), modelAnswer: q.modelAnswer, source: q.source ?? "", status: "draft" };
}

/** Add a question (create) or change one (edit). Values stay in the form when the server says no. */
export function QuestionForm({ roleId, question, onDone, organisations = [] }: { roleId: string; question?: BankQuestion; onDone?: () => void; /** Organisations offering this role — the administrator may add a question on one's behalf (CR-2026-10-01-2136). */ organisations?: { id: string; name: string }[] }) {
  const editing = question !== undefined;
  const [values, setValues] = useState<Values>(question ? valuesOf(question) : blank);
  const [organisationId, setOrganisationId] = useState("");
  const [state, action, pending] = useActionState(async (prev: AdminAssessmentState, formData: FormData) => {
    const next = editing ? await updateQuestionAction(prev, formData) : await createQuestionAction(prev, formData);
    if (next.status === "done") {
      if (!editing) setValues(blank);
      onDone?.();
    }
    return next;
  }, initial);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));
  const mode = editing ? "edit" : "create";

  return (
    <form action={action} className="flex flex-col gap-4" aria-label={editing ? "Edit question" : "Add a question"} data-testid={`qf-${mode}`}>
      <input type="hidden" name="roleId" value={roleId} />
      {question ? <input type="hidden" name="questionId" value={question.id} /> : null}
      {!editing && organisations.length > 0 ? (
        <SelectField
          label="Add to"
          name="organisationId"
          value={organisationId}
          onChange={(e) => setOrganisationId(e.target.value)}
          hint="The shared bank (every candidate), or an organisation's own questions — added on its behalf; they appear only in that organisation's tests."
          data-testid="qf-organisation"
        >
          <option value="">The shared question bank</option>
          {organisations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — its own questions
            </option>
          ))}
        </SelectField>
      ) : null}
      <Field label="Category" name="category" required maxLength={CATEGORY_MAX} value={values.category} onChange={(e) => set("category", e.target.value)} hint="The topic this question belongs to — it drives the candidate's per-topic breakdown." data-testid="qf-category" />
      <TextAreaField label="Question" name="stem" required rows={3} maxLength={STEM_MAX} value={values.stem} onChange={(e) => set("stem", e.target.value)} data-testid="qf-stem" />
      <div className="grid gap-3 sm:grid-cols-2">
        {LETTERS.map((letter, i) => (
          <Field
            key={letter}
            label={`Option ${letter}`}
            name={`option${i}`}
            required
            maxLength={OPTION_MAX}
            value={values.options[i] ?? ""}
            onChange={(e) => set("options", values.options.map((o, j) => (j === i ? e.target.value : o)))}
            data-testid={`qf-option-${i}`}
          />
        ))}
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-label mb-1">Correct option</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {LETTERS.map((letter, i) => (
            <label key={letter} className="text-body-sm flex items-center gap-2 text-[var(--color-ink)]">
              <input type="radio" name="correct" value={i} checked={values.correct === i} onChange={() => set("correct", i)} className="h-4 w-4" data-testid={`qf-correct-${i}`} />
              Option {letter} is correct
            </label>
          ))}
        </div>
      </fieldset>
      <TextAreaField
        label="Model answer"
        name="modelAnswer"
        required
        rows={5}
        maxLength={MODEL_ANSWER_MAX}
        value={values.modelAnswer}
        onChange={(e) => set("modelAnswer", e.target.value)}
        hint="The detailed answer a strong candidate would give in an interview — shown after the test."
        data-testid="qf-model-answer"
      />
      <Field label="Source note" name="source" optional maxLength={SOURCE_MAX} value={values.source} onChange={(e) => set("source", e.target.value)} data-testid="qf-source" />
      {editing ? null : (
        <SelectField label="Save as" name="status" value={values.status} onChange={(e) => set("status", e.target.value === "reviewed" ? "reviewed" : "draft")} data-testid="qf-status">
          <option value="draft">{organisationId ? "Pending approval (not shown to candidates yet)" : "Draft (not shown to candidates yet)"}</option>
          <option value="reviewed">{organisationId ? "Approved now" : "Reviewed (approved now)"}</option>
        </SelectField>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="qf-submit">
          {pending ? "Saving…" : editing ? "Save question" : "Add question"}
        </Button>
        {onDone ? (
          <Button type="button" variant="secondary" onClick={onDone} data-testid="qf-cancel">
            Cancel
          </Button>
        ) : null}
        <Status state={state} testId="qf-message" />
      </div>
    </form>
  );
}

/** Approve / reject / back to draft for one question; the reason (optional) goes to the audit log. */
export function QuestionStatusActions({ questionId, roleId, status, withReason = false }: { questionId: string; roleId: string; status: RoleQuestionStatus; withReason?: boolean }) {
  const [state, action, pending] = useActionState(setQuestionStatusAction, initial);
  const [reason, setReason] = useState("");
  const submit = (next: "reviewed" | "rejected" | "draft") => {
    const data = new FormData();
    data.set("questionId", questionId);
    data.set("roleId", roleId);
    data.set("status", next);
    if (reason.trim()) data.set("reason", reason.trim());
    startTransition(() => action(data));
  };
  const canApprove = status === "draft" || status === "pending" || status === "rejected";
  const canReject = status === "draft" || status === "pending";
  const canReturn = status === "reviewed" || status === "rejected";
  return (
    <div className="flex flex-col gap-2">
      {withReason ? (
        <Field label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} hint="Kept in the audit log." data-testid="question-reason" />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canApprove ? (
          <Button type="button" onClick={() => submit("reviewed")} disabled={pending} data-testid="question-approve">
            Approve
          </Button>
        ) : null}
        {canReject ? (
          <Button type="button" variant="secondary" onClick={() => submit("rejected")} disabled={pending} data-testid="question-reject">
            Reject
          </Button>
        ) : null}
        {canReturn ? (
          <Button type="button" variant="secondary" onClick={() => submit("draft")} disabled={pending} data-testid="question-to-draft">
            Back to draft
          </Button>
        ) : null}
      </div>
      <Status state={state} testId="question-status-message" />
    </div>
  );
}

/** The question's content: stem, five options with the correct one marked, the model answer. */
export function QuestionBody({ q }: { q: BankQuestion }) {
  return (
    <>
      <p className="text-body-lg mb-3 font-medium" data-testid="question-stem">
        {q.stem}
      </p>
      <ol className="text-body-sm mb-3 flex list-none flex-col gap-1 p-0">
        {q.options.map((o, i) => (
          <li key={o.position} className={o.isCorrect ? "font-medium text-[var(--color-success)]" : "text-[var(--color-ink-quiet)]"} data-testid={o.isCorrect ? "question-correct" : "question-option"}>
            {LETTERS[i]}. {o.text}
            {o.isCorrect ? " ✓ correct" : ""}
          </li>
        ))}
      </ol>
      <details className="mb-3">
        <summary className="text-body-sm cursor-pointer py-1 text-[var(--color-primary)] underline underline-offset-4">Model answer</summary>
        <p className="text-body-sm mt-2 whitespace-pre-line text-[var(--color-ink-quiet)]" data-testid="question-model-answer">
          {q.modelAnswer}
        </p>
        {q.source ? <p className="text-body-sm mt-2 text-[var(--color-ink-faint)]">Source: {q.source}</p> : null}
      </details>
    </>
  );
}

/** One question in a role's shared bank: review it, change it, delete it. */
export function BankQuestionCard({ q }: { q: BankQuestion }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [del, deleteAction, deleting] = useActionState(deleteQuestionAction, initial);
  const editable = EDITABLE_STATUSES.includes(q.status);
  return (
    <Card variant="panel" className="p-5" data-testid="bank-question" data-status={q.status} data-question-id={q.id}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Chip tone={q.status === "reviewed" ? "primary" : "neutral"}>{STATUS_LABEL[q.status]}</Chip>
        <span className="text-body-sm text-[var(--color-ink-faint)]" data-testid="question-category">
          {q.category}
        </span>
        {q.status === "reviewed" && q.reviewedByName ? <span className="text-body-sm text-[var(--color-ink-faint)]">· approved by {q.reviewedByName}</span> : null}
      </div>
      {editing ? (
        <QuestionForm roleId={q.roleId} question={q} onDone={() => setEditing(false)} />
      ) : (
        <>
          <QuestionBody q={q} />
          <div className="flex flex-wrap items-start gap-3">
            <QuestionStatusActions questionId={q.id} roleId={q.roleId} status={q.status} />
            {editable ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditing(true)} data-testid="question-edit">
                  Edit
                </Button>
                <Button type="button" variant="secondary" onClick={() => setConfirming(true)} disabled={deleting} data-testid="question-delete">
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </div>
            ) : (
              <p className="text-body-sm self-center text-[var(--color-ink-faint)]">A reviewed question is edited after returning it to draft.</p>
            )}
          </div>
          {del.status === "error" ? <FormStatus tone="error">{del.message}</FormStatus> : null}
          <ConfirmDialog
            open={confirming}
            title="Delete this question?"
            body="It is removed from the bank for good. Candidates' past results are not affected."
            confirmLabel="Delete"
            cancelLabel="Keep"
            onConfirm={() => {
              setConfirming(false);
              const data = new FormData();
              data.set("questionId", q.id);
              data.set("roleId", q.roleId);
              startTransition(() => deleteAction(data));
            }}
            onCancel={() => setConfirming(false)}
          />
        </>
      )}
    </Card>
  );
}

/** One organisation question awaiting approval — approve or reject, with an optional reason. */
export function ApprovalCard({ q }: { q: BankQuestion }) {
  return (
    <Card variant="panel" className="p-5" data-testid="approval-question" data-question-id={q.id}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Chip>{q.organisationName ?? "Shared bank"}</Chip>
        <span className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="approval-role">
          {q.roleName}
        </span>
        <span className="text-body-sm text-[var(--color-ink-faint)]">· {q.category}</span>
      </div>
      <QuestionBody q={q} />
      <QuestionStatusActions questionId={q.id} roleId={q.roleId} status={q.status} withReason />
    </Card>
  );
}
