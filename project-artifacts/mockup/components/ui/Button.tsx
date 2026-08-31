import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "text";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-plate)] px-5 py-2.5 text-body-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-ink)] hover:bg-[var(--color-primary-strong)]",
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
