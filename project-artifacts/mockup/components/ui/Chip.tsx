import type { ReactNode } from "react";

/** Small-caps annotation chip — domain tags, status labels. §16.5/§16.6. */
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
