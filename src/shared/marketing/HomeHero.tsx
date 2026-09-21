/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/HomeHeroLight.tsx
 * (ADR-045; exported as `HomeHero`). Changes on port: the trainer whose HRD
 * Corp accreditation the second card cites is passed in as `founder`
 * (repository `ExpertRecord`, may be null) instead of `practitioners[0]`;
 * the "Explore Courses" CTA target is passed in as `exploreHref`; the
 * mockup's `assetPath()` basePath workaround is dropped. Copy, cards,
 * classes and markup are unchanged.
 */

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { ExpertRecord } from "@/modules/catalogue/experts/repository";
import { NeuralNetworkBackground } from "./NeuralNetworkBackground";

/**
 * P01 — Homepage hero + learning-journey strip. Dark `.night` hero over an
 * original neural-network SVG, a 2-column grid of six capability cards, and
 * a light "learning journey" band beneath.
 *
 * Icons are original inline SVG, hand-authored for this component,
 * matching the portal's "no icon library" convention elsewhere.
 */

const s = {
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M13 3L5 13.5h5.5L11 21l8-10.5h-5.5L13 3z" {...s} />
    </svg>
  );
}
function IconRobot() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="5" y="9" width="14" height="10" rx="2.5" {...s} />
      <path d="M12 9V5.5M9.5 5.5h5" {...s} />
      <circle cx="9.5" cy="14" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="14" r="1.2" fill="currentColor" />
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="3.5" y="8" width="17" height="11" rx="1.5" {...s} />
      <path d="M8.5 8V6a2 2 0 012-2h3a2 2 0 012 2v2" {...s} />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" {...s} />
      <path d="M4 12h16M12 4c2.5 2.2 3.8 5 3.8 8s-1.3 5.8-3.8 8c-2.5-2.2-3.8-5-3.8-8s1.3-5.8 3.8-8z" {...s} strokeWidth={1.4} />
    </svg>
  );
}
function IconCode() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" {...s} />
    </svg>
  );
}
function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" {...s} />
      <path d="M8 12.5l2.5 2.5L16 9.5" {...s} />
    </svg>
  );
}
function IconChat() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M4 5.5h16v10.5H9.5L5 20v-4H4z" {...s} />
    </svg>
  );
}
function IconBook() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M4 5.2c2.2-1 4.7-1 7 0v13.6c-2.3-1-4.8-1-7 0V5.2z" {...s} />
      <path d="M20 5.2c-2.2-1-4.7-1-7 0v13.6c2.3-1 4.8-1 7 0V5.2z" {...s} />
    </svg>
  );
}
function IconCube() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M12 3.5l7.5 4.3v8.4L12 20.5l-7.5-4.3V7.8L12 3.5z" {...s} />
      <path d="M12 12v8.5M4.5 7.8L12 12l7.5-4.2" {...s} />
    </svg>
  );
}
function IconPerson() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" {...s} />
      <path d="M5.5 19c1-3.5 3.8-5.5 6.5-5.5s5.5 2 6.5 5.5" {...s} />
    </svg>
  );
}
function IconBars() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M5 19v-6M12 19V8M19 19V5" {...s} strokeWidth={2.2} />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M4 12h16M13 5l7 7-7 7" {...s} strokeWidth={2} />
    </svg>
  );
}

const benefits = [
  { tone: "blue", icon: <IconBolt />, label: "Learn by Building" },
  { tone: "purple", icon: <IconRobot />, label: "AI-Powered Skills" },
  { tone: "orange", icon: <IconBriefcase />, label: "Freelance Ready" },
  { tone: "teal", icon: <IconGlobe />, label: "Work From Anywhere" },
] as const;

const journey = [
  { num: "01", icon: <IconBook />, title: "Learn", body: "Master in-demand skills from global professionals." },
  { num: "02", icon: <IconCube />, title: "Build", body: "Apply your learning through real-world projects." },
  { num: "03", icon: <IconPerson />, title: "Showcase", body: "Create a portfolio that demonstrates what you can actually do." },
  { num: "04", icon: <IconBars />, title: "Explore Opportunities", body: "Use your skills and evidence to pursue freelance and remote opportunities." },
] as const;

/* Tinted-glass chips for the DARK hero. Each icon colour is ≥7:1 on the navy. */
const toneClasses = {
  blue: "bg-[rgba(59,130,246,0.18)] text-[#60a5fa] ring-1 ring-[rgba(96,165,250,0.35)]",
  purple: "bg-[rgba(139,92,246,0.2)] text-[#b39dfa] ring-1 ring-[rgba(167,139,250,0.35)]",
  orange: "bg-[rgba(246,164,75,0.16)] text-[#f6a44b] ring-1 ring-[rgba(246,164,75,0.35)]",
  teal: "bg-[rgba(34,211,238,0.14)] text-[#22d3ee] ring-1 ring-[rgba(34,211,238,0.35)]",
} as const;

/** Glass capability card for the dark hero. `.night` scopes the tokens, so
 *  these read as translucent panels over the network. */
const glassCard =
  "rounded-2xl border border-[var(--color-line)] bg-[rgba(255,255,255,0.05)] p-4 backdrop-blur-sm";

export function HomeHero({
  founder,
  exploreHref,
}: {
  /** The trainer whose HRD Corp accreditation the hero cites; null renders
   *  the card without a Trainer ID or badge. */
  founder: ExpertRecord | null;
  /** Target of the single hero CTA, "Explore Courses". */
  exploreHref: string;
}) {
  const accreditation = founder?.hrdCorpAccreditation ?? null;

  /* Six hero cards, in the founder's order. Copy is the founder's, verbatim.
     Card 2 claims only the TRAINER's HRD Corp accreditation (the
     organisation is not a registered provider); card 1 states the founder's
     intent — an open policy commitment, not yet backed by terms. */
  const heroCards: { icon: ReactNode; tone: keyof typeof toneClasses; title: string; body: string; href?: string; badge?: string }[] = [
    { icon: <IconBriefcase />, tone: "blue", title: "Job Opportunities in Malaysia", body: "1–2 top candidates will be brought to Malaysia for job opportunities." },
    { icon: <IconCheckCircle />, tone: "teal", title: "HRD Corp Accredited Trainer", body: accreditation ? `Verified — Trainer ID ${accreditation.trainerId}.` : "Trained by an HRD Corp Accredited Trainer.", href: "/hrd-corp", badge: accreditation?.badge },
    { icon: <IconCheckCircle />, tone: "blue", title: "No Coding Experience Required", body: "Anyone with zero coding background can take this course." },
    { icon: <IconChat />, tone: "teal", title: "Prepare for Interviews", body: "Get ready for Data & AI Interview" },
    { icon: <IconCode />, tone: "blue", title: "Learn Vibe Coding", body: "Turn ideas into real products with AI." },
    { icon: <IconGlobe />, tone: "teal", title: "Start Freelance Right After Training", body: "Work From Anywhere" },
  ];

  return (
    <>
      {/* ===== Hero ===== */}
      {/* DARK HERO — `.night` swaps in the deep-navy tokens; the gradient is
          inline because `.night`'s own `background` is unlayered CSS and
          would beat a bg-* utility. */}
      <section
        className="night relative overflow-hidden"
        style={{
          background:
            "radial-gradient(60% 70% at 78% 28%, rgba(37,99,235,0.28), transparent 70%), radial-gradient(45% 55% at 12% 90%, rgba(139,92,246,0.16), transparent 70%), linear-gradient(180deg, #071a35 0%, #061226 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <NeuralNetworkBackground id="home-hero" />
        </div>
        <div className="relative mx-auto grid max-w-[1280px] gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-bold tracking-[0.2em] text-[var(--color-cyan)]">
              PRACTICAL SKILLS FOR A BRIGHTER TOMORROW
            </p>
            <h1 className="mb-5 text-5xl font-bold leading-[1.05] tracking-tight text-[var(--color-ink)]">
              Don&rsquo;t Just Learn.{" "}
              <span className="bg-gradient-to-r from-[#22d3ee] via-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                Build a Future
              </span>{" "}
              You&rsquo;re Excited About.
            </h1>
            <p className="mb-8 max-w-[560px] text-[17px] leading-relaxed text-[var(--color-ink-quiet)]">
              Learn Vibe Coding and modern digital skills, build real projects,
              create a portfolio, and explore freelance and remote
              opportunities — all from anywhere in the world.
            </p>
            <div className="mb-8 flex flex-wrap gap-3">
              <Link
                href={exploreHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-action)] px-6 py-3.5 text-[15px] font-semibold text-[var(--color-action-ink)] shadow-[0_10px_28px_rgba(37,99,235,0.45)] transition-colors hover:bg-[var(--color-action-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                Explore Courses <IconArrow />
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {benefits.map((b) => (
                <div key={b.label} className="flex items-center gap-2.5">
                  <span className={`grid h-9 w-9 place-items-center rounded-full ${toneClasses[b.tone]}`}>
                    {b.icon}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-ink-quiet)]">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating cards — a plain 2-column grid of all six cards. */}
          <div className="relative mx-auto grid max-w-[520px] grid-cols-2 gap-3">
            {heroCards.map((c) => {
              const inner = (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    {c.badge ? (
                      <Image src={c.badge} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${toneClasses[c.tone]}`}>{c.icon}</span>
                    )}
                    <p className="text-[13px] font-semibold leading-tight text-[var(--color-ink)]">{c.title}</p>
                  </div>
                  <p className="text-[12px] leading-snug text-[var(--color-ink-faint)]">{c.body}</p>
                </>
              );
              return c.href ? (
                <Link key={c.title} href={c.href} className={`${glassCard} transition-colors hover:bg-[rgba(255,255,255,0.09)]`}>
                  {inner}
                </Link>
              ) : (
                <div key={c.title} className={glassCard}>
                  {inner}
                </div>
              );
            })}

            <p className="col-span-2 mt-2 text-right text-[15px] font-medium italic text-[var(--color-cyan)]">
              Real Skills. Real Opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Learning journey =====
          A LIGHT band between the dark hero and the dark diagnostic: a
          connecting dashed rail through ringed, gradient-tinted step badges. */}
      <section className="bg-[var(--color-ground)]">
        <div className="mx-auto max-w-[1280px] px-6 py-14">
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[var(--color-ink-faint)]">YOUR LEARNING JOURNEY</p>
          <h2 className="mb-10 max-w-[520px] text-3xl font-bold leading-tight text-[var(--color-ink)]">
            From learning to <span className="text-[var(--color-primary)]">real opportunities.</span>
          </h2>
          <ol className="grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-4">
            {journey.map((step, i) => (
              <li key={step.num} className="contents">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[rgba(37,99,235,0.28)] bg-gradient-to-br from-white to-[#e7efff] text-[var(--color-primary)] shadow-[0_6px_18px_rgba(37,99,235,0.14)]">
                      {step.icon}
                    </span>
                    <div>
                      <p className="text-mono text-xs font-bold tracking-wide text-[var(--color-primary)]">{step.num}</p>
                      <p className="text-base font-semibold text-[var(--color-ink)]">{step.title}</p>
                    </div>
                  </div>
                  <p className="text-[13px] leading-snug text-[var(--color-ink-quiet)]">{step.body}</p>
                </div>
                {i < journey.length - 1 && (
                  <div className="hidden items-center gap-1 self-start pt-[18px] text-[rgba(37,99,235,0.45)] lg:flex" aria-hidden="true">
                    <span className="block w-8 border-t-2 border-dashed border-current lg:w-14" />
                    <IconArrow />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
