"use client";

import { useActionState, useState } from "react";
import { updateProfile, type ProfileFormState } from "@/modules/identity/profile.actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus } from "@/shared/ui/forms";

/*
 * PORTED 2026-09-21 from the "Personal details" <InertForm> in
 * project-artifacts/mockup/app/account/profile/page.tsx (ADR-045).
 * Changed: a real form bound to the `updateProfile` server action, with field
 * errors and a form-level status; initial values are the person's own `users`
 * row (passed in by the server page). Email stays read-only: changing it
 * needs a verification email, which cannot be delivered yet. Fields are
 * controlled so a validation error does not wipe what was typed (same reason
 * as the enquiry form).
 */

const initial: ProfileFormState = { status: "idle" };

export function ProfileForm({ name, email, country }: { name: string; email: string; country: string | null }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const [values, setValues] = useState({ name, country: country ?? "" });
  const bind = (field: keyof typeof values) => ({
    value: values[field],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value })),
  });

  return (
    <form action={action} aria-label="Personal details" className="flex flex-col gap-5" noValidate>
      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        required
        minLength={2}
        maxLength={200}
        error={fieldErrors.name}
        {...bind("name")}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={email}
        readOnly
        hint="Changing your email is not available yet: it needs a verification email."
      />
      <Field
        label="Country"
        name="country"
        autoComplete="country-name"
        optional
        maxLength={100}
        error={fieldErrors.country}
        {...bind("country")}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="profile-save">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "saved" ? <FormStatus tone="success">Your changes have been saved.</FormStatus> : null}
      </div>
    </form>
  );
}
