"use client";

import { useId, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/*
 * Form building blocks — PORTED 2026-09-21 (structure and styling only) from
 * project-artifacts/mockup/components/auth/FormParts.tsx (ADR-045 PORT list,
 * row 7: "screen structure of account … every data source and action
 * replaced"). What was deliberately NOT ported: `InertForm` (forms here are
 * real), `BlockedConsent`'s always-disabled semantics (see ConsentField in
 * app/(auth)/register — it is blocked only while no document is published)
 * and `WireframeNote`.
 */

/** Input styling shared with the enquiry form so every form is one family. */
export const inputClass =
  "w-full rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3.5 py-2.5 text-body-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35 disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  optional,
  ...input
}: {
  label: string;
  hint?: string;
  /** Field-level validation message; sets aria-invalid and is announced. */
  error?: string;
  optional?: boolean;
} & Omit<ComponentPropsWithoutRef<"input">, "className">) {
  const hintId = useId();
  const errorId = useId();
  const generatedId = useId();
  const inputId = input.id ?? generatedId;
  const described = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  // Explicit htmlFor/id rather than a wrapping <label>: a wrapping label gives
  // the input an accessible name that includes the hint and error text (found
  // by the M5a e2e run — "Email" had no exact match). Same fix as SelectField.
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label">
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal normal-case tracking-normal text-[var(--color-ink-faint)]">
            (optional)
          </span>
        ) : null}
      </label>
      <input {...input} id={inputId} aria-describedby={described} aria-invalid={error ? true : undefined} className={inputClass} />
      {hint ? (
        <span id={hintId} className="text-body-sm text-[var(--color-ink-faint)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Select with explicit htmlFor/id rather than a wrapping <label>: a label
 * that wraps a select gives it an accessible name containing every option's
 * text (found by the admin offerings e2e run). Same pattern as the local
 * SelectField in app/admin/offerings/OfferingForm.tsx; shared here for the
 * profile and registration forms (Milestone 5a).
 */
export function SelectField({
  label,
  hint,
  error,
  optional,
  children,
  ...select
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"select">, "className">) {
  const hintId = useId();
  const errorId = useId();
  const selectId = useId();
  const described = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-label">
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal normal-case tracking-normal text-[var(--color-ink-faint)]">
            (optional)
          </span>
        ) : null}
      </label>
      <select {...select} id={selectId} aria-describedby={described} aria-invalid={error ? true : undefined} className={inputClass}>
        {children}
      </select>
      {hint ? (
        <span id={hintId} className="text-body-sm text-[var(--color-ink-faint)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function PasswordField({
  label,
  hint,
  error,
  labelAside,
  ...input
}: {
  label: string;
  hint?: string;
  error?: string;
  /** Right-aligned control on the label row — e.g. "Forgot password?". */
  labelAside?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"input">, "className" | "type">) {
  const [visible, setVisible] = useState(false);
  const hintId = useId();
  const errorId = useId();
  const inputId = useId();
  const described = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
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
          aria-describedby={described}
          aria-invalid={error ? true : undefined}
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
      {error ? (
        <span id={errorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Form-level status line (success or failure), announced politely. */
export function FormStatus({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const colour =
    tone === "error"
      ? "text-[var(--color-danger)]"
      : tone === "success"
        ? "text-[var(--color-success)]"
        : "text-[var(--color-ink-quiet)]";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`text-body-sm ${colour}`}>
      {children}
    </p>
  );
}
