import Link from "next/link";
import { hrdCorpAbout, hrdCorpOrg } from "@/content/hrd-corp";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * The HRD Corp sections — MOVED 2026-09-27 (Milestone 14 Phase 1, founder
 * decision P16) from app/(public)/hrd-corp/page.tsx onto the Trainings page,
 * which is now "Paid Trainings" (/programs#hrd-corp); /hrd-corp redirects
 * there. Organisation facts still read from src/content/hrd-corp.ts.
 *
 * TRIMMED 2026-09-28 (founder: "Remove content which is saying the YPT is
 * getting registered with HRD Corp, remove it. On trainers page, we can
 * mention that the trainer is HRD Authorised trainer or not.") — the
 * "Registration status — in progress" section is removed from here
 * entirely; the trainer's own accreditation (a different, held status) now
 * carries an explicit Yes/No statement on /trainers instead of a badge
 * alone. `hrdCorpOrg.registeredTrainingProvider` is no longer read on this
 * page; the field itself is untouched in src/content/hrd-corp.ts.
 *
 * TWO STATUSES remain here (see src/content/hrd-corp.ts header for all three):
 * 1. Trainer accreditation (Mustafa Qizilbash) — HELD, genuine, verifiable.
 *    Displayed on /trainers, not here.
 * 2. HRD Corp Claimable (any course) — NOT held by any course; the funding
 *    section below says so honestly without naming the org's own status.
 */
export function HrdCorpSections() {
  return (
    <div id="hrd-corp" className="scroll-mt-24 border-t border-[var(--color-line)]" data-testid="hrd-corp-sections">
      {/* ===== Heading (was the /hrd-corp hero) ===== */}
      <section className="mx-auto max-w-[1280px] px-6 pt-16">
        <p className="text-label mb-4 text-[var(--color-primary)]">HRD Corp</p>
        <h2 className="text-display-lg mb-6 max-w-[760px]">A genuine HRD Corp accreditation — verified, not just claimed</h2>
        <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
          Trainings here are designed and delivered by an HRD Corp Accredited Trainer — see{" "}
          <Link
            href="/mustafa-qizilbash#hrd-corp-accreditation"
            className="font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Trainers
          </Link>{" "}
          for that accreditation and how to verify it. This section sets out what that does, and does not, mean for this
          organisation and its trainings.
        </p>
      </section>

      {/* ===== What is HRD Corp ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="max-w-[560px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">Background</p>
            <h3 className="text-display mb-5">What HRD Corp is</h3>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              <strong className="text-[var(--color-ink)]">{hrdCorpAbout.fullName}</strong> is a Malaysian government agency under the{" "}
              {hrdCorpAbout.ministry}. {hrdCorpAbout.summary}
            </p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Source:{" "}
              <a
                href="https://hrdcorp.gov.my/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
              >
                hrdcorp.gov.my ↗
              </a>
            </p>
          </div>
          <div className="grid gap-4">
            {hrdCorpAbout.schemes.map((scheme) => (
              <Card key={scheme.name} variant="plate" className="p-5">
                <h4 className="text-h2 mb-2">{scheme.name}</h4>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">{scheme.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== For organisations ===== */}
      <section className="relative overflow-hidden bg-[var(--color-ground-tint)]">
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <div className="max-w-[640px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">For organisations</p>
            <h3 className="text-display mb-5">Planning around HRD Corp funding</h3>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              Malaysian employers registered with HRD Corp can claim back the cost of approved training under schemes such as HRD
              Corp Claimable Course. {hrdCorpOrg.claimableCourses.statement} Talk to us and we will give you a straight answer for
              your situation.
            </p>
            <Button variant="secondary" href="/contact-us">
              Talk to us about HRD Corp funding
            </Button>
          </div>
        </div>
      </section>

      {/* ===== Boundary note ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-12">
        <p className="text-body-sm max-w-[720px] text-[var(--color-ink-faint)]">
          This accreditation belongs to the trainer personally, and is not an HRD Corp endorsement of this Academy&rsquo;s own
          credential — which is earned through assessed applied work, never through attendance. See{" "}
          <Link
            href="/certifications"
            className="font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Certifications
          </Link>{" "}
          for how that credential works.
        </p>
      </section>
    </div>
  );
}
