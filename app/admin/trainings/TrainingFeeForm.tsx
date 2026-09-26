"use client";

import { useActionState, useId, useState } from "react";
import { FEE_DEFAULT_CURRENCY } from "@/modules/catalogue/programmes/constants";
import { removeTrainingFeeAction, saveTrainingFeeAction, type FormState } from "@/modules/catalogue/programmes/admin.actions";
import type { TrainingFeeErrors } from "@/modules/catalogue/programmes/admin.repository";
import { priceRegionMeta, type PriceRegion } from "@/modules/catalogue/programmes/types";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, TextAreaField } from "@/shared/ui/forms";

/*
 * One fee row (M12 WP1/WP2 — four per training: Malaysia via HRD Corp ·
 * Malaysia not via HRD Corp · Pakistan · Rest of the world). Each row is
 * its own form so a mistake in one never blocks saving another. Amounts
 * are typed in major units; the server stores minor units.
 */
export type FeeValues = {
  currency: string;
  listAmount: string;
  offerAmount: string;
  offerLabel: string;
  offerName: string;
  minParticipants: string;
  note: string;
  validFrom: string;
  validTo: string;
};

const initial: FormState<TrainingFeeErrors> = { status: "idle" };

export function TrainingFeeForm({ id, slug, region, values, exists }: { id: string; slug: string; region: PriceRegion; values: FeeValues | null; exists: boolean }) {
  const meta = priceRegionMeta(region);
  const [state, action, pending] = useActionState(saveTrainingFeeAction, initial);
  const [removeState, removeAction, removing] = useActionState(removeTrainingFeeAction, initial);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const [v, setV] = useState<FeeValues>(
    values ?? { currency: FEE_DEFAULT_CURRENCY[region], listAmount: "", offerAmount: "", offerLabel: "", offerName: meta.subtitle, minParticipants: "", note: "", validFrom: "", validTo: "" },
  );
  const [confirmRemove, setConfirmRemove] = useState(false);
  const confirmId = useId();
  const bind = (field: keyof FeeValues) => ({
    name: field,
    value: v[field],
    onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [field]: e.target.value })),
  });
  const removed = removeState.status === "saved";
  return (
    <div className="flex flex-col gap-4" data-testid={`fee-row-${region}`} data-exists={exists && !removed ? "true" : "false"}>
      <form action={action} aria-label={`Fee: ${meta.label}`} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="region" value={region} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Currency" type="text" required maxLength={3} hint="Three-letter code." error={errors.currency} {...bind("currency")} />
          <Field label="Full price" type="text" inputMode="decimal" required hint="e.g. 5000 or 5,000.00" error={errors.listAmount} {...bind("listAmount")} />
          <Field label="Today's price" type="text" inputMode="decimal" required hint="What is charged (or claimed). Equal to the full price = no discount." error={errors.offerAmount} {...bind("offerAmount")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Label beside the price" type="text" required maxLength={60} hint="e.g. 50% OFF, or Full fee" error={errors.offerLabel} {...bind("offerLabel")} />
          <Field label="Offer name" type="text" optional maxLength={120} hint="Shown at checkout; defaults to how this row pays." error={errors.offerName} {...bind("offerName")} />
          <Field label="Minimum participants" type="text" inputMode="numeric" optional hint="Blank = no minimum." error={errors.minParticipants} {...bind("minParticipants")} />
        </div>
        <TextAreaField label="Note under the price" rows={2} optional maxLength={500} hint="e.g. In-person training price. There is no online option in Malaysia." error={errors.note} {...bind("note")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valid from" type="date" optional error={errors.validFrom} {...bind("validFrom")} />
          <Field label="Valid to" type="date" optional error={errors.validTo} {...bind("validTo")} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={pending} data-testid={`fee-save-${region}`}>
            {pending ? "Saving…" : exists && !removed ? "Save fee" : "Add fee"}
          </Button>
          {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
          {state.status === "saved" ? <FormStatus tone="success">Saved.</FormStatus> : null}
        </div>
      </form>
      {exists && !removed ? (
        <form action={removeAction} aria-label={`Remove fee: ${meta.label}`} className="flex flex-wrap items-center gap-3 border-t border-[var(--color-line)] pt-3" noValidate>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="region" value={region} />
          <input type="hidden" name="confirm" value={confirmRemove ? "yes" : ""} />
          <input id={confirmId} type="checkbox" checked={confirmRemove} onChange={(e) => setConfirmRemove(e.target.checked)} className="h-4 w-4" />
          <label htmlFor={confirmId} className="text-body-sm text-[var(--color-ink-quiet)]">
            Remove this row {meta.payment === "card" ? "— participants in this region could then no longer pay by card for this training" : ""}
          </label>
          <Button type="submit" variant="text" disabled={removing || !confirmRemove} data-testid={`fee-remove-${region}`}>
            {removing ? "Removing…" : "Remove"}
          </Button>
          {removeState.status === "error" ? <FormStatus tone="error">{removeState.message}</FormStatus> : null}
        </form>
      ) : null}
    </div>
  );
}
