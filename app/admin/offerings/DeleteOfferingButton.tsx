"use client";

import { startTransition, useActionState, useState } from "react";
import { deleteOfferingAction, type DeleteOfferingResult } from "@/modules/catalogue/offerings/admin.actions";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormStatus } from "@/shared/ui/forms";

/*
 * Row "Delete" on /admin/offerings (founder, 2026-09-28). Platform
 * administrators only; the server refuses a date anything references
 * (orders, registrations, certificates) — that one is cancelled, not
 * deleted. Confirmed through the portal's own dialog.
 */

const initial: DeleteOfferingResult = { status: "idle" };

export function DeleteOfferingButton({ id, label }: { id: string; label: string }) {
  const [state, action, pending] = useActionState(deleteOfferingAction, initial);
  const [confirming, setConfirming] = useState(false);

  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        data-testid="offering-delete"
        className="text-body-sm py-1 text-[var(--color-ink-quiet)] underline underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      <ConfirmDialog
        open={confirming}
        title="Delete this date?"
        body={`${label} is removed for good. A date with orders, registrations or certificates cannot be deleted — cancel it instead.`}
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
