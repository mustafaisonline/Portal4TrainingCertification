"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Field, PasswordField, WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demoCredentials";
import { credentialsMatch, startDemoSession } from "@/lib/demoSession";

/**
 * Sign-in form with a PRE-LOADED DEMO ACCOUNT — 2026-09-20, founder
 * direction. See lib/demoSession.ts: this compares against public constants
 * and sets a browser-tab flag; it authenticates nothing. Delete both files
 * when real authentication (ADR-006) is built.
 *
 * Anything other than the demo credentials is refused with an honest
 * message, not a fake "invalid password" — a real-sounding error would
 * imply there is a real account database being checked.
 *
 * The submit handler always calls preventDefault, so typed values still can
 * never reach the URL.
 */
export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (credentialsMatch(email, password)) {
      setError(false);
      startDemoSession();
      router.push("/account");
    } else {
      setError(true);
    }
  }

  return (
    <form
      aria-label="Sign in"
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
    >
      <div
        role="note"
        className="text-body-sm rounded-[var(--radius-plate)] bg-[var(--color-ground-tint)] px-3.5 py-3 text-[var(--color-ink-quiet)]"
      >
        <p className="text-label mb-1.5 text-[var(--color-primary)]">
          Demo account — pre-filled
        </p>
        <p>
          <span className="text-[var(--color-ink-faint)]">Email </span>
          <span className="text-mono break-all">{DEMO_EMAIL}</span>
        </p>
        <p>
          <span className="text-[var(--color-ink-faint)]">Password </span>
          <span className="text-mono">{DEMO_PASSWORD}</span>
        </p>
      </div>
      <Field
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        labelAside={
          <Link
            href="/forgot-password"
            className="text-body-sm text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Forgot password?
          </Link>
        }
      />
      {error && (
        <p role="alert" className="text-body-sm text-[var(--color-danger)]">
          Only the demo account works in this wireframe — no other accounts
          exist.
        </p>
      )}
      <Button type="submit" className="w-full">
        Sign in
      </Button>
      <WireframeNote>
        Demo only — this signs you in to sample data, not a real account.
        Nothing typed is sent or stored.
      </WireframeNote>
    </form>
  );
}
