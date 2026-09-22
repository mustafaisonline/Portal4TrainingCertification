"use client";

import { useActionState, useId, useState } from "react";
import { correctHolderNameAction, revokeCertificateAction, type AdminCertificateActionState } from "@/modules/certificates/admin.actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, inputClass } from "@/shared/ui/forms";

/*
 * Administrator actions on one certificate (M6 plan §3 E8): a name
 * correction (same ID, audited) and revocation (reason, actor, time; the
 * certificate never disappears — it verifies as Revoked). Each is a small
 * form posting to its server action; the page re-renders from the database.
 * Revocation is hidden once the certificate is revoked — there is no undo
 * path here, and the confirmation checkbox says so before the button works.
 */

const initial: AdminCertificateActionState = { status: "idle" };

export function CorrectHolderName({ certificateId, holderName }: { certificateId: string; holderName: string }) {
  const [state, action, pending] = useActionState(correctHolderNameAction, initial);
  const fieldError = state.status === "error" ? state.fieldErrors?.["holderName"] : undefined;
  return (
    <form action={action} className="flex flex-col gap-3" data-testid="correct-name-form" aria-label="Correct holder name">
      <input type="hidden" name="certificateId" value={certificateId} />
      <Field
        label="Name on the certificate"
        name="holderName"
        type="text"
        defaultValue={holderName}
        required
        maxLength={200}
        autoComplete="off"
        hint="The certificate keeps its ID; the change is recorded in the audit log. The holder asks for a correction through Contact us."
        error={fieldError}
      />
      <div>
        <Button type="submit" variant="secondary" disabled={pending} data-testid="correct-name-submit">
          {pending ? "Saving…" : "Save name"}
        </Button>
      </div>
      {state.status === "done" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
      {state.status === "error" && !fieldError ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}

export function RevokeCertificate({ certificateId, printedId }: { certificateId: string; printedId: string }) {
  const [state, action, pending] = useActionState(revokeCertificateAction, initial);
  const [confirmed, setConfirmed] = useState(false);
  const reasonId = useId();
  const reasonHintId = useId();
  const reasonErrorId = useId();
  const confirmId = useId();
  const fieldError = state.status === "error" ? state.fieldErrors?.["reason"] : undefined;

  if (state.status === "done") {
    return (
      <div data-testid="revoke-done">
        <FormStatus tone="success">{state.message}</FormStatus>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3" data-testid="revoke-form" aria-label="Revoke certificate">
      <input type="hidden" name="certificateId" value={certificateId} />
      <div className="flex flex-col gap-2">
        <label htmlFor={reasonId} className="text-label">
          Reason for revoking {printedId}
        </label>
        <textarea
          id={reasonId}
          name="reason"
          rows={3}
          required
          minLength={3}
          maxLength={500}
          aria-describedby={[reasonHintId, fieldError ? reasonErrorId : null].filter(Boolean).join(" ")}
          aria-invalid={fieldError ? true : undefined}
          className={`${inputClass} resize-y`}
        />
        <span id={reasonHintId} className="text-body-sm text-[var(--color-ink-faint)]">
          3 to 500 characters. Kept in the audit log; the holder&apos;s page says the certificate was revoked and the public verification page shows it as revoked.
        </span>
        {fieldError ? (
          <span id={reasonErrorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
            {fieldError}
          </span>
        ) : null}
      </div>
      <div className="flex items-start gap-2">
        <input id={confirmId} type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4" data-testid="revoke-confirm" />
        <label htmlFor={confirmId} className="text-body-sm text-[var(--color-ink)]">
          I understand this cannot be undone here
        </label>
      </div>
      <div>
        <Button type="submit" variant="secondary" disabled={pending || !confirmed} data-testid="revoke-submit">
          {pending ? "Revoking…" : "Revoke certificate"}
        </Button>
      </div>
      {state.status === "error" && !fieldError ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
