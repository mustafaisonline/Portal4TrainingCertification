"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { COUNTRIES } from "@/content/countries";
import { authClient } from "@/modules/identity/auth-client";
import { dobBounds, LIMITS, validateDateOfBirth } from "@/modules/identity/profile-validation";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, PasswordField, SelectField } from "@/shared/ui/forms";

const MIN_PASSWORD = 8; // founder decision 2026-09-21 (was 12)
const AS_ON_ID = "As on your government ID.";

export function RegisterForm({
  registrationOpen,
  documents,
}: {
  registrationOpen: boolean;
  documents: { href: string; label: string }[];
}) {
  const router = useRouter();
  const consentId = useId();
  const reasonId = useId();
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; dateOfBirth?: string; country?: string; password?: string; confirm?: string }>({});
  const dob = dobBounds();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const dateOfBirth = String(form.get("date-of-birth") ?? "").trim();
    const country = String(form.get("country") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("password-confirm") ?? "");

    // Founder decision 2026-09-27: name, date of birth and country "as on
    // your government ID" are mandatory here, so a new account can register
    // for a date and pay without a further profile step. The endpoint
    // enforces the same rules (src/modules/identity/auth.ts).
    const errs: typeof fieldErrors = {};
    if (name.length < LIMITS.legalNameMin || name.length > LIMITS.legalNameMax) errs.name = "Please enter your full name as it appears on your government ID.";
    if (!dateOfBirth) errs.dateOfBirth = "Please enter your date of birth.";
    else {
      const checked = validateDateOfBirth(dateOfBirth);
      if (!checked.ok) errs.dateOfBirth = checked.message;
    }
    if (!country) errs.country = "Please choose your country.";
    if (password.length < MIN_PASSWORD) errs.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) errs.confirm = "The two passwords do not match.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    if (!consent) {
      setError("Please accept the Terms of service and Privacy policy to continue.");
      return;
    }

    setPending(true);
    // `consent` is not a stored field: the server's before-hook requires it on
    // this request and refuses without it (src/modules/identity/auth.ts).
    // `dateOfBirth` is likewise not a provider field: the server reads it from
    // this request and stores it on the person's profile row.
    const body = {
      name,
      email,
      password,
      country,
      dateOfBirth,
      consent: true,
      callbackURL: "/account",
    };
    const { error: err } = await authClient.signUp.email(body);
    setPending(false);
    if (err) {
      setError(
        err.code === "REGISTRATION_CLOSED" || err.code === "CONSENT_REQUIRED" || err.code === "USER_ALREADY_EXISTS" || err.code === "REGISTRATION_DETAILS_INVALID"
          ? err.message ?? "Registration is not available."
          : err.status === 429
            ? "Too many attempts. Please wait a minute and try again."
            : "We could not create the account with those details. Please check them and try again.",
      );
      return;
    }
    // Founder direction 2026-09-21: no email provider yet, so registration
    // leads straight to sign-in rather than to a "check your email" step.
    router.push("/sign-in?registered=1");
  }

  const consentSentence = (
    <>
      I agree to the{" "}
      {documents.map((d, i) => (
        <span key={d.href}>
          {i > 0 ? " and have read the " : ""}
          <Link href={d.href} className="underline underline-offset-4">
            {d.label}
          </Link>
        </span>
      ))}
      .
    </>
  );

  return (
    <form aria-label="Create an account" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        required
        maxLength={LIMITS.legalNameMax}
        hint={`${AS_ON_ID} This is the name printed on your certificate.`}
        error={fieldErrors.name}
      />
      <Field
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        maxLength={254}
        hint="You sign in with this address."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Stored on the profile row (user_profiles.date_of_birth), not on the
            provider's user; mandatory since 2026-09-27 (certificate data). */}
        <Field
          label="Date of birth"
          type="date"
          name="date-of-birth"
          autoComplete="bday"
          required
          min={dob.min}
          max={dob.max}
          hint={AS_ON_ID}
          error={fieldErrors.dateOfBirth}
        />
        {/* ISO 3166-1 code (Milestone 5a): seeds the profile's country and the
            pricing region; the after-hook mirrors the name to `users.country`. */}
        <SelectField label="Country" name="country" autoComplete="country" required defaultValue="" hint={AS_ON_ID} error={fieldErrors.country}>
          <option value="">Select your country</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          hint={`At least ${MIN_PASSWORD} characters.`}
          error={fieldErrors.password}
        />
        <PasswordField
          label="Confirm password"
          name="password-confirm"
          autoComplete="new-password"
          required
          error={fieldErrors.confirm}
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id={consentId}
          type="checkbox"
          checked={consent}
          disabled={!registrationOpen}
          onChange={(e) => setConsent(e.target.checked)}
          aria-describedby={registrationOpen ? undefined : reasonId}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)] disabled:opacity-60"
        />
        <div className="text-body-sm">
          <label htmlFor={consentId} className="text-[var(--color-ink-quiet)]">
            {consentSentence}
          </label>
          {!registrationOpen && (
            <p id={reasonId} className="mt-1 text-[var(--color-ink-faint)]">
              Cannot be ticked yet — the Terms of service and Privacy policy have not been published, so no account
              can be created.
            </p>
          )}
        </div>
      </div>

      {error && <FormStatus tone="error">{error}</FormStatus>}

      <Button type="submit" disabled={!registrationOpen || pending} className="w-full">
        {pending ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
