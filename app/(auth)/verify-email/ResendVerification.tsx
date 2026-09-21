"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/modules/identity/auth-client";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus } from "@/shared/ui/forms";

export function ResendVerification({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sent" | "error" | "limited">("idle");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const address = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!address) return;
    setPending(true);
    const { error } = await authClient.sendVerificationEmail({ email: address, callbackURL: "/account" });
    setPending(false);
    setStatus(error ? (error.status === 429 ? "limited" : "error") : "sent");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" aria-label="Resend the verification email">
      <Field label="Email" type="email" name="email" autoComplete="email" inputMode="email" defaultValue={email} required />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Sending…" : "Send a new link"}
      </Button>
      {status === "sent" && (
        // Neutral: does not confirm that the address has an account.
        <FormStatus tone="success">If an unverified account exists for that address, a new link is on its way.</FormStatus>
      )}
      {status === "limited" && <FormStatus tone="error">Too many requests. Please wait a minute and try again.</FormStatus>}
      {status === "error" && <FormStatus tone="error">Something went wrong. Please try again.</FormStatus>}
    </form>
  );
}
