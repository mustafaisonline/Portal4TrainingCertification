/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/signature/SkillMeter.tsx
 * (ADR-045). Changes on port: the capability areas arrive as a `domains`
 * prop (repository `DomainRecord`s) instead of the mockup's `data/domains`
 * constant, and `ProficiencyProfile` is declared here keyed by domain code —
 * `data/results.ts`, where it lived, is NEVER-PORT. Markup unchanged.
 */

import type { DomainRecord } from "@/modules/catalogue/domains/repository";

/** Proficiency on the shared 5-step scale, keyed by capability-area code. */
export type ProficiencyProfile = Record<string, 1 | 2 | 3 | 4 | 5>;

/**
 * Signature component — SkillMeter. Horizontal bars, one per domain, on the
 * shared 5-step proficiency scale (§16.6): a dedicated colour family, never
 * the semantic red/green palette, because low proficiency is not an error
 * state. Named, not just numeric (§4 P06 §1). An optional `target` profile
 * renders as a marker for P06 §2 "compared to your target role" — the gap
 * between marker and fill is the product.
 */
export function SkillMeter({
  domains,
  profile,
  target,
}: {
  domains: Pick<DomainRecord, "code" | "name">[];
  profile: ProficiencyProfile;
  target?: ProficiencyProfile;
}) {
  return (
    <div className="flex flex-col gap-5">
      {domains.map((domain) => {
        const level = profile[domain.code] ?? 0;
        const targetLevel = target?.[domain.code];
        return (
          <div key={domain.code} className="flex items-center gap-4">
            <p className="w-40 shrink-0 text-body-sm">{domain.name}</p>
            <div className="relative flex flex-1 gap-1">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className="h-2.5 flex-1 rounded-sm"
                  style={{
                    background:
                      step <= level
                        ? `var(--color-prof-${level})`
                        : "var(--color-line)",
                  }}
                />
              ))}
              {targetLevel && (
                <div
                  className="absolute top-[-4px] h-[18px] w-[2px] bg-[var(--color-ink)]"
                  style={{ left: `${(targetLevel / 5) * 100}%` }}
                  title={`Target: ${targetLevel}/5`}
                />
              )}
            </div>
            <p className="text-mono text-body-sm w-10 text-right text-[var(--color-ink-quiet)]">
              {level}/5
            </p>
          </div>
        );
      })}
      {target && (
        <p className="text-body-sm text-[var(--color-ink-faint)]">
          The vertical mark on each row is the target for this role — the gap
          between the bar and the mark is what the recommended path closes.
        </p>
      )}
    </div>
  );
}
