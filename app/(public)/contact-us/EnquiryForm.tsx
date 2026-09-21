"use client";

import { useActionState, useId, useState } from "react";
import { submitEnquiry, type EnquiryFormState } from "@/modules/catalogue/enquiries/actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, inputClass } from "@/shared/ui/forms";

/*
 * PORTED 2026-09-21 from the enquiry <form> in
 * project-artifacts/mockup/app/contact-us/page.tsx (ADR-045)
 * Changed: the mockup's inert form (a "#" button and a "Not connected yet"
 * status line) is now a real form bound to the `submitEnquiry` server action —
 * field errors, a form-level status and a confirmation carrying the reference.
 * Labels and layout unchanged; inputs use the shared `Field`/`inputClass`.
 */

const initial: EnquiryFormState = { status: "idle" };

export function EnquiryForm({
  kind,
  programmeId,
  sourcePath,
}: {
  kind: "general" | "organisation" | "programme_interest";
  programmeId?: string;
  sourcePath: string;
}) {
  const [state, action, pending] = useActionState(submitEnquiry, initial);
  const messageErrorId = useId();
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  // Controlled, deliberately: React resets UNCONTROLLED fields after a form
  // action resolves, which would wipe everything typed whenever the server
  // returns a validation error (found by the e2e test).
  const [values, setValues] = useState({ name: "", email: "", organisation: "", message: "" });
  const bind = (field: keyof typeof values) => ({
    value: values[field],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value })),
  });

  if (state.status === "sent") {
    return (
      <div role="status" className="flex flex-col gap-3">
        <p className="text-h2">Thank you — your enquiry has been received.</p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Your reference is{" "}
          <span className="text-mono font-medium text-[var(--color-ink)]">{state.reference}</span>. A practitioner
          will reply to the email address you gave.
        </p>
      </div>
    );
  }

  return (
    <form action={action} aria-describedby="enquiry-status" className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="kind" value={kind} />
      {programmeId ? <input type="hidden" name="programmeId" value={programmeId} /> : null}
      <input type="hidden" name="sourcePath" value={sourcePath} />
      {/* Honeypot — real people never fill a field they cannot see. */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" type="text" name="name" autoComplete="name" required error={fieldErrors.name} {...bind("name")} />
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          error={fieldErrors.email}
          {...bind("email")}
        />
      </div>
      <Field label="Organisation" type="text" name="organisation" autoComplete="organization" optional {...bind("organisation")} />
      <label className="flex flex-col gap-2">
        <span className="text-label">What do you need?</span>
        <textarea
          name="message"
          rows={5}
          {...bind("message")}
          required
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={fieldErrors.message ? messageErrorId : undefined}
          className={`${inputClass} resize-y`}
        />
        {fieldErrors.message ? (
          <span id={messageErrorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
            {fieldErrors.message}
          </span>
        ) : null}
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send enquiry"}
        </Button>
        <span id="enquiry-status">
          {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        </span>
      </div>
    </form>
  );
}
