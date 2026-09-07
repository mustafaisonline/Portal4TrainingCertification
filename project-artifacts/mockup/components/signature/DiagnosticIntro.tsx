import { Card } from "@/components/ui/Card";

/**
 * Shared diagnostic-intro pieces — extracted 2026-09-07 from
 * components/HomeDiagnostic.tsx so the homepage embed and the standalone
 * /diagnostic page can never drift apart on this content, the same reason
 * `DiagnosticStartCard` and `DiagnosticQuestionCanvas` are already shared
 * rather than duplicated (see those files' own header comments). Pure
 * presentation — no state, no logic — safe to render from either entry
 * point.
 */

/** Shared stroke props for this file's local icon glyphs — same
 *  convention as app/trainers/page.tsx's `iconStroke`. */
const iconStroke = {
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

/** Decorative illustration for the diagnostic intro. Original, geometric,
 *  deterministic inline SVG — same convention as
 *  components/illustrations/DeliveryIllustrations.tsx and
 *  components/DotField.tsx, not a photograph (see IMAGE_SLOTS.md). A
 *  single gauge/target reading in a floating card, with a small
 *  "assessed" check-badge overlapping the corner. */
export function DiagnosticIllustration() {
  return (
    <div className="relative h-[136px] w-[136px] shrink-0 sm:h-[152px] sm:w-[152px]">
      <div
        aria-hidden="true"
        className="absolute -left-5 -top-4 h-[130px] w-[130px] rounded-full bg-[var(--color-primary)]/10 blur-xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-1 left-0 h-[40px] w-[40px] rounded-full border border-dashed border-[var(--color-line-strong)]"
      />
      <svg viewBox="0 0 152 152" className="relative h-full w-full" aria-hidden="true">
        <g style={{ filter: "drop-shadow(0 16px 24px rgba(47,95,224,0.18))" }}>
          <rect x="18" y="10" width="116" height="116" rx="20" fill="var(--color-ground-raised)" stroke="var(--color-line)" />
        </g>
        <circle cx="76" cy="68" r="34" fill="none" stroke="var(--color-line)" strokeWidth="8" />
        <circle
          cx="76"
          cy="68"
          r="34"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 34 * 0.7} ${2 * Math.PI * 34}`}
          transform="rotate(-90 76 68)"
        />
        <circle cx="76" cy="68" r="6" fill="var(--color-primary)" />
        <path d="M130 20l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="var(--color-primary)" opacity="0.55" />
      </svg>
      <span
        aria-hidden="true"
        className="absolute bottom-2 right-1 grid h-9 w-9 place-items-center rounded-full bg-[var(--color-primary)] shadow-[0_6px_14px_rgba(47,95,224,0.35)] ring-4 ring-[var(--color-ground)]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </span>
    </div>
  );
}

function IconGift() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <rect x="4" y="9.5" width="16" height="10" rx="1.5" {...iconStroke} />
      <path d="M4 13.2h16" {...iconStroke} />
      <path d="M12 9.5v10" {...iconStroke} />
      <path
        d="M12 9.5c-1.2-3-3-4-4.2-3-1 .8-.4 3 4.2 3zM12 9.5c1.2-3 3-4 4.2-3 1 .8.4 3-4.2 3z"
        {...iconStroke}
      />
    </svg>
  );
}

function IconBars() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M5 19v-6M12 19V8M19 19V5" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M12 3.5l7 3v5.2c0 4.6-3 7.8-7 8.8-4-1-7-4.2-7-8.8V6.5l7-3z" {...iconStroke} />
    </svg>
  );
}

/** The three trust points, each with a title AND a description line. */
const trustPoints = [
  {
    icon: <IconGift />,
    title: "Free · no account to start",
    body: "Get started instantly",
  },
  {
    icon: <IconBars />,
    title: "Named gaps, not a score",
    body: "Clear, actionable insights",
  },
  {
    icon: <IconShield />,
    title: "No commitment",
    body: "Explore at your own pace",
  },
] as const;

/** Bordered card of the three trust points — icon-in-circle, title,
 *  description. `className` lets a caller control width/shrink without
 *  touching the internals (e.g. `sm:w-[320px]` on the homepage). */
export function DiagnosticTrustCard({ className = "" }: { className?: string }) {
  return (
    <Card
      variant="panel"
      className={`flex shrink-0 flex-col gap-6 border border-[var(--color-line)] ${className}`}
      style={{ borderRadius: "20px" }}
    >
      {trustPoints.map((point) => (
        <div key={point.title} className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            {point.icon}
          </span>
          <div>
            <p className="text-label mb-0.5">{point.title}</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">{point.body}</p>
          </div>
        </div>
      ))}
    </Card>
  );
}
