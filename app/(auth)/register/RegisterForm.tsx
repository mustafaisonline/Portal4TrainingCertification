"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/modules/identity/auth-client";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, PasswordField } from "@/shared/ui/forms";

const MIN_PASSWORD = 12;

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
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const country = String(form.get("country") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("password-confirm") ?? "");

    const errs: typeof fieldErrors = {};
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
    const body = {
      name,
      email,
      password,
      country: country || undefined,
      consent: true,
      callbackURL: "/account",
    };
    const { error: err } = await authClient.signUp.email(body);
    setPending(false);
    if (err) {
      setError(
        err.code === "REGISTRATION_CLOSED" || err.code === "CONSENT_REQUIRED"
          ? err.message ?? "Registration is not available."
          : err.status === 429
            ? "Too many attempts. Please wait a minute and try again."
            : // Neutral on purpose (enumeration-safe): an existing address gets
              // the same outcome as any other failure that isn't a policy error.
              "We could not create the account with those details. If you already have an account, sign in or reset your password.",
      );
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
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
        maxLength={200}
        hint="As you would like it to appear on any certificate of participation."
      />
      <Field label="Email" type="email" name="email" autoComplete="email" inputMode="email" required maxLength={254} />
      <Field label="Country" name="country" autoComplete="country-name" optional maxLength={100} />
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
