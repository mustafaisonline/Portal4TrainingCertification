"use client";

import { useActionState } from "react";
import { changeFeeAction, type AdminCertificateActionState } from "@/modules/certificates/admin.actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus } from "@/shared/ui/forms";

/*
 * New effective-dated renewal fee (M6 plan §3 E4). The form supplies the
 * amount, the currency, an optional effective time and a note; the action
 * validates, appends the insert-only setting and audits it. Nothing already
 * paid changes: the fee in force is read at the moment a renewal starts.
 * The effective time is typed as Malaysia wall-clock time (E6) and blank
 * means "from now".
 */

const initial: AdminCertificateActionState = { status: "idle" };

export function ChangeFeeForm({ defaultCurrency }: { defaultCurrency: string }) {
  const [state, action, pending] = useActionState(changeFeeAction, initial);
  const err = (k: string) => (state.status === "error" ? state.fieldErrors?.[k] : undefined);
  const hasFieldError = state.status === "error" && !!state.fieldErrors && Object.keys(state.fieldErrors).length > 0;
  return (
    <form action={action} className="flex flex-col gap-4" data-testid="fee-form" aria-label="Change renewal fee">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount" name="amount" type="text" inputMode="decimal" placeholder="10.00" required autoComplete="off" hint="Up to two decimals, e.g. 10.00." error={err("amountMinor")} />
        <Field
          label="Currency"
          name="currency"
          type="text"
          defaultValue={defaultCurrency}
          required
          minLength={3}
          maxLength={3}
          autoComplete="off"
          hint="Three-letter code. Renewals are charged in USD to everyone."
          error={err("currency")}
        />
      </div>
      <Field
        label="Effective from"
        name="effectiveFrom"
        type="datetime-local"
        optional
        hint="Read as Malaysia time (Asia/Kuala_Lumpur). Leave blank to apply from now. A time in the past is refused."
        error={err("effectiveFrom")}
      />
      <Field label="Note" name="note" type="text" optional maxLength={500} autoComplete="off" hint="Why the fee changed; kept with the setting and in the audit log." error={err("note")} />
      <div>
        <Button type="submit" disabled={pending} data-testid="fee-submit">
          {pending ? "Saving…" : "Set renewal fee"}
        </Button>
      </div>
      {state.status === "done" ? (
        <div data-testid="fee-saved">
          <FormStatus tone="success">{state.message}</FormStatus>
        </div>
      ) : null}
      {state.status === "error" && !hasFieldError ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
