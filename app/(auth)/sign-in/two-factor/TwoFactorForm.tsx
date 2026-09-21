"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/modules/identity/auth-client";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus } from "@/shared/ui/forms";

export function TwoFactorForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    setPending(true);
    setError(null);
    const { error: err } =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code })
        : await authClient.twoFactor.verifyBackupCode({ code });
    setPending(false);
    if (err) {
      setError(err.status === 429 ? "Too many attempts. Please wait a minute and try again." : "That code was not accepted.");
      return;
    }
    router.push(returnTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" aria-label="Two-factor code" noValidate>
      {mode === "totp" ? (
        <Field
          label="Authenticator code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
        />
      ) : (
        <Field label="Backup code" name="code" autoComplete="off" required autoFocus />
      )}
      {error && <FormStatus tone="error">{error}</FormStatus>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "totp" ? "backup" : "totp");
          setError(null);
        }}
        className="text-body-sm self-center text-[var(--color-primary)] underline underline-offset-4"
      >
        {mode === "totp" ? "Use a backup code instead" : "Use my authenticator app instead"}
      </button>
    </form>
  );
}
