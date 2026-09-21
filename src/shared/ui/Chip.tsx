import type { ReactNode } from "react";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/ui/Chip.tsx
 * (ADR-045 PORT list, row 2) — unchanged apart from this header.
 * Small-caps annotation chip — domain tags, status labels.
 */
export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary";
}) {
  const toneClasses =
    tone === "primary"
      ? "border-[var(--color-primary)] text-[var(--color-primary)]"
      : "border-[var(--color-line-strong)] text-[var(--color-ink-quiet)]";
  return (
    <span
      className={`text-label inline-flex items-center rounded-full border px-2.5 py-1 ${toneClasses}`}
    >
      {children}
    </span>
  );
}
