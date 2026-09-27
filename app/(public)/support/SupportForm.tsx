"use client";

import { useActionState, useId } from "react";
import { beginSupportPaymentAction, type SupportPayState } from "@/modules/commerce/support.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/* The one button (2026-09-27): no amount, currency or label travels from the
   browser — the server reads the setting in force and redirects to Stripe. */
const initial: SupportPayState = { status: "idle" };

export function SupportForm({ payLabel, notConfiguredMessage }: { payLabel: string; notConfiguredMessage: string | null }) {
  const [state, action, pending] = useActionState(beginSupportPaymentAction, initial);
  const statusId = useId();
  return (
    <form action={action} aria-label="Support the Academy" aria-describedby={statusId} className="flex flex-col gap-4" noValidate>
      {notConfiguredMessage ? (
        <p role="status" className="text-body-sm rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] px-4 py-3 text-[var(--color-ink-quiet)]">
          {notConfiguredMessage}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="support-pay">
          {pending ? "Taking you to Stripe…" : payLabel}
        </Button>
        <span id={statusId}>{state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}</span>
      </div>
      <p className="text-body-sm text-[var(--color-ink-faint)]">
        Payment is taken on Stripe&rsquo;s secure page; card details are never entered on this site. This is a one-off payment that unlocks nothing — it is simply a thank you, and it appears in your orders and receipts.
      </p>
    </form>
  );
}
