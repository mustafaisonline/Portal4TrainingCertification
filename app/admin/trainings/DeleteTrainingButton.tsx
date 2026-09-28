"use client";

import { startTransition, useActionState, useState } from "react";
import { deleteTrainingAction, type DeleteTrainingResult } from "@/modules/catalogue/programmes/admin.actions";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormStatus } from "@/shared/ui/forms";

/*
 * Row "Delete" on /admin/trainings (founder, 2026-09-28). Platform
 * administrators only; the server refuses a training anything references
 * (dates, orders, certificates, coupons, reviews) — that one is unlisted,
 * not deleted. Confirmed through the portal's own dialog.
 */

const initial: DeleteTrainingResult = { status: "idle" };

export function DeleteTrainingButton({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState(deleteTrainingAction, initial);
  const [confirming, setConfirming] = useState(false);

  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        data-testid="training-delete"
        className="text-body-sm py-1 text-[var(--color-ink-quiet)] underline underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      <ConfirmDialog
        open={confirming}
        title={`Delete "${title}"?`}
        body="The training and its configuration are removed for good. A training with dates, orders, certificates, coupons or reviews cannot be deleted — unlist it instead."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={() => {
          setConfirming(false);
          const data = new FormData();
          data.set("id", id);
          startTransition(() => action(data));
        }}
        onCancel={() => setConfirming(false)}
      />
    </span>
  );
}
