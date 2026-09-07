"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticQuestionCanvas } from "@/components/signature/DiagnosticQuestionCanvas";
import { DiagnosticStartCard } from "@/components/signature/DiagnosticStartCard";
import { LogoMark } from "@/components/PublicShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  INSIGHT_CARD,
  questions,
  UNSURE_OPTION,
} from "@/data/questions";
import { selectFixture } from "@/data/results";

/**
 * P05 — Free Skill Diagnostic (§4). Full-screen focus mode: no global nav,
 * just logo + honest progress + Save & exit, per the spec.
 *
 * localStorage boundary (approval message, adjustment #3): this is the ONE
 * approved use of localStorage in this milestone — temporary, resumable
 * in-progress answers, purely for prototype UX continuity. It is never read
 * as an authoritative source of truth anywhere else, and it holds no
 * business rule or computed result — only the raw answers.
 *
 * IDLE LANDING STAGE — added 2026-09-06, founder direction: this page used
 * to drop a visitor straight into question 1 with no context at all. It now
 * shows the same "Not sure where you stand?" framing as the homepage's
 * embedded diagnostic (components/HomeDiagnostic.tsx) before starting —
 * heading, the three honest bullets, and `DiagnosticStartCard` (tier
 * selector, Start button, the Certificate-of-Attempt disclaimer), the last
 * of which is a SHARED component so this page and the homepage can never
 * drift apart on that content. Unlike the homepage, clicking a 50/100/200
 * tier here does nothing (`onUnavailableTier` omitted) — there is nowhere
 * further to send a visitor who is already on the dedicated page.
 * Resuming an in-progress attempt (existing behaviour, unchanged) skips
 * straight past this stage into "question", same as before.
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

export default function DiagnosticPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => Array(questions.length).fill(null) as (string | null)[],
  );
  const [hydrated, setHydrated] = useState(false);

  // Resume in-progress answers, if any (spec: "resumed" state on P05).
  // Only a genuine in-progress attempt (at least one real answer) skips the
  // new idle stage — a fresh visitor still sees it, even if a stale
  // all-null record exists in storage.
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

  // "Cancel test" (2026-09-05 founder request): distinct from "Save & exit"
  // above — this discards the in-progress answers rather than preserving
  // them for resume. Shared with components/HomeDiagnostic.tsx via the same
  // DiagnosticQuestionCanvas; see that component's header comment.
  //
  // 2026-09-06, founder direction: stays on THIS page (returns to its own
  // idle stage) rather than navigating to "/" — this page didn't have an
  // idle stage to return to when that behaviour was first written; now
  // that it does, cancelling here should land back here, same as
  // HomeDiagnostic's handleCancel already does on the homepage.
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
    <div className="flex min-h-dvh flex-col">
      {/* 2026-09-06, founder direction: this header was a plain light bar —
          every other page opened with the site's dark-navy masthead
          (PublicShell) at the time, so this one read as a different,
          disconnected product. Given the same `night` scope + translucent
          navy background + LogoMark as PublicShell's header (imported
          from there so the mark can't drift into a second version), while
          keeping the deliberately reduced content (logo + progress +
          Save & exit only, no full nav, no CTA) — that reduction is
          "focus mode," not the theme mismatch that needed fixing.
          LATER THE SAME DAY, light-theme propagation: `.night` removed —
          PublicShell's header is light now too, so this still matches it,
          just at the new colour. See components/HomeHeroLight.tsx's
          header comment for the redesign this follows. */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-white/90 px-6 py-3.5 backdrop-blur">
        <div className="mx-auto flex max-w-[640px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="wordmark">Data &amp; AI Academy</span>
          </Link>
          {/* Progress and Save & exit only mean something once a walkthrough
              is actually underway — hidden on the new idle stage rather than
              showing "Question 1 of ~10" before anything has started. */}
          {stage !== "idle" && (
            <>
              <p className="text-label">
                Question {index + 1} of ~{questions.length}
              </p>
              <Link href="/" className="text-body-sm text-[var(--color-ink-quiet)] underline underline-offset-4">
                Save &amp; exit
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        {stage === "idle" ? (
          <div className="flex w-full max-w-[640px] flex-col gap-8">
            <div className="flex items-start gap-5">
              <div className="mt-1 hidden rounded-[10px] border border-[var(--color-line-strong)] p-2.5 text-[var(--color-primary)] sm:inline-flex">
                <GlyphTarget />
              </div>
              <div>
                <p className="text-label mb-2 text-[var(--color-primary)]">
                  Free skill diagnostic
                </p>
                <h1 className="text-h1 mb-2">Not sure where you stand?</h1>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  The free diagnostic locates you across our capability areas
                  and names your gaps in plain language — before you commit
                  to anything.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <p className="text-label">Free · no account to start</p>
              <p className="text-label">Named gaps, not a score</p>
              <p className="text-label">No commitment</p>
            </div>
            <DiagnosticStartCard onStart={handleStart} />
          </div>
        ) : stage === "insight" ? (
          <Card variant="feature" className="mx-auto max-w-[560px] text-center">
            <p className="text-label mb-3">Calibrating</p>
            <p className="text-body-lg mb-6">{INSIGHT_CARD.text}</p>
            <Button onClick={dismissInsight}>Continue</Button>
          </Card>
        ) : (
          <DiagnosticQuestionCanvas
            question={current}
            selected={selected}
            onSelect={handleSelect}
            onBack={handleBack}
            onContinue={handleContinue}
            canGoBack={index > 0}
            onCancel={handleCancel}
          />
        )}
      </main>
    </div>
  );
}
