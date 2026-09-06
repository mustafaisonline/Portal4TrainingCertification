"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkillMeter } from "@/components/signature/SkillMeter";
import { QUESTION_COUNT_TIERS } from "@/data/questions";
import { resultFixtures } from "@/data/results";
import { roleTargets } from "@/data/roles";

/**
 * P06 — Diagnostic Result (§4). Full experience only in this milestone —
 * the anonymous blurred variant is deferred; see docs/FINDINGS.md for why.
 *
 * `useSearchParams` requires a Suspense boundary in the App Router, so the
 * page body is a separate component wrapped below.
 *
 * CERTIFICATE OF ATTEMPT — WIREFRAME ONLY (2026-09-05, founder request).
 * Shown when `fixture.score >= 90`. Explicitly a UI wireframe, not a real
 * feature, because things it would need don't exist and weren't approved
 * here:
 * 1. A real scoring engine. `fixture.score` is a static illustrative field
 *    on each canned fixture (data/results.ts), never computed from answers
 *    — docs/MOCK_DATA_REGISTER.md is explicit that the diagnostic "must
 *    never be mistaken for or evolved into a real scoring engine."
 * 2. Real payment. The "Request certificate" button is inert by design
 *    (disabled, no href) — same honest-inert convention as the contact
 *    form ("Not connected yet") elsewhere in this codebase, not a fake
 *    success state. Founder intends Stripe for the real integration.
 * 3. A real account system. Founder direction (2026-09-05): the certificate
 *    requires an account and a one-time USD 10 fee. No account/auth system
 *    exists anywhere in this codebase — the "account" line below describes
 *    the intended flow, not a working gate.
 * 4. A resolved answer to whether a "certificate of attempt" (for a
 *    self-assessment score) sits alongside DR-01's "one credential, no
 *    ladder" and DR-02's "earned through applied work, not attendance"
 *    model, or contradicts it. The copy below deliberately frames this as
 *    a distinct, lesser artefact from the real earned credential rather
 *    than quietly redefining it — but that framing itself is not an
 *    approved decision, just the least-damage placeholder. This is sharper
 *    since founder direction (2026-09-05) added named tiers (Basic/
 *    Associate/Professional/Master, by question count — see
 *    data/questions.ts's QUESTION_COUNT_TIERS) — a named ladder is exactly
 *    what DR-01 says the Academy's credential does not have. Flagged, not
 *    resolved.
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
  // Every diagnostic run today is the 10-question tier — see this file's
  // header comment and data/questions.ts's QUESTION_COUNT_TIERS.
  const tierName =
    QUESTION_COUNT_TIERS.find((t) => t.count === 10)?.tier ?? "Basic";

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

        {/* 7. Certificate of attempt — WIREFRAME ONLY, see this file's
            header comment for why (no real scoring, no real payment, and
            the DR-01/DR-02 question is unresolved). Only appears above the
            illustrative 90% line. */}
        {fixture.score >= 90 && (
          <section className="mb-16">
            <h2 className="text-h1 mb-2">Certificate of attempt</h2>
            <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
              You scored {fixture.score}% on this self-assessment —
              illustrative, not a computed result (see note).
            </p>
            <Card variant="feature">
              <p className="text-label mb-2">
                Certificate of Attempt — {tierName} tier
              </p>
              <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
                A record that you completed this diagnostic and scored{" "}
                {fixture.score}%. This is not the Academy&rsquo;s earned
                credential — that is judged applied work against a published
                rubric. A certificate of attempt only confirms you took and
                scored well on this self-assessment.
              </p>
              <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
                This diagnostic is the 10-question {tierName} tier.
                Associate (50), Professional (100) and Master (200) tiers are
                coming soon. Requesting a certificate needs a free account
                and a one-time USD 10 fee.
              </p>
              <Button disabled>Request certificate — USD 10</Button>
              <p className="mt-3 text-body-sm text-[var(--color-ink-faint)]">
                Wireframe only — no account system exists yet, and payment
                isn&rsquo;t connected.
              </p>
            </Card>
          </section>
        )}

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
