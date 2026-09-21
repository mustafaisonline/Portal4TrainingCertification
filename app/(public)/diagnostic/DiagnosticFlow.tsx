"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticQuestionCanvas } from "@/shared/signature/DiagnosticQuestionCanvas";
import { DiagnosticStartCard } from "@/shared/signature/DiagnosticStartCard";
import { DiagnosticIllustration, DiagnosticTrustCard } from "@/shared/signature/DiagnosticIntro";
import {
  DIAGNOSTIC_PROGRESS_STORAGE_KEY,
  DIAGNOSTIC_RESULT_STORAGE_KEY,
  INSIGHT_CARD,
  type CompletedDiagnostic,
  type SavedProgress,
} from "@/shared/signature/diagnostic";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/diagnostic/page.tsx (ADR-045)
 * Changed: the mockup page's client walkthrough (idle → question → insight →
 * finish), now fed `questions` by the server page instead of importing a
 * hardcoded list. Storage keys come from the shared `@/shared/signature/
 * diagnostic` contract (`p4tc:…`, formerly `mockup:…`). On finish the raw
 * answers are written to the shared completed-diagnostic record and the
 * visitor is sent to /diagnostic/result — the mockup's canned
 * `selectFixture(unsureCount)` routing is NOT ported. The mid-flow insight
 * card's canned copy (`INSIGHT_CARD.text`, "You're reading strongly on data
 * modelling…") asserted a reading of the visitor's answers that nothing
 * computes, so it is replaced by a factual line derived from the remaining
 * questions' capability areas; its position (`afterQuestionIndex`) is kept.
 * Own `<PublicShell>` wrapper dropped.
 */

/**
 * P05 — Free Skill Diagnostic (§4). Full `PublicShell` chrome (founder
 * direction 2026-09-07), with the progress indicator and "Save & exit" link
 * in their own slim bar beneath the main header, only while `stage !== "idle"`.
 *
 * localStorage boundary: temporary, resumable in-progress answers and the
 * completed hand-off to the result page, purely for UX continuity. Never
 * read as an authoritative source of truth anywhere else, and it holds no
 * business rule or computed result — only the raw answers. Clearing it
 * loses nothing but an unfinished attempt or an unviewed summary.
 */

export type DiagnosticFlowQuestion = {
  code: string;
  scenario: string;
  options: string[];
  domainCode: string;
  domainName: string;
};

type Stage = "idle" | "question" | "insight";

export function DiagnosticFlow({ questions }: { questions: DiagnosticFlowQuestion[] }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => Array(questions.length).fill(null) as (string | null)[],
  );
  const [hydrated, setHydrated] = useState(false);

  // Resume in-progress answers, if any (spec: "resumed" state on P05).
  // Only a genuine in-progress attempt (at least one real answer) skips the
  // idle stage — a fresh visitor still sees it, even if a stale all-null
  // record exists in storage.
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
            setStage("question");
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
        JSON.stringify({ index: nextIndex, answers: nextAnswers } satisfies SavedProgress),
      );
    } catch {
      // Best-effort only — the walkthrough still works without it.
    }
  };

  if (!hydrated) return null;

  const current = questions[index];
  const selected = answers[index] ?? null;

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
      const completed: CompletedDiagnostic = {
        completedAt: new Date().toISOString(),
        answers: questions.map((q, i) => ({
          code: q.code,
          domainCode: q.domainCode,
          domainName: q.domainName,
          scenario: q.scenario,
          selected: answers[i] ?? null,
        })),
      };
      try {
        window.localStorage.setItem(DIAGNOSTIC_RESULT_STORAGE_KEY, JSON.stringify(completed));
        window.localStorage.removeItem(DIAGNOSTIC_PROGRESS_STORAGE_KEY);
      } catch {
        // Best-effort only — the result page says plainly when it finds nothing.
      }
      router.push("/diagnostic/result");
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

  // "Cancel test": distinct from "Save & exit" — this discards the
  // in-progress answers rather than preserving them for resume, and lands
  // back on this page's own idle stage.
  const handleCancel = () => {
    if (!window.confirm("Cancel this diagnostic? Your answers so far will be discarded.")) {
      return;
    }
    try {
      window.localStorage.removeItem(DIAGNOSTIC_PROGRESS_STORAGE_KEY);
    } catch {
      // Best-effort only.
    }
    setAnswers(Array(questions.length).fill(null) as (string | null)[]);
    setIndex(0);
    setStage("idle");
  };

  // Factual mid-flow copy: the capability areas the remaining questions
  // cover, read from the question set itself — no reading of the answers.
  const remainingAreas = Array.from(new Set(questions.slice(index + 1).map((q) => q.domainName)));
  const insightText =
    remainingAreas.length > 0
      ? `You've answered ${index + 1} of ${questions.length}. The remaining questions look at how you reason about ${formatList(remainingAreas)}.`
      : `You've answered ${index + 1} of ${questions.length}.`;

  return (
    <div
      className="night relative overflow-hidden"
      style={{
        background:
          "radial-gradient(55% 90% at 12% 25%, rgba(37,99,235,0.26), transparent 70%), radial-gradient(40% 70% at 92% 80%, rgba(34,211,238,0.09), transparent 70%), linear-gradient(180deg, #071a35 0%, #061226 100%)",
      }}
    >
      {stage !== "idle" && (
        <div className="relative border-b border-[var(--color-line)] bg-[var(--color-ground-raised)]/70 px-6 py-2.5 backdrop-blur">
          <div className="mx-auto flex max-w-[900px] items-center justify-between">
            <p className="text-label">
              Question {index + 1} of ~{questions.length}
            </p>
            <Link href="/" className="text-body-sm text-[var(--color-ink-quiet)] underline underline-offset-4">
              Save &amp; exit
            </Link>
          </div>
        </div>
      )}

      <div className="relative flex items-center justify-center px-6 py-16">
        {stage === "idle" ? (
          <div className="flex w-full max-w-[900px] flex-col gap-10">
            <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex max-w-[520px] items-start gap-5">
                <div className="hidden sm:block">
                  <DiagnosticIllustration />
                </div>
                <div>
                  <p className="text-label mb-2 text-[var(--color-primary)]">Free skill diagnostic</p>
                  <h1 className="text-h1 mb-2">Not sure where you stand?</h1>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    The free diagnostic locates you across our capability areas and names your gaps in plain
                    language — before you commit to anything.
                  </p>
                </div>
              </div>
              <DiagnosticTrustCard className="sm:w-[280px]" />
            </div>
            <DiagnosticStartCard onStart={handleStart} />
          </div>
        ) : stage === "insight" ? (
          <Card variant="feature" className="mx-auto max-w-[560px] text-center">
            <p className="text-label mb-3">Halfway there</p>
            <p className="text-body-lg mb-6">{insightText}</p>
            <Button onClick={dismissInsight}>Continue</Button>
          </Card>
        ) : current ? (
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
        ) : null}
      </div>
    </div>
  );
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
