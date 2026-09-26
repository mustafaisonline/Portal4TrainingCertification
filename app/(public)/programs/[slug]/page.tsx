import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  findPublishedProgrammeBySlug,
  listPublishedProgrammesBySlugs,
} from "@/modules/catalogue/programmes/repository";
import { levelLabel } from "@/modules/catalogue/programmes/types";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { ImageFrame } from "@/shared/marketing/ImageFrame";
import {
  CourseInDeliveryIllustration,
  TeachingDetailIllustration,
} from "@/shared/marketing/DeliveryIllustrations";
import { CourseCard } from "@/shared/marketing/CourseCard";
import { DeliveryFormats } from "@/shared/marketing/DeliveryFormats";
import { TrainerCard } from "@/shared/marketing/TrainerCard";
import { ProgrammePricing } from "@/shared/marketing/ProgrammePricing";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { FlagshipLanding } from "./FlagshipLanding";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/courses/[slug]/page.tsx
 * (ADR-045). Changed: the programme, its related programmes and the
 * delivering expert are read from the repositories (published rows only —
 * an unlisted slug is a real 404); editorial sections come from
 * `programme.content`; field renames follow `ProgrammeRecord`
 * (durationLabel, certificateLabel, deliveryFormats[].*Label); no
 * `generateStaticParams` (production renders dynamically); the mockup's own
 * `PublicShell` wrapper is gone; "Register your interest" carries the
 * programme slug into the enquiry form. Copy, structure and classes are
 * otherwise unchanged.
 *
 * MOVED 2026-09-26 from app/(public)/courses/[slug]/page.tsx (founder:
 * "/DataBlueprint-AIVibeCoding → /programs", "Programme → Trainings"). This
 * is now the training detail page under the /programs hub. When the resolved
 * programme is the flagship, the bespoke landing (./FlagshipLanding.tsx —
 * the former /DataBlueprint-AIVibeCoding page) renders instead of this
 * template. New optional content sections — `relationshipNote`,
 * `afterThisTraining`, `faq` — render only when a programme publishes them
 * (first: Learn Vibe Coding). The hero gained "See upcoming dates".
 * 2026-09-26 (founder change list, second round): "Who should attend" is
 * "Who can take this training"; a "What you get out of this training"
 * section (`content.whatYouGet`) precedes the Investment cards; the delivery
 * formats list participant numbers (`content.paceNotes`); the Investment
 * section no longer takes a value stack (the two published programmes
 * publish none — `included`, `valueStack` stay in the type for the unlisted
 * rows).
 *
 * Course detail — the P10 Course Detail realization.
 *
 * Every section renders only when the source published that content, so
 * depth is preserved where it exists and nothing is padded where it does
 * not. Curriculum uses native <details> accordions: progressive disclosure
 * keeps a 9–10 module curriculum scannable without hiding it, and needs no
 * client JS.
 *
 * No dates or capacity appear here — scheduled offerings live on /schedule.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await findPublishedProgrammeBySlug(slug);
  return { title: course ? course.title : "Training" };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await findPublishedProgrammeBySlug(slug);
  if (!course) notFound();

  const content = course.content;
  const [related, experts] = await Promise.all([
    listPublishedProgrammesBySlugs(content.related),
    listPublishedExperts(),
  ]);

  // The founder-designated flagship keeps its bespoke single-proposition
  // landing (resolved by the row's `flagship` flag, not by slug — ADR-023).
  if (course.flagship) {
    return <FlagshipLanding programme={course} experts={experts} />;
  }
  // The programme's delivering expert, with the full published profile
  // (the programme record carries only a summary).
  const founder =
    experts.find((e) => course.experts.some((x) => x.id === e.id)) ??
    experts[0];
  const enquiryHref = `/contact-us?kind=programme_interest&programme=${course.slug}`;

  const meta: [string, string][] = [
    ["Level", levelLabel(course.level)],
    ["Duration", course.durationLabel],
    ["Prerequisites", course.prerequisites],
    ["Delivery", course.formats.join(" · ")],
    ["Certificate", course.certificateLabel],
    ["Audience", course.audienceSummary],
  ];

  return (
    <>
      {/* ===== Hero =====
          `night hero-band` is the dark navy hero (see app/globals.css). */}
      <section className="night hero-band relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 80% at 80% 20%, rgba(47,95,224,0.12), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <Link
            href="/programs"
            className="text-body-sm mb-7 inline-block py-2 text-[var(--color-ink-quiet)] underline underline-offset-4 hover:text-[var(--color-ink)]"
          >
            ← All trainings
          </Link>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Chip tone="primary">{levelLabel(course.level)}</Chip>
            {course.flagship && <Chip>Flagship course</Chip>}
          </div>
          <h1 className="text-display-lg mb-4 max-w-[820px]">
            {course.title}
          </h1>
          <p className="text-body-lg mb-5 max-w-[640px] text-[var(--color-ink-quiet)]">
            {course.valueProposition}
          </p>
          {content.relationshipNote && (
            <p
              data-testid="relationship-note"
              className="text-body-sm mb-8 max-w-[640px] border-l-2 border-[var(--color-primary)] pl-4 text-[var(--color-ink-quiet)]"
            >
              {content.relationshipNote}
            </p>
          )}
          <div className="mb-10 flex flex-wrap items-center gap-4">
            <Button href={enquiryHref}>Register your interest</Button>
            <Button variant="secondary" href="/schedule">
              See upcoming dates
            </Button>
            <Button variant="secondary" href="#investment">
              See the investment
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

      {/* ===== Course header photograph (reserved) =====
          One wide frame per course. Deliberately BELOW the hero rather
          than inside it: the hero is a night section carrying the title and
          the meta strip, and dropping an empty box into it would weaken the
          page's one dominant moment. */}
      <section className="mx-auto max-w-[1280px] px-6 pt-12">
        <ImageFrame
          subject={`${course.title} in delivery — the room, the participants, the work being done`}
          ratio="21 / 9"
          minWidth={2000}
          note="reusable across pages"
          illustration={<CourseInDeliveryIllustration />}
        />
      </section>

      {/* ===== Overview + highlights ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="max-w-[680px]">
            <h2 className="text-h1 mb-5">{content.rationale.heading}</h2>
            {content.rationale.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-body-lg mb-4 text-[var(--color-ink-quiet)]"
              >
                {p}
              </p>
            ))}
            {content.rationale.problems && (
              <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
                {content.rationale.problems.map((item) => (
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
            <p className="text-label mb-4">Course highlights</p>
            <ul className="flex flex-col gap-2.5">
              {content.highlights.map((h) => (
                <li
                  key={h}
                  className="text-body-sm text-[var(--color-ink-quiet)]"
                >
                  {h}
                </li>
              ))}
            </ul>
            {content.included && (
              <>
                <p className="text-label mb-3 mt-7">Included</p>
                <ul className="flex flex-col gap-2">
                  {content.included.map((item) => (
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

      {/* ===== Who can take this training ===== */}
      <section
        id="who-can-take-this-training"
        className="scroll-mt-24 border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]"
      >
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Who is this for
          </p>
          <h2 className="text-display mb-5">Who can take this training</h2>
          <p className="text-body-lg mb-9 max-w-[680px] text-[var(--color-ink-quiet)]">
            {content.whoShouldAttend.intro}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {content.whoShouldAttend.roles.map((role) => (
              <Chip key={role}>{role}</Chip>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Delivery formats ===== (shared with the flagship landing) */}
      <DeliveryFormats formats={course.deliveryFormats} notes={content.paceNotes} />

      {/* ===== Learning outcomes ===== */}
      {(content.outcomes || content.outcomeGroups) && (
        <section className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Learning outcomes
          </p>
          <h2 className="text-display mb-10">What you will learn</h2>
          {content.outcomeGroups && (
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {content.outcomeGroups.map((group) => (
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
          {content.outcomes && (
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {content.outcomes.map((item) => (
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

      {/* ===== After this training — founder-directed block (2026-09-26),
          e.g. Learn Vibe Coding's "Start freelancing straight after the
          session". Factual capabilities only; no income claim. ===== */}
      {content.afterThisTraining && (
        <section
          id="after-this-training"
          className="border-t border-[var(--color-line)] bg-[var(--color-ground-tint)]"
        >
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              After this training
            </p>
            <h2 className="text-display mb-5 max-w-[640px]">
              {content.afterThisTraining.heading}
            </h2>
            <p className="text-body-lg mb-8 max-w-[680px] text-[var(--color-ink-quiet)]">
              {content.afterThisTraining.intro}
            </p>
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {content.afterThisTraining.items.map((item) => (
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

      {/* ===== Curriculum (accordion) ===== */}
      <section
        id="curriculum"
        className="border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]"
      >
        <div className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Course content
          </p>
          <h2 className="text-display mb-4">Curriculum</h2>
          <p className="text-body-sm mb-10 text-[var(--color-ink-faint)]">
            {course.modules.length} modules · expand any module to see what
            it covers
          </p>
          <div className="max-w-[860px]">
            {course.modules.map((module, i) => {
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
      {content.careerPaths && (
        <section className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Career transitions
          </p>
          <h2 className="text-display mb-4">Choose your career path</h2>
          <p className="text-body-lg mb-10 max-w-[680px] text-[var(--color-ink-quiet)]">
            Identify where you are today — and where mentorship can take you.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {content.careerPaths.map((path) => (
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
      {content.methodology && (
        <section className="relative overflow-hidden bg-[var(--color-ground-tint)]">
          <div className="relative mx-auto max-w-[1280px] px-6 py-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              The approach
            </p>
            <h2 className="text-display mb-10">{content.methodology.name}</h2>
            <ol className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
              {content.methodology.steps.map((step, i) => (
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
      {content.pedagogy && (
        <section className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div className="max-w-[560px]">
              <p className="text-label mb-3 text-[var(--color-primary)]">
                Learning experience
              </p>
              <h2 className="text-display mb-5">How it is taught</h2>
              <p className="text-body-lg mb-8 text-[var(--color-ink-quiet)]">
                {content.pedagogy.intro}
              </p>
              {/* Pedagogy is the most abstract writing on the page; a
                  photograph of the teaching itself is what makes it
                  concrete. Detail over wide shot. */}
              <ImageFrame
                subject="The teaching itself — whiteboard, a worked exercise, or a group working through a case"
                ratio="3 / 2"
                minWidth={1400}
                note="detail beats a wide shot"
                illustration={<TeachingDetailIllustration />}
              />
            </div>
            <div>
              <ul className="grid gap-x-8 sm:grid-cols-2">
                {content.pedagogy.methods.map((m) => (
                  <li
                    key={m}
                    className="border-t border-[var(--color-line)] py-3 text-body-sm text-[var(--color-ink-quiet)]"
                  >
                    {m}
                  </li>
                ))}
              </ul>
              {content.pedagogy.industries && (
                <>
                  <p className="text-label mb-3 mt-7">
                    Industry examples drawn from
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {content.pedagogy.industries.map((ind) => (
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
      {content.benefits && (
        <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <h2 className="text-h1 mb-5">{content.benefits.intro}</h2>
            <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {content.benefits.items.map((item) => (
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

      {/* ===== What you get out of this training (2026-09-26) ===== */}
      {content.whatYouGet && content.whatYouGet.length > 0 && (
        <section id="what-you-get" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Take-aways
          </p>
          <h2 className="text-display mb-8">What you get out of this training</h2>
          <ul className="grid max-w-[960px] gap-x-10 sm:grid-cols-2" data-testid="what-you-get">
            {content.whatYouGet.map((item) => (
              <li
                key={item}
                className="border-t border-[var(--color-line)] py-3.5 text-body-sm text-[var(--color-ink-quiet)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ===== Investment (regional pricing cards) ===== */}
      <ProgrammePricing
        prices={course.prices}
        packages={content.mentorshipPackages}
        regionalPricing={content.regionalPricing}
        programmeSlug={course.slug}
      />

      {/* ===== Trainer ===== */}
      {founder && (
        <section className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Who delivers this
          </p>
          <h2 className="text-display mb-8">Taught by a practitioner</h2>
          <div className="max-w-[760px]">
            <TrainerCard person={founder} />
          </div>
        </section>
      )}

      {/* ===== Certification note (OQ-21 boundary) =====
          The /certifications link is carried over as the mockup left it
          (that page is paused by founder direction; re-pointing the link
          is a content decision, not a port decision). */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16">
        <Card variant="plate" className="max-w-[760px] p-6">
          <p className="text-label mb-2">Certification</p>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            This course awards a{" "}
            <span className="text-[var(--color-ink)]">
              {course.certificateLabel.toLowerCase()}
            </span>
            . That is deliberately distinct from the Academy credential, which
            is earned through assessed applied work judged by a qualified
            assessor — taking part in a course is part of that pathway, and
            attendance alone is never sufficient.{" "}
            <Link
              href="/certifications"
              className="text-[var(--color-primary)] underline underline-offset-4"
            >
              How certification works
            </Link>
          </p>
        </Card>
      </section>

      {/* ===== FAQ (2026-09-26) — native <details>, same disclosure pattern
          as the curriculum; no client JS. ===== */}
      {content.faq && content.faq.length > 0 && (
        <section id="faq" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 pb-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Questions
          </p>
          <h2 className="text-display mb-8">Frequently asked</h2>
          <div className="max-w-[860px]">
            {content.faq.map((item) => (
              <details key={item.q} className="group border-t border-[var(--color-line)]">
                <summary className="flex cursor-pointer list-none items-baseline gap-5 py-4 hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
                  <span className="flex-1 font-semibold">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="text-[var(--color-ink-faint)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="text-body-sm pb-5 pr-4 text-[var(--color-ink-quiet)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ===== External resources ===== */}
      {content.externalResources && (
        <section className="mx-auto max-w-[1280px] px-6 pb-16">
          <h2 className="text-h1 mb-6">Related resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.externalResources.map((res) => (
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

      {/* ===== Related courses ===== */}
      {related.length > 0 && (
        <section className="border-t border-[var(--color-line)]">
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <h2 className="text-h1 mb-8">Related trainings</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <CourseCard key={p.slug} course={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden bg-[var(--color-ground-tint)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 90% at 20% 50%, rgba(47,95,224,0.12), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 py-16">
          <h2 className="text-display mb-4 max-w-[620px]">
            Bring this course to your team
          </h2>
          <p className="text-body-lg mb-9 max-w-[620px] text-[var(--color-ink-quiet)]">
            Public dates are not yet published. Register your interest, or talk
            to us about running this as a private cohort — on-site, live
            online, or internationally.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="/contact-us">Talk to us about your team</Button>
            <Button variant="secondary" href="/programs">
              See all trainings
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
