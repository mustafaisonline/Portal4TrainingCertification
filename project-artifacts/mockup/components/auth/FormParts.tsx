"use client";

import { useId, useState } from "react";
import type { ComponentPropsWithoutRef, FormEvent, ReactNode } from "react";

/**
 * Shared building blocks for the account & payment WIREFRAMES
 * (/sign-in, /register, /forgot-password, /checkout, /account/profile) — added 2026-09-20,
 * founder direction: "introduce standard pages ... No backend
 * implementation yet."
 *
 * EVERYTHING HERE IS INERT, AND SAYS SO. No authentication, database,
 * server action or API route exists in this mockup (next.config.ts), so:
 *
 * - `InertForm` swallows submission. Without it, pressing Enter in a field
 *   would perform a native GET to the same URL and put whatever was typed —
 *   including a password — into the address bar and browser history. That
 *   is a genuine leak even in a wireframe, so it is prevented, not merely
 *   left "not connected".
 * - The submit buttons on /register, /forgot-password and /account/profile
 *   are genuinely `disabled`, the same convention as the
 *   Certificate-of-attempt button on /diagnostic/result — a button that
 *   flashes "Registered!" would be a simulated success state.
 *   ⚠ EXCEPTIONS, added later on 2026-09-20 at the founder's explicit request
 *   and confined to the labelled DEMO SESSION: the demo sign-in
 *   (components/auth/SignInForm.tsx), the checkout "Pay" and the certificate
 *   renewal "Pay" simulate success. Each says so on the page. See
 *   lib/demoSession.ts and docs/execution/BACKEND_HANDOFF_INDEX.md.
 * - Nothing typed is read, stored or transmitted. These inputs are
 *   uncontrolled and unread; the only local state is the show/hide toggle
 *   on the password field, which is genuine UI behaviour.
 */

/** Input styling identical to the /contact-us enquiry form, so the account
 *  forms and the enquiry form are visibly one family. */
export const inputClass =
  "w-full rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3.5 py-2.5 text-body-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35";

/** A form that can never submit. See the header comment for why. */
export function InertForm({
  children,
  ...props
}: Omit<ComponentPropsWithoutRef<"form">, "onSubmit" | "action" | "method">) {
  return (
    <form
      {...props}
      onSubmit={(e: FormEvent<HTMLFormElement>) => e.preventDefault()}
    >
      {children}
    </form>
  );
}

export function Field({
  label,
  hint,
  optional,
  ...input
}: {
  label: string;
  hint?: string;
  optional?: boolean;
} & Omit<ComponentPropsWithoutRef<"input">, "className">) {
  const hintId = useId();
  return (
    <label className="flex flex-col gap-2">
      <span className="text-label">
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal normal-case tracking-normal text-[var(--color-ink-faint)]">
            (optional)
          </span>
        ) : null}
      </span>
      <input
        {...input}
        aria-describedby={hint ? hintId : undefined}
        className={inputClass}
      />
      {hint ? (
        <span id={hintId} className="text-body-sm text-[var(--color-ink-faint)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function PasswordField({
  label,
  hint,
  labelAside,
  ...input
}: {
  label: string;
  hint?: string;
  /** Right-aligned control on the label row — e.g. "Forgot password?". */
  labelAside?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"input">, "className" | "type">) {
  const [visible, setVisible] = useState(false);
  const hintId = useId();
  const inputId = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-label">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          {...input}
          id={inputId}
          type={visible ? "text" : "password"}
          aria-describedby={hint ? hintId : undefined}
          className={`${inputClass} pr-16`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 min-w-[3.5rem] px-3.5 text-body-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary)]"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint ? (
        <span id={hintId} className="text-body-sm text-[var(--color-ink-faint)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/** A checkbox row that is disabled, with the reason stated beside it. Used
 *  where the real control would require accepting a document that has not
 *  been written (Terms, Privacy, Refund policy — docs/SITE_PAGES.md). An
 *  enabled checkbox "agreeing" to a policy that does not exist would be a
 *  fake consent record. */
export function BlockedConsent({
  children,
  reason,
}: {
  children: ReactNode;
  reason: string;
}) {
  const reasonId = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        disabled
        aria-describedby={reasonId}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)] disabled:opacity-60"
      />
      <div className="text-body-sm">
        <p className="text-[var(--color-ink-quiet)]">{children}</p>
        <p id={reasonId} className="mt-1 text-[var(--color-ink-faint)]">
          {reason}
        </p>
      </div>
    </div>
  );
}

/** The standing "this is a wireframe" statement for a screen. */
export function WireframeNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="note"
      className="text-body-sm rounded-[var(--radius-plate)] border border-dashed border-[var(--color-line-strong)] px-3.5 py-3 text-[var(--color-ink-faint)]"
    >
      <span className="text-label mr-2 text-[var(--color-ink-quiet)]">
        Wireframe
      </span>
      {children}
    </p>
  );
}
