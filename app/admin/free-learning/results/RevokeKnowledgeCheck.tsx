"use client";

import { useActionState, useId, useState } from "react";
import { revokeKnowledgeCheckAction, type RevokeKnowledgeCheckState } from "@/modules/free-learning/knowledge-check-admin.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus, inputClass } from "@/shared/ui/forms";

/*
 * Revoke one Knowledge Check certificate: a reason (kept in the audit log) and
 * a confirmation that it cannot be undone here — the same shape as the
 * Professional certificate's revoke form. The public verification page then
 * says Revoked.
 */
const initial: RevokeKnowledgeCheckState = { status: "idle" };

export function RevokeKnowledgeCheck({ publicId }: { publicId: string }) {
  const [state, action, pending] = useActionState(revokeKnowledgeCheckAction, initial);
  const [confirmed, setConfirmed] = useState(false);
  const reasonId = useId();
  const hintId = useId();
  const errorId = useId();
  const confirmId = useId();
  const fieldError = state.status === "error" ? state.fieldErrors?.["reason"] : undefined;

  if (state.status === "done") {
    return (
      <div data-testid="kc-revoke-done">
        <FormStatus tone="success">{state.message}</FormStatus>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3" data-testid="kc-revoke-form" aria-label={`Revoke ${publicId}`}>
      <input type="hidden" name="publicId" value={publicId} />
      <div className="flex flex-col gap-2">
        <label htmlFor={reasonId} className="text-label">
          Reason for revoking {publicId}
        </label>
        <textarea
          id={reasonId}
          name="reason"
          rows={2}
          required
          minLength={3}
          maxLength={500}
          aria-describedby={[hintId, fieldError ? errorId : null].filter(Boolean).join(" ")}
          aria-invalid={fieldError ? true : undefined}
          className={`${inputClass} resize-y`}
        />
        <span id={hintId} className="text-body-sm text-[var(--color-ink-faint)]">
          3 to 500 characters. Kept in the audit log; the public verification page shows the certificate as revoked.
        </span>
        {fieldError ? (
          <span id={errorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
            {fieldError}
          </span>
        ) : null}
      </div>
      <div className="flex items-start gap-2">
        <input id={confirmId} type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4" data-testid="kc-revoke-confirm" />
        <label htmlFor={confirmId} className="text-body-sm text-[var(--color-ink)]">
          I understand this cannot be undone here
        </label>
      </div>
      <div>
        <Button type="submit" variant="secondary" disabled={pending || !confirmed} data-testid="kc-revoke-submit">
          {pending ? "Revoking…" : "Revoke certificate"}
        </Button>
      </div>
      {state.status === "error" && !fieldError ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
