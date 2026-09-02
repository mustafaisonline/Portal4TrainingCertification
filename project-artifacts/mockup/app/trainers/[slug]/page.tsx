import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { ImageFrame } from "@/components/ImageFrame";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { practitioners } from "@/data/practitioners";

/**
 * Trainer profile — the P23 Expert Profile realization for the mockup.
 * An expert biography inside a professional learning institution: every
 * fact and every external URL rendered here comes from
 * data/practitioners.ts, which is bound to genuine, source-verified
 * content only (see that file's header). Enriched 2026-08-31 at the
 * founder's direction with sections and embedded links from his published
 * bio (career achievements, books, frameworks, podcast, community
 * impact, online presence) — content adapted to the portal's own design
 * system, never the source site's.
 *
 * Sections render only when their data exists, so future trainers
 * without books or a podcast still get a correct page.
 *
 * Deliberately absent: programme-delivery history at the Academy — no
 * programme has run yet (State A), so none is claimed.
 */

export function generateStaticParams() {
  return practitioners.map((person) => ({ slug: person.slug }));
}

export default async function TrainerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = practitioners.find((p) => p.slug === slug);
  if (!person) notFound();

  return (
    <PublicShell>
      {/* ===== Profile header (night) ===== */}
      <section className="night relative">
        <div className="mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <Link
            href="/trainers"
            className="text-body-sm mb-10 inline-block text-[var(--color-ink-quiet)] underline underline-offset-4 hover:text-[var(--color-ink)]"
          >
            ← All trainers
          </Link>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
            <Image
              src={person.photo}
              alt={`Photograph of ${person.name}`}
              width={800}
              height={800}
              priority
              className="h-40 w-40 shrink-0 rounded-[var(--radius-panel)] border border-[var(--color-line-strong)] object-cover"
            />
            <div className="min-w-0">
              <p className="text-label mb-3 text-[var(--color-primary)]">
                {person.role}
              </p>
              <h1 className="text-display-lg mb-2">{person.name}</h1>
              <p className="text-body-lg mb-1 text-[var(--color-ink-quiet)]">
                {person.headline}
              </p>
              <p className="text-mono mb-6 text-[0.8rem] text-[var(--color-ink-faint)]">
                {person.experienceLine} · {person.location}
              </p>
              <div className="mb-7 flex flex-wrap gap-2">
                {person.expertise.map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>
              {person.linkedin && (
                <Button
                  variant="secondary"
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${person.name} on LinkedIn (opens in a new tab)`}
                >
                  LinkedIn profile ↗
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== About + career, with credentials sidebar ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div className="max-w-[680px]">
            <h2 className="text-h1 mb-5">About</h2>
            {person.about.map((paragraph, i) => (
              <p
                key={i}
                className="text-body-lg mb-4 text-[var(--color-ink-quiet)]"
              >
                {paragraph}
              </p>
            ))}

            {person.careerAchievements && (
              <>
                <h2 className="text-h1 mb-6 mt-12">Career achievements</h2>
                <div className="flex flex-col gap-4">
                  {person.careerAchievements.map((item) => (
                    <Card key={item.org} variant="plate" className="p-5">
                      <p className="text-label mb-2 text-[var(--color-primary)]">
                        {item.org}
                      </p>
                      <p className="text-body-sm text-[var(--color-ink-quiet)]">
                        {item.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </>
            )}

            <h2 className="text-h1 mb-5 mt-12">Professional background</h2>
            <ul>
              {person.background.map((item, i) => (
                <li
                  key={i}
                  className="border-t border-[var(--color-line)] py-3.5 text-body-sm text-[var(--color-ink-quiet)]"
                >
                  {item}
                </li>
              ))}
            </ul>

            <h2 className="text-h1 mb-5 mt-12">Training specialisations</h2>
            <ul>
              {person.specialisations.map((item, i) => (
                <li
                  key={i}
                  className="border-t border-[var(--color-line)] py-3.5 text-body-sm text-[var(--color-ink-quiet)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <Card variant="panel">
              <p className="text-label mb-4">Certifications</p>
              <ul className="flex flex-col gap-2">
                {person.certifications.map((cert) => (
                  <li
                    key={cert}
                    className="text-mono text-body-sm text-[var(--color-ink-quiet)]"
                  >
                    {cert}
                  </li>
                ))}
              </ul>
              <p className="text-label mb-3 mt-6">Education</p>
              <ul className="flex flex-col gap-1.5">
                {person.education.map((item) => (
                  <li
                    key={item}
                    className="text-body-sm text-[var(--color-ink-quiet)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card variant="panel">
              <p className="text-label mb-4">Platforms &amp; tools</p>
              <div className="flex flex-wrap gap-2">
                {person.technologies.map((tech) => (
                  <Chip key={tech}>{tech}</Chip>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== Published books ===== */}
      {person.books && (
        <section className="border-t border-[var(--color-line)]">
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Thought leadership
            </p>
            <h2 className="text-display mb-10">Published books</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {person.books.map((book) => (
                <Card
                  key={book.title}
                  variant="plate"
                  className="flex gap-5 p-5"
                >
                  <Image
                    src={book.cover}
                    alt={`Cover of ${book.title}`}
                    width={1000}
                    height={1500}
                    className="h-36 w-24 shrink-0 rounded-[4px] border border-[var(--color-line)] object-cover"
                  />
                  <div className="min-w-0">
                    <p className="mb-1 font-semibold leading-snug">
                      {book.title}
                    </p>
                    <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
                      {book.subtitle}
                    </p>
                    <a
                      href={book.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${book.title} on Amazon (opens in a new tab)`}
                      className="text-body-sm font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
                    >
                      View on Amazon ↗
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Innovations & frameworks ===== */}
      {person.frameworks && (
        <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Original contributions
            </p>
            <h2 className="text-display mb-10">
              Innovations &amp; frameworks
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {person.frameworks.map((fw) => (
                <Card
                  key={fw.name}
                  variant="plate"
                  className="bg-[var(--color-ground)] p-6"
                >
                  <span className="text-mono mb-4 inline-flex rounded-[8px] bg-[var(--color-prof-1)] px-3 py-1.5 text-[0.85rem] font-semibold text-[var(--color-primary)]">
                    {fw.abbr}
                  </span>
                  <h3 className="text-h2 mb-2">{fw.name}</h3>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    {fw.description}
                  </p>
                </Card>
              ))}
            </div>
            {person.frameworksUrl && (
              <a
                href={person.frameworksUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Read more about these frameworks on Medium (opens in a new tab)"
                className="text-body-sm mt-8 inline-block font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
              >
                Read more about these frameworks on Medium ↗
              </a>
            )}
          </div>
        </section>
      )}

      {/* ===== Let's Talk About Data (night band) ===== */}
      {person.podcast && (
        <section className="night relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 90% at 82% 30%, rgba(122,132,255,0.14), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-[1280px] px-6 py-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Podcast
            </p>
            <h2 className="text-display mb-5">{person.podcast.name}</h2>
            <p className="text-body-lg mb-9 max-w-[620px] text-[var(--color-ink-quiet)]">
              {person.podcast.description}
            </p>
            {/* Cover art almost certainly already exists on YouTube or
                Spotify — this is a copy-across, not a commission. It is the
                trainer's own artwork, so no licensing question arises. */}
            <div className="mb-9 w-full max-w-[220px]">
              <ImageFrame
                subject="The podcast's own cover art"
                ratio="1 / 1"
                minWidth={1400}
                note="already published"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                href={person.podcast.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${person.podcast.name} on YouTube (opens in a new tab)`}
              >
                Watch on YouTube ↗
              </Button>
              <Button
                variant="secondary"
                href={person.podcast.spotify}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${person.podcast.name} on Spotify (opens in a new tab)`}
              >
                Listen on Spotify ↗
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ===== Community impact ===== */}
      {person.communityImpact && (
        <section className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Beyond commercial work
          </p>
          <h2 className="text-display mb-10">Community impact</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {person.communityImpact.map((item) => (
              <div
                key={item.label}
                className="border-t-2 border-[var(--color-primary)]/60 pt-5"
              >
                <p className="text-mono text-display mb-1 text-[var(--color-primary)]">
                  {item.metric}
                </p>
                <p className="text-label mb-3">{item.label}</p>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          {/* Reserved photography (2026-09-02). This section states community
              reach entirely as numbers; photographs of the speaking and
              meetup work would evidence it, and per the photography brief
              they most likely already exist rather than needing a shoot.
              Frames stay visibly empty until genuine ones are supplied. */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <ImageFrame
              subject="Speaking at a conference or industry event"
              ratio="3 / 2"
              minWidth={1200}
              note="date + venue for the caption"
            />
            <ImageFrame
              subject="A community meetup in progress"
              ratio="3 / 2"
              minWidth={1200}
              note="candid preferred"
            />
            <ImageFrame
              subject="Teaching or mentoring outside commercial work — a student session or open workshop"
              ratio="3 / 2"
              minWidth={1200}
              note="consent required"
            />
          </div>
          <p className="text-mono mt-8 text-[0.7rem] text-[var(--color-ink-faint)]">
            Figures as published by the trainer, 2026.
          </p>
        </section>
      )}

      {/* ===== Connect online ===== */}
      {person.socialLinks && (
        <section className="border-t border-[var(--color-line)]">
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <h2 className="text-h1 mb-8">Connect online</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {person.socialLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${person.name} on ${link.platform} (opens in a new tab)`}
                  className="group rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground)] p-4 transition-colors hover:border-[var(--color-primary)]"
                >
                  <p className="text-label mb-1 flex items-center justify-between text-[var(--color-ink)] group-hover:text-[var(--color-primary)]">
                    {link.platform}
                    <span aria-hidden="true">↗</span>
                  </p>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    {link.handle}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Honest State-A note ===== */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16">
        <p className="border-t border-[var(--color-line)] pt-6 text-body-sm text-[var(--color-ink-faint)]">
          Programme delivery history at the Academy will appear here as
          cohorts are delivered — genuinely, never padded.
        </p>
      </section>
    </PublicShell>
  );
}
