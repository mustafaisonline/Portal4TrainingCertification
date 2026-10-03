"use client";

import { useActionState } from "react";
import { requestTrainingReviewAction } from "@/modules/catalogue/programmes/admin.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * "Submit for review" (CR-2026-10-03-2254; founder: a Trainer's training must be approved by an administrator before it is
 * published). It tells the administrators (their bell) that this draft is ready; only an administrator can publish it.
 * Disabled until the readiness check passes — the list above it says what is still missing.
 */
const initial = { status: "idle" } as const;

export function SubmitForReviewForm({ id, ready, requestedAt, describedBy }: { id: string; ready: boolean; requestedAt: string | null; describedBy?: string }) {
  const [state, action, pending] = useActionState(requestTrainingReviewAction, initial);
  return (
    <form action={action} className="mt-3 flex flex-col gap-2" data-testid="submit-review-form" aria-label="Submit for review">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !ready} aria-describedby={!ready ? describedBy : undefined} data-testid="submit-review">
          {pending ? "Sending…" : "Submit for review"}
        </Button>
        {requestedAt && state.status !== "saved" ? (
          <span className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="review-requested">
            Last submitted {requestedAt}. The administrators have been told.
          </span>
        ) : null}
      </div>
      {state.status === "saved" ? <FormStatus tone="success">Sent. An administrator will review it and publish it.</FormStatus> : null}
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
