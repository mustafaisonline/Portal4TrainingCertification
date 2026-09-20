"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Field, PasswordField, WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_EMAIL,
  DEMO_PASSWORD,
} from "@/lib/demoCredentials";
import {
  consumeReturnTo,
  matchDemoRole,
  peekReturnTo,
  startDemoSession,
} from "@/lib/demoSession";

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
  // True when the visitor was sent here to register (return path pending).
  const [toRegister, setToRegister] = useState(false);
  useEffect(() => {
    setToRegister(peekReturnTo() === "/checkout");
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const role = matchDemoRole(email, password);
    if (role) {
      setError(false);
      startDemoSession(role);
      router.push(consumeReturnTo() ?? (role === "admin" ? "/admin" : "/account"));
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
      {toRegister && (
        <p role="status" className="text-body-sm font-medium text-[var(--color-ink)]">
          Sign in to continue to programme registration.
        </p>
      )}
      {/* Two demo personas (2026-09-20): participant and trainer/admin.
          Clicking one fills the form. Both are public constants that protect
          nothing — lib/demoCredentials.ts. */}
      <div
        role="note"
        className="text-body-sm rounded-[var(--radius-plate)] bg-[var(--color-ground-tint)] px-3.5 py-3 text-[var(--color-ink-quiet)]"
      >
        <p className="text-label mb-2 text-[var(--color-primary)]">Demo accounts — click to fill</p>
        <div className="flex flex-col gap-2">
          {[
            { label: "Participant", e: DEMO_EMAIL, p: DEMO_PASSWORD },
            { label: "Trainer / admin", e: DEMO_ADMIN_EMAIL, p: DEMO_ADMIN_PASSWORD },
          ].map((d) => (
            <button
              key={d.e}
              type="button"
              onClick={() => {
                setEmail(d.e);
                setPassword(d.p);
                setError(false);
              }}
              className="rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground)] px-3 py-2 text-left hover:border-[var(--color-primary)]"
            >
              <span className="text-label block text-[0.6rem]">{d.label}</span>
              <span className="text-mono block break-all text-[0.8rem]">{d.e}</span>
              <span className="text-mono block text-[0.8rem] text-[var(--color-ink-faint)]">{d.p}</span>
            </button>
          ))}
        </div>
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
            className="text-body-sm inline-block py-2 text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Forgot password?
          </Link>
        }
      />
      {error && (
        <p role="alert" className="text-body-sm text-[var(--color-danger)]">
          Only the two demo accounts work in this wireframe — no other accounts
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
