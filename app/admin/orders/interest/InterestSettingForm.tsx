"use client";

import { useActionState, useState } from "react";
import { changeInterestSettingAction, type InterestSettingState } from "@/modules/commerce/interest.actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus } from "@/shared/ui/forms";

/* New effective-dated interest-fee setting (CR-2026-10-01-2138): on/off, amount,
   currency, label, optional effective time (Malaysia wall clock) and note. */
const initial: InterestSettingState = { status: "idle" };

export function InterestSettingForm({ current }: { current: { enabled: boolean; amount: string; currency: string; label: string } }) {
  const [state, action, pending] = useActionState(changeInterestSettingAction, initial);
  const [enabled, setEnabled] = useState(current.enabled);
  const err = (k: string) => (state.status === "error" ? state.fieldErrors?.[k] : undefined);
  const hasFieldError = state.status === "error" && !!state.fieldErrors && Object.keys(state.fieldErrors).length > 0;
  return (
    <form action={action} className="flex flex-col gap-4" data-testid="interest-setting-form" aria-label="Change the interest fee setting">
      <label className="flex items-start gap-2">
        <input type="checkbox" name="enabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="mt-1 h-4 w-4" data-testid="interest-setting-enabled" />
        <span className="text-body-sm text-[var(--color-ink)]">
          Enabled <span className="text-[var(--color-ink-faint)]">— off hides "Register your interest" everywhere and refuses new registrations; interests already registered stay registered.</span>
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Amount" name="amount" type="text" inputMode="decimal" defaultValue={current.amount} required autoComplete="off" hint="Up to two decimals. Stripe's USD minimum is 0.50. Default 2.00." error={err("amountMinor")} />
        <Field label="Currency" name="currency" type="text" defaultValue={current.currency} required minLength={3} maxLength={3} autoComplete="off" hint="Three-letter code." error={err("currency")} />
        <Field label="Label" name="label" type="text" defaultValue={current.label} required maxLength={80} autoComplete="off" hint="Shown on Stripe's page and the receipt." error={err("label")} />
      </div>
      <Field label="Effective from" name="effectiveFrom" type="datetime-local" optional hint="Read as Malaysia time. Leave blank to apply from now." error={err("effectiveFrom")} />
      <Field label="Note" name="note" type="text" optional maxLength={500} autoComplete="off" hint="Why it changed; kept with the setting and in the audit log." error={err("note")} />
      <div>
        <Button type="submit" disabled={pending} data-testid="interest-setting-submit">
          {pending ? "Saving…" : "Save setting"}
        </Button>
      </div>
      {state.status === "done" ? (
        <div data-testid="interest-setting-saved">
          <FormStatus tone="success">{state.message}</FormStatus>
        </div>
      ) : null}
      {state.status === "error" && !hasFieldError ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
