"use client";

import { useActionState, useId } from "react";
import { beginUnlockPaymentAction, type UnlockPayState } from "@/modules/commerce/unlock.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/* The one button (M14 Phase 5): no amount travels from the browser — the
   server reads the setting in force and redirects to Stripe. */
const initial: UnlockPayState = { status: "idle" };

export function UnlockForm({ attemptId, payLabel, notConfiguredMessage }: { attemptId: string; payLabel: string; notConfiguredMessage: string | null }) {
  const [state, action, pending] = useActionState(beginUnlockPaymentAction, initial);
  const statusId = useId();
  return (
    <form action={action} aria-label="Unlock the result document" aria-describedby={statusId} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="attemptId" value={attemptId} />
      {notConfiguredMessage ? (
        <p role="status" className="text-body-sm rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] px-4 py-3 text-[var(--color-ink-quiet)]">
          {notConfiguredMessage}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="unlock-pay">
          {pending ? "Taking you to Stripe…" : payLabel}
        </Button>
        <span id={statusId}>{state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}</span>
      </div>
      <p className="text-body-sm text-[var(--color-ink-faint)]">
        Payment is taken on Stripe&rsquo;s secure page; card details are never entered on this site. The fee is not refundable once the document has
        been shown. Your result, its ID and its verification page stay free.
      </p>
    </form>
  );
}
