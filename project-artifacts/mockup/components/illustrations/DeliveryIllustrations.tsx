/**
 * Original illustrations for the "Photograph needed" slots (`ImageFrame`).
 *
 * FOUNDER DIRECTION 2026-09-05: fill the reserved photography slots with
 * imagery rather than leave them as dashed-border placeholders. The request
 * was framed as "AI-generated photographs" and explicitly acknowledged as
 * overriding the documented no-stock/no-AI-photo rule in docs/IMAGE_SLOTS.md
 * ("a photograph of a classroom is a claim that cohorts have run"). No image-
 * generation tool is available in this environment, so — offered as an
 * alternative and accepted — these are hand-authored, ORIGINAL inline SVG
 * illustrations instead: abstract, geometric, deterministic (no photographic
 * likeness of any real or implied person, no randomness). This is the same
 * technique already used everywhere else in this codebase (components/
 * DotField.tsx, the homepage hero glyphs) and sits inside the *existing*
 * "original graphics authored for this portal" exception in IMAGE_SLOTS.md
 * — so, in the end, nothing here actually needed the override. It stays
 * clearly non-photographic on purpose: it must never be mistaken for
 * evidence that a session happened, only used as a placeholder that is more
 * finished-looking than a dashed box. Swapping in a real photograph later
 * is still just a `src` prop — see ImageFrame.tsx.
 *
 * Every shape below is drawn, not traced or generated from any reference
 * material or photograph.
 */

const DOT = "var(--color-line)";
const GROUND = "var(--color-ground-raised)";
const INK = "var(--color-ink-quiet)";

/** Shared dot-grid + soft accent-glow backdrop, matching DotField's language. */
function Backdrop({ id, accent }: { id: string; accent: string }) {
  return (
    <>
      <defs>
        <pattern
          id={`${id}-dots`}
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1.3" cy="1.3" r="1" fill={DOT} />
        </pattern>
        <radialGradient id={`${id}-glow`} cx="78%" cy="18%" r="75%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill={GROUND} />
      <rect width="100%" height="100%" fill={`url(#${id}-dots)`} />
      <rect width="100%" height="100%" fill={`url(#${id}-glow)`} />
    </>
  );
}

/** Abstract seated/standing figure — head + shoulders, never a likeness. */
function Person({
  x,
  y,
  scale = 1,
  color,
  standing = false,
}: {
  x: number;
  y: number;
  scale?: number;
  color: string;
  standing?: boolean;
}) {
  const r = 7 * scale;
  const bodyH = (standing ? 34 : 20) * scale;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={-bodyH - r * 0.4} r={r} fill={color} />
      <path
        d={`M ${-r * 1.5} 0 Q ${-r * 1.5} ${-bodyH} 0 ${-bodyH} Q ${r * 1.5} ${-bodyH} ${r * 1.5} 0 Z`}
        fill={color}
        opacity={0.85}
      />
    </g>
  );
}

const wrapperSvgProps = {
  role: "img" as const,
  "aria-hidden": true,
  preserveAspectRatio: "xMidYMid slice",
  className: "h-full w-full",
};

/** 1. Face-to-face — room, participants seated, practitioner presenting. */
export function FaceToFaceIllustration() {
  const accent = "var(--color-primary)";
  return (
    <svg viewBox="0 0 400 300" {...wrapperSvgProps}>
      <Backdrop id="f2f" accent={accent} />
      {/* Presenter, standing, facing the seated group */}
      <Person x={310} y={190} scale={1.15} color={accent} standing />
      {/* A simple easel/board beside the presenter */}
      <rect
        x={330}
        y={110}
        width={46}
        height={62}
        rx={3}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        opacity={0.6}
      />
      <path
        d="M 340 128 H 366 M 340 140 H 360 M 340 152 H 366"
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* Seated participants, two loose rows */}
      {[70, 120, 170, 220].map((x, i) => (
        <Person key={`a${x}`} x={x} y={220} scale={0.9} color={INK} />
      ))}
      {[95, 145, 195].map((x) => (
        <Person key={`b${x}`} x={x} y={255} scale={0.85} color={INK} />
      ))}
      {/* Sightlines from a couple of participants toward the presenter */}
      <path
        d="M 90 205 Q 200 150 300 190"
        fill="none"
        stroke={accent}
        strokeWidth={1.5}
        strokeDasharray="1 8"
        strokeLinecap="round"
        opacity={0.4}
      />
    </svg>
  );
}

/** 2. Live online — screen, gallery of participants, discussion. */
export function LiveOnlineIllustration() {
  const accent = "var(--color-hero-teal)";
  return (
    <svg viewBox="0 0 400 300" {...wrapperSvgProps}>
      <Backdrop id="live" accent={accent} />
      <rect
        x={70}
        y={60}
        width={260}
        height={165}
        rx={8}
        fill="var(--color-ground)"
        stroke={accent}
        strokeWidth={2}
      />
      {/* Speaker tile, larger */}
      <rect
        x={84}
        y={74}
        width={110}
        height={80}
        rx={4}
        fill="none"
        stroke={accent}
        strokeWidth={1.5}
        opacity={0.7}
      />
      <Person x={139} y={140} scale={1} color={accent} />
      {/* Gallery grid of smaller tiles */}
      {[0, 1, 2].map((col) =>
        [0, 1].map((row) => (
          <g key={`${col}-${row}`}>
            <rect
              x={204 + col * 42}
              y={74 + row * 40}
              width={36}
              height={34}
              rx={3}
              fill="none"
              stroke={INK}
              strokeWidth={1.2}
              opacity={0.5}
            />
            <Person
              x={204 + col * 42 + 18}
              y={74 + row * 40 + 27}
              scale={0.45}
              color={INK}
            />
          </g>
        )),
      )}
      {/* Control bar */}
      <rect x={84} y={168} width={200} height={12} rx={6} fill={accent} opacity={0.15} />
      <circle cx={94} cy={174} r={4} fill={accent} />
      <circle cx={112} cy={174} r={4} fill={accent} opacity={0.6} />
      <circle cx={130} cy={174} r={4} fill={accent} opacity={0.6} />
      {/* Discussion waveform beneath the speaker tile */}
      <path
        d="M 84 195 v-6 M 92 195 v-14 M 100 195 v-4 M 108 195 v-18 M 116 195 v-8 M 124 195 v-3"
        stroke={accent}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 3. Private cohorts — one organisation's group, working closely together. */
export function PrivateCohortIllustration() {
  const accent = "var(--color-hero-purple)";
  return (
    <svg viewBox="0 0 400 300" {...wrapperSvgProps}>
      <Backdrop id="cohort" accent={accent} />
      {/* A single boundary — one organisation */}
      <rect
        x={90}
        y={60}
        width={220}
        height={190}
        rx={12}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeDasharray="3 7"
        opacity={0.55}
      />
      {/* Tight cluster of participants connected to each other, not a lecturer */}
      {[
        [160, 190],
        [220, 165],
        [260, 210],
        [190, 235],
        [240, 245],
      ].map(([x, y], i) => (
        <Person key={i} x={x} y={y} scale={0.95} color={i === 1 ? accent : INK} />
      ))}
      <path
        d="M 160 178 L 220 153 L 260 198 L 190 223 L 240 233 L 160 178 L 260 198"
        fill="none"
        stroke={accent}
        strokeWidth={1.3}
        strokeLinecap="round"
        opacity={0.35}
      />
    </svg>
  );
}

/** 4. On-site & international — a place, a pin, delivery away from home base. */
export function OnSiteIllustration() {
  const accent = "var(--color-hero-orange)";
  return (
    <svg viewBox="0 0 400 300" {...wrapperSvgProps}>
      <Backdrop id="onsite" accent={accent} />
      {/* Horizon */}
      <line x1={0} y1={210} x2={400} y2={210} stroke={INK} strokeWidth={1.2} opacity={0.3} />
      {/* A simple building at the client site */}
      <rect x={140} y={140} width={90} height={70} fill="none" stroke={INK} strokeWidth={2} opacity={0.5} />
      <path d="M 132 140 L 185 105 L 238 140" fill="none" stroke={INK} strokeWidth={2} opacity={0.5} />
      <rect x={160} y={165} width={18} height={22} fill="none" stroke={INK} strokeWidth={1.5} opacity={0.5} />
      <rect x={196} y={165} width={18} height={22} fill="none" stroke={INK} strokeWidth={1.5} opacity={0.5} />
      {/* Location pin marking the delivery site */}
      <g transform="translate(270 120)">
        <path
          d="M 0 0 C -18 0 -26 16 -12 34 L 0 52 L 12 34 C 26 16 18 0 0 0 Z"
          fill={accent}
          opacity={0.85}
        />
        <circle cx={0} cy={16} r={7} fill="var(--color-ground)" />
      </g>
      {/* A well-travelled dashed route from "home" to the pin */}
      <path
        d="M 60 200 Q 150 90 262 100"
        fill="none"
        stroke={accent}
        strokeWidth={1.5}
        strokeDasharray="2 8"
        strokeLinecap="round"
        opacity={0.5}
      />
      <circle cx={60} cy={200} r={5} fill={INK} opacity={0.6} />
    </svg>
  );
}

/**
 * 5. Founder teaching — deliberately NOT a portrait: a standing figure at a
 * board with a small seated group, generic enough that it never reads as a
 * likeness of any specific person.
 */
export function FounderTeachingIllustration() {
  const accent = "var(--color-primary)";
  return (
    <svg viewBox="0 0 300 200" {...wrapperSvgProps}>
      <Backdrop id="founder" accent={accent} />
      <rect x={40} y={40} width={80} height={56} rx={3} fill="none" stroke={accent} strokeWidth={2} opacity={0.6} />
      <path
        d="M 50 56 H 100 M 50 66 Q 70 60 90 68 M 50 80 H 82"
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />
      <Person x={95} y={150} scale={1.1} color={accent} standing />
      {[160, 200, 240].map((x) => (
        <Person key={x} x={x} y={165} scale={0.85} color={INK} />
      ))}
      <path
        d="M 130 140 Q 190 110 250 145"
        fill="none"
        stroke={accent}
        strokeWidth={1.4}
        strokeDasharray="1 7"
        strokeLinecap="round"
        opacity={0.4}
      />
    </svg>
  );
}

/** 6. Trainer at work — mid-session, gesturing, not posed for the camera. */
export function TrainerAtWorkIllustration() {
  const accent = "var(--color-primary)";
  return (
    <svg viewBox="0 0 300 200" {...wrapperSvgProps}>
      <Backdrop id="trainer" accent={accent} />
      <Person x={150} y={150} scale={1.3} color={accent} standing />
      {/* A raised, gesturing arm — mid-explanation, not a static pose */}
      <path
        d="M 158 118 Q 180 100 198 108"
        fill="none"
        stroke={accent}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={200} cy={107} r={3.5} fill={accent} />
      {/* Small audience of dots below, out of focus */}
      {[70, 100, 200, 230].map((x) => (
        <circle key={x} cx={x} cy={172} r={5} fill={INK} opacity={0.35} />
      ))}
    </svg>
  );
}

/** 7. Flagship band — a cohort actively building, not sitting and listening. */
export function CohortBuildingIllustration() {
  const accent = "var(--color-hero-blue)";
  return (
    <svg viewBox="0 0 300 200" {...wrapperSvgProps}>
      <Backdrop id="build" accent={accent} />
      {/* A shared structure being assembled — interlocking blocks, not a lecture */}
      <g stroke={accent} strokeWidth={2} fill="none">
        <rect x={110} y={80} width={40} height={30} rx={3} opacity={0.85} />
        <rect x={150} y={60} width={40} height={30} rx={3} opacity={0.6} />
        <rect x={90} y={110} width={40} height={30} rx={3} opacity={0.45} />
        <rect x={150} y={110} width={40} height={30} rx={3} opacity={0.7} />
      </g>
      {/* Hands from around the table, contributing */}
      {[
        [70, 168],
        [130, 172],
        [190, 168],
        [230, 150],
      ].map(([x, y], i) => (
        <Person key={i} x={x} y={y} scale={0.85} color={i % 2 ? INK : accent} />
      ))}
    </svg>
  );
}

/** 8. Course header — wide banner: the room, the participants, work underway. */
export function CourseInDeliveryIllustration() {
  const accent = "var(--color-primary)";
  return (
    <svg viewBox="0 0 420 180" {...wrapperSvgProps}>
      <Backdrop id="course" accent={accent} />
      <rect x={30} y={40} width={360} height={100} rx={6} fill="none" stroke={accent} strokeWidth={1.5} opacity={0.35} />
      {/* Central shared workspace */}
      <rect x={170} y={70} width={80} height={40} rx={4} fill="none" stroke={accent} strokeWidth={2} opacity={0.6} />
      <path d="M 182 90 H 238 M 182 98 H 220" stroke={accent} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      {/* Participants ringed around it */}
      {[
        [80, 130],
        [120, 145],
        [300, 145],
        [340, 130],
        [210, 150],
      ].map(([x, y], i) => (
        <Person key={i} x={x} y={y} scale={0.85} color={INK} />
      ))}
      {/* Facilitator */}
      <Person x={210} y={72} scale={0.9} color={accent} />
    </svg>
  );
}

/** 9. How it's taught — a worked exercise or case being diagrammed. */
export function TeachingDetailIllustration() {
  const accent = "var(--color-primary)";
  return (
    <svg viewBox="0 0 300 200" {...wrapperSvgProps}>
      <Backdrop id="detail" accent={accent} />
      <rect x={50} y={40} width={200} height={130} rx={4} fill="var(--color-ground)" stroke={accent} strokeWidth={2} />
      {/* A worked case: boxes connected by a reasoning path, mid-sketch */}
      <g stroke={accent} strokeWidth={1.8} fill="none">
        <rect x={70} y={62} width={44} height={26} rx={3} />
        <rect x={140} y={62} width={44} height={26} rx={3} opacity={0.7} />
        <rect x={105} y={112} width={44} height={26} rx={3} opacity={0.5} />
      </g>
      <path
        d="M 114 75 H 140 M 162 88 Q 150 100 149 112"
        stroke={accent}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Annotation marks, as if mid-explanation */}
      <path d="M 70 150 H 130 M 70 158 H 110" stroke={INK} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
    </svg>
  );
}
