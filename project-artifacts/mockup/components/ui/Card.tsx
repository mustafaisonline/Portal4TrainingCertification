import type { ReactNode } from "react";

type CardVariant = "plate" | "panel" | "feature";

/**
 * The three card types (§16.3) — a single component with a `variant` prop,
 * not three separate components, so the contract stays in one place.
 *
 * Rules from the spec, enforced by convention (not by code): never nest a
 * card inside a card of the same type; "feature" appears at most once per
 * screen.
 *
 * SHADOW POLICY CHANGED 2026-09-06 (light-theme redesign, founder
 * direction, from a supplied reference image): "panel" now carries a soft
 * shadow — the reference's cards read as gently floating above the page,
 * not flush plates. This reverses the original rule ("shadows are
 * reserved for genuinely floating elements... and are deliberately absent
 * here"), which held from this component's creation until now. "plate"
 * stays flush/flat (unchanged) — it's the lower-emphasis surface and the
 * reference doesn't ask it to float too.
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
      "bg-[var(--color-ground-raised)] border border-[var(--color-line)] rounded-[var(--radius-panel)] p-6 shadow-[0_10px_30px_rgba(16,24,40,0.06)]",
    feature:
      "bg-[var(--color-ground-raised)] border border-[var(--color-primary)]/30 rounded-[var(--radius-feature)] p-8",
  };
  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
