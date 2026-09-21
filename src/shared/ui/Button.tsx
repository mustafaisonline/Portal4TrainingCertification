import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/ui/Button.tsx
 * (ADR-045 PORT list, row 2) — token-driven, stateless, unchanged apart from
 * this header. Primary reads the --color-action* tokens rather than
 * --color-primary*: inside a `.night` band the two diverge (readable-on-navy
 * text blue vs. AA-safe button fill); outside it they are identical.
 */

type ButtonVariant = "primary" | "secondary" | "text";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-plate)] px-5 py-2.5 text-body-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-action)] text-[var(--color-action-ink)] hover:bg-[var(--color-action-strong)]",
  secondary:
    "bg-transparent text-[var(--color-ink)] border border-[var(--color-line-strong)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
  text: "bg-transparent text-[var(--color-primary)] px-1 py-1 underline underline-offset-4 hover:text-[var(--color-primary-strong)]",
};

type ButtonAsButton = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  href?: undefined;
};
type ButtonAsLink = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className = "",
  href,
  ...props
}: ButtonAsButton | ButtonAsLink) {
  const classes = `${base} ${variants[variant]} ${className}`;
  if (href) {
    const linkProps = {
      ...(props as ComponentPropsWithoutRef<typeof Link>),
      href,
    };
    return <Link className={classes} {...linkProps} />;
  }
  return (
    <button
      className={classes}
      {...(props as ComponentPropsWithoutRef<"button">)}
    />
  );
}
