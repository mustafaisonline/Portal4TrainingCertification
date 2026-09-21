/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/PublicShell.tsx
 * (ADR-045 PORT list, row 3). An ORIGINAL inline SVG — a capability line
 * rising through data nodes; nothing copied from any reference material.
 * Its own file so pages with a stripped-back shell can reuse the exact mark.
 */
export function LogoMark() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-[var(--color-primary)]"
    >
      <rect
        x="1"
        y="1"
        width="28"
        height="28"
        rx="8"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      <path
        d="M8 21 L13.5 14.5 L17 17 L22 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="9" r="2.3" fill="currentColor" />
      <circle cx="8" cy="21" r="1.6" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}
