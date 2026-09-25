import type { Metadata } from "next";
import { listPublishedProgrammesWithPrices } from "@/modules/catalogue/programmes/repository";
import { CourseCard } from "@/shared/marketing/CourseCard";
import { Button } from "@/shared/ui/Button";

/*
 * /programs — the "Trainings" hub (founder direction 2026-09-26: the menu
 * item "Programme" becomes "Trainings" and the catalogue URL becomes
 * /programs). Lists every PUBLISHED programme in `sortOrder` (Learn Vibe
 * Coding first, the flagship second — the founder's order, set in the seed),
 * read through the catalogue repository (ADR-023: nothing here knows a slug,
 * title or price). Each card links to /programs/<slug>; an unlisted
 * programme is absent here and 404s there.
 *
 * No dates or capacity — scheduled offerings live on /schedule.
 */

export const metadata: Metadata = {
  title: "Trainings",
  description:
    "Expert-led trainings, delivered face-to-face and live online, each with its own Certificate of Completion.",
};

export const dynamic = "force-dynamic";

export default async function TrainingsPage() {
  const programmes = await listPublishedProgrammesWithPrices();

  return (
    <>
      {/* ===== Hero ===== `night hero-band` is the dark navy hero. */}
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
          <p className="text-label mb-4 text-[var(--color-primary)]">Trainings</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]">Trainings</h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            Expert-led trainings, delivered face-to-face and live online, each
            with its own Certificate of Completion.
          </p>
        </div>
      </section>

      {/* ===== The trainings ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        {programmes.length === 0 ? (
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            No training is published yet.
          </p>
        ) : (
          <ol
            data-testid="trainings-list"
            className="grid list-none gap-6 p-0 md:grid-cols-2"
          >
            {programmes.map((p) => (
              <li key={p.slug} className="min-w-0">
                <CourseCard course={p} showAllRegions />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ===== Closing CTA row ===== */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-12">
          <div>
            <h2 className="text-h1 mb-1">Not sure which?</h2>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Ten minutes, free, no account to start.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="/diagnostic">Take the free diagnostic</Button>
            <Button variant="secondary" href="/for-organisations">
              Training for a team?
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
