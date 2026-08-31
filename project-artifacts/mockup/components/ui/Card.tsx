import type { ReactNode } from "react";

type CardVariant = "plate" | "panel" | "feature";

/**
 * The three card types (§16.3) — a single component with a `variant` prop,
 * not three separate components, so the contract stays in one place.
 *
 * Rules from the spec, enforced by convention (not by code): never nest a
 * card inside a card of the same type; "feature" appears at most once per
 * screen; shadows are reserved for genuinely floating elements (modals,
 * popovers) and are deliberately absent here.
 */
export function Card({
  variant = "plate",
  className = "",
  children,
}: {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
}) {
  const variantClasses: Record<CardVariant, string> = {
    plate:
      "bg-[var(--color-ground)] border border-[var(--color-line)] rounded-[var(--radius-plate)]",
    panel:
      "bg-[var(--color-ground-raised)] border border-[var(--color-line)] rounded-[var(--radius-panel)] p-6",
    feature:
      "bg-[var(--color-ground-raised)] border border-[var(--color-primary)]/30 rounded-[var(--radius-feature)] p-8",
  };
  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
