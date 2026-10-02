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
  type DrawnDiagnosticQuestion,
  type SavedProgress,
} from "@/shared/signature/diagnostic";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { drawDiagnosticQuestionsAction } from "./actions";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/diagnostic/page.tsx
 * (ADR-045); REWIRED 2026-09-28 (founder's "New change" item 1): the
 * walkthrough no longer receives a fixed question list from the server page.
 * Pressing Start calls `drawDiagnosticQuestionsAction`, which draws a fresh
 * random ten from the reviewed Free Learning question bank — so every start
 * is a genuinely new set. The resumable per-browser record therefore carries
 * its own drawn set (`SavedProgress.questions`); an old record without one
 * cannot be matched to any set and is not resumed. On finish the raw answers
 * still go to /free-learning/diagnostic/result through the shared
 * per-browser record — nothing is saved server-side, unchanged.
 */

/**
 * P05 — Free Skill Diagnostic (§4). Full `PublicShell` chrome (founder
 * direction 2026-09-07), with the progress indicator and "Save & exit" link
 * in their own slim bar beneath the main header, only while `stage !== "idle"`.
 *
 * localStorage boundary: temporary, resumable in-progress answers (with the
 * drawn set they belong to) and the completed hand-off to the result page,
 * purely for UX continuity. Never read as an authoritative source of truth
 * anywhere else, and it holds no business rule or computed result — only
 * public questions and the raw answers. Clearing it loses nothing but an
 * unfinished attempt or an unviewed summary.
 */

export type DiagnosticFlowQuestion = DrawnDiagnosticQuestion;

type Stage = "idle" | "question" | "insight";

function isDrawnSet(value: unknown): value is DrawnDiagnosticQuestion[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (q) =>
        typeof q === "object" &&
        q !== null &&
        typeof (q as DrawnDiagnosticQuestion).code === "string" &&
        typeof (q as DrawnDiagnosticQuestion).scenario === "string" &&
        Array.isArray((q as DrawnDiagnosticQuestion).options) &&
        typeof (q as DrawnDiagnosticQuestion).domainName === "string",
    )
  );
}

export function DiagnosticFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [questions, setQuestions] = useState<DiagnosticFlowQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startFailed, setStartFailed] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  // Resume an in-progress draw, if any (spec: "resumed" state on P05).
  // Only a genuine in-progress attempt — its own drawn set plus at least one
  // real answer — skips the idle stage; anything else starts fresh.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DIAGNOSTIC_PROGRESS_STORAGE_KEY);
      if (raw) {
        const saved: SavedProgress = JSON.parse(raw);
        if (
          isDrawnSet(saved.questions) &&
          Array.isArray(saved.answers) &&
          saved.answers.length === saved.questions.length &&
          saved.answers.some((a) => a !== null)
        ) {
          setQuestions(saved.questions);
          setAnswers(saved.answers);
          setIndex(Math.min(saved.index, saved.questions.length - 1));
          setStage("question");
        }
      }
    } catch {
      // Corrupt or unavailable storage — start fresh. Never authoritative.
    }
    setHydrated(true);
  }, []);

  const persist = (nextIndex: number, nextAnswers: (string | null)[], set: DiagnosticFlowQuestion[]) => {
    try {
      window.localStorage.setItem(
        DIAGNOSTIC_PROGRESS_STORAGE_KEY,
        JSON.stringify({ index: nextIndex, answers: nextAnswers, questions: set } satisfies SavedProgress),
      );
    } catch {
      // Best-effort only — the walkthrough still works without it.
    }
  };

  if (!hydrated) return null;

  const current = questions?.[index];
  const selected = answers[index] ?? null;

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    setStartFailed(false);
    try {
      const result = await drawDiagnosticQuestionsAction();
      if (!result.ok) {
        setStartFailed(true);
        return;
      }
      setQuestions(result.questions);
      setAnswers(Array(result.questions.length).fill(null) as (string | null)[]);
      setIndex(0);
      setStage("question");
    } catch {
      setStartFailed(true);
    } finally {
      setStarting(false);
    }
  };

  const handleSelect = (option: string) => {
    if (!questions) return;
    const next = [...answers];
    next[index] = option;
    setAnswers(next);
    persist(index, next, questions);
  };

  const handleBack = () => {
    if (index === 0 || !questions) return;
    const prevIndex = index - 1;
    setIndex(prevIndex);
    persist(prevIndex, answers, questions);
  };

  const handleContinue = () => {
    if (!questions) return;
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
          correct: q.correct ?? null,
        })),
      };
      try {
        window.localStorage.setItem(DIAGNOSTIC_RESULT_STORAGE_KEY, JSON.stringify(completed));
        window.localStorage.removeItem(DIAGNOSTIC_PROGRESS_STORAGE_KEY);
      } catch {
        // Best-effort only — the result page says plainly when it finds nothing.
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
    persist(nextIndex, answers, questions);
  };

  const dismissInsight = () => {
    if (!questions) return;
    setStage("question");
    const nextIndex = index + 1;
    setIndex(nextIndex);
    persist(nextIndex, answers, questions);
  };

  // "Cancel test": distinct from "Save & exit" — this discards the
  // in-progress answers (and their drawn set) rather than preserving them
  // for resume, and lands back on this page's own idle stage. The next
  // start draws a brand-new set. Confirmed through the portal's own dialog,
  // never window.confirm (founder, 2026-09-28).
  const handleCancel = () => setConfirmingCancel(true);
  const confirmCancel = () => {
    setConfirmingCancel(false);
    try {
      window.localStorage.removeItem(DIAGNOSTIC_PROGRESS_STORAGE_KEY);
    } catch {
      // Best-effort only.
    }
    setQuestions(null);
    setAnswers([]);
    setIndex(0);
    setStage("idle");
  };

  // Factual mid-flow copy: the topics the remaining questions come from,
  // read from the drawn set itself — no reading of the answers.
  const remainingAreas = questions ? Array.from(new Set(questions.slice(index + 1).map((q) => q.domainName))) : [];
  const insightText = questions
    ? remainingAreas.length > 0
      ? `You've answered ${index + 1} of ${questions.length}. The remaining questions come from ${formatList(remainingAreas)}.`
      : `You've answered ${index + 1} of ${questions.length}.`
    : "";

  return (
    <div
      className="night relative overflow-hidden"
      style={{
        background:
          "radial-gradient(55% 90% at 12% 25%, rgba(37,99,235,0.26), transparent 70%), radial-gradient(40% 70% at 92% 80%, rgba(34,211,238,0.09), transparent 70%), linear-gradient(180deg, #071a35 0%, #061226 100%)",
      }}
    >
      {stage !== "idle" && questions && (
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
                    Ten questions, drawn fresh from the Knowledge Hub&rsquo;s question bank every time you
                    start — a quick check of basic data and AI concepts before you commit to anything.
                  </p>
                  {/* Founder direction 2026-09-27 (M14 item C): nothing is saved. */}
                  <p className="text-body-sm mt-3 text-[var(--color-ink-faint)]" data-testid="diagnostic-not-saved">
                    Free, no account needed — and your answers stay in your browser: we do not save your diagnostic results.
                  </p>
                  {startFailed && (
                    <p className="text-body-sm mt-3 text-[var(--color-ink)]" data-testid="diagnostic-start-failed" role="alert">
                      The questions could not be loaded just now. Please try again.
                    </p>
                  )}
                </div>
              </div>
              <DiagnosticTrustCard className="sm:w-[280px]" />
            </div>
            <DiagnosticStartCard onStart={() => void handleStart()} />
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
      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this diagnostic?"
        body="Your answers so far will be discarded. The next start draws a fresh set of questions."
        confirmLabel="Cancel the test"
        cancelLabel="Keep going"
        onConfirm={confirmCancel}
        onCancel={() => setConfirmingCancel(false)}
      />
    </div>
  );
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
