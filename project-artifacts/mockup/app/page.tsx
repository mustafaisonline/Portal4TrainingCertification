import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { ProgrammeCard } from "@/components/ProgrammeCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
 * (H0–H9). Visual recomposition 2026-09-01 following the design audit —
 * see docs/P01_DESIGN_DECISIONS.md "Audit remediation".
 *
 * What the audit changed here, and why:
 * - Eyebrows: 9/9 sections opened with an uppercase label. Now 2 remain,
 *   where they do genuine wayfinding. That uniformity was the single
 *   biggest reason the page read as generated.
 * - Rhythm: every section used symmetric py-16. Now uses the deliberate
 *   .section-tight / .section / .section-open / .section-lead tiers so the
 *   page breathes unevenly, the way an edited page does.
 * - Decoration removed: the dot-field SVG and radial "glow" gradients are
 *   gone. They were atmosphere without meaning, and the data-dot motif is
 *   the most recognisable AI-industry cliché in current use.
 * - De-carded: delivery formats, capability areas and the journey are now
 *   ruled lists and editorial columns rather than boxes.
 * - Three-column reflex broken: the page now uses 2-, 4- and asymmetric
 *   splits, and one full-bleed statement.
 * - Ember accent activated on the credential moment only.
 *
 * Inventory state: STATE A — no dates, capacity or fabricated evidence.
 */

export default function HomePage() {
  const founder = practitioners[0];

  return (
    <PublicShell>
      {/* ============ Hero — night, asymmetric ============
          No eyebrow: the masthead already says what this is, and a label
          above an H1 is the construction the audit flagged. */}
      <section className="night">
        <div className="mx-auto max-w-[1280px] px-6 pb-16 pt-20 lg:pb-20 lg:pt-28">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20">
            <div>
              <h1 className="text-display-xl max-w-[15ch]">
                Taught live by a practitioner.
              </h1>
              <p className="text-body-lg mt-8 max-w-[46ch] text-[var(--color-ink-quiet)]">
                Expert-led programmes for data and AI professionals —
                delivered face-to-face and live online, in Malaysia and
                internationally. Not a course library: real sessions, direct
                feedback from someone who has built these systems, and a
                credential that has to be earned.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button href="/programmes">Explore programmes</Button>
                <Button variant="secondary" href="/diagnostic">
                  Start free diagnostic (10 min)
                </Button>
              </div>
            </div>

            {/* The model, stated plainly as a numbered sequence — a ruled
                list rather than three floating cards. */}
            <ol className="lg:pt-3">
              {[
                ["Live programmes", "Face-to-face and live online. Never a video library."],
                ["Applied work", "Real deliverables, judged against a published rubric."],
                ["Earned credential", "Recognition for demonstrated capability."],
              ].map(([title, body], i) => (
                <li
                  key={title}
                  className="flex gap-5 border-t border-[var(--color-line)] py-5 first:border-t-0 first:pt-0"
                >
                  <span className="text-mono text-body-sm pt-0.5 text-[var(--color-primary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-h2 mb-1">{title}</p>
                    <p className="text-body-sm text-[var(--color-ink-quiet)]">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Credibility descriptors — positioning facts, not metrics. */}
        <div className="border-t border-[var(--color-line)]">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-10 gap-y-3 px-6 py-5">
            {[
              "24+ years in practice",
              "Practitioner-led",
              "Data & AI focused",
              "Assessment-driven",
              "Face-to-face & live online",
            ].map((chip) => (
              <span
                key={chip}
                className="text-body-sm text-[var(--color-ink-quiet)]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Pathways — two-up asymmetric, not three cards ============ */}
      <section className="section mx-auto max-w-[1280px] px-6">
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,26ch)_minmax(0,1fr)]">
          <h2 className="text-display">Start where it makes sense</h2>
          <div>
            {[
              [
                "Explore programmes",
                "Expert-led programmes with stated capability outcomes, and an assessed path to the credential.",
                "/programmes",
                "See the programmes",
              ],
              [
                "Train your team",
                "Private cohorts and tailored engagements — on-site, live online, and internationally.",
                "#organisations",
                "How we work with teams",
              ],
              [
                "Assess your capability",
                "Ten minutes, free, and a specific answer about where you stand — not a score.",
                "/diagnostic",
                "Start free diagnostic (10 min)",
              ],
            ].map(([title, body, href, cta]) => (
              <div
                key={title}
                className="grid gap-x-10 gap-y-2 border-t border-[var(--color-line)] py-7 sm:grid-cols-[minmax(0,22ch)_minmax(0,1fr)]"
              >
                <h3 className="text-h1">{title}</h3>
                <div>
                  <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
                    {body}
                  </p>
                  <Link
                    href={href}
                    className="text-body-sm font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
                  >
                    {cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ What live means — full-bleed statement ============
          The one moment on the page that breaks the container. */}
      <section
        id="delivery"
        className="section-open scroll-mt-24 border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="text-display mx-auto max-w-[24ch] text-center">
            A session is interaction — not playback.
          </p>
          <p className="text-body-lg mx-auto mt-7 max-w-[62ch] text-center text-[var(--color-ink-quiet)]">
            Questions, discussion of your own situation, worked examples and
            direct expert feedback, alongside peers from other organisations.
            Materials prepare and reinforce that experience; they never
            replace it.
          </p>
          <dl className="mx-auto mt-14 grid max-w-[900px] gap-x-14 gap-y-8 sm:grid-cols-2">
            {[
              ["Face-to-face", "Instructor-led programmes and workshops, delivered in person."],
              ["Live online", "Real-time sessions with the same interaction and feedback."],
              ["Private cohorts", "Dedicated programmes for one organisation, shaped to its context."],
              ["On-site & international", "Expert-led delivery at your location, including outside Malaysia."],
            ].map(([title, body]) => (
              <div key={title} className="border-t border-[var(--color-line-strong)] pt-4">
                <dt className="text-h2 mb-1.5">{title}</dt>
                <dd className="text-body-sm text-[var(--color-ink-quiet)]">
                  {body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============ Programmes — lead tier, cards earn their place here ============ */}
      <section
        id="programmes"
        className="section-lead mx-auto max-w-[1280px] scroll-mt-24 px-6"
      >
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 className="text-display max-w-[20ch]">
            A deliberately structured portfolio
          </h2>
          <Button variant="secondary" href="/programmes">
            All seven programmes
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredProgrammes.map((programme) => (
            <ProgrammeCard key={programme.slug} programme={programme} />
          ))}
        </div>
      </section>

      {/* ============ Capability areas — dense ruled index, deliberately tight ============ */}
      <section
        id="capability"
        className="section-follow mx-auto max-w-[1280px] scroll-mt-24 px-6"
      >
        <div className="grid gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,26ch)_minmax(0,1fr)]">
          <div>
            <h2 className="text-h1 mb-3">Capability areas</h2>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Where we develop professional capability — subject scope, not a
              catalogue.
            </p>
          </div>
          <ul className="columns-1 sm:columns-2">
            {domains.map((domain) => (
              <li
                key={domain.code}
                className="mb-4 break-inside-avoid border-t border-[var(--color-line)] pt-3"
              >
                <p className="text-h2">{domain.name}</p>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  {domain.scope}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ Who teaches — editorial, photograph earns the space ============ */}
      <section
        id="practitioner"
        className="section scroll-mt-24 border-t border-[var(--color-line)]"
      >
        <div className="mx-auto grid max-w-[1280px] gap-x-16 gap-y-10 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30ch)]">
          <div>
            <h2 className="text-display mb-6 max-w-[22ch]">
              Learn from someone who has done the work
            </h2>
            <p className="text-body-lg mb-8 max-w-[54ch] text-[var(--color-ink-quiet)]">
              Programmes are designed and delivered by practitioners with real
              enterprise delivery behind them — people who have built, led and
              operated data and AI capabilities, not just taught them.
            </p>
            <Button variant="secondary" href="/trainers">
              Meet the trainers
            </Button>
          </div>
          <figure className="border-t border-[var(--color-line-strong)] pt-5">
            <figcaption>
              <p className="text-h1">{founder.name}</p>
              <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
                {founder.role}
              </p>
            </figcaption>
            <ul>
              {founder.expertise.slice(0, 4).map((item) => (
                <li
                  key={item}
                  className="border-t border-[var(--color-line)] py-2 text-body-sm text-[var(--color-ink-quiet)]"
                >
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={`/trainers/${founder.slug}`}
              className="text-body-sm mt-4 inline-block font-medium text-[var(--color-primary)] underline underline-offset-4"
            >
              Full profile →
            </Link>
          </figure>
        </div>
      </section>

      {/* ============ The credential — the one ember moment on the site ============ */}
      <section
        id="credential"
        className="section-open scroll-mt-24 border-y border-[var(--color-line)] bg-[var(--color-accent-quiet)]"
      >
        <div className="mx-auto grid max-w-[1280px] items-start gap-x-16 gap-y-10 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34ch)]">
          <div>
            <p className="text-mono mb-5 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-accent)]">
              The credential
            </p>
            <h2 className="text-display mb-6 max-w-[18ch]">
              It has to be earned
            </h2>
            <p className="text-body-lg mb-4 max-w-[54ch] text-[var(--color-ink-quiet)]">
              No credential here is awarded for showing up. It is earned
              through assessed applied work — real deliverables, judged by a
              qualified assessor against a published rubric, with written
              reasoning for every criterion.
            </p>
            <p className="text-body-sm max-w-[54ch] text-[var(--color-ink-quiet)]">
              Taking part in an expert-led programme is part of the pathway.
              Attendance alone is never enough — and that is exactly why the
              credential means something to an employer.
            </p>
          </div>
          <div className="border-l-2 border-[var(--color-accent)] pl-6">
            <p className="text-mono text-body-sm mb-3 text-[var(--color-ink-faint)]">
              From the assessment rubric
            </p>
            <p className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
              Criterion 2 — Justification
              <br />○ Not yet&nbsp;&nbsp;◉ Competent&nbsp;&nbsp;○ Proficient
              <br />○ Distinguished
            </p>
            <p className="text-body-sm mt-5 border-t border-[var(--color-line)] pt-4 text-[var(--color-ink-quiet)]">
              Assessor reasoning is written for every criterion, and shown to
              the candidate in full.
            </p>
          </div>
        </div>
      </section>

      {/* ============ Organisations ============ */}
      <section
        id="organisations"
        className="section mx-auto max-w-[1280px] scroll-mt-24 px-6"
      >
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,32ch)]">
          <div>
            <h2 className="text-display mb-6 max-w-[20ch]">
              Build your team&rsquo;s capability — with proof it worked
            </h2>
            <p className="text-body-lg mb-4 max-w-[54ch] text-[var(--color-ink-quiet)]">
              Private cohorts and tailored engagements, delivered on-site,
              live online, or at your locations internationally. We usually
              start with a team capability assessment — so the programme
              targets the gaps you actually have.
            </p>
            <p className="text-body-sm mb-8 max-w-[54ch] text-[var(--color-ink-quiet)]">
              You get cohort visibility, attendance records, and the
              documentation your L&amp;D and reporting processes need.
            </p>
            <Button variant="secondary" href="#">
              Talk to us about your team
            </Button>
          </div>
          <Card variant="plate" className="p-6">
            <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">
              Illustrative — team capability view
            </p>
            <div className="grid grid-cols-10 gap-1" aria-hidden="true">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[2px]"
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

      {/* ============ Honest position + close — night, tight ============ */}
      <section className="night section-tight">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[46ch]">
            <h2 className="text-h1 mb-3">
              The first programmes are being prepared now
            </h2>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Everything published here will be genuine — real programmes,
              real dates, a real practitioner. On a platform about proof, that
              starts with us.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button href="/programmes">Explore programmes</Button>
            <Button variant="secondary" href="/diagnostic">
              Start free diagnostic (10 min)
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
