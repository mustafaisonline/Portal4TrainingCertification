"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkillMeter } from "@/components/signature/SkillMeter";
import { resultFixtures } from "@/data/results";
import { roleTargets } from "@/data/roles";

/**
 * P06 — Diagnostic Result (§4). Full experience only in this milestone —
 * the anonymous blurred variant is deferred; see docs/FINDINGS.md for why.
 *
 * `useSearchParams` requires a Suspense boundary in the App Router, so the
 * page body is a separate component wrapped below.
 */
export default function DiagnosticResultPage() {
  return (
    <Suspense fallback={null}>
      <DiagnosticResult />
    </Suspense>
  );
}

function DiagnosticResult() {
  const searchParams = useSearchParams();
  const fixtureId = searchParams.get("fixture") === "B" ? "B" : "A";
  const fixture = resultFixtures[fixtureId];

  const [roleId, setRoleId] = useState(roleTargets[0].id);
  const role = roleTargets.find((r) => r.id === roleId) ?? roleTargets[0];

  return (
    <PublicShell>
      <div className="mx-auto max-w-[880px] px-6 py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Your diagnostic result
        </p>
        <h1 className="text-display mb-10">Here&rsquo;s where you stand</h1>

        {/* 1. Capability profile */}
        <section className="mb-12">
          <h2 className="text-h1 mb-6">Your capability profile</h2>
          <Card variant="panel">
            <SkillMeter profile={fixture.profile} />
          </Card>
        </section>

        {/* 2. Compared to your target role */}
        <section className="mb-12">
          <h2 className="text-h1 mb-2">Compared to your target role</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            The gap is the product.
          </p>
          <div className="mb-5 flex flex-wrap gap-2">
            {roleTargets.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoleId(r.id)}
                className={`text-label rounded-full border px-3 py-1.5 ${
                  r.id === roleId
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-[var(--color-line-strong)] text-[var(--color-ink-quiet)]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Card variant="panel">
            <SkillMeter profile={fixture.profile} target={role.target} />
          </Card>
        </section>

        {/* 3. Named gaps */}
        <section className="mb-12">
          <h2 className="text-h1 mb-6">Your named gaps</h2>
          <div className="flex flex-col gap-3">
            {fixture.gaps.map((gap, i) => (
              <Card key={i} variant="plate" className="p-5">
                <p className="text-body-sm">{gap}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* 4. Recommended path */}
        <section className="mb-12">
          <h2 className="text-h1 mb-6">Your recommended path</h2>
          <Card variant="feature">
            <p className="text-label mb-2">{fixture.path.targetCredential}</p>
            <p className="text-mono text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              {fixture.path.hourEstimate} · {fixture.path.price}
            </p>
            <ol className="flex flex-col gap-3">
              {fixture.path.milestones.map((milestone, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <span className="text-mono text-body-sm text-[var(--color-ink-faint)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-body-sm">{milestone}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>

        {/* 5. What you already have */}
        <section className="mb-12">
          <h2 className="text-h1 mb-6">What you already have</h2>
          <Card variant="panel">
            <ul className="flex flex-col gap-2">
              {fixture.alreadyHave.map((item, i) => (
                <li key={i} className="text-body-sm text-[var(--color-ink-quiet)]">
                  ✓ {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* 6. Optional peer benchmark */}
        <section className="mb-16">
          <h2 className="text-h1 mb-4">How you compare</h2>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            {fixture.peerBenchmark}
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-line)] pt-10">
          <Button href="/journey-placeholder">Start this path</Button>
          <Button variant="text" href="#">
            Save results
          </Button>
          <Button variant="text" href="#">
            Email me the report
          </Button>
          <Button variant="text" href="/">
            Explore other paths
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
