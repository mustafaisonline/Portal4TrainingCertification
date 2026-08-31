import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { domains } from "@/data/domains";

/**
 * P01 — Homepage. Spec: DATA_AI_ACADEMY_PORTAL_MOCKUP_SPECIFICATION.md §4.
 * Signed-out state only in this milestone — no auth exists to render a
 * signed-in "continue learning" variant.
 */
export default function HomePage() {
  return (
    <PublicShell>
      {/* 1. Hero */}
      <section className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="max-w-[720px]">
          <p className="text-label mb-4 text-[var(--color-primary)]">
            Data &amp; AI capability, proven
          </p>
          <h1 className="text-display-lg mb-6">
            Learn what you&rsquo;re missing. Prove it by doing the work. Carry
            the proof anywhere.
          </h1>
          <p className="text-body-lg mb-8 text-[var(--color-ink-quiet)]">
            For data and AI professionals who want a credential employers
            actually trust — not another certificate of attendance.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="/diagnostic">Start free diagnostic (10 min)</Button>
            <Button variant="text" href="#how-it-works">
              See how certification works
            </Button>
          </div>
        </div>
      </section>

      {/* 2. The three doors */}
      <section className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <Card variant="panel">
            <p className="text-label mb-3">For individuals</p>
            <h2 className="text-h2 mb-2">Build my career</h2>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Find your gaps, learn the shortest honest path, and earn a
              credential that proves it.
            </p>
            <Button variant="secondary" href="/diagnostic">
              Start free diagnostic
            </Button>
          </Card>
          <Card variant="panel">
            <p className="text-label mb-3">For organisations</p>
            <h2 className="text-h2 mb-2">Train my team</h2>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              See your team&rsquo;s real capability gaps and close them with
              evidence, not attendance records.
            </p>
            <Button variant="secondary" href="#">
              Explore for organisations
            </Button>
          </Card>
          <Card variant="panel">
            <p className="text-label mb-3">For practitioners</p>
            <h2 className="text-h2 mb-2">Teach or partner</h2>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              Bring your expertise to a standard other people can trust.
            </p>
            <Button variant="secondary" href="#">
              Become an instructor
            </Button>
          </Card>
        </div>
      </section>

      {/* 3. Why this is different */}
      <section id="how-it-works" className="mx-auto max-w-[1280px] px-6 py-16">
        <h2 className="text-display mb-10 max-w-[640px]">
          Why this is different
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-label mb-3">D1 — Evidence, not attendance</p>
            <Card variant="plate" className="p-5">
              <p className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
                Rubric — Criterion 2: Justification
                <br />○ Not yet ○ Competent ● Proficient ○ Distinguished
              </p>
            </Card>
          </div>
          <div>
            <p className="text-label mb-3">D2 — Living knowledge</p>
            <Card variant="plate" className="p-5">
              <p className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
                Data Modelling for Governance
                <br />
                v2.3 · reviewed 2026-06
              </p>
            </Card>
          </div>
          <div>
            <p className="text-label mb-3">D3 — Grounded AI, always cited</p>
            <Card variant="plate" className="p-5">
              <p className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
                &ldquo;A lineage capability tracks…&rdquo;
                <br />
                [DF-14 §2, v1.4]
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. The credential (DR-01: no ladder in V1) */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <Card variant="feature">
          <p className="text-label mb-3">The credential</p>
          <h2 className="text-display mb-4 max-w-[640px]">
            One credential. Knowledge and evidence, both required.
          </h2>
          <p className="text-body-lg mb-6 max-w-[640px] text-[var(--color-ink-quiet)]">
            To earn it, you pass a knowledge assessment and submit an applied
            artifact that a qualified assessor reviews against a published
            rubric. Attendance alone never earns it.
          </p>
          <Button variant="secondary" href="#">
            See the credential
          </Button>
        </Card>
      </section>

      {/* 5. Domains */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <h2 className="text-display mb-10">Five domains</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {domains.map((domain) => (
            <Card
              key={domain.code}
              variant={domain.emphasised ? "feature" : "plate"}
              className={domain.emphasised ? "" : "p-5"}
            >
              <Chip tone={domain.emphasised ? "primary" : "neutral"}>
                {domain.code}
              </Chip>
              <h3 className="text-h2 mt-3 mb-1">{domain.name}</h3>
              <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
                {domain.scope}
              </p>
              <p className="text-mono text-body-sm text-[var(--color-ink-faint)]">
                {domain.courseCount} courses
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. Proof band — honest empty state, no padded numbers (§4 P01) */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto max-w-[1280px] px-6 py-12 text-center">
          <p className="text-label mb-2">Where we are today</p>
          <p className="text-body-lg mx-auto max-w-[640px] text-[var(--color-ink-quiet)]">
            The first cohorts are being assembled now. Founding candidates get
            a credential from the very first assessment round — with the same
            rubric and the same qualified assessors as every round after.
          </p>
        </div>
      </section>

      {/* 7. For organisations teaser */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-label mb-3">For organisations</p>
            <h2 className="text-display mb-4">
              See exactly where your team&rsquo;s capability stands
            </h2>
            <p className="text-body-lg mb-6 text-[var(--color-ink-quiet)]">
              A live view of skill coverage across every domain, drillable
              down to the individual — the artefact that turns a training
              budget conversation into a capability conversation.
            </p>
            <Button variant="secondary" href="#">
              Talk to us about your team
            </Button>
          </div>
          <Card variant="panel">
            <p className="text-label mb-4">Illustrative — skills heatmap</p>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    background: `var(--color-prof-${((i * 7) % 5) + 1})`,
                  }}
                />
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* 8. From the knowledge library */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <h2 className="text-display mb-10">From the knowledge library</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Designing a lineage capability", "DF-14", "v1.4"],
            ["Reading a rubric like an assessor", "GA-03", "v2.1"],
            ["When to disclose AI use", "GA-07", "v1.0"],
          ].map(([title, code, version]) => (
            <Card key={code} variant="plate" className="p-5">
              <h3 className="text-h2 mb-2">{title}</h3>
              <p className="text-mono text-body-sm text-[var(--color-ink-faint)]">
                {code} · {version}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 9. Closing CTA */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 text-center">
        <h2 className="text-display mb-4">Find out where you stand</h2>
        <p className="text-body-lg mb-8 text-[var(--color-ink-quiet)]">
          No payment, no commitment, results in 10 minutes.
        </p>
        <Button href="/diagnostic">Start free diagnostic (10 min)</Button>
      </section>
    </PublicShell>
  );
}
