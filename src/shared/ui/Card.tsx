import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/ui/Card.tsx
 * (ADR-045 PORT list, row 2) — unchanged apart from this header.
 *
 * The three card types (Mockup Spec §16.3) as one component with a `variant`
 * prop, so the contract stays in one place. Conventions, not enforced by
 * code: never nest a card inside a card of the same type; "feature" appears
 * at most once per screen. "panel" floats (soft shadow); "plate" is flush.
 */

type CardVariant = "plate" | "panel" | "feature";

export function Card({
  variant = "plate",
  className = "",
  style,
  children,
  ...rest
}: {
  variant?: CardVariant;
  className?: string;
  /** Escape hatch for a one-off caller that needs a value the variant tokens
   *  don't cover (e.g. a non-standard border-radius). Inline style always wins
   *  over the variant's utility classes, so it never produces two conflicting
   *  Tailwind classes on the same property. */
  style?: CSSProperties;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "style" | "children">) {
  const variantClasses: Record<CardVariant, string> = {
    plate:
      "bg-[var(--color-ground)] border border-[var(--color-line)] rounded-[var(--radius-plate)]",
    panel:
      "bg-[var(--color-ground-raised)] border border-[var(--color-line)] rounded-[var(--radius-panel)] p-6 shadow-[0_10px_30px_rgba(16,24,40,0.06)]",
    feature:
      "bg-[var(--color-ground-raised)] border border-[var(--color-primary)]/30 rounded-[var(--radius-feature)] p-8",
  };
  return (
    // Remaining div attributes (id, aria-*, data-testid …) pass through —
    // found in M5b when a `data-testid` on a Card silently vanished.
    <div {...rest} className={`${variantClasses[variant]} ${className}`} style={style}>
      {children}
    </div>
  );
}
