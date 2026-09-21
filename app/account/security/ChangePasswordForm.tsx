"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/modules/identity/auth-client";
import { Button } from "@/shared/ui/Button";
import { FormStatus, PasswordField } from "@/shared/ui/forms";

const MIN_PASSWORD = 8;

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [formKey, setFormKey] = useState(0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("current-password") ?? "");
    const newPassword = String(form.get("new-password") ?? "");
    const confirm = String(form.get("new-password-confirm") ?? "");
    const errs: typeof fieldErrors = {};
    if (!currentPassword) errs.current = "Enter your current password.";
    if (newPassword.length < MIN_PASSWORD) errs.next = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== newPassword) errs.confirm = "The two passwords do not match.";
    setFieldErrors(errs);
    setStatus(null);
    if (Object.keys(errs).length) return;

    setPending(true);
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setPending(false);
    if (error) {
      setStatus({
        tone: "error",
        text:
          error.code === "INVALID_PASSWORD"
            ? "Your current password is incorrect."
            : error.status === 429
              ? "Too many attempts. Please wait a minute and try again."
              : "We could not change the password. Please try again.",
      });
      return;
    }
    setStatus({ tone: "success", text: "Your password has been changed. Other devices have been signed out." });
    setFormKey((k) => k + 1); // clears the fields
  }

  return (
    <form key={formKey} onSubmit={onSubmit} className="flex max-w-[480px] flex-col gap-5" aria-label="Change password" noValidate>
      <PasswordField label="Current password" name="current-password" autoComplete="current-password" required error={fieldErrors.current} />
      <PasswordField
        label="New password"
        name="new-password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD}
        hint={`At least ${MIN_PASSWORD} characters.`}
        error={fieldErrors.next}
      />
      <PasswordField label="Confirm new password" name="new-password-confirm" autoComplete="new-password" required error={fieldErrors.confirm} />
      {status && <FormStatus tone={status.tone}>{status.text}</FormStatus>}
      <Button type="submit" disabled={pending} data-testid="change-password-submit">
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
