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
 * Kept from the mockup: the page frame and the CTA row. The certificate-style
 * panel (seal, ring gauge, "Request certificate — USD 10") was removed on the
 * founder's instruction, 2026-09-27: the free diagnostic is a check of basic
 * concepts, nothing more — the outcome is stated plainly. Replaced:
 * the SkillMeter profile, target-role comparison, named gaps, recommended
 * path, "what you already have" and peer benchmark — all read from invented
 * fixtures — become (1) answered / "not sure" counts per capability area
 * from the visitor's own answers and (2) a plain statement that the scored
 * profile and recommended path arrive when the assessment engine is live.
 * "Never a score" was the rule until the founder's 2026-10-02 instruction
 * (CR-2026-10-02-2014, "Score not displayed"; option B): when every question
 * carries its correct option the page now shows the total score and a bar per
 * learning area, computed HERE in the browser — no answer is sent anywhere
 * (Privacy §2/§3). No band or level names are shown: none has been approved.
 * A record without correct options (the homepage walkthrough's fixed set, or an
 * older attempt) keeps the counts-only summary. CTAs point at existing routes; "Save results" / "Email me the report"
 * (`href="#"`) are dropped. No name, ID, date or score is shown.
 */

type AreaSummary = { code: string; name: string; total: number; answered: number; unsure: number; correct: number };

function summariseByArea(completed: CompletedDiagnostic): AreaSummary[] {
  const byCode = new Map<string, AreaSummary>();
  for (const answer of completed.answers) {
    const entry = byCode.get(answer.domainCode) ?? {
      code: answer.domainCode,
      name: answer.domainName,
      total: 0,
      answered: 0,
      unsure: 0,
      correct: 0,
    };
    entry.total += 1;
    if (answer.selected !== null) entry.answered += 1;
    if (answer.selected === UNSURE_OPTION) entry.unsure += 1;
    if (answer.correct && answer.selected === answer.correct) entry.correct += 1;
    byCode.set(answer.domainCode, entry);
  }
  return Array.from(byCode.values());
}

/** Scoreable only when every question carries its correct option. */
function isScoreable(completed: CompletedDiagnostic): boolean {
  return completed.answers.length > 0 && completed.answers.every((a) => typeof a.correct === "string" && a.correct.length > 0);
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
          <Button href="/free-learning/diagnostic">Start the free diagnostic</Button>
        </Card>
      </div>
    );
  }

  const areas = summariseByArea(completed);
  const scoreable = isScoreable(completed);
  const correctCount = areas.reduce((n, a) => n + a.correct, 0);
  const percent = Math.round((correctCount / total) * 100);
  // Areas where fewer answers were correct, weakest first — a plain reading of the counts, not a band.
  const focus = scoreable ? areas.filter((a) => a.correct < a.total).sort((a, b) => a.correct / a.total - b.correct / b.total) : [];

  return (
    <div className="mx-auto max-w-[880px] px-6 py-16">
      <p className="text-label mb-3 text-[var(--color-primary)]">Your diagnostic result</p>
      <h1 className="text-display mb-10">{scoreable ? "Your score" : "Here\u2019s what you answered"}</h1>

      {scoreable && (
        <section className="mb-12" data-testid="diagnostic-score">
          <Card variant="feature">
            <p className="text-display" data-testid="diagnostic-score-total">
              {correctCount} of {total}
            </p>
            <p className="text-body-lg text-[var(--color-ink-quiet)]" data-testid="diagnostic-score-percent">
              {percent}% correct
            </p>
          </Card>
        </section>
      )}

      {/* 1. Answers by capability area — counts only, from the visitor's own
          answers × each question's capability area. */}
      <section className="mb-12">
        <h2 className="text-h1 mb-6">{scoreable ? "Your score by learning area" : "Your answers by capability area"}</h2>
        <Card variant="panel">
          <ul className="flex flex-col divide-y divide-[var(--color-line)]">
            {areas.map((area) => (
              <li
                key={area.code}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-body-sm font-medium">{area.name}</span>
                <span className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
                  {scoreable ? `${area.correct} of ${area.total} correct · ` : ""}
                  {area.answered} of {area.total} answered, {area.unsure} &lsquo;not sure&rsquo;
                </span>
                {scoreable && (
                  <span
                    aria-hidden="true"
                    className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]"
                    data-testid="diagnostic-area-bar"
                  >
                    <span className="block h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.round((area.correct / area.total) * 100)}%` }} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* 2. Where to focus (scored) — or what is not here yet (counts only). */}
      <section className="mb-12">
        <h2 className="text-h1 mb-6">{scoreable ? "Where to focus next" : "Your profile and recommended path"}</h2>
        <Card variant="feature">
          {scoreable ? (
            focus.length > 0 ? (
              <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="diagnostic-focus">
                Fewer correct answers in: {focus.map((a) => a.name).join(", ")}. The free learning section covers each of these areas.
              </p>
            ) : (
              <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="diagnostic-focus">
                Every answer was correct in every area.
              </p>
            )
          ) : (
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              This record has no scoring information, so it shows what you answered only. Take the full free diagnostic to see a score and a
              chart for each learning area. <a className="text-[var(--color-primary)] underline underline-offset-4" href="/free-learning/diagnostic">Start the free diagnostic</a>.
            </p>
          )}
        </Card>
      </section>

      {/* 3. Outcome — plain. Founder, 2026-09-27: no "Certificate of attempt";
          the free diagnostic is a check of basic concepts, nothing more. */}
      <section className="mb-16" data-testid="diagnostic-outcome">
        <p className="text-label mb-3 text-[var(--color-primary)]">Diagnostic outcome</p>
        <h2 className="text-h1 mb-2">
          You answered {answered} of {total} questions
        </h2>
        <p className="text-body-sm max-w-[560px] text-[var(--color-ink-quiet)]">
          This free diagnostic is a quick check of basic data and AI concepts{scoreable ? " — your score is a self-check" : ""}, not a certificate and not
          the Academy&rsquo;s credential. Nothing is saved or sent: the score is worked out in your browser. For a longer free test with a verifiable result, take The
          Free Assessment Check once you have an account.
        </p>
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
