import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { ImageFrame } from "@/components/ImageFrame";
import { ProgrammeCard } from "@/components/ProgrammeCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  learningPathway,
  pricingRegions,
  programmeLevels,
  programmes,
  getProgramme,
} from "@/data/programmes";

/**
 * Programmes hub — the P10/P24 discovery surface for the mockup.
 *
 * Content migrated from the founder's existing training ecosystem; see
 * data/programmes.ts for provenance and for what was deliberately NOT
 * migrated (prices, dates). Levels are used as the organising taxonomy
 * because that is how the source itself groups the portfolio, and they
 * double as the progression.
 *
 * Deliberately server-rendered with no client-side filter: seven
 * programmes across six levels is a portfolio, not a catalogue — the
 * level rail plus a single grid is more usable here than facets, and it
 * avoids reintroducing catalogue-browse patterns DR-02 retired.
 */

export const metadata: Metadata = {
  title: "Programmes — Data & AI Academy",
};

export default function ProgrammesPage() {
  const flagship = programmes.find((p) => p.flagship);
  // One source of truth (learningPathway); the section splits it rather than
  // duplicating the sequence, so a data change cannot desynchronise them.
  const corePath = learningPathway.filter((step) => !step.parallel);
  const parallelPath = learningPathway.filter((step) => step.parallel);

  return (
    <PublicShell>
      {/* Hero */}
      <section className="night relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 75% at 78% 25%, rgba(122,132,255,0.15), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-4 text-[var(--color-primary)]">
            Programmes
          </p>
          <h1 className="text-display-lg mb-6 max-w-[760px]">
            Build the Data &amp; AI capability that holds up at work
          </h1>
          <p className="text-body-lg mb-9 max-w-[640px] text-[var(--color-ink-quiet)]">
            A deliberately structured portfolio — from foundational literacy
            for business teams, through practitioner and architect tracks, to
            executive AI adoption, product building and one-to-one career
            mentorship. Every programme is designed and delivered by a
            practitioner.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="#all-programmes">Explore programmes</Button>
            <Button variant="secondary" href="#pathway">
              Find your starting point
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="max-w-[560px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              How these programmes are built
            </p>
            <h2 className="text-display mb-5">
              Taught by practitioners, not theorists
            </h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              Each programme maps to real enterprise data and AI work rather
              than slide-deck theory. Concepts are taught through practical
              business situations and industry case studies — not
              vendor-specific tooling — so what you learn transfers to the
              platform your organisation actually runs.
            </p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Programmes are delivered face-to-face, live online or hybrid, as
              public sessions, private team cohorts, executive workshops or
              university programmes.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Practitioner-led", "Taught by someone who has built these systems in real organisations."],
              ["Enterprise context", "Banking, telecom, healthcare, retail, oil & gas and public sector examples."],
              ["Vendor-neutral", "Concepts and architecture patterns, not a product tutorial."],
              ["Applied", "Case studies, discussion and practical scenarios throughout."],
            ].map(([title, body]) => (
              <Card key={title} variant="plate" className="p-5">
                <h3 className="text-h2 mb-2">{title}</h3>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  {body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto max-w-[1280px] px-6 py-14">
          <p className="text-label mb-6 text-[var(--color-primary)]">
            Programme levels
          </p>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {programmeLevels.map(({ level, description }) => {
              const count = programmes.filter((p) => p.level === level).length;
              return (
                <div
                  key={level}
                  className="border-t-2 border-[var(--color-primary)]/50 pt-4"
                >
                  <p className="mb-1 font-semibold">{level}</p>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    {description}
                  </p>
                  <p className="text-mono mt-2 text-[0.75rem] text-[var(--color-ink-faint)]">
                    {count === 1 ? "1 programme" : `${count} programmes`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Flagship =====
          Redesigned 2026-09-02. Was a beige Feature card whose right column
          was a bare hairline list with the image frame wedged beneath it —
          it read as a normal section with more items in it, and answered
          none of a buyer's concrete questions.

          Now a NIGHT band. The distinction is structural rather than
          decorative: night is the portal's existing device for identity
          moments, so the flagship is the only paper-section break between
          the hero and the pathway, and it earns the page's one dominant
          moment (P3, hierarchy over uniformity) without inventing a new
          treatment. The meta strip is the substantive change — duration,
          audience, delivery and the entry price now answer on the page what
          previously required a click. */}
      {flagship && (
        <section className="night relative overflow-hidden">
          <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
            <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
              <div>
                <p className="text-label mb-4 text-[var(--color-primary)]">
                  Flagship programme
                </p>
                <h2 className="text-display-lg mb-5 max-w-[16ch]">
                  {flagship.title}
                </h2>
                <p className="text-body-lg mb-8 max-w-[52ch] text-[var(--color-ink-quiet)]">
                  {flagship.valueProposition}
                </p>

                {/* The buyer's four questions, answered without a click. */}
                <dl className="mb-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-[var(--color-line)] pt-7 sm:grid-cols-3">
                  {[
                    ["Duration", flagship.duration],
                    ["For", flagship.audienceSummary],
                    ["Delivery", flagship.formats.join(" · ")],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-label mb-1.5">{label}</dt>
                      <dd className="text-body-sm leading-snug">{value}</dd>
                    </div>
                  ))}
                </dl>

                {/* Pricing lifted out of the meta strip (2026-09-02). All
                    three published regions are shown, matching the detail
                    page: the hub previously listed Malaysia alone, which a
                    Pakistani or international reader would read as "this
                    price is not for me". Figures are the founder's own
                    published launch offers and will date — the detail page
                    carries that caveat in full. */}
                {flagship.pricing && (
                  <div className="mb-9 border-t border-[var(--color-line)] pt-7">
                    <p className="text-label mb-4">From — by region</p>
                    <dl className="grid grid-cols-3 gap-x-6 gap-y-3">
                      {pricingRegions.map((region) => (
                        <div key={region.key}>
                          <dt className="text-mono text-[0.7rem] mb-1 text-[var(--color-ink-faint)]">
                            {region.label}
                          </dt>
                          <dd className="text-body-sm font-medium text-[var(--color-primary)]">
                            {flagship.pricing![region.key].today}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <Button href={`/programmes/${flagship.slug}`}>
                    Explore the programme
                  </Button>
                  <Button
                    variant="secondary"
                    href={`/programmes/${flagship.slug}#investment`}
                  >
                    See the investment
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-label mb-5">What it leads to</p>
                <ul className="mb-8 flex flex-col gap-3.5">
                  {flagship.highlights.map((h) => (
                    <li key={h} className="flex gap-3.5">
                      {/* A drawn rule, not a bullet glyph — consistent with
                          the rubric block and the delivery-format cards. */}
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-px w-5 shrink-0 bg-[var(--color-primary)]"
                      />
                      <span className="text-body-sm leading-snug text-[var(--color-ink-quiet)]">
                        {h}
                      </span>
                    </li>
                  ))}
                </ul>
                <ImageFrame
                  subject={`${flagship.title} — a cohort building, not listening`}
                  ratio="3 / 2"
                  minWidth={1600}
                  note="consent required"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== All programmes =====
          Redesigned 2026-09-02. Was a flat 3-column grid of all seven cards
          in data order — Foundation, Practitioner, Architect, Architect,
          Executive, Builder, Mentorship — which reads as arbitrary, gives no
          way to scan, and wastes the level taxonomy established directly
          above it.

          Now grouped by level in progression order, reusing `programmeLevels`
          so the grouping cannot drift from the rail above. Still no client
          -side filter: this adds structure, not catalogue-browse mechanics
          the model retired. */}
      <section
        id="all-programmes"
        className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16"
      >
        <p className="text-label mb-3 text-[var(--color-primary)]">
          The portfolio
        </p>
        <h2 className="text-display mb-4">All programmes</h2>
        <p className="text-body-lg mb-14 max-w-[620px] text-[var(--color-ink-quiet)]">
          Seven programmes, grouped by the level they are pitched at. The order
          is the progression — but only the core track is sequential, and the
          journey below shows which parts are not.
        </p>

        {/* Level as a left rail, not a full-width header. Five of the six
            levels hold a single programme, so a header-plus-3-column-grid
            per level produced five near-empty rows and ran the section to
            ~4000px. The rail keeps the grouping legible while reading as a
            structured index, and the progression runs top to bottom. */}
        <div className="flex flex-col">
          {programmeLevels.map(({ level, description }) => {
            const inLevel = programmes.filter((p) => p.level === level);
            if (inLevel.length === 0) return null;
            return (
              <div
                key={level}
                className="grid gap-x-10 gap-y-6 border-t border-[var(--color-line)] py-10 first:border-t-0 first:pt-0 lg:grid-cols-[220px_1fr]"
              >
                <div className="lg:pt-1">
                  <h3 className="text-h1 mb-2">{level}</h3>
                  <p className="text-body-sm mb-2 text-[var(--color-ink-quiet)]">
                    {description}
                  </p>
                  <p className="text-mono text-body-sm text-[var(--color-ink-faint)]">
                    {inLevel.length === 1
                      ? "1 programme"
                      : `${inLevel.length} programmes`}
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {inLevel.map((programme) => (
                    <ProgrammeCard
                      key={programme.slug}
                      programme={programme}
                      showAllRegions
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Choose your journey =====
          Redesigned 2026-09-02. Was a flat <ol> of six Panel cards where the
          only signal that two of them run in PARALLEL rather than in sequence
          was a 48px left indent at lg — invisible below that breakpoint, and
          easy to miss above it. The section's whole job is that distinction.

          Now split explicitly: a core track drawn as a spine with numbered
          nodes, and the parallel tracks as their own block that says so in
          words. The spine is CSS — no library, no images. */}
      <section
        id="pathway"
        className="night relative scroll-mt-24 overflow-hidden"
      >
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Choose your journey
          </p>
          <h2 className="text-display mb-4">Where to start, and what follows</h2>
          <p className="text-body-lg mb-14 max-w-[620px] text-[var(--color-ink-quiet)]">
            The core track builds from shared language to enterprise design and
            product delivery. Two further tracks run alongside it rather than
            after it — entered when the role calls for them, at any point.
          </p>

          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[1.25fr_1fr] lg:items-start">
            {/* ── Core track: a drawn spine ── */}
            <div>
              <p className="text-label mb-7">The core track · in sequence</p>
              <ol className="relative flex flex-col gap-9">
                {/* The spine itself. Stops short at both ends so it reads as
                    connecting the nodes rather than running off the block. */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-4 left-[15px] top-4 w-px bg-[var(--color-line-strong)]"
                />
                {corePath.map((step, i) => (
                  <li key={step.stage} className="relative flex gap-6">
                    <span
                      aria-hidden="true"
                      className="text-mono relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-ground)] text-[0.75rem] text-[var(--color-primary)]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-label mb-1">{step.level}</p>
                      <p className="text-h2 mb-3">{step.stage}</p>
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        {step.slugs.map((slug) => {
                          const p = getProgramme(slug);
                          if (!p) return null;
                          return (
                            <Link
                              key={slug}
                              href={`/programmes/${slug}`}
                              className="text-body-sm font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
                            >
                              {p.title} →
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* ── Parallel tracks: stated, not implied by an indent ── */}
            <div>
              <p className="text-label mb-7">
                Alongside · entered at any stage
              </p>
              <div className="flex flex-col gap-5">
                {parallelPath.map((step) => (
                  <Card
                    key={step.stage}
                    variant="panel"
                    className="border border-[var(--color-line-strong)]"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="text-mono text-body-sm text-[var(--color-primary)]"
                      >
                        ↳
                      </span>
                      <p className="text-label">{step.level}</p>
                    </div>
                    <p className="text-h2 mb-3">{step.stage}</p>
                    <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2">
                      {step.slugs.map((slug) => {
                        const p = getProgramme(slug);
                        if (!p) return null;
                        return (
                          <Link
                            key={slug}
                            href={`/programmes/${slug}`}
                            className="text-body-sm font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
                          >
                            {p.title} →
                          </Link>
                        );
                      })}
                    </div>
                    {step.note && (
                      <p className="text-body-sm text-[var(--color-ink-quiet)]">
                        {step.note}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate + delivery */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="max-w-[560px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              For organisations
            </p>
            <h2 className="text-display mb-5">
              Customised capability development
            </h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              Programmes can be tailored to your industry, technology stack and
              workforce skill gaps — across government, financial services,
              telecommunications, healthcare, retail, universities and
              enterprise organisations.
            </p>
            <p className="text-body-sm mb-8 text-[var(--color-ink-quiet)]">
              Engagement models include executive awareness programmes, team
              workshops, capability development programmes, graduate
              development programmes and private bootcamps.
            </p>
            <Button variant="secondary" href="/#organisations">
              Talk to us about your team
            </Button>
          </div>
          <div>
            <p className="text-label mb-5">Delivery options</p>
            <ul>
              {[
                ["Public programmes", "Scheduled sessions open to individuals."],
                ["Private team training", "Dedicated programmes for one organisation."],
                ["Executive workshops", "Leadership-focused awareness programmes."],
                ["University programmes", "Student and graduate capability development."],
              ].map(([title, body]) => (
                <li
                  key={title}
                  className="border-t border-[var(--color-line)] py-4"
                >
                  <p className="mb-0.5 font-semibold">{title}</p>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-body-sm mt-6 text-[var(--color-ink-faint)]">
              Public dates are not yet published. Register your interest and we
              will confirm scheduled offerings as they open.
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
