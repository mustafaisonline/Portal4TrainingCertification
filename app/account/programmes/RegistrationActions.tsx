"use client";

import { useActionState, useId, useState } from "react";
import {
  cancelRegistrationAction,
  transferRegistrationAction,
  type RegistrationActionState,
} from "@/modules/commerce/registration.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus, inputClass } from "@/shared/ui/forms";

/*
 * Cancel / transfer controls for one confirmed registration (M4 plan §2
 * item 6). New for the production app — the wireframe's registration list
 * had no actions. Cancellation has a confirm step that states the refund the
 * policy returns TODAY (computed server-side and passed in); transfer offers
 * the other open dates of the same programme. Both post to server actions;
 * the list re-renders from the database.
 */

const initial: RegistrationActionState = { status: "idle" };

export type TransferTarget = { id: string; label: string };

export function RegistrationActions({
  registrationId,
  refundSentence,
  canCancel,
  canTransfer,
  transferUsed,
  targets,
}: {
  registrationId: string;
  /** e.g. "If you cancel today you receive a 100 % refund (RM 4,999)." */
  refundSentence: string;
  canCancel: boolean;
  canTransfer: boolean;
  transferUsed: boolean;
  targets: TransferTarget[];
}) {
  const [cancelState, cancelAction, cancelling] = useActionState(cancelRegistrationAction, initial);
  const [transferState, transferAction, transferring] = useActionState(transferRegistrationAction, initial);
  const [confirming, setConfirming] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const selectId = useId();
  const done = cancelState.status === "done" || transferState.status === "done";

  if (done) {
    const message = cancelState.status === "done" ? cancelState.message : transferState.status === "done" ? transferState.message : "";
    return <FormStatus tone="success">{message}</FormStatus>;
  }

  return (
    <div className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-4">
      {/* Transfer */}
      {canTransfer ? (
        transferOpen ? (
          <form action={transferAction} className="flex flex-col gap-3" aria-label="Transfer to another date">
            <input type="hidden" name="registrationId" value={registrationId} />
            <label htmlFor={selectId} className="text-label">
              Transfer to another date
            </label>
            {targets.length === 0 ? (
              <p className="text-body-sm text-[var(--color-ink-quiet)]">No other date of this programme is open right now.</p>
            ) : (
              <select id={selectId} name="targetOfferingId" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Choose a date
                </option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
            <p className="text-body-sm text-[var(--color-ink-faint)]">One transfer is free, before your current date starts. It can be used once.</p>
            <div className="flex flex-wrap items-center gap-3">
              {targets.length > 0 && (
                <Button type="submit" disabled={transferring} data-testid="transfer-confirm">
                  {transferring ? "Transferring…" : "Transfer my place"}
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={() => setTransferOpen(false)}>
                Keep this date
              </Button>
              {transferState.status === "error" ? <FormStatus tone="error">{transferState.message}</FormStatus> : null}
            </div>
          </form>
        ) : null
      ) : transferUsed ? (
        <p className="text-body-sm text-[var(--color-ink-faint)]">Your one free transfer has been used.</p>
      ) : null}

      {/* Cancel */}
      {confirming ? (
        <form action={cancelAction} className="flex flex-col gap-3" aria-label="Confirm cancellation">
          <input type="hidden" name="registrationId" value={registrationId} />
          <input type="hidden" name="confirm" value="yes" />
          <p className="text-body-sm text-[var(--color-ink)]">{refundSentence} This cannot be undone.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={cancelling} data-testid="cancel-confirm">
              {cancelling ? "Cancelling…" : "Confirm cancellation"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
              Keep my place
            </Button>
            {cancelState.status === "error" ? <FormStatus tone="error">{cancelState.message}</FormStatus> : null}
          </div>
        </form>
      ) : null}

      {!confirming && !transferOpen && (
        <div className="flex flex-wrap gap-3">
          {canTransfer && (
            <Button type="button" variant="secondary" onClick={() => setTransferOpen(true)} data-testid="transfer-open">
              Transfer to another date
            </Button>
          )}
          {canCancel && (
            <Button type="button" variant="text" onClick={() => setConfirming(true)} data-testid="cancel-open">
              Cancel registration
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
