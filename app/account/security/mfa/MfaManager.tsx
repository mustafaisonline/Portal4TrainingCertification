"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/modules/identity/auth-client";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, PasswordField } from "@/shared/ui/forms";

/*
 * Enrolment: password → secret issued (shown as text + otpauth link; a QR
 * image would need a new dependency, deliberately not added) → first code
 * verified → backup codes shown ONCE. Disable: password. Every state change
 * is audited server-side (auth.ts databaseHooks).
 */
type Stage =
  | { kind: "off" }
  | { kind: "issued"; totpURI: string; secret: string; backupCodes: string[] }
  | { kind: "on" }
  | { kind: "enrolled"; backupCodes: string[] };

function secretFrom(totpURI: string): string {
  try {
    return new URL(totpURI).searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}

export function MfaManager({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(enabled ? { kind: "on" } : { kind: "off" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setPending(true);
    setError(null);
    const { data, error: err } = await authClient.twoFactor.enable({ password });
    setPending(false);
    if (err || !data || data.method !== "totp") {
      setError(err?.status === 401 || err?.code === "INVALID_PASSWORD" ? "That password is incorrect." : "Could not start enrolment. Please try again.");
      return;
    }
    setStage({ kind: "issued", totpURI: data.totpURI, secret: secretFrom(data.totpURI), backupCodes: data.backupCodes });
  }

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (stage.kind !== "issued") return;
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    setPending(true);
    setError(null);
    const { error: err } = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (err) {
      setError("That code was not accepted. Check the time on your device and try the next code.");
      return;
    }
    setStage({ kind: "enrolled", backupCodes: stage.backupCodes });
    router.refresh();
  }

  async function disable(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setPending(true);
    setError(null);
    const { error: err } = await authClient.twoFactor.disable({ password });
    setPending(false);
    if (err) {
      setError("Could not turn off two-factor authentication. Check your password and try again.");
      return;
    }
    setStage({ kind: "off" });
    router.refresh();
  }

  if (stage.kind === "off") {
    return (
      <form onSubmit={start} className="flex flex-col gap-5" aria-label="Set up two-factor authentication" noValidate>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Two-factor authentication adds a six-digit code from an authenticator app to every sign-in. Confirm your
          password to begin.
        </p>
        <PasswordField label="Current password" name="password" autoComplete="current-password" required />
        {error && <FormStatus tone="error">{error}</FormStatus>}
        <Button type="submit" disabled={pending} data-testid="mfa-start">
          {pending ? "Starting…" : "Set up two-factor authentication"}
        </Button>
      </form>
    );
  }

  if (stage.kind === "issued") {
    return (
      <form onSubmit={verify} className="flex flex-col gap-5" aria-label="Confirm your authenticator" noValidate>
        <ol className="text-body-sm list-decimal space-y-3 pl-5 text-[var(--color-ink-quiet)]">
          <li>
            Add this account to your authenticator app. Enter the key manually, or open the setup link on a device
            with the app installed.
            <p className="text-mono mt-2 break-all rounded-[var(--radius-plate)] bg-[var(--color-ground-tint)] px-3 py-2 text-[var(--color-ink)]" data-testid="mfa-secret">
              {stage.secret}
            </p>
            <a href={stage.totpURI} className="mt-2 inline-block text-[var(--color-primary)] underline underline-offset-4">
              Open setup link
            </a>
          </li>
          <li>Enter the six-digit code the app shows now.</li>
        </ol>
        <Field label="Authenticator code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
        {error && <FormStatus tone="error">{error}</FormStatus>}
        <Button type="submit" disabled={pending} data-testid="mfa-verify">
          {pending ? "Checking…" : "Turn on two-factor authentication"}
        </Button>
      </form>
    );
  }

  if (stage.kind === "enrolled") {
    return (
      <div className="flex flex-col gap-5">
        <FormStatus tone="success">Two-factor authentication is on.</FormStatus>
        <div>
          <h2 className="text-h2 mb-2">Backup codes</h2>
          <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
            Store these somewhere safe. Each works once if you lose access to your authenticator. <strong>They are shown only now.</strong>
          </p>
          <ul className="text-mono grid grid-cols-2 gap-2 rounded-[var(--radius-plate)] bg-[var(--color-ground-tint)] p-4" data-testid="mfa-backup-codes">
            {stage.backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <Button variant="secondary" href="/account">
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={disable} className="flex flex-col gap-5" aria-label="Turn off two-factor authentication" noValidate>
      <FormStatus tone="success">Two-factor authentication is on for this account.</FormStatus>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">To turn it off, confirm your password.</p>
      <PasswordField label="Current password" name="password" autoComplete="current-password" required />
      {error && <FormStatus tone="error">{error}</FormStatus>}
      <Button type="submit" variant="secondary" disabled={pending} data-testid="mfa-disable">
        {pending ? "Turning off…" : "Turn off two-factor authentication"}
      </Button>
    </form>
  );
}
