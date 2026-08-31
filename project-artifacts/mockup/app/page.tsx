import Image from "next/image";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { domains } from "@/data/domains";
import { practitioners } from "@/data/practitioners";

/**
 * P01 — Homepage. Content per docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md
 * (H0–H9); visual recomposition 2026-08-31 for the premium navy identity —
 * see docs/P01_DESIGN_DECISIONS.md "Visual redesign".
 *
 * Inventory state: STATE A — no confirmed public programme inventory.
 * Nothing here shows a programme name, date, capacity or price. The
 * programmes-vs-offerings emphasis (HO-1) remains open: both concepts are
 * described, neither leads.
 *
 * All decorative graphics below are ORIGINAL inline SVG (deterministic dot
 * fields and geometric glyphs) — nothing is copied from reference
 * material, and no stock or AI-generated imagery is used anywhere.
 */

/** Original data-atmosphere: a masked dot grid + a few falling node
 *  streams. Deterministic — no randomness, so SSR output is stable. */
function DotField({ id }: { id: string }) {
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

/** Original geometric glyphs for the three pathways. */
function GlyphRise() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 19 L10 12.5 L14 15.5 L20 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="6.5" r="2.3" fill="currentColor" />
    </svg>
  );
}
function GlyphNodes() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 8.5 L16.5 8.5 M8.5 10.5 L11 15 M15.5 10.5 L13 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="6.5" cy="8" r="2.4" fill="currentColor" />
      <circle cx="17.5" cy="8" r="2.4" fill="currentColor" />
      <circle cx="12" cy="17" r="2.4" fill="currentColor" />
    </svg>
  );
}
function GlyphTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}
function GlyphCheck() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="mt-1.5 shrink-0 text-[var(--color-primary)]"
    >
      <path
        d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const heroChips = [
  "24+ years in practice",
  "Practitioner-led",
  "Data & AI focused",
  "Assessment-driven",
  "Face-to-face & live online",
];

export default function HomePage() {
  const founder = practitioners[0];

  return (
    <PublicShell>
      {/* ============ H1 — Hero (night) ============
          The D0 compound proof: named genuine practitioner + live delivery
          formats in one eyeline. No date exists yet, so none is shown
          (State A omits the element rather than faking it). Diagnostic CTA
          sits as hero secondary per the 2026-08-31 visual-redesign
          authorization — see P01_DESIGN_DECISIONS.md. */}
      <section className="night relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(58% 72% at 76% 18%, rgba(122,132,255,0.16), transparent 70%)",
          }}
        />
        <DotField id="hero" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-16 lg:pt-20">
          <div className="grid items-center gap-14 pb-14 lg:grid-cols-[1fr_400px] lg:pb-20">
            <div className="max-w-[660px]">
              <p className="text-label mb-5 text-[var(--color-primary)]">
                Expert-led training &amp; certification · Data &amp; AI
              </p>
              <h1 className="text-display-xl mb-6">
                Taught live by a practitioner.{" "}
                <span className="text-[var(--color-primary)]">
                  Proven by the work you do.
                </span>
              </h1>
              <p className="text-body-lg mb-9 max-w-[560px] text-[var(--color-ink-quiet)]">
                Expert-led programmes for data and AI professionals —
                delivered face-to-face and live online, in Malaysia and
                internationally. This is not a course library: real sessions,
                direct feedback from someone who has built these systems, and
                a credential that has to be earned.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button href="#programmes">Explore programmes</Button>
                <Button variant="secondary" href="/diagnostic">
                  Start free diagnostic (10 min)
                </Button>
              </div>
            </div>

            {/* Genuine photograph, editorial treatment: navy gradient tie-in
                plus an overlapping credibility card. */}
            <div className="relative mx-auto w-full max-w-[400px] pb-10 lg:pb-0">
              <div className="relative overflow-hidden rounded-[var(--radius-feature)] border border-[var(--color-line-strong)]">
                <Image
                  src={founder.photo}
                  alt={`Photograph of ${founder.name}`}
                  width={800}
                  height={800}
                  priority
                  className="w-full"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,14,31,0.62) 0%, rgba(10,14,31,0.08) 38%, rgba(10,14,31,0.12) 100%)",
                  }}
                />
              </div>
              <Card
                variant="panel"
                className="relative -mt-14 ml-4 mr-[-0.5rem] border border-[var(--color-line-strong)] sm:ml-8 lg:absolute lg:-bottom-9 lg:-left-12 lg:ml-0 lg:mr-0 lg:mt-0 lg:w-[290px]"
              >
                <p className="text-label mb-2">Founder &amp; Lead Trainer</p>
                <p className="text-h1">{founder.name}</p>
                <div className="mt-3 border-t border-[var(--color-line)] pt-3">
                  <p className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
                    24+ years · enterprise data &amp; AI
                  </p>
                  <p className="text-mono text-body-sm text-[var(--color-ink-faint)]">
                    {founder.location}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Credibility descriptors — positioning facts, not metrics. */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--color-line)] py-6">
            {heroChips.map((chip) => (
              <span key={chip} className="text-label">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ H2 — Three pathways (light) ============ */}
      <section className="mx-auto max-w-[1280px] px-6 py-20">
        <p className="text-label mb-3 text-center text-[var(--color-primary)]">
          Three pathways
        </p>
        <h2 className="text-display mb-12 text-center">
          Start where it makes sense for you
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card variant="panel">
            <div className="mb-5 inline-flex rounded-[10px] bg-[var(--color-prof-1)] p-2.5 text-[var(--color-primary)]">
              <GlyphRise />
            </div>
            <p className="text-label mb-2">For individuals</p>
            <h3 className="text-h2 mb-2">Explore programmes</h3>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Expert-led programmes with stated capability outcomes, delivered
              live — and an assessed path to the credential.
            </p>
            <Button variant="secondary" href="#programmes">
              See the programmes
            </Button>
          </Card>
          <Card variant="panel">
            <div className="mb-5 inline-flex rounded-[10px] bg-[var(--color-prof-1)] p-2.5 text-[var(--color-primary)]">
              <GlyphNodes />
            </div>
            <p className="text-label mb-2">For organisations</p>
            <h3 className="text-h2 mb-2">Train your team</h3>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Private cohorts and tailored engagements — on-site, live online,
              and internationally — with evidence the capability changed.
            </p>
            <Button variant="secondary" href="#organisations">
              How we work with teams
            </Button>
          </Card>
          <Card variant="panel">
            <div className="mb-5 inline-flex rounded-[10px] bg-[var(--color-prof-1)] p-2.5 text-[var(--color-primary)]">
              <GlyphTarget />
            </div>
            <p className="text-label mb-2">Not sure where to start?</p>
            <h3 className="text-h2 mb-2">Assess your capability</h3>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Ten minutes, free, and you get a specific answer about where you
              stand — not a score.
            </p>
            <Button variant="secondary" href="/diagnostic">
              Start free diagnostic (10 min)
            </Button>
          </Card>
        </div>
      </section>

      {/* ============ H4 — How it works (light, editorial 01–04) ============ */}
      <section
        id="delivery"
        className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16"
      >
        <p className="text-label mb-3 text-[var(--color-primary)]">
          How it works
        </p>
        <h2 className="text-display mb-4 max-w-[680px]">
          Live means live. You are in the room — physical or online.
        </h2>
        <p className="text-body-lg mb-12 max-w-[680px] text-[var(--color-ink-quiet)]">
          A session is interaction: questions, discussion of your own
          situation, worked examples, and direct expert feedback — alongside
          peers from other organisations. It is never watching a recording.
        </p>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Face-to-face",
              "Instructor-led programmes and workshops, delivered in person.",
            ],
            [
              "Live online",
              "Real-time sessions with the same interaction, questions and feedback — not pre-recorded content.",
            ],
            [
              "Private cohorts",
              "Dedicated programmes for one organisation, shaped to its context.",
            ],
            [
              "On-site & international",
              "Expert-led delivery at your location, including outside Malaysia.",
            ],
          ].map(([title, body], i) => (
            <div
              key={title}
              className="border-t-2 border-[var(--color-primary)]/60 pt-5"
            >
              <p className="text-mono text-body-sm mb-3 text-[var(--color-ink-faint)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="text-h2 mb-2">{title}</h3>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                {body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-12 max-w-[680px] text-body-sm text-[var(--color-ink-faint)]">
          Materials — readings, templates, exercises, session preparation —
          support the live experience. They prepare, extend and reinforce it;
          they never replace it.
        </p>
      </section>

      {/* ============ Night band: H6 capability areas + H3 who teaches ============ */}
      <section className="night relative mt-8 overflow-hidden">
        <DotField id="band" />
        <div className="relative mx-auto grid max-w-[1280px] gap-16 px-6 py-20 lg:grid-cols-2">
          {/* Capability areas — subject scope, never categories; no counts. */}
          <div id="capability" className="scroll-mt-24">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Capability areas
            </p>
            <h2 className="text-display mb-8">
              Where we build professional capability
            </h2>
            <ul>
              {domains.map((domain) => (
                <li
                  key={domain.code}
                  className="flex items-baseline gap-4 border-t border-[var(--color-line)] py-4"
                >
                  <Chip>{domain.code}</Chip>
                  <div>
                    <p className="font-semibold">{domain.name}</p>
                    <p className="text-body-sm text-[var(--color-ink-quiet)]">
                      {domain.scope}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Who teaches — founder-led, structurally plural (a data change
              adds a practitioner, never a redesign). Grayscale treatment is
              CSS only; the photograph itself is untouched and genuine. */}
          <div id="practitioner" className="scroll-mt-24">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Who teaches
            </p>
            <h2 className="text-display mb-6">
              Learn from someone who has done the work
            </h2>
            {practitioners.map((person) => (
              <div key={person.slug}>
                <div className="mb-6 flex items-center gap-5">
                  <Image
                    src={person.photo}
                    alt=""
                    width={800}
                    height={800}
                    className="h-20 w-20 rounded-[var(--radius-plate)] object-cover grayscale"
                  />
                  <div>
                    <p className="text-h2">{person.name}</p>
                    <p className="text-body-sm text-[var(--color-ink-quiet)]">
                      {person.role} · {person.location}
                    </p>
                  </div>
                </div>
                <ul className="mb-6 flex flex-col gap-2.5">
                  {person.facts.map((fact, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <GlyphCheck />
                      <span className="text-body-sm text-[var(--color-ink-quiet)]">
                        {fact}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-body-sm text-[var(--color-ink-faint)]">
              The platform is founder-led today. As it grows, additional
              practitioners will be introduced here — only ever real ones.
            </p>
          </div>
        </div>
      </section>

      {/* ============ H5 — Programmes (light, State A) ============ */}
      <section
        id="programmes"
        className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-20"
      >
        <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
          <div className="max-w-[620px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Programmes
            </p>
            <h2 className="text-display mb-6">
              A deliberately small set of programmes, built properly
            </h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              A programme here is a designed, expert-led learning experience
              with stated outcomes — what you will actually be able to do
              afterwards. Each programme runs as scheduled offerings: a
              specific format, dates and location you register for.
            </p>
            <p className="text-body-sm mb-9 text-[var(--color-ink-quiet)]">
              The first public programmes and their dates are being finalised
              now. When they are published, they will be real — a small,
              genuine schedule, never a padded catalogue.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="secondary" href="#">
                Register your interest
              </Button>
              <Button variant="text" href="#organisations">
                Or talk to us about a private cohort
              </Button>
            </div>
          </div>
          <Card variant="panel">
            <p className="text-label mb-5">Every programme includes</p>
            <ul>
              {[
                "Capability outcomes stated up front — what you will be able to do",
                "Live, expert-led sessions — face-to-face or online",
                "Applied work on realistic enterprise problems",
                "Supporting materials that prepare and reinforce each session",
                "An assessed path toward the credential, judged by a qualified assessor",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-baseline gap-4 border-t border-[var(--color-line)] py-3 text-body-sm text-[var(--color-ink-quiet)]"
                >
                  <span className="text-mono text-[var(--color-primary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* ============ H7 — Certification (light + night rubric card) ============ */}
      <section
        id="credential"
        className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-[560px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Certification
            </p>
            <h2 className="text-display mb-6">
              The credential has to be earned
            </h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              No credential here is awarded for showing up. It is earned
              through assessed applied work — real deliverables, judged by a
              qualified assessor against a published rubric, with written
              reasoning for every criterion.
            </p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Taking part in an expert-led programme is part of the pathway.
              Attendance alone is never enough — and that is exactly why the
              credential means something to an employer.
            </p>
          </div>
          <div className="night rounded-[var(--radius-panel)] border border-[var(--color-line-strong)] p-7">
            <p className="text-label mb-4">From the assessment rubric</p>
            <p className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
              Criterion 2 — Justification
              <br />
              ○ Not yet&nbsp;&nbsp;◉ Competent&nbsp;&nbsp;○
              Proficient&nbsp;&nbsp;○ Distinguished
              <br />
              <br />
              Assessor reasoning: written for every criterion,
              <br />
              and shown to the candidate in full.
            </p>
          </div>
        </div>
      </section>

      {/* ============ H8 — For organisations (raised) ============ */}
      <section
        id="organisations"
        className="scroll-mt-24 border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]"
      >
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div className="max-w-[560px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              For organisations
            </p>
            <h2 className="text-display mb-6">
              Build your team&rsquo;s capability — with proof it worked
            </h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              Private cohorts and tailored engagements, delivered on-site,
              live online, or at your locations internationally. We usually
              start with a team capability assessment — so the programme
              targets the gaps you actually have.
            </p>
            <p className="text-body-sm mb-9 text-[var(--color-ink-quiet)]">
              You get cohort visibility, attendance records, and the
              documentation your L&amp;D and reporting processes need.
            </p>
            <Button variant="secondary" href="#">
              Talk to us about your team
            </Button>
          </div>
          <Card variant="plate" className="bg-[var(--color-ground)] p-6">
            <p className="text-label mb-4">
              Illustrative — team capability view
            </p>
            <div className="grid grid-cols-10 gap-1" aria-hidden="true">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[3px]"
                  style={{
                    background: `var(--color-prof-${((i * 13 + 3) % 5) + 1})`,
                  }}
                />
              ))}
            </div>
            <p className="text-mono mt-4 text-[0.7rem] text-[var(--color-ink-faint)]">
              team members × capability areas · proficiency 1–5
            </p>
          </Card>
        </div>
      </section>

      {/* ============ H9 — Honest position + primary close (light) ============ */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 text-center">
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Where we are today
        </p>
        <h2 className="text-display mb-5">
          The first programmes are being prepared now
        </h2>
        <p className="text-body-lg mx-auto mb-9 max-w-[620px] text-[var(--color-ink-quiet)]">
          Everything published here will be genuine — real programmes, real
          dates, a real practitioner. On a platform about proof, that starts
          with us.
        </p>
        <Button href="#programmes">Explore programmes</Button>
      </section>

      {/* ============ Diagnostic band (night, pre-footer) ============
          Final placement of the preserved diagnostic CTA. Descriptors are
          the approved expectations — free, ~10 minutes, named gaps, no
          commitment — not metrics. */}
      <section className="night relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 90% at 18% 50%, rgba(122,132,255,0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex max-w-[1280px] flex-col gap-10 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-[560px] items-start gap-5">
            <div className="mt-1 hidden rounded-[10px] border border-[var(--color-line-strong)] p-2.5 text-[var(--color-primary)] sm:inline-flex">
              <GlyphTarget />
            </div>
            <div>
              <h2 className="text-h1 mb-2">Not sure where you stand?</h2>
              <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
                The free diagnostic locates you across our capability areas
                and names your gaps in plain language — before you commit to
                anything.
              </p>
              <Button href="/diagnostic">Start free diagnostic (10 min)</Button>
            </div>
          </div>
          <div className="flex items-center gap-8 lg:gap-10">
            <div>
              <p className="text-mono text-h1">10</p>
              <p className="text-label">minutes</p>
            </div>
            <div className="flex flex-col gap-3 border-l border-[var(--color-line)] pl-8 lg:pl-10">
              <p className="text-label">Free · no account to start</p>
              <p className="text-label">Named gaps, not a score</p>
              <p className="text-label">No commitment</p>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
