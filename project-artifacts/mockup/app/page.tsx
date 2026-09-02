import { PublicShell } from "@/components/PublicShell";
import { ProgrammeCard } from "@/components/ProgrammeCard";
import { TrainerCard } from "@/components/TrainerCard";
import { ImageFrame } from "@/components/ImageFrame";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { domains } from "@/data/domains";
import { practitioners } from "@/data/practitioners";
import { programmes } from "@/data/programmes";

/** Homepage preview: the flagship plus the two entry-level programmes —
 *  discovery, not the catalogue. Exploration lives at /programmes. */
const featuredProgrammes = [
  programmes.find((p) => p.flagship),
  programmes.find((p) => p.slug === "data-ai-essentials"),
  programmes.find((p) => p.slug === "data-blueprint"),
].filter((p): p is NonNullable<typeof p> => Boolean(p));

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
const heroChips = [
  "24+ years in practice",
  "Practitioner-led",
  "Data & AI focused",
  "Assessment-driven",
  "Face-to-face & live online",
];

export default function HomePage() {
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

            {/* The learning journey — an original, academy-first visual:
                three ascending steps from live delivery to an earned
                credential (2026-08-31 direction: no individual trainer
                profile dominates the hero; trainers live at /trainers and
                in the "Learn from practitioners" section below). */}
            <div className="relative mx-auto w-full max-w-[400px]">
              <svg
                aria-hidden="true"
                width="150"
                height="150"
                viewBox="0 0 150 150"
                fill="none"
                className="pointer-events-none absolute -right-6 -top-10 text-[var(--color-primary)] opacity-25"
              >
                <circle cx="75" cy="75" r="60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 7" />
                <circle cx="75" cy="75" r="38" stroke="currentColor" strokeWidth="1.5" />
                <path d="M62 76 L71 85 L90 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <ol className="relative flex flex-col gap-5">
                {[
                  [
                    "01",
                    "Live programmes",
                    "Taught face-to-face and live online — never a video library.",
                    "",
                  ],
                  [
                    "02",
                    "Applied work",
                    "Real deliverables, judged by a qualified assessor against a published rubric.",
                    "sm:ml-8",
                  ],
                  [
                    "03",
                    "Earned credential",
                    "Recognition that stands for demonstrated capability — publicly verifiable.",
                    "sm:ml-16",
                  ],
                ].map(([num, title, body, offset]) => (
                  <li key={num} className={offset}>
                    <Card
                      variant="panel"
                      className="border border-[var(--color-line-strong)]"
                    >
                      <div className="flex items-baseline gap-4">
                        <span className="text-mono text-body-sm text-[var(--color-primary)]">
                          {num}
                        </span>
                        <div>
                          <p className="text-h2 mb-1">{title}</p>
                          <p className="text-body-sm text-[var(--color-ink-quiet)]">
                            {body}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
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
          {/* Each format reserves a photograph (2026-09-02). This is the
              portal's highest-value image slot: the section makes the
              product's central claim — you are in the room with a
              practitioner — and until now proved it with a text grid alone.
              The frames stay visibly empty rather than borrowing stock
              imagery, which would claim delivery that has not happened.
              Filling one is a `src` prop; no layout changes. */}
          {[
            {
              title: "Face-to-face",
              body: "Instructor-led programmes and workshops, delivered in person.",
              shot: "A face-to-face session in progress — room, participants, practitioner teaching",
              note: "consent required",
            },
            {
              title: "Live online",
              body: "Real-time sessions with the same interaction, questions and feedback — not pre-recorded content.",
              shot: "A live online session as run — screen, gallery of participants, discussion",
              note: "no client data on screen",
            },
            {
              title: "Private cohorts",
              body: "Dedicated programmes for one organisation, shaped to its context.",
              shot: "A single-organisation cohort working together",
              note: "client consent essential",
            },
            {
              title: "On-site & international",
              body: "Expert-led delivery at your location, including outside Malaysia.",
              shot: "Delivery at a client site, ideally showing place",
              note: "consent required",
            },
          ].map(({ title, body, shot, note }, i) => (
            <div
              key={title}
              className="border-t-2 border-[var(--color-primary)]/60 pt-5"
            >
              <p className="text-mono text-body-sm mb-3 text-[var(--color-ink-faint)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="text-h2 mb-2">{title}</h3>
              <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
                {body}
              </p>
              <ImageFrame
                subject={shot}
                ratio="4 / 3"
                minWidth={1600}
                note={note}
              />
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

          {/* Learn from practitioners — featured trainer cards, rendered
              from the plural practitioners array (a data change adds a
              trainer, never a redesign). Full profiles live at /trainers. */}
          <div id="practitioner" className="scroll-mt-24">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Who teaches
            </p>
            <h2 className="text-display mb-5">Learn from practitioners</h2>
            <p className="text-body-lg mb-8 text-[var(--color-ink-quiet)]">
              Programmes are designed and delivered by people who have built
              these systems in real organisations — and can respond to yours.
            </p>
            <div className="mb-6 flex flex-col gap-6">
              {practitioners.slice(0, 3).map((person) => (
                <TrainerCard key={person.slug} person={person} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <Button variant="secondary" href="/trainers">
                Meet the trainers
              </Button>
              <p className="text-body-sm text-[var(--color-ink-faint)]">
                Founder-led today — additional trainers will be real ones,
                never placeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ H5 — Programmes (light) ============
          The real portfolio now exists (migrated from the founder's training
          ecosystem), so the homepage previews it and routes to /programmes:
          discovery here, exploration there, depth on the detail pages.
          Still no dates — scheduled offerings remain State A, which keeps
          the programmes-vs-offerings emphasis (HO-1) open. */}
      <section
        id="programmes"
        className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-20"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[620px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Programmes
            </p>
            <h2 className="text-display mb-5">
              A deliberately structured portfolio, built properly
            </h2>
            <p className="text-body-lg text-[var(--color-ink-quiet)]">
              A programme here is a designed, expert-led learning experience
              with stated outcomes — what you will actually be able to do
              afterwards. Each runs as scheduled offerings: a specific format,
              dates and location you register for.
            </p>
          </div>
          <Button href="/programmes">All programmes</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredProgrammes.map((programme) => (
            <ProgrammeCard key={programme.slug} programme={programme} />
          ))}
        </div>
        <p className="text-body-sm mt-8 text-[var(--color-ink-faint)]">
          Public dates are not yet published. When they are, they will be real
          — a small, genuine schedule, never a padded catalogue.
        </p>
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
          {/* Rubric excerpt — rebuilt 2026-09-02.
              It previously rendered as a single monospace paragraph with
              <br> breaks and ○/◉ characters standing in for form controls,
              which read as terminal output rather than an assessment
              instrument. It is now laid out as the scale it actually is:
              prose in the UI face, the four levels as a real four-point
              scale, and the assessor's mark carried by a drawn indicator.
              The selected level is signalled by weight, a marker and a
              caption as well as colour — colour is never the sole carrier
              of meaning here. Still illustrative of FORMAT only: the real
              rubric is unwritten and must never be faked. */}
          <div className="night rounded-[var(--radius-panel)] border border-[var(--color-line-strong)] p-7">
            <p className="text-label mb-5">From the assessment rubric</p>

            <p className="text-h2">Justification</p>
            <p className="text-body-sm mb-7 text-[var(--color-ink-faint)]">
              Criterion 2 of 5 · assessed on every submission
            </p>

            <ol className="mb-7 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4">
              {[
                { level: "Not yet", awarded: false },
                { level: "Competent", awarded: true },
                { level: "Proficient", awarded: false },
                { level: "Distinguished", awarded: false },
              ].map(({ level, awarded }) => (
                <li key={level}>
                  <span
                    aria-hidden="true"
                    className={`mb-2.5 block h-[3px] rounded-full ${
                      awarded
                        ? "bg-[var(--color-primary)]"
                        : "bg-[var(--color-line-strong)]"
                    }`}
                  />
                  <span
                    className={`block text-body-sm ${
                      awarded
                        ? "font-semibold text-[var(--color-ink)]"
                        : "text-[var(--color-ink-faint)]"
                    }`}
                  >
                    {level}
                  </span>
                  {/* One word, not a phrase: "assessor's mark" set in the
                      tracked uppercase label wrapped to two lines inside a
                      quarter-width column and read as clutter. This carries
                      the same meaning without colour being the sole
                      signal, and never wraps. */}
                  {awarded && (
                    <span
                      className="text-label mt-1 block"
                      // `.text-label` sets its own colour and is unlayered
                      // CSS, so it outranks a Tailwind text-* utility. Set
                      // it here rather than fight specificity.
                      style={{ color: "var(--color-primary)" }}
                    >
                      Awarded
                    </span>
                  )}
                </li>
              ))}
            </ol>

            <p className="text-body-sm border-t border-[var(--color-line)] pt-5 text-[var(--color-ink-quiet)]">
              The assessor records a level for every criterion and writes the
              reasoning behind it — shown to the candidate in full.
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
