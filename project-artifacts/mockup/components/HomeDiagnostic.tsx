"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticQuestionCanvas } from "@/components/signature/DiagnosticQuestionCanvas";
import { DiagnosticStartCard } from "@/components/signature/DiagnosticStartCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  INSIGHT_CARD,
  questions,
  UNSURE_OPTION,
} from "@/data/questions";
import { selectFixture } from "@/data/results";

/**
 * P01 — Homepage "Not sure where you stand?" band.
 *
 * REBUILT 2026-09-05 (founder request) from a static CTA banner into the
 * real, live diagnostic walkthrough (previously only reachable at
 * /diagnostic), embedded directly in this homepage section so a visitor
 * can start it without navigating away.
 *
 * Shares the exact same question data, canvas component, in-progress
 * localStorage key and fixture-selection logic as app/diagnostic/page.tsx
 * — this is the same diagnostic, not a second one, so progress carries
 * over between the two entry points. On completion it navigates to
 * /diagnostic/result?fixture=<A|B>, same as the standalone page.
 *
 * Question-count selector (10/50/100/200, named tiers Basic/Associate/
 * Professional/Master per data/questions.ts's QUESTION_COUNT_TIERS): only
 * "10" (Basic) is real. There are exactly 10 hand-written questions in
 * data/questions.ts — no 50/100/200 question bank exists. Per
 * docs/MOCK_DATA_REGISTER.md's own standard ("Diagnostic question sequence
 * — FAKED... out of scope for a mockup" to invent more), the other three
 * tiers are not backed by fabricated filler questions — clicking one here
 * does not run a 50/100/200-question test. Extracted into
 * `DiagnosticStartCard` (2026-09-06, founder direction) so this exact
 * content — tier selector, Start button, the disclaimer below — is shared
 * with app/diagnostic/page.tsx rather than duplicated and drifting.
 * "10" starts the real inline walkthrough; clicking 50/100/200 HERE
 * navigates to the standalone /diagnostic page instead of doing nothing —
 * there is somewhere more dedicated to send that visitor, even though the
 * tier itself is still unavailable once they arrive.
 *
 * Certificate-of-attempt copy (account + USD 10 fee, 2026-09-05 founder
 * request): describes the intended flow only — no account system exists
 * anywhere in this codebase yet, and the fee is not collected here (see
 * app/diagnostic/result/page.tsx's own header comment for the payment
 * wireframe). See docs/MOCK_DATA_REGISTER.md for the DR-01 tier-naming
 * flag.
 *
 * "Cancel test" (2026-09-05 founder request): lets a user abandon a test
 * in progress, distinct from the existing "Back" (which only changes the
 * previous answer). Discards the in-progress localStorage answers — see
 * handleCancel below.
 */

const STORAGE_KEY = "mockup:diagnostic:in-progress";

type SavedProgress = {
  index: number;
  answers: (string | null)[];
};

type Stage = "idle" | "question" | "insight";

function GlyphTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function HomeDiagnostic() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => Array(questions.length).fill(null) as (string | null)[],
  );
  const [hydrated, setHydrated] = useState(false);

  // Resume in-progress answers, if any — same key as /diagnostic, so a
  // walkthrough started there (or here) continues from either entry point.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedProgress = JSON.parse(raw);
        if (Array.isArray(saved.answers) && saved.answers.length === questions.length) {
          const hasAnyAnswer = saved.answers.some((a) => a !== null);
          if (hasAnyAnswer) {
            setAnswers(saved.answers);
            setIndex(Math.min(saved.index, questions.length - 1));
            setStage("question");
          }
        }
      }
    } catch {
      // Corrupt or unavailable storage — start fresh. Never authoritative.
    }
    setHydrated(true);
  }, []);

  const persist = (nextIndex: number, nextAnswers: (string | null)[]) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ index: nextIndex, answers: nextAnswers }),
      );
    } catch {
      // Best-effort only — the walkthrough still works without it.
    }
  };

  if (!hydrated) return null;

  const current = questions[index];
  const selected = answers[index];

  const handleStart = () => {
    setIndex(0);
    setStage("question");
  };

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
      window.localStorage.removeItem(STORAGE_KEY);
      const unsureCount = answers.filter((a) => a === UNSURE_OPTION).length;
      const fixture = selectFixture(unsureCount);
      router.push(`/diagnostic/result?fixture=${fixture}`);
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

  const handleCancel = () => {
    if (
      !window.confirm(
        "Cancel this diagnostic? Your answers so far will be discarded.",
      )
    ) {
      return;
    }
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Best-effort only.
    }
    setAnswers(Array(questions.length).fill(null) as (string | null)[]);
    setIndex(0);
    setStage("idle");
  };

  return (
    // LIGHT-THEME REDESIGN, 2026-09-06: `night` removed (was the same dark
    // scope as every other homepage section under the old visual system —
    // see HomeHeroLight.tsx's header comment for the redesign this is
    // part of). mt-12: standardised 48px inter-section gap, unchanged (see
    // app/page.tsx's "Three pathways" comment for the gap convention).
    <section className="relative mt-12 overflow-hidden bg-[#eef2fc]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 90% at 20% 30%, rgba(47,95,224,0.10), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[880px] px-6 py-[25px]">
        {/* Intro block (heading, description, stats) — always visible.
            EXTENDED 2026-09-05 (founder request): previously this whole
            block disappeared once the quiz started, replaced by the
            question card. It now stays put and the section grows
            downward to reveal the form beneath it instead. */}
        <div className="relative mb-8 flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-[560px] items-start gap-5">
            <div className="mt-1 hidden rounded-[10px] border border-[var(--color-line-strong)] p-2.5 text-[var(--color-primary)] sm:inline-flex">
              <GlyphTarget />
            </div>
            <div>
              <p className="text-label mb-2 text-[var(--color-primary)]">
                Free skill diagnostic
              </p>
              <h2 className="text-h1 mb-2">Not sure where you stand?</h2>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                The free diagnostic locates you across our capability areas
                and names your gaps in plain language — before you commit
                to anything.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3">
            <p className="text-label">Free · no account to start</p>
            <p className="text-label">Named gaps, not a score</p>
            <p className="text-label">No commitment</p>
          </div>
        </div>

        {stage === "idle" && (
          <DiagnosticStartCard
            onStart={handleStart}
            onUnavailableTier={() => router.push("/diagnostic")}
          />
        )}

        {stage === "insight" && (
          <Card variant="feature" className="relative mx-auto max-w-[560px] text-center">
            <p className="text-label mb-3">Calibrating</p>
            <p className="text-body-lg mb-6">{INSIGHT_CARD.text}</p>
            <Button onClick={dismissInsight}>Continue</Button>
          </Card>
        )}

        {stage === "question" && (
          <div className="relative">
            <p className="text-label mb-5 text-center text-[var(--color-ink-quiet)]">
              Question {index + 1} of {questions.length}
            </p>
            <DiagnosticQuestionCanvas
              question={current}
              selected={selected}
              onSelect={handleSelect}
              onBack={handleBack}
              onContinue={handleContinue}
              canGoBack={index > 0}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </section>
  );
}
