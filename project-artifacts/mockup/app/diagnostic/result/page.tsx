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
 *
 * CERTIFICATE VISUAL TREATMENT — 2026-09-07, founder direction ("this page
 * should look like a proper certificate page"). Scoped to section 7 below
 * (an ornamental frame, a seal icon, and a score gauge reusing the same
 * ring-arc technique as components/signature/DiagnosticIntro.tsx's
 * illustration, for visual continuity with the rest of the diagnostic
 * flow) — the other six sections are a capability report and were left as
 * they were; "certificate page" reads as a request about section 7
 * specifically, not a full page rebuild.
 *
 * WHAT DID NOT CHANGE, DELIBERATELY: every word of the existing caveat
 * copy (the "not the Academy's earned credential" paragraph, the tier/fee
 * paragraph, and the "Wireframe only — no account system exists yet, and
 * payment isn't connected" line) is reproduced verbatim, just laid out
 * differently — split into the ornamental panel (the ceremonial part) and
 * a plain box beneath it (the administrative/caveat part), which if
 * anything makes the wireframe-vs-real distinction from point 4 above
 * MORE visible, not less. The "Request certificate" button is still
 * `disabled` with no `href` — nothing here makes this look more real or
 * more functional than it is; only more considered as a piece of design.
 * No invented data either: no fabricated recipient name, certificate ID,
 * verification code or issue date — none of that exists behind this
 * wireframe, and adding placeholder-looking versions of it would misrepresent
 * this as closer to a real, working certificate than it is.
 */
/** Seal/medal icon for the certificate panel — original geometric inline
 *  SVG (a ribboned medallion), same convention as every other icon in
 *  this codebase; not a photograph or a third-party glyph. */
function SealIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
      <circle cx="20" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14 25l-3 10 6.5-3.5L20 35l2.5-3.5L29 35l-3-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 16l3.5 3.5L26 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Circular score reading — same ring-arc technique as
 *  components/signature/DiagnosticIntro.tsx's `DiagnosticIllustration`
 *  gauge, parameterised by an actual percentage here rather than a fixed
 *  decorative fraction, so the certificate panel and the rest of the
 *  diagnostic flow share one visual language for "a score, shown as a
 *  ring." `score` is `fixture.score` — see this file's header comment:
 *  illustrative, never a computed result. */
function ScoreGauge({ score }: { score: number }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative grid h-[110px] w-[110px] shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${circumference * (score / 100)} ${circumference}`}
        />
      </svg>
      <p className="text-h1">{score}%</p>
    </div>
  );
}

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
            illustrative 90% line.
            REDESIGNED 2026-09-07 — see this file's header comment
            ("CERTIFICATE VISUAL TREATMENT") for what changed and, just as
            importantly, what deliberately didn't. */}
        {fixture.score >= 90 && (
          <section className="mb-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Diagnostic outcome
            </p>
            <h2 className="text-h1 mb-2">Certificate of attempt</h2>
            <p className="text-body-sm mb-8 max-w-[560px] text-[var(--color-ink-quiet)]">
              You scored {fixture.score}% on this self-assessment —
              illustrative, not a computed result (see note below).
            </p>

            {/* The ornamental panel — double border, centred, a seal and a
                score gauge. Everything text-bearing here is either
                unchanged copy from before this pass or a direct restating
                of `tierName`/`fixture.score`, both real props — nothing
                invented. */}
            <div className="mx-auto max-w-[720px] rounded-[26px] border-2 border-[var(--color-accent-line)]/40 bg-[var(--color-ground-raised)] p-2.5 shadow-[0_20px_50px_rgba(16,24,40,0.08)]">
              <div className="rounded-[20px] border border-dashed border-[var(--color-accent-line)]/50 px-8 py-12 text-center sm:px-14">
                <div className="mx-auto mb-6 grid h-[72px] w-[72px] place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]">
                  <SealIcon />
                </div>
                <p className="text-label mb-3 tracking-[0.18em] text-[var(--color-accent-ink)]">
                  Certificate of Attempt
                </p>
                <h3 className="text-display mb-1">{tierName} tier</h3>
                <p className="text-mono text-body-sm mb-9 text-[var(--color-ink-faint)]">
                  Data &amp; AI Academy · Free Skill Diagnostic
                </p>

                <div className="mx-auto mb-9 flex w-fit items-center gap-3">
                  <ScoreGauge score={fixture.score} />
                </div>

                <p className="mx-auto max-w-[460px] text-body-sm text-[var(--color-ink-quiet)]">
                  A record that you completed this diagnostic and scored{" "}
                  {fixture.score}%. This is not the Academy&rsquo;s earned
                  credential — that is judged applied work against a
                  published rubric. A certificate of attempt only confirms
                  you took and scored well on this self-assessment.
                </p>
              </div>
            </div>

            {/* The administrative/caveat block — deliberately plain, not
                ornamental, so it reads as terms rather than part of the
                ceremony. Same three original pieces of copy as before this
                pass, word for word. */}
            <div className="mx-auto mt-6 max-w-[720px] rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] p-6">
              <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
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
            </div>
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
