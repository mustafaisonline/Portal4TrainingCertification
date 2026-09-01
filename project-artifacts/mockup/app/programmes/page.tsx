import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { ProgrammeCard } from "@/components/ProgrammeCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  learningPathway,
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

  return (
    <PublicShell>
      {/* Hero */}
      <section className="night relative overflow-hidden">
        <div className="mx-auto max-w-[1280px] section-open px-6">
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
      <section className="section mx-auto max-w-[1280px] px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="max-w-[560px]">
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
          {/* De-carded (audit): four boxes became a ruled list. These are
              descriptive attributes, not comparable objects — they never
              needed containers. */}
          <dl>
            {[
              ["Practitioner-led", "Taught by someone who has built these systems in real organisations."],
              ["Enterprise context", "Banking, telecom, healthcare, retail, oil & gas and public sector examples."],
              ["Vendor-neutral", "Concepts and architecture patterns, not a product tutorial."],
              ["Applied", "Case studies, discussion and practical scenarios throughout."],
            ].map(([title, body]) => (
              <div
                key={title}
                className="grid gap-x-8 gap-y-1 border-t border-[var(--color-line)] py-4 sm:grid-cols-[minmax(0,18ch)_minmax(0,1fr)]"
              >
                <dt className="text-h2">{title}</dt>
                <dd className="text-body-sm text-[var(--color-ink-quiet)]">
                  {body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Levels */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="section-tight mx-auto max-w-[1280px] px-6">
          {/* Two columns, not three — breaking the three-column reflex the
              audit flagged. Dense ruled index rather than accent-topped
              tiles. */}
          <dl className="grid gap-x-14 sm:grid-cols-2">
            {programmeLevels.map(({ level, description }) => {
              const count = programmes.filter((p) => p.level === level).length;
              return (
                <div
                  key={level}
                  className="flex items-baseline justify-between gap-6 border-t border-[var(--color-line)] py-4"
                >
                  <div>
                    <dt className="text-h2">{level}</dt>
                    <dd className="text-body-sm text-[var(--color-ink-quiet)]">
                      {description}
                    </dd>
                  </div>
                  <span className="text-mono shrink-0 text-[0.75rem] text-[var(--color-ink-faint)]">
                    {count}
                  </span>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* Flagship */}
      {flagship && (
        <section className="section mx-auto max-w-[1280px] px-6">
          <Card variant="feature">
            <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Chip tone="primary">{flagship.level}</Chip>
                  {flagship.formats.map((f) => (
                    <Chip key={f}>{f}</Chip>
                  ))}
                </div>
                <h2 className="text-display mb-3">{flagship.title}</h2>
                <p className="text-body-lg mb-5 text-[var(--color-ink-quiet)]">
                  {flagship.valueProposition}
                </p>
                <Button href={`/programmes/${flagship.slug}`}>
                  Explore the programme
                </Button>
              </div>
              <ul className="flex flex-col gap-2">
                {flagship.highlights.map((h) => (
                  <li
                    key={h}
                    className="border-t border-[var(--color-line)] pt-2 text-body-sm text-[var(--color-ink-quiet)]"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </section>
      )}

      {/* All programmes */}
      <section
        id="all-programmes"
        className="section mx-auto max-w-[1280px] scroll-mt-24 px-6"
      >
        <h2 className="text-display mb-10">All programmes</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programmes.map((programme) => (
            <ProgrammeCard key={programme.slug} programme={programme} />
          ))}
        </div>
      </section>

      {/* Learning pathway */}
      <section id="pathway" className="night relative scroll-mt-24 overflow-hidden">
        <div className="mx-auto max-w-[1280px] section px-6">
          <h2 className="text-display mb-4">Where to start, and what follows</h2>
          <p className="text-body-lg mb-10 max-w-[620px] text-[var(--color-ink-quiet)]">
            The core track builds from shared language to enterprise design and
            product delivery. Two tracks run in parallel rather than in
            sequence — they are entered when the role calls for them.
          </p>
          <ol className="flex flex-col gap-4">
            {learningPathway.map((step, i) => (
              <li
                key={step.stage}
                className={step.parallel ? "lg:ml-12" : undefined}
              >
                <Card
                  variant="panel"
                  className="border border-[var(--color-line-strong)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex shrink-0 items-center gap-3 sm:w-[190px]">
                      <span className="text-mono text-body-sm text-[var(--color-primary)]">
                        {step.parallel ? "↳" : String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-label">{step.stage}</p>
                        <p className="text-body-sm font-semibold">
                          {step.level}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
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
                      {step.note && (
                        <p className="text-body-sm mt-2 text-[var(--color-ink-faint)]">
                          {step.note}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Corporate + delivery */}
      <section className="section mx-auto max-w-[1280px] px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="max-w-[560px]">
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
