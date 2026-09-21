"use client";

import { useEffect, useState } from "react";
import {
  readCompletedDiagnostic,
  UNSURE_OPTION,
  type CompletedDiagnostic,
} from "@/shared/signature/diagnostic";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/diagnostic/result/page.tsx (ADR-045)
 * Changed: canned result fixtures NOT ported; page shows an answer summary.
 * Kept from the mockup: the page frame, the certificate-style panel (double
 * border, seal, ring gauge) and its caveat box, and the CTA row. Replaced:
 * the SkillMeter profile, target-role comparison, named gaps, recommended
 * path, "what you already have" and peer benchmark — all read from invented
 * fixtures — become (1) answered / "not sure" counts per capability area
 * from the visitor's own answers and (2) a plain statement that the scored
 * profile and recommended path arrive when the assessment engine is live.
 * The gauge shows completion (answered ÷ total), labelled "Completed" —
 * never a score. The tier name is replaced by the real question count. The
 * "Request certificate" button stays disabled and is labelled not available
 * yet. CTAs point at existing routes; "Save results" / "Email me the report"
 * (`href="#"`) are dropped. No name, ID, date or score is shown.
 */

/** Seal/medal icon for the certificate panel — original geometric inline SVG. */
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

/** Circular reading — same ring-arc technique as DiagnosticIntro's
 *  illustration. Driven ONLY by the completion percentage (answered ÷ total);
 *  it is not a score. */
function CompletionGauge({ percent }: { percent: number }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
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
            strokeDasharray={`${circumference * (percent / 100)} ${circumference}`}
          />
        </svg>
        <p className="text-h1">{percent}%</p>
      </div>
      <p className="text-label text-[var(--color-ink-quiet)]">Completed</p>
    </div>
  );
}

type AreaSummary = { code: string; name: string; total: number; answered: number; unsure: number };

function summariseByArea(completed: CompletedDiagnostic): AreaSummary[] {
  const byCode = new Map<string, AreaSummary>();
  for (const answer of completed.answers) {
    const entry = byCode.get(answer.domainCode) ?? {
      code: answer.domainCode,
      name: answer.domainName,
      total: 0,
      answered: 0,
      unsure: 0,
    };
    entry.total += 1;
    if (answer.selected !== null) entry.answered += 1;
    if (answer.selected === UNSURE_OPTION) entry.unsure += 1;
    byCode.set(answer.domainCode, entry);
  }
  return Array.from(byCode.values());
}

export function DiagnosticResultView({
  programmeHref,
  programmeLabel,
}: {
  programmeHref: string;
  programmeLabel: string;
}) {
  const [completed, setCompleted] = useState<CompletedDiagnostic | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // The completed answers live only in this browser (UX continuity, never a
  // business record) — read them after mount, same boundary as the flow.
  useEffect(() => {
    setCompleted(readCompletedDiagnostic());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const total = completed?.answers.length ?? 0;
  const answered = completed?.answers.filter((a) => a.selected !== null).length ?? 0;

  if (!completed || total === 0 || answered === 0) {
    return (
      <div className="mx-auto max-w-[880px] px-6 py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Your diagnostic result</p>
        <h1 className="text-display mb-10">No answers found</h1>
        <Card variant="panel">
          <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
            This page shows what you answered on the free skill diagnostic, and we could not find a completed
            attempt in this browser. Start the diagnostic to see your summary here.
          </p>
          <Button href="/diagnostic">Start the free diagnostic</Button>
        </Card>
      </div>
    );
  }

  const percent = Math.round((answered / total) * 100);
  const areas = summariseByArea(completed);

  return (
    <div className="mx-auto max-w-[880px] px-6 py-16">
      <p className="text-label mb-3 text-[var(--color-primary)]">Your diagnostic result</p>
      <h1 className="text-display mb-10">Here&rsquo;s what you answered</h1>

      {/* 1. Answers by capability area — counts only, from the visitor's own
          answers × each question's capability area. */}
      <section className="mb-12">
        <h2 className="text-h1 mb-6">Your answers by capability area</h2>
        <Card variant="panel">
          <ul className="flex flex-col divide-y divide-[var(--color-line)]">
            {areas.map((area) => (
              <li
                key={area.code}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-body-sm font-medium">{area.name}</span>
                <span className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
                  {area.answered} of {area.total} answered, {area.unsure} &lsquo;not sure&rsquo;
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* 2. What is not here yet — stated plainly. */}
      <section className="mb-12">
        <h2 className="text-h1 mb-6">Your profile and recommended path</h2>
        <Card variant="feature">
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            Your scored profile and recommended path arrive when the assessment engine is live. Nothing on this page
            is a score or a ranking — it is a record of what you answered.
          </p>
        </Card>
      </section>

      {/* 3. Certificate of attempt — the ornamental panel (seal + ring gauge),
          the gauge driven by completion only. */}
      <section className="mb-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Diagnostic outcome</p>
        <h2 className="text-h1 mb-2">Certificate of attempt</h2>
        <p className="text-body-sm mb-8 max-w-[560px] text-[var(--color-ink-quiet)]">
          You answered {answered} of {total} questions on this self-assessment. Your scored profile and recommended
          path arrive when the assessment engine is live.
        </p>

        <div className="mx-auto max-w-[720px] rounded-[26px] border-2 border-[var(--color-accent-line)]/40 bg-[var(--color-ground-raised)] p-2.5 shadow-[0_20px_50px_rgba(16,24,40,0.08)]">
          <div className="rounded-[20px] border border-dashed border-[var(--color-accent-line)]/50 px-8 py-12 text-center sm:px-14">
            <div className="mx-auto mb-6 grid h-[72px] w-[72px] place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]">
              <SealIcon />
            </div>
            <p className="text-label mb-3 tracking-[0.18em] text-[var(--color-accent-ink)]">Certificate of Attempt</p>
            <h3 className="text-display mb-1">{total}-question diagnostic</h3>
            <p className="text-mono text-body-sm mb-9 text-[var(--color-ink-faint)]">
              Data &amp; AI Academy · Free Skill Diagnostic
            </p>

            <div className="mx-auto mb-9 flex w-fit items-center gap-3">
              <CompletionGauge percent={percent} />
            </div>

            <p className="mx-auto max-w-[460px] text-body-sm text-[var(--color-ink-quiet)]">
              A record that you completed this diagnostic, answering {answered} of {total} questions. This is not the
              Academy&rsquo;s earned credential — that is judged applied work against a published rubric. A
              certificate of attempt only confirms you took this self-assessment.
            </p>
          </div>
        </div>

        {/* The administrative/caveat block — deliberately plain. */}
        <div className="mx-auto mt-6 max-w-[720px] rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] p-6">
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            Requesting a certificate needs a free account and a one-time USD 10 fee.
          </p>
          <Button disabled>Request certificate — USD 10</Button>
          <p className="mt-3 text-body-sm text-[var(--color-ink-faint)]">
            Not available yet — certificate requests and payment aren&rsquo;t connected.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-line)] pt-10">
        <Button href={programmeHref}>{programmeLabel}</Button>
        <Button variant="text" href="/register">
          Create a free account
        </Button>
        <Button variant="text" href="/">
          Back to the homepage
        </Button>
      </div>
    </div>
  );
}
