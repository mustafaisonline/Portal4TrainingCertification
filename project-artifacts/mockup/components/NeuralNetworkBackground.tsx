/**
 * Hero background — a neural-network / data-graph motif. Original,
 * hand-authored SVG — no stock or AI-generated photograph. No
 * image-generation tool exists in this environment, and this project's
 * own rule (docs/IMAGE_SLOTS.md rule 1) still prohibits stock/
 * third-party imagery even after the 2026-09-06 AI-imagery policy
 * change, which was specifically about AI generation. Deterministic
 * (fixed coordinates, no randomness) for stable SSR output, matching the
 * convention `components/DotField.tsx` already established — this file
 * follows the same technique throughout, including this comment's
 * reasoning being inherited from that one.
 *
 * First built inline in `app/home1/page.tsx` (2026-09-06, replacing an
 * earlier reused `DotField`, founder direction: "something more visibly
 * AI/data network"); extracted here the same day once the real homepage
 * hero (`components/HomeHeroLight.tsx`) needed the identical treatment —
 * same reasoning `DotField` itself was extracted for.
 *
 * No `viewBox` on the outer `<svg>`, deliberately — percentage
 * coordinates (`cx="72%"` etc.) then resolve against the element's
 * actual rendered pixel size with no aspect-ratio distortion, while
 * `r`/`strokeWidth` stay fixed pixel values. Concentrated toward the
 * upper-right (behind the floating cards, away from the headline) via a
 * radial-gradient mask, exactly like `DotField`'s own fade.
 *
 * `id` must be unique per instance on a page — it namespaces the
 * gradient/mask so two instances (unlikely today, but not impossible)
 * never collide, same requirement `DotField` has.
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
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="currentColor"
            strokeWidth={1}
            strokeOpacity={0.32}
          />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="currentColor" fillOpacity={0.55} />
        ))}
      </g>
    </svg>
  );
}
