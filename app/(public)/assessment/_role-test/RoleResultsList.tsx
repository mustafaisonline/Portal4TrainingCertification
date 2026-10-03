"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { deleteRoleResultsAction, type RoleTestState } from "@/modules/assessment/role-test.actions";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormStatus } from "@/shared/ui/forms";

/*
 * "Your results" for one role (Prepare for Interview and Organisation Interview
 * Screening share it): every finished test with its score, a link to the full
 * result, and — for a practice result — a checkbox per row with Delete selected
 * behind the portal's own confirmation dialog. A result shared with an
 * organisation is the organisation's record: it is listed without a checkbox
 * (`deletable` false) and the server refuses to delete it anyway.
 */

export type RoleResultRow = {
  id: string;
  href: string;
  score: number;
  size: number;
  percent: number;
  finishedAtLabel: string;
  /** null for interview practice (no time limit — "time taken" is not shown). */
  timeLabel: string | null;
};

const initial: RoleTestState = { status: "idle" };

export function RoleResultsList({ rows, deletable }: { rows: RoleResultRow[]; deletable: boolean }) {
  const [state, action, pending] = useActionState(deleteRoleResultsAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const [ticked, setTicked] = useState<number | null>(null);

  if (rows.length === 0) {
    return (
      <div>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">No finished test yet.</p>
        <span data-testid="role-delete-status">{state.status === "saved" ? <FormStatus tone="success">{state.message}</FormStatus> : null}</span>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      aria-label="Your results"
      onSubmit={(e) => {
        // First submit opens the portal's own dialog; Confirm re-submits with the flag set.
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
          <li key={r.id} className="text-body-sm flex flex-wrap items-start gap-3 border-b border-[var(--color-line)] pb-3 last:border-b-0 last:pb-0" data-testid="role-result-row">
            {deletable ? (
              <input
                type="checkbox"
                name="attempt"
                value={r.id}
                aria-label={`Select the result of ${r.finishedAtLabel}`}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                data-testid="role-result-select"
              />
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span>
                <strong>
                  {r.score} of {r.size}
                </strong>{" "}
                ({r.percent} %) · {r.finishedAtLabel}
              </span>
              {r.timeLabel !== null ? <span className="text-[var(--color-ink-quiet)]">Time taken {r.timeLabel}</span> : null}
            </span>
            <Link href={r.href} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="role-result-link">
              View result
            </Link>
          </li>
        ))}
      </ul>
      {deletable ? (
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--color-line)] pt-4">
          <Button type="submit" variant="secondary" disabled={pending} data-testid="role-delete-selected">
            {pending ? "Deleting…" : "Delete selected"}
          </Button>
          <span data-testid="role-delete-status">
            {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
            {state.status === "saved" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
          </span>
        </div>
      ) : null}
      <ConfirmDialog
        open={ticked !== null}
        title={ticked === 1 ? "Delete this result?" : `Delete these ${ticked ?? 0} results?`}
        body="This cannot be undone."
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
