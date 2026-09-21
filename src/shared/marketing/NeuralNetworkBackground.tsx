/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/NeuralNetworkBackground.tsx
 * (ADR-045). Unchanged apart from this header and a guard on the node lookup
 * required by `noUncheckedIndexedAccess` — pure, deterministic SVG.
 */

/**
 * Hero background — a neural-network / data-graph motif. Original,
 * hand-authored SVG — no stock or AI-generated photograph. Deterministic
 * (fixed coordinates, no randomness) for stable SSR output, matching the
 * convention `DotField.tsx` established.
 *
 * No `viewBox` on the outer `<svg>`, deliberately — percentage
 * coordinates (`cx="72%"` etc.) then resolve against the element's
 * actual rendered pixel size with no aspect-ratio distortion, while
 * `r`/`strokeWidth` stay fixed pixel values. Concentrated toward the
 * upper-right (behind the floating cards, away from the headline) via a
 * radial-gradient mask, exactly like `DotField`'s own fade.
 *
 * `id` must be unique per instance on a page — it namespaces the
 * gradient/mask so two instances never collide.
 */
export function NeuralNetworkBackground({ id }: { id: string }) {
  const nodes = [
    { x: "56%", y: "10%", r: 3.2 },
    { x: "70%", y: "6%", r: 2.2 },
    { x: "84%", y: "16%", r: 3.6 },
    { x: "62%", y: "24%", r: 2.6 },
    { x: "77%", y: "30%", r: 2.2 },
    { x: "92%", y: "26%", r: 3 },
    { x: "58%", y: "42%", r: 2.4 },
    { x: "73%", y: "48%", r: 3.6 },
    { x: "88%", y: "44%", r: 2.6 },
    { x: "64%", y: "60%", r: 2.2 },
    { x: "80%", y: "66%", r: 2.8 },
    { x: "95%", y: "58%", r: 2.4 },
    { x: "69%", y: "78%", r: 3 },
    { x: "85%", y: "84%", r: 2.2 },
  ] as const;
  const edges: [number, number][] = [
    [0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [2, 5],
    [3, 6], [4, 7], [7, 8], [5, 8],
    [6, 9], [7, 10], [8, 11], [10, 11],
    [9, 12], [10, 12], [11, 13], [12, 13],
  ];

  return (
    <svg aria-hidden="true" className="h-full w-full text-[var(--color-primary)]">
      <defs>
        <radialGradient id={`${id}-fade`} cx="78%" cy="35%" r="78%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="55%" stopColor="white" stopOpacity="0.2" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        {edges.map(([a, b], i) => {
          const from = nodes[a];
          const to = nodes[b];
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="currentColor"
              strokeWidth={1}
              strokeOpacity={0.32}
            />
          );
        })}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="currentColor" fillOpacity={0.55} />
        ))}
      </g>
    </svg>
  );
}
