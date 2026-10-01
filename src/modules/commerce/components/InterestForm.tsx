"use client";

import { useActionState } from "react";
import { registerInterestAction, type RegisterInterestState } from "@/modules/commerce/interest.actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus } from "@/shared/ui/forms";

/*
 * "Register your interest" (CR-2026-10-01-2138). A native <details> holds the
 * form so it needs no client state to open. No amount travels from the
 * browser: the server reads the fee setting in force and, for a card payer,
 * sends the person to Stripe; a participant in Pakistan registers without the
 * fee. The non-refundable wording and who sees the details are stated BEFORE
 * the button, as the founder asked.
 */

const initial: RegisterInterestState = { status: "idle" };

export function InterestForm({
  formatId,
  formatName,
  defaultEmail,
  defaultName,
  feeLabel,
  notConfiguredMessage,
}: {
  formatId: string;
  formatName: string;
  defaultEmail: string;
  defaultName: string;
  /** "USD 2.00" — null when no fee applies to this person (Pakistan). */
  feeLabel: string | null;
  notConfiguredMessage: string | null;
}) {
  const [state, action, pending] = useActionState(registerInterestAction, initial);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const buttonLabel = feeLabel ? `Register your interest — ${feeLabel} (non-refundable)` : "Register your interest — free for you";
  return (
    <details className="group mt-auto border-t border-[var(--color-line)] pt-4" data-testid={`interest-${formatId}`} open={state.status === "error" ? true : undefined}>
      <summary className="text-body-sm cursor-pointer list-none font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]" data-testid="interest-open">
        {buttonLabel}
      </summary>
      {state.status === "registered" ? (
        <div className="mt-4" role="status" data-testid="interest-registered">
          <FormStatus tone="success">{state.message}</FormStatus>
        </div>
      ) : (
        <form action={action} aria-label={`Register your interest in ${formatName}`} className="mt-4 flex flex-col gap-4" noValidate>
          <input type="hidden" name="formatId" value={formatId} />
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            {feeLabel ? (
              <>
                This records that you want this training in the <strong>{formatName}</strong> format, so the trainer can plan it. It costs <strong>{feeLabel}</strong>,
                which is <strong>non-refundable</strong> and is not credited against the training fee. It does not reserve a seat — the trainer will email you when a date is scheduled.
              </>
            ) : (
              <>
                This records that you want this training in the <strong>{formatName}</strong> format, so the trainer can plan it. No fee applies to participants in Pakistan. It does
                not reserve a seat — the trainer will email you when a date is scheduled.
              </>
            )}
          </p>
          <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={defaultEmail} star required error={errors.email} hint="The trainer writes to this address." />
          <Field label="Full name" name="fullName" autoComplete="name" defaultValue={defaultName} optional error={errors.fullName} />
          <Field label="Mobile number" name="mobile" type="tel" autoComplete="tel" optional error={errors.mobile} hint="With the country code, e.g. +60 12 345 6789." />
          <Field label="Date of birth" name="dateOfBirth" type="date" autoComplete="bday" optional error={errors.dateOfBirth} />
          <div className="flex flex-col gap-2">
            <label className="text-body-sm flex items-start gap-2 text-[var(--color-ink)]">
              <input type="checkbox" name="consent" className="mt-1 h-4 w-4" aria-invalid={errors.consent ? true : undefined} />
              <span>The trainer of this training and the Academy&rsquo;s administrators may contact me about it, and see the details above.</span>
            </label>
            {errors.consent ? (
              <span role="alert" className="text-body-sm text-[var(--color-danger)]">
                {errors.consent}
              </span>
            ) : null}
          </div>
          {notConfiguredMessage ? (
            <p role="status" className="text-body-sm rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] px-4 py-3 text-[var(--color-ink-quiet)]">
              {notConfiguredMessage}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={pending} data-testid="interest-submit">
              {pending ? (feeLabel ? "Taking you to Stripe…" : "Saving…") : feeLabel ? `Pay ${feeLabel} and register` : "Register my interest"}
            </Button>
            {state.status === "error" ? (
              <span role="alert">
                <FormStatus tone="error">{state.message}</FormStatus>
              </span>
            ) : null}
          </div>
          {feeLabel ? <p className="text-body-sm text-[var(--color-ink-faint)]">Payment is taken on Stripe&rsquo;s secure page; card details are never entered on this site.</p> : null}
        </form>
      )}
    </details>
  );
}
