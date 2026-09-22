"use client";

import Link from "next/link";
import { useActionState } from "react";
import { recordCompletionAction, type AdminCertificateActionState } from "@/modules/certificates/admin.actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus } from "@/shared/ui/forms";

/*
 * Per-participant "Record completion" (M6 plan §3 E2, §5 "Admin"). One small
 * form per roster row posting to `recordCompletionAction`; the ONLY value the
 * form supplies is the completion date (default: the offering's last day,
 * bounded by the first day and today in MYT). The action authorises itself,
 * issues the certificate in one transaction and revalidates the roster, so
 * the row re-renders from the database with the certificate.
 *
 * The component stays mounted across that re-render (the page renders it for
 * every row, whatever its state), so a successful submission keeps showing
 * "Certificate … issued" with its link after the form itself has gone.
 */

export type RosterBlock = "registration_not_confirmed" | "offering_not_ended" | "profile_incomplete" | "already_issued";

const BLOCK_TEXT: Record<RosterBlock, string> = {
  registration_not_confirmed: "Registration cancelled",
  offering_not_ended: "Offering not ended",
  profile_incomplete: "Profile incomplete — legal name required",
  already_issued: "Certificate already issued",
};

const initial: AdminCertificateActionState = { status: "idle" };

export function RecordCompletion({
  registrationId,
  registrationStatus,
  canRecord,
  reason,
  defaultDate,
  minDate,
  maxDate,
}: {
  registrationId: string;
  registrationStatus: "confirmed" | "cancelled" | "transferred";
  canRecord: boolean;
  reason: RosterBlock | null;
  /** YYYY-MM-DD: the offering's last day. */
  defaultDate: string;
  /** YYYY-MM-DD: the offering's first day. */
  minDate: string;
  /** YYYY-MM-DD: today in Asia/Kuala_Lumpur. */
  maxDate: string;
}) {
  const [state, action, pending] = useActionState(recordCompletionAction, initial);

  if (state.status === "done") {
    return (
      <div className="flex flex-col gap-1" data-testid="completion-recorded">
        <FormStatus tone="success">{state.message}</FormStatus>
        {state.certificateId ? (
          <Link href={`/admin/certificates/${state.certificateId}`} className="text-body-sm text-[var(--color-primary)] underline underline-offset-4">
            Open certificate
          </Link>
        ) : null}
      </div>
    );
  }

  if (!canRecord) {
    const text = reason === "registration_not_confirmed" && registrationStatus === "transferred" ? "Registration transferred" : reason ? BLOCK_TEXT[reason] : "Not available";
    return (
      <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="completion-blocked">
        {text}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3" data-testid="record-completion-form" aria-label="Record completion">
      <input type="hidden" name="registrationId" value={registrationId} />
      <Field
        label="Completed on"
        name="completedOn"
        type="date"
        defaultValue={defaultDate}
        min={minDate}
        max={maxDate}
        required
        hint="Malaysia calendar date; defaults to the offering's last day."
        error={state.status === "error" ? state.fieldErrors?.["completedOn"] : undefined}
      />
      <div>
        <Button type="submit" disabled={pending} className="px-3! py-1.5!" data-testid="record-completion-submit">
          {pending ? "Recording…" : "Record completion"}
        </Button>
      </div>
      {state.status === "error" && !state.fieldErrors?.["completedOn"] ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
