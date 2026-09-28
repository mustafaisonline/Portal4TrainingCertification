"use client";

import { startTransition, useActionState, useState } from "react";
import { deleteOrderAction, type RegistrationActionState } from "@/modules/commerce/registration.actions";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormStatus } from "@/shared/ui/forms";

/*
 * "Delete" on an order card (founder, 2026-09-28). Shown only for orders
 * that never became money or a seat; the server action re-checks that rule
 * regardless. Confirmed through the portal's own dialog.
 */

const initial: RegistrationActionState = { status: "idle" };

export function DeleteOrder({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(deleteOrderAction, initial);
  const [confirming, setConfirming] = useState(false);

  return (
    <span className="flex flex-wrap items-center gap-3">
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        data-testid="order-delete"
        className="text-body-sm py-1 text-[var(--color-ink-quiet)] underline underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      <ConfirmDialog
        open={confirming}
        title="Delete this order?"
        body="This unpaid order will be removed from your list. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={() => {
          setConfirming(false);
          const data = new FormData();
          data.set("orderId", orderId);
          startTransition(() => action(data));
        }}
        onCancel={() => setConfirming(false)}
      />
    </span>
  );
}
