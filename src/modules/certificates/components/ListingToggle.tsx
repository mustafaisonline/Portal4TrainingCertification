"use client";

import { useActionState, useId, useState } from "react";
import { setListingAction, type CertificateActionState } from "@/modules/certificates/certificate.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * Listing consent (M6 plan §3 E3): opt-in, default off, revocable at any
 * time. PORTED 2026-09-22 from the "Public listing" card in project-
 * artifacts/mockup/components/account/CertificateView.tsx. Changed: the
 * choice posts to `setListingAction`, which records the consent row and the
 * audit row in one transaction; the outcome sentence comes back from the
 * action — the checkbox never announces success on its own.
 */

const initial: CertificateActionState = { status: "idle" };

export function ListingToggle({ certificateId, listed }: { certificateId: string; listed: boolean }) {
  const [state, action, pending] = useActionState(setListingAction, initial);
  const [checked, setChecked] = useState(listed);
  const checkboxId = useId();
  const helpId = useId();

  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Public listing">
      <input type="hidden" name="certificateId" value={certificateId} />
      <input type="hidden" name="listed" value={checked ? "true" : "false"} />
      <div className="flex items-start gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          aria-describedby={helpId}
          data-testid="listing-toggle"
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
        />
        <label htmlFor={checkboxId} className="text-body-sm font-medium text-[var(--color-ink)]">
          List my name in public certificate search
        </label>
      </div>
      <p id={helpId} className="text-body-sm text-[var(--color-ink-quiet)]">
        When on, anyone searching by name can find this certificate. Your certificate ID and link always work whether or not you are
        listed. You can turn this off at any time.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending || checked === listed} data-testid="listing-save">
          {pending ? "Saving…" : "Save listing choice"}
        </Button>
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "done" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
      </div>
    </form>
  );
}
