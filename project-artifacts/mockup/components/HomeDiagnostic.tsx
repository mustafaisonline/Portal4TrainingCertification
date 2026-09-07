"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticQuestionCanvas } from "@/components/signature/DiagnosticQuestionCanvas";
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
 *
 * 2026-09-07, founder direction ("preload that form... show the pre-open
 * to users"): the "Number of questions" tier-selector card
 * (`DiagnosticStartCard`) is REMOVED from this homepage embed — the idle
 * stage it belonged to is gone, and `stage` now starts on "question"
 * directly, so the real 10-question form is visible and answerable the
 * moment this section renders, no click required. `DiagnosticStartCard`
 * itself is untouched and still used by app/diagnostic/page.tsx's own
 * idle stage — that page's flow (and its 50/100/200 tier buttons) is
 * unchanged; only this homepage entry point now skips straight to
 * question 1. The disclaimer text that card carried (free diagnostic, no
 * account; Certificate of Attempt needs an account + USD 10) moved into
 * the intro paragraph below instead, so it isn't lost along with the
 * card, plus a new sentence pointing anyone who wants the 50/100/200
 * tiers at the new "Free Diagnostic" button/nav item (→ /diagnostic,
 * where that tier selector still lives). */

const STORAGE_KEY = "mockup:diagnostic:in-progress";

type SavedProgress = {
  index: number;
  answers: (string | null)[];
};

type Stage = "question" | "insight";

function GlyphTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

/** 2026-09-07: the three trust points ("Free · no account to start" etc.)
 *  used to be bare `text-label` lines with no visual anchor — this gives
 *  each one the same icon-in-circle treatment already established for
 *  the hero's benefit row (components/HomeHeroLight.tsx's `benefits`),
 *  reused here rather than inventing a second convention. */
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const trustPoints = [
  "Free · no account to start",
  "Named gaps, not a score",
  "No commitment",
];

export function HomeDiagnostic() {
  const router = useRouter();
  // Starts on "question" directly (2026-09-07, see header comment) — the
  // form is pre-opened, not gated behind an idle "Start" click.
  const [stage, setStage] = useState<Stage>("question");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => Array(questions.length).fill(null) as (string | null)[],
  );
  const [hydrated, setHydrated] = useState(false);

  // Resume in-progress answers, if any — same key as /diagnostic, so a
  // walkthrough started there (or here) continues from either entry point.
  // `stage` is already "question" by default, so this only needs to
  // restore index/answers, not change stage.
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
    // Resets to a fresh question 1, not a hidden idle state — the form
    // stays pre-opened per 2026-09-07 direction (see header comment).
    setAnswers(Array(questions.length).fill(null) as (string | null)[]);
    setIndex(0);
    setStage("question");
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
        {/* Intro block (heading, description, trust points) — always
            visible. EXTENDED 2026-09-05 (founder request): previously this
            whole block disappeared once the quiz started, replaced by the
            question card. It now stays put and the section grows
            downward to reveal the form beneath it instead.
            2026-09-07, founder direction ("professional look... arrange
            text properly"): `lg:items-center` → `lg:items-start` — the
            trust points used to vertically centre against the paragraph,
            which looked off-balance once that paragraph grew (see below).
            The three trust points moved from bare stacked `text-label`
            lines to icon-chip rows, matching the hero's own benefit-chip
            treatment (components/HomeHeroLight.tsx) rather than reading
            as an unstyled afterthought next to a designed hero above it. */}
        <div className="relative mb-10 flex flex-col items-start gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-[560px] items-start gap-5">
            <div className="mt-1 hidden rounded-[10px] border border-[var(--color-line-strong)] p-2.5 text-[var(--color-primary)] sm:inline-flex">
              <GlyphTarget />
            </div>
            <div>
              <p className="text-label mb-2 text-[var(--color-primary)]">
                Free skill diagnostic
              </p>
              <h2 className="text-h1 mb-3">Not sure where you stand?</h2>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                The free diagnostic locates you across our capability areas
                and names your gaps in plain language — before you commit
                to anything.
              </p>
              <div className="mt-5">
                <Button href="/diagnostic" variant="secondary">
                  Free Diagnostic
                </Button>
              </div>
              {/* Fine print — split out from the pitch above it, 2026-09-07
                  ("arrange text properly"): this was one dense five-sentence
                  paragraph mixing the marketing pitch with account/fee
                  terms. Given its own smaller, fainter, top-bordered
                  treatment instead — the same "quieter note under a CTA"
                  pattern already used on components/signature/
                  DiagnosticStartCard.tsx and app/contact-us/page.tsx's
                  enquiry form, so this reads as a disclaimer, not more
                  pitch copy. Content is unchanged from the founder's own
                  wording; only the visual treatment split it out. */}
              <p className="mt-5 max-w-[480px] border-t border-[var(--color-line)] pt-4 text-body-sm text-[var(--color-ink-faint)]">
                The diagnostic itself is always free — no account needed. A
                Certificate of Attempt for a strong result is a separate,
                optional step: it needs a free account and a one-time USD
                10 fee. See &ldquo;Certificate of attempt&rdquo; on your
                result page for details. To attempt the 50, 100 or
                200-question diagnostics, click &ldquo;Free
                Diagnostic&rdquo; above.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:gap-6 lg:flex-col lg:gap-3">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[var(--color-primary)] shadow-sm">
                  <IconCheck />
                </span>
                <span className="text-label whitespace-nowrap">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider between the pitch and the live form — 2026-09-07,
            same "arrange text properly" direction: previously the form
            just started immediately below the intro with no visual break,
            which read as one unbroken block rather than two clear parts
            (pitch, then the actual diagnostic). */}
        <div className="mb-8 border-t border-[var(--color-line)]" />

        {stage === "insight" && (
          <Card variant="feature" className="relative mx-auto max-w-[560px] text-center">
            <p className="text-label mb-3">Calibrating</p>
            <p className="text-body-lg mb-6">{INSIGHT_CARD.text}</p>
            <Button onClick={dismissInsight}>Continue</Button>
          </Card>
        )}

        {stage === "question" && (
          <div className="relative">
            <div className="mb-6 flex justify-center">
              <span className="text-label inline-flex items-center rounded-full border border-[var(--color-line-strong)] bg-white px-4 py-1.5 text-[var(--color-ink-quiet)] shadow-sm">
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
            />
          </div>
        )}
      </div>
    </section>
  );
}
