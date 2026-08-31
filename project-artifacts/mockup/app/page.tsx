import Image from "next/image";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { domains } from "@/data/domains";
import { practitioners } from "@/data/practitioners";

/**
 * P01 — Homepage. Redesigned 2026-08-31 for the expert-led delivery model.
 *
 * Authority chain: DR-02 → MVP_BUILD_SPEC §6 → MOCKUP_SPECIFICATION §4
 * P01 brief → docs/design/P01_HOMEPAGE_REDESIGN_SPECIFICATION.md (H0–H9).
 * Design decisions recorded in docs/P01_DESIGN_DECISIONS.md (this artifact).
 *
 * Inventory state: STATE A — no confirmed public programme inventory.
 * Nothing on this page shows a programme name, date, capacity or price,
 * and nothing may until real inventory exists (HD-7, HO-2).
 *
 * Programmes vs scheduled offerings emphasis (HO-1) is OPEN: this page
 * describes both concepts and visually leads with neither.
 */
export default function HomePage() {
  const founder = practitioners[0];

  return (
    <PublicShell>
      {/* H1 — Hero: the D0 compound proof. A named genuine practitioner +
          real delivery formats, together in one eyeline. No date is shown
          because none exists — State A omits the element rather than
          faking it (spec §7.11). */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 pt-16 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_360px]">
          <div className="max-w-[680px]">
            <p className="text-label mb-4 text-[var(--color-primary)]">
              Expert-led training &amp; certification · Data &amp; AI
            </p>
            <h1 className="text-display-lg mb-6">
              Taught live by a practitioner. Proven by the work you do.
            </h1>
            <p className="text-body-lg mb-8 text-[var(--color-ink-quiet)]">
              Expert-led programmes for data and AI professionals — delivered
              face-to-face and live online, in Malaysia and internationally.
              This is not a course library: real sessions, direct feedback
              from someone who has built these systems, and a credential that
              has to be earned.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button href="#programmes">Explore programmes</Button>
              <Button variant="text" href="#delivery">
                How delivery works
              </Button>
            </div>
          </div>

          {/* The one Feature card on the page — the practitioner is the
              differentiator (D0), so the single most important treatment
              goes here. Genuine photograph only (spec §16.2). */}
          <Card variant="feature" className="w-full max-w-[360px] justify-self-center lg:justify-self-end">
            <p className="text-label mb-4">Programmes delivered by</p>
            <Image
              src={founder.photo}
              alt={`Photograph of ${founder.name}`}
              width={800}
              height={800}
              priority
              className="mb-5 w-full rounded-[var(--radius-panel)]"
            />
            <p className="text-h2">{founder.name}</p>
            <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
              {founder.role}
            </p>
            <div className="border-t border-[var(--color-line)] pt-4">
              <p className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
                24+ years · enterprise data &amp; AI
              </p>
              <p className="text-mono text-body-sm text-[var(--color-ink-faint)]">
                {founder.location}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* H2 — The three pathways, in the fixed priority order (HD-2). */}
      <section className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <Card variant="panel">
            <p className="text-label mb-3">For individuals</p>
            <h2 className="text-h2 mb-2">Explore programmes</h2>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Expert-led programmes with stated capability outcomes, delivered
              live — and an assessed path to the credential.
            </p>
            <Button variant="secondary" href="#programmes">
              See the programmes
            </Button>
          </Card>
          <Card variant="panel">
            <p className="text-label mb-3">For organisations</p>
            <h2 className="text-h2 mb-2">Train your team</h2>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Private cohorts and tailored engagements — on-site, live online,
              and internationally — with evidence the capability changed.
            </p>
            <Button variant="secondary" href="#organisations">
              How we work with teams
            </Button>
          </Card>
          <Card variant="panel">
            <p className="text-label mb-3">Not sure where to start?</p>
            <h2 className="text-h2 mb-2">Assess your capability</h2>
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

      {/* H3 — Practitioner credibility. Founder-led at launch; the markup
          maps over a plural practitioners array so a second genuine expert
          is a data change, never a redesign (spec §8.7). */}
      <section id="practitioner" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="max-w-[560px]">
            <p className="text-label mb-3">Who teaches</p>
            <h2 className="text-display mb-5">
              Learn from someone who has done the work
            </h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              Content is everywhere. What changes how you work is a
              practitioner in the room — someone who has carried these
              decisions in real organisations and can respond to yours.
            </p>
            <p className="text-body-sm text-[var(--color-ink-faint)]">
              The platform is founder-led today. As it grows, additional
              practitioners will be introduced here — only ever real ones.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            {practitioners.map((person) => (
              <Card key={person.slug} variant="panel">
                <p className="text-h2 mb-1">{person.name}</p>
                <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
                  {person.role} · {person.location}
                </p>
                <ul className="flex flex-col gap-2">
                  {person.facts.map((fact, i) => (
                    <li
                      key={i}
                      className="border-t border-[var(--color-line)] pt-2 text-body-sm text-[var(--color-ink-quiet)]"
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* H4 — What expert-led delivery actually means. Fully deliverable on
          day one; depends on no inventory. Pre-empts the "is this just
          videos?" assumption (DR-02 §2). */}
      <section id="delivery" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
        <p className="text-label mb-3">How it works</p>
        <h2 className="text-display mb-4 max-w-[680px]">
          Live means live. You are in the room — physical or online.
        </h2>
        <p className="text-body-lg mb-10 max-w-[680px] text-[var(--color-ink-quiet)]">
          A session is interaction: questions, discussion of your own
          situation, worked examples, and direct expert feedback — alongside
          peers from other organisations. It is never watching a recording.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="plate" className="p-5">
            <h3 className="text-h2 mb-2">Face-to-face</h3>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Instructor-led programmes and workshops, delivered in person.
            </p>
          </Card>
          <Card variant="plate" className="p-5">
            <h3 className="text-h2 mb-2">Live online</h3>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Real-time sessions with the same interaction, questions and
              feedback — not pre-recorded content.
            </p>
          </Card>
          <Card variant="plate" className="p-5">
            <h3 className="text-h2 mb-2">Private cohorts</h3>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Dedicated programmes for one organisation, shaped to its
              context.
            </p>
          </Card>
          <Card variant="plate" className="p-5">
            <h3 className="text-h2 mb-2">On-site &amp; international</h3>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Expert-led delivery at your location, including outside
              Malaysia.
            </p>
          </Card>
        </div>
        <p className="mt-8 max-w-[680px] text-body-sm text-[var(--color-ink-faint)]">
          Materials — readings, templates, exercises, session preparation —
          support the live experience. They prepare, extend and reinforce it;
          they never replace it.
        </p>
      </section>

      {/* H5 — Programme discovery, State A: no confirmed public inventory.
          Describes what a programme is; shows no cards, no names, no dates,
          no "coming soon" placeholders (spec §10.2). Describes both
          programmes and scheduled offerings without leading with either
          (HO-1 open). */}
      <section id="programmes" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <div className="max-w-[620px]">
            <p className="text-label mb-3">Programmes</p>
            <h2 className="text-display mb-5">
              A deliberately small set of programmes, built properly
            </h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              A programme here is a designed, expert-led learning experience
              with stated outcomes — what you will actually be able to do
              afterwards. Each programme runs as scheduled offerings: a
              specific format, dates and location you register for.
            </p>
            <p className="text-body-sm mb-8 text-[var(--color-ink-quiet)]">
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
            <p className="text-label mb-4">Every programme includes</p>
            <ul className="flex flex-col gap-3">
              {[
                "Capability outcomes stated up front — what you will be able to do",
                "Live, expert-led sessions — face-to-face or online",
                "Applied work on realistic enterprise problems",
                "Supporting materials that prepare and reinforce each session",
                "An assessed path toward the credential, judged by a qualified assessor",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-baseline gap-3 text-body-sm text-[var(--color-ink-quiet)]"
                >
                  <span className="text-mono text-[var(--color-ink-faint)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* H6 — Capability areas: subject scope, not catalogue categories.
          No counts of anything; layout is count-agnostic (spec §11). */}
      <section id="capability" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
        <p className="text-label mb-3">Capability areas</p>
        <h2 className="text-display mb-10 max-w-[680px]">
          Where we build professional capability
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain) => (
            <Card key={domain.code} variant="plate" className="p-5">
              <Chip>{domain.code}</Chip>
              <h3 className="text-h2 mt-3 mb-1">{domain.name}</h3>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                {domain.scope}
              </p>
            </Card>
          ))}
        </div>
        {/* Supporting diagnostic band — second and final placement of the
            diagnostic CTA on this page (spec §9.2: at most twice). */}
        <Card variant="panel" className="mt-10 text-center">
          <p className="text-label mb-2">Not sure where you stand?</p>
          <p className="text-body-lg mx-auto mb-5 max-w-[560px]">
            The free diagnostic locates you across these areas and names your
            gaps in plain language — before you commit to anything.
          </p>
          <Button variant="secondary" href="/diagnostic">
            Start free diagnostic (10 min)
          </Button>
        </Card>
      </section>

      {/* H7 — How capability is recognised. OQ-21 language boundary applies
          (spec §12): participation is part of the pathway; attendance alone
          never earns the credential; nothing states HOW participation is
          represented in the requirement model. The rubric fragment mirrors
          the K06 wireframe in the approved Mockup Specification. */}
      <section id="credential" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="max-w-[560px]">
            <p className="text-label mb-3">Certification</p>
            <h2 className="text-display mb-5">
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
          <Card variant="plate" className="p-6">
            <p className="text-label mb-4">From the assessment rubric</p>
            <p className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
              Criterion 2 — Justification
              <br />
              ○ Not yet&nbsp;&nbsp;◉ Competent&nbsp;&nbsp;○ Proficient&nbsp;&nbsp;○
              Distinguished
              <br />
              <br />
              Assessor reasoning: written for every criterion,
              <br />
              and shown to the candidate in full.
            </p>
          </Card>
        </div>
      </section>

      {/* H8 — For organisations: a distinct band, enquiry-shaped only.
          No purchase flow, no seat counts, no pricing (HO-10, HO-11). */}
      <section
        id="organisations"
        className="scroll-mt-24 border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]"
      >
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 py-16 lg:grid-cols-2">
          <div className="max-w-[560px]">
            <p className="text-label mb-3">For organisations</p>
            <h2 className="text-display mb-5">
              Build your team&rsquo;s capability — with proof it worked
            </h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              Private cohorts and tailored engagements, delivered on-site,
              live online, or at your locations internationally. We usually
              start with a team capability assessment — so the programme
              targets the gaps you actually have.
            </p>
            <p className="text-body-sm mb-8 text-[var(--color-ink-quiet)]">
              You get cohort visibility, attendance records, and the
              documentation your L&amp;D and reporting processes need.
            </p>
            <Button variant="secondary" href="#">
              Talk to us about your team
            </Button>
          </div>
          <Card variant="panel">
            <p className="text-label mb-4">
              Illustrative — team capability view
            </p>
            <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    background: `var(--color-prof-${((i * 7) % 5) + 1})`,
                  }}
                />
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* H9 — Honest position + closing action. No fabricated numbers,
          cohorts or employers — evidence appears here only when real. */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 text-center">
        <p className="text-label mb-3">Where we are today</p>
        <h2 className="text-display mb-4">
          The first programmes are being prepared now
        </h2>
        <p className="text-body-lg mx-auto mb-8 max-w-[640px] text-[var(--color-ink-quiet)]">
          Everything published here will be genuine — real programmes, real
          dates, a real practitioner. On a platform about proof, that starts
          with us.
        </p>
        <Button href="#programmes">Explore programmes</Button>
      </section>
    </PublicShell>
  );
}
