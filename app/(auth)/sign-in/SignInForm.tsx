"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/modules/identity/auth-client";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, PasswordField } from "@/shared/ui/forms";

type Outcome = { kind: "idle" } | { kind: "error"; message: string } | { kind: "unverified"; email: string };

export function SignInForm({
  returnTo,
  passwordWasReset,
  justRegistered = false,
}: {
  returnTo: string;
  passwordWasReset: boolean;
  justRegistered?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setPending(true);
    setOutcome({ kind: "idle" });
    const { data, error } = await authClient.signIn.email({ email, password });
    setPending(false);
    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setOutcome({ kind: "unverified", email });
      } else if (error.status === 429) {
        setOutcome({ kind: "error", message: "Too many attempts. Please wait a minute and try again." });
      } else {
        // One neutral message for every credential failure (enumeration-safe).
        setOutcome({ kind: "error", message: "Email or password is incorrect." });
      }
      return;
    }
    // With two-factor enabled the credential step does not create a session
    // yet; the code step does (twoFactor plugin).
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      router.push(`/sign-in/two-factor?return-to=${encodeURIComponent(returnTo)}`);
      return;
    }
    router.push(returnTo);
    router.refresh();
  }

  return (
    <form aria-label="Sign in" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {passwordWasReset && <FormStatus tone="success">Your password has been changed. Sign in with the new one.</FormStatus>}
      {justRegistered && (
        <FormStatus tone="success">Your account has been created. Sign in with your email and password.</FormStatus>
      )}
      {returnTo !== "/account" && (
        <p role="status" className="text-body-sm font-medium text-[var(--color-ink)]">
          Sign in to continue.
        </p>
      )}
      <Field label="Email" type="email" name="email" autoComplete="email" inputMode="email" required />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        labelAside={
          <Link
            href="/forgot-password"
            className="text-body-sm inline-block py-2 text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Forgot password?
          </Link>
        }
      />
      {outcome.kind === "error" && <FormStatus tone="error">{outcome.message}</FormStatus>}
      {outcome.kind === "unverified" && (
        <FormStatus tone="error">
          Please verify your email address first.{" "}
          <Link href={`/verify-email?email=${encodeURIComponent(outcome.email)}`} className="underline underline-offset-4">
            Send a new verification link
          </Link>
          .
        </FormStatus>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
