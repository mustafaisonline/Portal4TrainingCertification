import Link from "next/link";
import { hrdCorpAbout, hrdCorpOrg } from "@/content/hrd-corp";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * The HRD Corp sections — MOVED 2026-09-27 (Milestone 14 Phase 1, founder
 * decision P16) from app/(public)/hrd-corp/page.tsx onto the Trainings page,
 * which is now "Trainings & HRD Corp" (/programs#hrd-corp); /hrd-corp
 * redirects there. Copy unchanged; the page's hero became the section's
 * heading. Organisation facts still read from src/content/hrd-corp.ts.
 *
 * THREE STATUSES, never blurred (see src/content/hrd-corp.ts header):
 * 1. Trainer accreditation (Mustafa Qizilbash) — HELD, genuine, verifiable.
 *    Displayed on /trainers, not here.
 * 2. Registered Training Provider (Your Partner Technologies) — NOT held;
 *    application in progress. Displayed here.
 * 3. HRD Corp Claimable (any course) — NOT held by any course.
 */
export function HrdCorpSections() {
  return (
    <div id="hrd-corp" className="scroll-mt-24 border-t border-[var(--color-line)]" data-testid="hrd-corp-sections">
      {/* ===== Heading (was the /hrd-corp hero) ===== */}
      <section className="mx-auto max-w-[1280px] px-6 pt-16">
        <p className="text-label mb-4 text-[var(--color-primary)]">HRD Corp</p>
        <h2 className="text-display-lg mb-6 max-w-[760px]">A genuine HRD Corp accreditation — verified, not just claimed</h2>
        <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
          Courses here are designed and delivered by an HRD Corp Accredited Trainer — see{" "}
          <Link
            href="/trainers#hrd-corp-accreditation"
            className="font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Trainers
          </Link>{" "}
          for that accreditation and how to verify it. This section sets out what that does, and does not, mean for this
          organisation and its courses.
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

      {/* ===== Registration status — honest, in progress ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="max-w-[560px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">In progress</p>
            <h3 className="text-display mb-5">Becoming an HRD Corp Registered Training Provider</h3>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              A trainer&rsquo;s own accreditation and an organisation&rsquo;s HRD Corp registration are two different things.{" "}
              {hrdCorpOrg.legalEntityName} — the training practice behind these courses — does not hold Registered Training
              Provider status today.
            </p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">{hrdCorpOrg.claimableCourses.statement}</p>
          </div>
          <div
            role="note"
            aria-label="HRD Corp Registered Training Provider application — in progress"
            className="flex flex-col justify-center rounded-[var(--radius-panel)] border-2 border-dashed border-[var(--color-accent-line)] bg-[var(--color-accent-soft)] p-8"
          >
            <span className="text-label mb-3" style={{ color: "var(--color-accent-ink)" }}>
              Application in progress — not yet registered
            </span>
            <p className="text-h2 mb-3">{hrdCorpOrg.registeredTrainingProvider.statement}</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">We will update this section — and only this section — the moment that changes.</p>
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
              Corp Claimable Course. Whether a specific engagement can be structured that way depends on registration steps this
              organisation has not completed yet — talk to us and we will give you a straight answer for your situation.
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
          This accreditation belongs to the trainer personally. It does not certify {hrdCorpOrg.legalEntityName} as an HRD Corp
          Registered Training Provider, and it is not an HRD Corp endorsement of this Academy&rsquo;s own credential — which is earned
          through assessed applied work, never through attendance. See{" "}
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
