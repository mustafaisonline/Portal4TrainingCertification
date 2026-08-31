import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { practitioners } from "@/data/practitioners";

/**
 * Trainer profile — the P23 Expert Profile realization for the mockup.
 * An expert biography inside a professional learning institution: every
 * fact rendered here comes from data/practitioners.ts, which is bound to
 * genuine, source-verified content only (see that file's header).
 *
 * Deliberately absent: programme-delivery history at the Academy — no
 * programme has run yet (State A), so none is claimed. The section
 * appears only when it is real.
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
      {/* Profile header (night) */}
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
                >
                  LinkedIn profile ↗
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Profile body */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
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

            <p className="mt-12 border-t border-[var(--color-line)] pt-6 text-body-sm text-[var(--color-ink-faint)]">
              Programme delivery history at the Academy will appear here as
              cohorts are delivered — genuinely, never padded.
            </p>
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
              <p className="text-label mb-4">Beyond the classroom</p>
              <ul className="flex flex-col gap-2.5">
                {person.beyond.map((item, i) => (
                  <li
                    key={i}
                    className="text-body-sm text-[var(--color-ink-quiet)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
