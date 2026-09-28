"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { deleteKnowledgeCheckResultsAction, type KnowledgeCheckState } from "@/modules/free-learning/knowledge-check.actions";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormStatus } from "@/shared/ui/forms";

/*
 * "Your results" on /free-certifications (founder, 2026-09-28): every
 * finished check with its full stats — questions, answered, correct, wrong,
 * unanswered — a checkbox per row, and Delete selected behind a
 * confirmation dialog. Deletion is the server action's: ownership, the
 * finished-only rule and the unlock-order refusal are all checked there.
 */

export type ResultRow = {
  id: string;
  passed: boolean;
  size: number;
  answered: number;
  correct: number;
  wrong: number;
  unanswered: number;
  publicId: string;
  finishedAtLabel: string;
};

const initial: KnowledgeCheckState = { status: "idle" };

export function ResultsList({ rows }: { rows: ResultRow[] }) {
  const [state, action, pending] = useActionState(deleteKnowledgeCheckResultsAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const [ticked, setTicked] = useState<number | null>(null);

  if (rows.length === 0) {
    // Still a place for the outcome sentence: deleting the LAST result
    // lands here, and "1 result deleted." must survive the re-render.
    return (
      <div>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">No finished check yet.</p>
        <span data-testid="kc-delete-status">
          {state.status === "saved" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
        </span>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      aria-label="Your results"
      onSubmit={(e) => {
        // The portal's own dialog, not the system one (founder, 2026-09-28):
        // first submit opens it; Confirm re-submits with the flag set.
        if (confirmed.current) {
          confirmed.current = false;
          return;
        }
        const count = new FormData(e.currentTarget).getAll("attempt").length;
        if (count === 0) return; // the action answers with its own sentence
        e.preventDefault();
        setTicked(count);
      }}
    >
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 border-b border-[var(--color-line)] pb-3 text-body-sm last:border-b-0 last:pb-0" data-testid="kc-result-row">
            <input
              type="checkbox"
              name="attempt"
              value={r.id}
              aria-label={`Select the ${r.size}-question result ${r.publicId}`}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
              data-testid="kc-result-select"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <Chip tone={r.passed ? "primary" : "neutral"}>{r.passed ? "Passed" : "Not passed"}</Chip>
                {r.correct} of {r.size} · {r.finishedAtLabel} ·{" "}
                <Link href={`/verify/${r.publicId}`} className="text-mono text-[var(--color-primary)] underline underline-offset-4">
                  {r.publicId}
                </Link>
              </span>
              {/* The founder's stats line: attempted, answered, correct, wrong. */}
              <span className="text-[var(--color-ink-quiet)]" data-testid="kc-result-stats">
                Questions {r.size} · Answered {r.answered} · Correct {r.correct} · Wrong {r.wrong}
                {r.unanswered > 0 ? ` · Unanswered ${r.unanswered}` : ""}
              </span>
            </span>
            <Link href={`/free-learning/knowledge-check/${r.id}/result`} className="text-[var(--color-primary)] underline underline-offset-4">
              Result
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--color-line)] pt-4">
        <Button type="submit" variant="secondary" disabled={pending} data-testid="kc-delete-selected">
          {pending ? "Deleting…" : "Delete selected"}
        </Button>
        <span data-testid="kc-delete-status">
          {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
          {state.status === "saved" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
        </span>
      </div>
      <ConfirmDialog
        open={ticked !== null}
        title={ticked === 1 ? "Delete this result?" : `Delete these ${ticked ?? 0} results?`}
        body={`The verify link${ticked === 1 ? "" : "s"} will stop working. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={() => {
          setTicked(null);
          confirmed.current = true;
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setTicked(null)}
      />
    </form>
  );
}
