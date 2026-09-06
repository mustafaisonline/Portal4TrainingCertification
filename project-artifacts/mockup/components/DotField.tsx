/**
 * Original data-atmosphere: a masked dot grid + a few falling node streams.
 * Deterministic — no randomness, so SSR output is stable.
 *
 * Lived inline in app/page.tsx until 2026-09-05; moved here unchanged so the
 * homepage hero (components/HomeHero.tsx) and the page's other night bands
 * can share it.
 */
export function DotField({ id }: { id: string }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-[var(--color-primary)]"
    >
      <defs>
        <pattern
          id={`${id}-dots`}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1.5" cy="1.5" r="1.1" fill="currentColor" />
        </pattern>
        <radialGradient id={`${id}-fade`} cx="72%" cy="30%" r="80%">
          <stop offset="0%" stopColor="white" stopOpacity="0.34" />
          <stop offset="55%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill={`url(#${id}-dots)`}
        mask={`url(#${id}-mask)`}
      />
      {[62, 76, 88].map((x, i) => (
        <line
          key={x}
          x1={`${x}%`}
          y1="0%"
          x2={`${x}%`}
          y2={`${34 + i * 14}%`}
          stroke="currentColor"
          strokeOpacity={0.25 - i * 0.06}
          strokeWidth="1.5"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
