"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/modules/identity/auth-client";
import { Button } from "@/shared/ui/Button";
import { FormStatus, PasswordField } from "@/shared/ui/forms";

const MIN_PASSWORD = 8; // founder decision 2026-09-21 (was 12)

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("password-confirm") ?? "");
    const errs: typeof fieldErrors = {};
    if (password.length < MIN_PASSWORD) errs.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) errs.confirm = "The two passwords do not match.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setPending(true);
    setError(null);
    const { error: err } = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (err) {
      setError(
        err.code === "INVALID_TOKEN"
          ? "This reset link is no longer valid. Please request a new one."
          : "We could not change the password. Please try again.",
      );
      return;
    }
    router.push("/sign-in?reset=1");
  }

  return (
    <form aria-label="Choose a new password" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD}
        error={fieldErrors.password}
      />
      <PasswordField
        label="Confirm new password"
        name="password-confirm"
        autoComplete="new-password"
        required
        error={fieldErrors.confirm}
      />
      {error && <FormStatus tone="error">{error}</FormStatus>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
