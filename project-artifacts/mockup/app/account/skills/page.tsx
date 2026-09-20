import Link from "next/link";
import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Card } from "@/components/ui/Card";
import { domains } from "@/data/domains";
import { resultFixtures } from "@/data/results";

/**
 * L05 — Skills profile (wireframe, 2026-09-20). Reuses the diagnostic's
 * canned fixture "A" (data/results.ts) for the five capability areas and
 * the gap statements. That fixture is NOT computed from anyone's answers
 * (see its own header) and the page says so. Deliberately omitted: the
 * fixture's `path` (target credential, hours, price) — retired ladder /
 * self-paced vocabulary (DR-01, DR-02) that this screen must not revive.
 */
export default function SkillsProfilePage() {
  const fx = resultFixtures.A;
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Skills profile</p>
        <h1 className="text-display">Where you stand</h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
          From your diagnostic attempt on 10 Sep 2026
          <SampleTag />
        </p>
      </header>

      <Card variant="panel" className="p-6">
        <h2 className="text-h1 mb-5">Capability areas</h2>
        <ul className="flex flex-col gap-5">
          {domains.map((d) => {
            const level = fx.profile[d.code];
            return (
              <li key={d.code}>
                <div className="mb-2 flex items-baseline justify-between gap-4">
                  <span className="text-body-sm font-medium">{d.name}</span>
                  <span className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
                    {level} / 5
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={`${d.name}: level ${level} of 5`}
                  className="h-2 overflow-hidden rounded-full bg-[var(--color-line)]"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(level / 5) * 100}%`,
                      background: `var(--color-prof-${level})`,
                    }}
                  />
                </div>
                <p className="text-body-sm mt-1.5 text-[var(--color-ink-faint)]">{d.scope}</p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h1 mb-4">Where to focus</h2>
        <ul className="text-body-sm flex list-disc flex-col gap-3 pl-5 text-[var(--color-ink-quiet)]">
          {fx.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/diagnostic"
          className="text-body-sm text-[var(--color-primary)] underline underline-offset-4"
        >
          Take the diagnostic again
        </Link>
      </div>
      <WireframeNote>
        Illustrative fixture — these levels are not computed from any answers.
        In the real product each level links to the evidence behind it.
      </WireframeNote>
    </div>
  );
}
