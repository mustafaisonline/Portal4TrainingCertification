import { PublicShell } from "@/components/PublicShell";
import { ImageFrame } from "@/components/ImageFrame";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { domains } from "@/data/domains";
import { courses } from "@/data/courses";

/**
 * P01 — Homepage. Content per docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md
 * (H0–H9); visual recomposition 2026-08-31 for the premium navy identity —
 * see docs/P01_DESIGN_DECISIONS.md "Visual redesign".
 *
 * Inventory state: STATE A — no confirmed public course inventory.
 * Nothing here shows a course name, date, capacity or price. The
 * courses-vs-offerings emphasis (HO-1) remains open: both concepts are
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

/* Original glyphs for the hero credibility badges — one per heroChip.
   Hand-drawn line icons in the file's existing style, not an icon library. */
function GlyphEnterprise() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="9" height="16" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="9" width="5" height="11" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 7.5h1.5M7.5 11h1.5M7.5 14.5h1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function GlyphPractitioner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 19c1-3.5 3.8-5.5 6.5-5.5s5.5 2 6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function GlyphDataAI() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 3.5v2.3M12 18.2v2.3M3.5 12h2.3M18.2 12h2.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function GlyphAssessed() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4.5" width="14" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 12l2.3 2.3L16 9.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GlyphLiveGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 12h16M12 4c2.5 2.2 3.8 5 3.8 8s-1.3 5.8-3.8 8c-2.5-2.2-3.8-5-3.8-8s1.3-5.8 3.8-8z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function GlyphArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h16M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GlyphDiagnosticBars() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19V13M12 19V8M19 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
/* Positioning facts about the ACADEMY — never metrics, and never facts that
   belong to a person rather than the organisation. "24+ years in practice"
   was removed on 2026-09-02 (founder direction) on both counts: it is a
   metric, which this strip's own rule excludes, and it is the founder's
   experience rather than the Academy's, so reading it here implied an
   organisation two decades old. It survives where it is true — the trainer's
   `experienceLine`. "Real enterprise context" replaces it, drawn from
   DR-02 §9, and adds a dimension the other four do not carry. */
const heroChips = [
  { label: "Real enterprise context", icon: <GlyphEnterprise /> },
  { label: "Practitioner-led", icon: <GlyphPractitioner /> },
  { label: "Data & AI focused", icon: <GlyphDataAI /> },
  { label: "Assessment-driven", icon: <GlyphAssessed /> },
  { label: "Face-to-face & live online", icon: <GlyphLiveGlobe /> },
];

export default function HomePage() {
  return (
    <PublicShell>
      {/* ============ H1 — Hero (night) ============
          The D0 compound proof: named genuine practitioner + live delivery
          formats in one eyeline. No date exists yet, so none is shown
          (State A omits the element rather than faking it). Diagnostic CTA
          sits as hero secondary per the 2026-08-31 visual-redesign
          authorization — see P01_DESIGN_DECISIONS.md.

          2026-09-04: recomposed (headline cadence, CTA helper line,
          credibility badges) taking layout cues from a founder-supplied
          reference mockup — see the founder's request in session for the
          reference. The reference's own copy (self-paced/portfolio/
          freelance framing) was NOT used: it contradicts DR-02's
          expert-led, live-delivery, earned-credential model, so every
          line below still carries only facts already approved elsewhere
          on this page. The reference's photograph was deliberately not
          used either — this file's header comment bars stock/AI imagery
          site-wide, and the 2026-08-31 direction already decided no
          individual profile should dominate the hero; the abstract
          "learning journey" visual is unchanged for that reason. */}
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
                Taught live.
                <br />
                <span className="text-[var(--color-primary)]">
                  By a practitioner.
                </span>
                <br />
                Proven by the work you do.
              </h1>
              <p className="text-body-lg mb-6 max-w-[560px] text-[var(--color-ink-quiet)]">
                Expert-led courses for data and AI professionals —
                delivered face-to-face and live online, in Malaysia and
                internationally. This is not a video library: real sessions,
                direct feedback from someone who has built these systems, and
                a credential that has to be earned.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button href="/courses">
                  Explore courses
                  <GlyphArrowRight />
                </Button>
                <Button variant="secondary" href="/diagnostic">
                  <GlyphDiagnosticBars />
                  Start free diagnostic (10 min)
                </Button>
              </div>
              <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
                Not sure where to start? The free 10-minute diagnostic names
                your gaps — no account needed.
              </p>

              {/* Credibility badges — positioning facts, not metrics;
                  content unchanged from the prior full-width strip, only
                  the presentation (icon + label) and position moved. */}
              <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-4">
                {heroChips.map(({ label, icon }) => (
                  <li key={label} className="flex items-center gap-2.5">
                    <span className="inline-flex rounded-full bg-[var(--color-prof-1)] p-1.5 text-[var(--color-primary)]">
                      {icon}
                    </span>
                    <span className="text-label">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The learning journey — an original, academy-first visual:
                three ascending steps from live delivery to an earned
                credential (2026-08-31 direction: no individual trainer
                profile dominates the hero; trainers live at /trainers). */}
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
                    "Live courses",
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
              {/* Floating fact tag — echoes the reference mockup's corner
                  tag treatment, restating a fact already stated in the
                  subtext above rather than a new claim. */}
              <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground-raised)] px-3.5 py-2 shadow-lg sm:flex">
                <span className="text-[var(--color-primary)]">
                  <GlyphLiveGlobe />
                </span>
                <span className="text-label">Malaysia &amp; international</span>
              </div>
            </div>
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
            <h3 className="text-h2 mb-2">Explore courses</h3>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Expert-led courses with stated capability outcomes, delivered
              live — and an assessed path to the credential.
            </p>
            <Button variant="secondary" href="/courses">
              See the courses
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
            <Button variant="secondary" href="/contact-us">
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
              body: "Instructor-led courses and workshops, delivered in person.",
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
              body: "Dedicated courses for one organisation, shaped to its context.",
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

      {/* ============ Night band: H6 capability areas + "Why expert-led" ============
          2026-09-04 (founder direction): the H3 "Who teaches" practitioner
          panel that occupied this slot was removed from the homepage. It
          is replaced with a differentiator panel that restates claims
          already made elsewhere on this page (H1 hero, H4 "How it works")
          rather than inventing new ones — live delivery, direct feedback,
          an earned credential. It names no individual, so it carries no
          claim that needs a second practitioner to stay true. The full
          practitioner content (H3 as approved in
          docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md §8) still lives
          at /trainers; only its homepage placement changed. */}
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

          {/* Why expert-led — restates claims already made in H1 and H4
              (live delivery, direct feedback, an earned credential) rather
              than introducing new ones. Names no individual. */}
          <div id="why-expert-led" className="scroll-mt-24">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Why expert-led
            </p>
            <h2 className="text-display mb-5">Live, not self-paced</h2>
            <p className="text-body-lg mb-8 text-[var(--color-ink-quiet)]">
              A video library can&rsquo;t take your questions and can&rsquo;t
              check whether you can actually do the work. Every course here
              runs live, with direct feedback, and ends in a credential you
              earn — not one you attend.
            </p>
            <ul>
              {[
                [
                  "Live sessions",
                  "Face-to-face or live online, with real-time interaction — never a recording.",
                ],
                [
                  "Direct feedback",
                  "Questions, worked examples and feedback from someone who has built these systems.",
                ],
                [
                  "Earned credential",
                  "Real deliverables, judged by a qualified assessor against a published rubric — not attendance.",
                ],
              ].map(([title, body]) => (
                <li
                  key={title}
                  className="border-t border-[var(--color-line)] py-4"
                >
                  <p className="font-semibold">{title}</p>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-5">
              <Button variant="secondary" href="#delivery">
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* H5 Courses, H7 Certification, H8 For organisations and H9
          "Where we are today" were REMOVED 2026-09-02 by founder
          direction. See docs/P01_DESIGN_DECISIONS.md "Homepage reduced"
          for what each carried and where it went. The certification
          content was not discarded — it moved to /certifications. */}


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
