"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticQuestionCanvas } from "@/components/signature/DiagnosticQuestionCanvas";
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
 */

const STORAGE_KEY = "mockup:diagnostic:in-progress";

type SavedProgress = {
  index: number;
  answers: (string | null)[];
};

export default function DiagnosticPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => Array(questions.length).fill(null) as (string | null)[],
  );
  const [showInsight, setShowInsight] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Resume in-progress answers, if any (spec: "resumed" state on P05).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedProgress = JSON.parse(raw);
        if (Array.isArray(saved.answers) && saved.answers.length === questions.length) {
          setAnswers(saved.answers);
          setIndex(Math.min(saved.index, questions.length - 1));
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
      setShowInsight(true);
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    persist(nextIndex, answers);
  };

  const dismissInsight = () => {
    setShowInsight(false);
    const nextIndex = index + 1;
    setIndex(nextIndex);
    persist(nextIndex, answers);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-[var(--color-line)] px-6 py-4">
        <div className="mx-auto flex max-w-[640px] items-center justify-between">
          {/* The diagnostic runs in its own stripped-back shell, not
              PublicShell, so it needs the `wordmark` class explicitly —
              otherwise this is the only place in the portal where the brand
              is set in the interface sans rather than the serif. */}
          <Link href="/" className="wordmark">
            Data &amp; AI Academy
          </Link>
          <p className="text-label">
            Question {index + 1} of ~{questions.length}
          </p>
          <Link href="/" className="text-body-sm text-[var(--color-ink-quiet)] underline underline-offset-4">
            Save &amp; exit
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        {showInsight ? (
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
          />
        )}
      </main>
    </div>
  );
}
