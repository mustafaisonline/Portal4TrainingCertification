"use client";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/HomeDiagnostic.tsx
 * (ADR-045). Changes on port: the questions arrive as a `questions` prop
 * (repository records, read by the server page) instead of the mockup's
 * `data/questions` constant; the completion step no longer picks a canned
 * result fixture (`data/results.ts` is NEVER-PORT) — it hands the answers
 * given to /diagnostic/result through the shared per-browser storage
 * contract in `@/shared/signature/diagnostic` and navigates there. The
 * mid-flow insight card's canned copy (which asserted a reading of the
 * answers nothing computes) is replaced by the shared factual `insightText`,
 * identical to the standalone /diagnostic flow. The in-progress localStorage
 * resume/cancel stays: it is per-browser UI continuity only, never a
 * business record. All other copy and markup unchanged.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DiagnosticQuestionRecord } from "@/modules/catalogue/diagnostic/repository";
import { DiagnosticQuestionCanvas } from "@/shared/signature/DiagnosticQuestionCanvas";
import {
  DiagnosticIllustration,
  DiagnosticTrustCard,
} from "@/shared/signature/DiagnosticIntro";
import {
  DIAGNOSTIC_PROGRESS_STORAGE_KEY,
  DIAGNOSTIC_RESULT_STORAGE_KEY,
  INSIGHT_CARD,
  insightText,
  type CompletedDiagnostic,
  type SavedProgress,
} from "@/shared/signature/diagnostic";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";

/**
 * P01 — Homepage "Not sure where you stand?" band: the real, live
 * diagnostic walkthrough embedded directly in this homepage section so a
 * visitor can start it without navigating away.
 *
 * Shares the same question data, canvas component and in-progress storage
 * key as the standalone /diagnostic page — this is the same diagnostic, not
 * a second one, so progress carries over between the two entry points. The
 * form is pre-opened: `stage` starts on "question", so question 1 is
 * visible and answerable the moment this section renders. Anyone who wants
 * the 50/100/200 tiers is pointed at the "Free Diagnostic" button
 * (→ /diagnostic, where that tier selector lives).
 *
 * "Cancel test" lets a user abandon a test in progress, distinct from
 * "Back" (which only changes the previous answer); it discards the
 * in-progress answers and resets to a fresh question 1.
 */

type Stage = "question" | "insight";

/** Trailing arrow for the primary CTA. */
function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M4 12h16M13 5l7 7-7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** `teaser` (UX review 2026-09-27 U3): the band keeps its pitch and trust card
 *  but not the ten questions — those live on /free-learning/diagnostic, which
 *  the button opens. The home page no longer carries a whole quiz mid-page. */
export function HomeDiagnostic({ questions, teaser = false }: { questions: DiagnosticQuestionRecord[]; teaser?: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("question");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => Array(questions.length).fill(null) as (string | null)[],
  );
  const [hydrated, setHydrated] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  // Resume in-progress answers, if any — same key as /diagnostic, so a
  // walkthrough started there (or here) continues from either entry point.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DIAGNOSTIC_PROGRESS_STORAGE_KEY);
      if (raw) {
        const saved: SavedProgress = JSON.parse(raw);
        if (Array.isArray(saved.answers) && saved.answers.length === questions.length) {
          const hasAnyAnswer = saved.answers.some((a) => a !== null);
          if (hasAnyAnswer) {
            setAnswers(saved.answers);
            setIndex(Math.min(saved.index, questions.length - 1));
          }
        }
      }
    } catch {
      // Corrupt or unavailable storage — start fresh. Never authoritative.
    }
    setHydrated(true);
  }, [questions.length]);

  const persist = (nextIndex: number, nextAnswers: (string | null)[]) => {
    try {
      window.localStorage.setItem(
        DIAGNOSTIC_PROGRESS_STORAGE_KEY,
        JSON.stringify({ index: nextIndex, answers: nextAnswers }),
      );
    } catch {
      // Best-effort only — the walkthrough still works without it.
    }
  };

  if (!hydrated) return null;

  const current = questions[index];
  const selected = answers[index] ?? null;

  const handleSelect = (option: string) => {
    const next = [...answers];
    next[index] = option;
    setAnswers(next);
    persist(index, next);
  };

  const handleBack = () => {
    if (index === 0) return;
    const prevIndex = index - 1;
    setIndex(prevIndex);
    persist(prevIndex, answers);
  };

  const handleContinue = () => {
    const questionNumber = index + 1;
    const isLast = questionNumber === questions.length;

    if (isLast) {
      // Hand the answers given to the result page (per-browser, best-effort)
      // and clear the in-progress record. No score or profile is computed
      // here — the result page summarises the answers per capability area.
      const completed: CompletedDiagnostic = {
        completedAt: new Date().toISOString(),
        answers: questions.map((q, i) => ({
          code: q.code,
          domainCode: q.domain.code,
          domainName: q.domain.name,
          scenario: q.scenario,
          selected: answers[i] ?? null,
        })),
      };
      try {
        window.localStorage.setItem(DIAGNOSTIC_RESULT_STORAGE_KEY, JSON.stringify(completed));
        window.localStorage.removeItem(DIAGNOSTIC_PROGRESS_STORAGE_KEY);
      } catch {
        // Best-effort only.
      }
      router.push("/free-learning/diagnostic/result");
      return;
    }

    if (questionNumber === INSIGHT_CARD.afterQuestionIndex) {
      setStage("insight");
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    persist(nextIndex, answers);
  };

  const dismissInsight = () => {
    setStage("question");
    const nextIndex = index + 1;
    setIndex(nextIndex);
    persist(nextIndex, answers);
  };

  // Confirmed through the portal's own dialog, never window.confirm
  // (founder, 2026-09-28).
  const handleCancel = () => setConfirmingCancel(true);
  const confirmCancel = () => {
    setConfirmingCancel(false);
    try {
      window.localStorage.removeItem(DIAGNOSTIC_PROGRESS_STORAGE_KEY);
    } catch {
      // Best-effort only.
    }
    // Resets to a fresh question 1, not a hidden idle state — the form
    // stays pre-opened.
    setAnswers(Array(questions.length).fill(null) as (string | null)[]);
    setIndex(0);
    setStage("question");
  };

  // Factual mid-flow copy — see `INSIGHT_CARD` in @/shared/signature/diagnostic.
  const remainingAreas = Array.from(new Set(questions.slice(index + 1).map((q) => q.domain.name)));
  const insight = insightText(index + 1, questions.length, remainingAreas);

  return (
    // `.night` with the deep navy gradient inline (`.night`'s own
    // `background` is unlayered and beats any bg-* utility). mt-12: the
    // standardised 48px inter-section gap.
    <section
      id="free-skill-diagnostic"
      className="night relative mt-12 overflow-hidden"
      style={{
        background:
          "radial-gradient(55% 90% at 12% 30%, rgba(37,99,235,0.28), transparent 70%), radial-gradient(40% 70% at 92% 80%, rgba(34,211,238,0.10), transparent 70%), linear-gradient(180deg, #071a35 0%, #061226 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(96,165,250,0.22) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(70% 100% at 20% 40%, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(70% 100% at 20% 40%, black, transparent 80%)",
        }}
      />
      <div className="relative mx-auto max-w-[960px] px-6 py-16 sm:py-20">
        {/* Intro block (heading, description, trust points) — always
            visible; the section grows downward to reveal the form beneath. */}
        <div className={`relative flex flex-col items-start gap-8 lg:flex-row lg:items-start lg:justify-between ${teaser ? "" : "mb-10"}`}>
          <div className="flex max-w-[560px] items-start gap-5">
            <div className="hidden sm:block">
              <DiagnosticIllustration />
            </div>
            <div>
              <p className="text-label mb-2 text-[var(--color-primary)]">
                Free skill diagnostic
              </p>
              <h2 className="text-h1 mb-3">Not sure where you stand?</h2>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                The free diagnostic locates you across our learning areas
                and shows your score for each — before you commit
                to anything.
              </p>
              <div className="mt-5">
                <Button
                  href="/free-learning/diagnostic"
                  className="shadow-[0_10px_26px_rgba(37,99,235,0.45)] transition-shadow hover:shadow-[0_14px_32px_rgba(37,99,235,0.55)]"
                >
                  Free Diagnostic
                  <IconArrowRight />
                </Button>
              </div>
              {/* Fine print — the "quieter note under a CTA" pattern, so this
                  reads as a disclaimer, not more pitch copy. */}
              {/* Founder direction 2026-09-27 (M14 item C): the ten questions
                  stay free and NOTHING is saved — say so here. The mockup's
                  "Certificate of Attempt … USD 10 … 50/100/200 diagnostics"
                  sentence described things that did not exist and is gone;
                  the Free Assessment Check arrives with M14 Phase 4. */}
              <p className="mt-5 max-w-[480px] border-t border-[var(--color-line)] pt-4 text-body-sm text-[var(--color-ink-faint)]" data-testid="diagnostic-not-saved">
                Always free, no account needed — and your answers stay in your browser: we do not save your diagnostic
                results. For the book and its topic self-checks, see the Knowledge Hub; for The Free Assessment
                Check, see Assessment.
              </p>
            </div>
          </div>
          <DiagnosticTrustCard className="sm:w-[320px]" />
        </div>

        {!teaser && (
          <>
        {/* Divider between the pitch and the live form. */}
        <div className="mb-8 border-t border-[var(--color-line)]" />

        {stage === "insight" && (
          <Card variant="feature" className="relative mx-auto max-w-[560px] text-center">
            <p className="text-label mb-3">Halfway there</p>
            <p className="text-body-lg mb-6">{insight}</p>
            <Button onClick={dismissInsight}>Continue</Button>
          </Card>
        )}

        {stage === "question" && current && (
          <div className="relative">
            {/* Progress track + floating pill. Progress is the CURRENT
                question number, not the completed count, so question 1
                already shows ~10% filled. */}
            <div className="relative mb-6 flex items-center">
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--color-line)]">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                  style={{ width: `${((index + 1) / questions.length) * 100}%` }}
                />
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--color-line-strong)] bg-[var(--color-ground-raised)] px-4 py-1.5 text-label text-[var(--color-ink-quiet)] shadow-sm">
                Question {index + 1} of {questions.length}
              </span>
            </div>
            <DiagnosticQuestionCanvas
              question={current}
              selected={selected}
              onSelect={handleSelect}
              onBack={handleBack}
              onContinue={handleContinue}
              canGoBack={index > 0}
              onCancel={handleCancel}
              cardClassName="max-w-[860px]"
              cardStyle={{ borderRadius: "22px" }}
            />
          </div>
        )}
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this diagnostic?"
        body="Your answers so far will be discarded."
        confirmLabel="Cancel the test"
        cancelLabel="Keep going"
        onConfirm={confirmCancel}
        onCancel={() => setConfirmingCancel(false)}
      />
    </section>
  );
}
