"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitEnquiry, type EnquiryFormState } from "@/modules/catalogue/enquiries/actions";
import { ENQUIRY_KIND_CHOICES, type EnquiryKindValue } from "@/modules/catalogue/enquiries/enquiry-validation";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, SelectField, TextAreaField } from "@/shared/ui/forms";

/*
 * The Contact Us form (CR-2026-10-03-1226). Restored from the Milestone 3 form
 * the founder retired on 2026-09-29 — the portal now shows no email address
 * anywhere, so this form is how every visitor reaches the team. Bound to the
 * `submitEnquiry` server action: field errors, a form-level status and a
 * confirmation carrying the reference.
 *
 * Controlled fields, deliberately: React resets UNCONTROLLED fields after a
 * form action resolves, which would wipe everything typed whenever the server
 * returns a validation error.
 */

const initial: EnquiryFormState = { status: "idle" };

export function EnquiryForm({
  kind,
  programmeId,
  sourcePath,
  defaultName,
  defaultEmail,
}: {
  kind: EnquiryKindValue;
  programmeId?: string;
  sourcePath: string;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState(submitEnquiry, initial);
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const [values, setValues] = useState({ name: defaultName ?? "", email: defaultEmail ?? "", organisation: "", message: "", kind });
  const bind = <K extends keyof typeof values>(field: K) => ({
    value: values[field],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value })),
  });

  if (state.status === "sent") {
    return (
      <div role="status" className="flex flex-col gap-3" data-testid="enquiry-sent">
        <p className="text-h2">Thank you — your message has been received.</p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Your reference is <span className="text-mono font-medium text-[var(--color-ink)]" data-testid="enquiry-reference">{state.reference}</span>. A member of our team will reply to the email address you gave.
        </p>
      </div>
    );
  }

  return (
    <form action={action} aria-describedby="enquiry-status" className="flex flex-col gap-5" noValidate data-testid="enquiry-form">
      {programmeId ? <input type="hidden" name="programmeId" value={programmeId} /> : null}
      <input type="hidden" name="sourcePath" value={sourcePath} />
      {/* Honeypot — real people never fill a field they cannot see. */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" type="text" name="name" autoComplete="name" required error={fieldErrors.name} {...bind("name")} />
        <Field label="Email" type="email" name="email" autoComplete="email" inputMode="email" required error={fieldErrors.email} {...bind("email")} />
      </div>
      <SelectField label="I am contacting you about" name="kind" {...bind("kind")}>
        {ENQUIRY_KIND_CHOICES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </SelectField>
      <Field label="Organisation" type="text" name="organisation" autoComplete="organization" optional error={fieldErrors.organisation} {...bind("organisation")} />
      <TextAreaField label="Your message" name="message" rows={6} required error={fieldErrors.message} hint="What would you like to know, or what are you trying to build?" {...bind("message")} />

      <p className="text-body-sm text-[var(--color-ink-faint)]">
        We use your details only to answer your message. See our{" "}
        <Link href="/privacy" className="text-[var(--color-primary)] underline underline-offset-4">
          Privacy policy
        </Link>
        .
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="enquiry-submit">
          {pending ? "Sending…" : "Send message"}
        </Button>
        <span id="enquiry-status">{state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}</span>
      </div>
    </form>
  );
}
