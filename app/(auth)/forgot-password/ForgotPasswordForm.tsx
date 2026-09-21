"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/modules/identity/auth-client";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus } from "@/shared/ui/forms";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<"idle" | "done" | "limited" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setPending(true);
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setPending(false);
    setState(error ? (error.status === 429 ? "limited" : "error") : "done");
  }

  if (state === "done") {
    return (
      <FormStatus tone="success">
        If an account exists for that address, an email with a reset link is on its way. The link works once and
        expires in 60 minutes.
      </FormStatus>
    );
  }

  return (
    <form aria-label="Request a password reset" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="Email" type="email" name="email" autoComplete="email" inputMode="email" required />
      {state === "limited" && <FormStatus tone="error">Too many requests. Please wait a minute and try again.</FormStatus>}
      {state === "error" && <FormStatus tone="error">Something went wrong. Please try again.</FormStatus>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
