import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";

/**
 * Certifications — created 2026-09-02.
 *
 * The homepage's H7 certification section was removed by founder direction
 * on the same day. That would have orphaned the "Certifications" nav item
 * requested one instruction earlier, and discarded the rubric block the
 * founder had specifically had rebuilt. Both problems are solved by giving
 * certification its own page: the argument and the rubric moved here
 * INTACT rather than being rewritten or dropped.
 *
 * Boundary held (OQ-21): a course's "Certificate of Participation" is NOT
 * the Academy credential, and this page must never blur the two. Nothing
 * here claims a credential has been issued, because none has.
 *
 * DISABLED 2026-09-06, founder direction: "We will work on Certification
 * option in future." The nav item was removed too (components/PublicShell.tsx).
 * The page content below is untouched — this is a pause, not a deletion —
 * `notFound()` just makes the route 404 until `CERTIFICATIONS_PAGE_ENABLED`
 * is flipped back. Two other pages still link here (app/hrd-corp/page.tsx,
 * app/courses/[slug]/page.tsx's rubric section) — those links were left as
 * they are rather than silently reworked, since re-pointing them is itself
 * a content decision; they will 404 too until this is re-enabled.
 */
const CERTIFICATIONS_PAGE_ENABLED = false;

export const metadata: Metadata = {
  title: "Certifications — Data & AI Academy",
  description:
    "The Academy credential is earned through assessed applied work, judged against a published rubric — never awarded for attendance.",
};

export default function CertificationsPage() {
  if (!CERTIFICATIONS_PAGE_ENABLED) {
    notFound();
  }

  return (
    <PublicShell>
      <section className="night relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-4 text-[var(--color-primary)]">
            Certifications
          </p>
          <h1 className="text-display-lg mb-6 max-w-[760px]">
            A credential that means something to an employer
          </h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            Most training certificates record attendance. This one records
            demonstrated capability — which is a harder thing to earn, and the
            only reason it is worth holding.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-[560px]">
              <p className="text-label mb-3 text-[var(--color-primary)]">
                Certification
              </p>
              <h2 className="text-display mb-6">
                The credential has to be earned
              </h2>
              <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
                No credential here is awarded for showing up. It is earned
                through assessed applied work — real deliverables, judged by a
                qualified assessor against a published rubric, with written
                reasoning for every criterion.
              </p>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                Taking part in an expert-led course is part of the pathway.
                Attendance alone is never enough — and that is exactly why the
                credential means something to an employer.
              </p>
            </div>
            {/* Rubric excerpt — rebuilt 2026-09-02.
                It previously rendered as a single monospace paragraph with
                <br> breaks and ○/◉ characters standing in for form controls,
                which read as terminal output rather than an assessment
                instrument. It is now laid out as the scale it actually is:
                prose in the UI face, the four levels as a real four-point
                scale, and the assessor's mark carried by a drawn indicator.
                The selected level is signalled by weight, a marker and a
                caption as well as colour — colour is never the sole carrier
                of meaning here. Still illustrative of FORMAT only: the real
                rubric is unwritten and must never be faked. */}
            <div className="night rounded-[var(--radius-panel)] border border-[var(--color-line-strong)] p-7">
              <p className="text-label mb-5">From the assessment rubric</p>

              <p className="text-h2">Justification</p>
              <p className="text-body-sm mb-7 text-[var(--color-ink-faint)]">
                Criterion 2 of 5 · assessed on every submission
              </p>

              <ol className="mb-7 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4">
                {[
                  { level: "Not yet", awarded: false },
                  { level: "Competent", awarded: true },
                  { level: "Proficient", awarded: false },
                  { level: "Distinguished", awarded: false },
                ].map(({ level, awarded }) => (
                  <li key={level}>
                    <span
                      aria-hidden="true"
                      className={`mb-2.5 block h-[3px] rounded-full ${
                        awarded
                          ? "bg-[var(--color-primary)]"
                          : "bg-[var(--color-line-strong)]"
                      }`}
                    />
                    <span
                      className={`block text-body-sm ${
                        awarded
                          ? "font-semibold text-[var(--color-ink)]"
                          : "text-[var(--color-ink-faint)]"
                      }`}
                    >
                      {level}
                    </span>
                    {/* One word, not a phrase: "assessor's mark" set in the
                        tracked uppercase label wrapped to two lines inside a
                        quarter-width column and read as clutter. This carries
                        the same meaning without colour being the sole
                        signal, and never wraps. */}
                    {awarded && (
                      <span
                        className="text-label mt-1 block"
                        // `.text-label` sets its own colour and is unlayered
                        // CSS, so it outranks a Tailwind text-* utility. Set
                        // it here rather than fight specificity.
                        style={{ color: "var(--color-primary)" }}
                      >
                        Awarded
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              <p className="text-body-sm border-t border-[var(--color-line)] pt-5 text-[var(--color-ink-quiet)]">
                The assessor records a level for every criterion and writes the
                reasoning behind it — shown to the candidate in full.
              </p>
            </div>
          </div>
      </section>

      {/* Two things people conflate, kept apart. This distinction is a
          product boundary (OQ-21), not copy: a certificate of participation
          is issued per course; the credential is separate and assessed. */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <h2 className="text-display mb-10 max-w-[720px]">
            Two different things, often confused
          </h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="border-t-2 border-[var(--color-line-strong)] pt-5">
              <p className="text-label mb-3">Certificate of participation</p>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                Issued for attending a course. It records that you were there
                and took part. Useful for training records and employer
                reporting — and it is not a claim about capability.
              </p>
            </div>
            <div className="border-t-2 border-[var(--color-primary)] pt-5">
              <p className="text-label mb-3 text-[var(--color-primary)]">
                The Academy credential
              </p>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                Earned through assessed applied work, judged by a qualified
                assessor against a published rubric. Attendance alone never
                earns it, and taking part in a course is one part of the
                pathway rather than the whole of it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest close — no credential has been issued, so nothing here
          claims one has, and no verification lookup is offered yet. */}
      <section className="mx-auto max-w-[1280px] px-6 py-16 text-center">
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Where this stands today
        </p>
        <h2 className="text-display mb-5 max-w-[760px] mx-auto">
          The first credentials have not been issued yet
        </h2>
        <p className="text-body-lg mx-auto mb-9 max-w-[620px] text-[var(--color-ink-quiet)]">
          The rubric is still being authored, and public verification opens
          when the first credential exists. Nothing on this page describes a
          credential that has already been awarded.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button href="/courses">Explore courses</Button>
          <Button variant="secondary" href="/contact-us">
            Ask about certification
          </Button>
        </div>
      </section>
    </PublicShell>
  );
}
