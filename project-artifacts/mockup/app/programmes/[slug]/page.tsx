import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { ProgrammeCard } from "@/components/ProgrammeCard";
import { TrainerCard } from "@/components/TrainerCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { getProgramme, programmes } from "@/data/programmes";
import { practitioners } from "@/data/practitioners";

/**
 * Programme detail — the P10 Programme Detail realization for the mockup.
 *
 * Every section renders only when the source published that content, so
 * depth is preserved where it exists and nothing is padded where it does
 * not. Curriculum uses native <details> accordions: progressive disclosure
 * keeps a 9–10 module curriculum scannable without hiding it, and needs no
 * client JS.
 *
 * No dates, capacity or price appear here — see data/programmes.ts.
 */

export function generateStaticParams() {
  return programmes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const programme = getProgramme(slug);
  return {
    title: programme
      ? `${programme.title} — Data & AI Academy`
      : "Programme — Data & AI Academy",
  };
}

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const programme = getProgramme(slug);
  if (!programme) notFound();

  const related = programme.related
    .map(getProgramme)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const founder = practitioners[0];

  const meta: [string, string][] = [
    ["Level", programme.level],
    ["Duration", programme.duration],
    ["Prerequisites", programme.prerequisites],
    ["Delivery", programme.formats.join(" · ")],
    ["Certificate", programme.certificate],
    ["Audience", programme.audienceSummary],
  ];

  return (
    <PublicShell>
      {/* ===== Hero ===== */}
      <section className="night relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 80% at 80% 20%, rgba(122,132,255,0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <Link
            href="/programmes"
            className="text-body-sm mb-9 inline-block text-[var(--color-ink-quiet)] underline underline-offset-4 hover:text-[var(--color-ink)]"
          >
            ← All programmes
          </Link>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Chip tone="primary">{programme.level}</Chip>
            {programme.flagship && <Chip>Flagship programme</Chip>}
          </div>
          <h1 className="text-display-lg mb-4 max-w-[820px]">
            {programme.title}
          </h1>
          <p className="text-body-lg mb-8 max-w-[640px] text-[var(--color-ink-quiet)]">
            {programme.valueProposition}
          </p>
          <div className="mb-10 flex flex-wrap items-center gap-4">
            <Button href="/#organisations">Register your interest</Button>
            <Button variant="secondary" href="#curriculum">
              See the curriculum
            </Button>
          </div>
          <dl className="grid gap-x-8 gap-y-5 border-t border-[var(--color-line)] pt-7 sm:grid-cols-2 lg:grid-cols-3">
            {meta.map(([label, value]) => (
              <div key={label}>
                <dt className="text-label mb-1">{label}</dt>
                <dd className="text-body-sm text-[var(--color-ink-quiet)]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===== Overview + highlights ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="max-w-[680px]">
            <h2 className="text-h1 mb-5">{programme.rationale.heading}</h2>
            {programme.rationale.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-body-lg mb-4 text-[var(--color-ink-quiet)]"
              >
                {p}
              </p>
            ))}
            {programme.rationale.problems && (
              <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
                {programme.rationale.problems.map((item) => (
                  <li
                    key={item}
                    className="border-t border-[var(--color-line)] py-3 text-body-sm text-[var(--color-ink-quiet)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Card variant="panel" className="h-fit">
            <p className="text-label mb-4">Programme highlights</p>
            <ul className="flex flex-col gap-2.5">
              {programme.highlights.map((h) => (
                <li
                  key={h}
                  className="text-body-sm text-[var(--color-ink-quiet)]"
                >
                  {h}
                </li>
              ))}
            </ul>
            {programme.included && (
              <>
                <p className="text-label mb-3 mt-7">Included</p>
                <ul className="flex flex-col gap-2">
                  {programme.included.map((item) => (
                    <li
                      key={item}
                      className="text-body-sm text-[var(--color-ink-quiet)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      </section>

      {/* ===== Who should attend ===== */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Who is this for
          </p>
          <h2 className="text-display mb-5">Who should attend</h2>
          <p className="text-body-lg mb-9 max-w-[680px] text-[var(--color-ink-quiet)]">
            {programme.whoShouldAttend.intro}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {programme.whoShouldAttend.roles.map((role) => (
              <Chip key={role}>{role}</Chip>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Delivery formats (flagship) ===== */}
      {programme.deliveryFormats && (
        <section className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Choose your pace
          </p>
          <h2 className="text-display mb-4">Flexible learning formats</h2>
          <p className="text-body-lg mb-10 max-w-[680px] text-[var(--color-ink-quiet)]">
            All formats cover the same curriculum, learning outcomes,
            exercises and certification requirements. The only difference is
            the pace of delivery.
          </p>
          <div className="grid gap-6 lg:grid-cols-3">
            {programme.deliveryFormats.map((format) => (
              <Card key={format.name} variant="panel" className="flex flex-col">
                {format.badge && (
                  <p className="text-label mb-3 text-[var(--color-primary)]">
                    {format.badge}
                  </p>
                )}
                <h3 className="text-h2 mb-4">{format.name}</h3>
                <dl className="mb-5 flex flex-col gap-1.5 border-y border-[var(--color-line)] py-4">
                  {[
                    ["Duration", format.duration],
                    ["Schedule", format.schedule],
                    ["Total time", format.totalTime],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="text-label w-[80px] shrink-0">{k}</dt>
                      <dd className="text-body-sm text-[var(--color-ink-quiet)]">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="text-label mb-2">Best for</p>
                <ul className="flex flex-col gap-1.5">
                  {format.bestFor.map((b) => (
                    <li
                      key={b}
                      className="text-body-sm text-[var(--color-ink-quiet)]"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ===== Learning outcomes ===== */}
      {(programme.outcomes || programme.outcomeGroups) && (
        <section className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Learning outcomes
          </p>
          <h2 className="text-display mb-10">What you will learn</h2>
          {programme.outcomeGroups && (
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {programme.outcomeGroups.map((group) => (
                <div
                  key={group.title}
                  className="border-t-2 border-[var(--color-primary)]/50 pt-4"
                >
                  <h3 className="text-h2 mb-3">{group.title}</h3>
                  <ul className="flex flex-col gap-1.5">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="text-body-sm text-[var(--color-ink-quiet)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {programme.outcomes && (
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {programme.outcomes.map((item) => (
                <li
                  key={item}
                  className="border-t border-[var(--color-line)] py-3.5 text-body-sm text-[var(--color-ink-quiet)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ===== Curriculum (accordion) ===== */}
      <section
        id="curriculum"
        className="border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]"
      >
        <div className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Programme content
          </p>
          <h2 className="text-display mb-4">Curriculum</h2>
          <p className="text-body-sm mb-10 text-[var(--color-ink-faint)]">
            {programme.modules.length} modules · expand any module to see what
            it covers
          </p>
          <div className="max-w-[860px]">
            {programme.modules.map((module, i) => {
              const hasDetail = Boolean(module.description || module.points);
              const header = (
                <>
                  <span className="text-mono text-body-sm shrink-0 text-[var(--color-primary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-semibold">{module.title}</span>
                </>
              );
              if (!hasDetail) {
                return (
                  <div
                    key={module.title}
                    className="flex items-baseline gap-5 border-t border-[var(--color-line)] py-4"
                  >
                    {header}
                  </div>
                );
              }
              return (
                <details
                  key={module.title}
                  className="group border-t border-[var(--color-line)]"
                >
                  <summary className="flex cursor-pointer list-none items-baseline gap-5 py-4 hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
                    {header}
                    <span
                      aria-hidden="true"
                      className="text-[var(--color-ink-faint)] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="pb-5 pl-[2.6rem] pr-4">
                    {module.description && (
                      <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
                        {module.description}
                      </p>
                    )}
                    {module.points && (
                      <ul className="flex flex-col gap-1.5">
                        {module.points.map((point) => (
                          <li
                            key={point}
                            className="text-body-sm text-[var(--color-ink-quiet)]"
                          >
                            · {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Career paths (mentorship) ===== */}
      {programme.careerPaths && (
        <section className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Career transitions
          </p>
          <h2 className="text-display mb-4">Choose your career path</h2>
          <p className="text-body-lg mb-10 max-w-[680px] text-[var(--color-ink-quiet)]">
            Identify where you are today — and where mentorship can take you.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {programme.careerPaths.map((path) => (
              <Card
                key={`${path.from}-${path.to}`}
                variant="plate"
                className="p-5"
              >
                <p className="text-mono text-body-sm mb-3 text-[var(--color-primary)]">
                  {path.from} → {path.to}
                </p>
                <p className="text-body-sm mb-2 text-[var(--color-ink-quiet)]">
                  <span className="font-semibold text-[var(--color-ink)]">
                    Challenge:{" "}
                  </span>
                  {path.challenge}
                </p>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  <span className="font-semibold text-[var(--color-ink)]">
                    Mentorship helps:{" "}
                  </span>
                  {path.helps}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ===== Methodology / journey ===== */}
      {programme.methodology && (
        <section className="night relative overflow-hidden">
          <div className="relative mx-auto max-w-[1280px] px-6 py-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              The approach
            </p>
            <h2 className="text-display mb-10">{programme.methodology.name}</h2>
            <ol className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
              {programme.methodology.steps.map((step, i) => (
                <li
                  key={step.title}
                  className="border-t-2 border-[var(--color-primary)]/60 pt-4"
                >
                  <p className="text-mono text-body-sm mb-2 text-[var(--color-ink-faint)]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-h2 mb-1.5">{step.title}</h3>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ===== How it is taught ===== */}
      {programme.pedagogy && (
        <section className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div className="max-w-[560px]">
              <p className="text-label mb-3 text-[var(--color-primary)]">
                Learning experience
              </p>
              <h2 className="text-display mb-5">How it is taught</h2>
              <p className="text-body-lg text-[var(--color-ink-quiet)]">
                {programme.pedagogy.intro}
              </p>
            </div>
            <div>
              <ul className="grid gap-x-8 sm:grid-cols-2">
                {programme.pedagogy.methods.map((m) => (
                  <li
                    key={m}
                    className="border-t border-[var(--color-line)] py-3 text-body-sm text-[var(--color-ink-quiet)]"
                  >
                    {m}
                  </li>
                ))}
              </ul>
              {programme.pedagogy.industries && (
                <>
                  <p className="text-label mb-3 mt-7">
                    Industry examples drawn from
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {programme.pedagogy.industries.map((ind) => (
                      <Chip key={ind}>{ind}</Chip>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== Organisational benefits ===== */}
      {programme.benefits && (
        <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <h2 className="text-h1 mb-5">{programme.benefits.intro}</h2>
            <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {programme.benefits.items.map((item) => (
                <li
                  key={item}
                  className="border-t border-[var(--color-line)] py-3.5 text-body-sm text-[var(--color-ink-quiet)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ===== Trainer ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Who delivers this
        </p>
        <h2 className="text-display mb-8">Taught by a practitioner</h2>
        <div className="max-w-[760px]">
          <TrainerCard person={founder} />
        </div>
      </section>

      {/* ===== Certification note (OQ-21 boundary) ===== */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16">
        <Card variant="plate" className="max-w-[760px] p-6">
          <p className="text-label mb-2">Certification</p>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            This programme awards a{" "}
            <span className="text-[var(--color-ink)]">
              {programme.certificate.toLowerCase()}
            </span>
            . That is deliberately distinct from the Academy credential, which
            is earned through assessed applied work judged by a qualified
            assessor — taking part in a programme is part of that pathway, and
            attendance alone is never sufficient.{" "}
            <Link
              href="/#credential"
              className="text-[var(--color-primary)] underline underline-offset-4"
            >
              How certification works
            </Link>
          </p>
        </Card>
      </section>

      {/* ===== External resources ===== */}
      {programme.externalResources && (
        <section className="mx-auto max-w-[1280px] px-6 pb-16">
          <h2 className="text-h1 mb-6">Related resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programme.externalResources.map((res) => (
              <a
                key={res.url}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${res.label} (opens in a new tab)`}
                className="group rounded-[var(--radius-plate)] border border-[var(--color-line)] p-5 transition-colors hover:border-[var(--color-primary)]"
              >
                <p className="mb-1 flex items-center justify-between font-semibold group-hover:text-[var(--color-primary)]">
                  {res.label}
                  <span aria-hidden="true">↗</span>
                </p>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  {res.description}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ===== Related programmes ===== */}
      {related.length > 0 && (
        <section className="border-t border-[var(--color-line)]">
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <h2 className="text-h1 mb-8">Related programmes</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProgrammeCard key={p.slug} programme={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="night relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 90% at 20% 50%, rgba(122,132,255,0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 py-16">
          <h2 className="text-display mb-4 max-w-[620px]">
            Bring this programme to your team
          </h2>
          <p className="text-body-lg mb-9 max-w-[620px] text-[var(--color-ink-quiet)]">
            Public dates are not yet published. Register your interest, or talk
            to us about running this as a private cohort — on-site, live
            online, or internationally.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="/#organisations">Talk to us about your team</Button>
            <Button variant="secondary" href="/programmes">
              Explore other programmes
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
