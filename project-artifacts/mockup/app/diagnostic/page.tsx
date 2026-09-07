"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticQuestionCanvas } from "@/components/signature/DiagnosticQuestionCanvas";
import { DiagnosticStartCard } from "@/components/signature/DiagnosticStartCard";
import {
  DiagnosticIllustration,
  DiagnosticTrustCard,
} from "@/components/signature/DiagnosticIntro";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  INSIGHT_CARD,
  questions,
  UNSURE_OPTION,
} from "@/data/questions";
import { selectFixture } from "@/data/results";

/**
 * P05 — Free Skill Diagnostic (§4). Originally full-screen "focus mode" —
 * no global nav, just logo + honest progress + Save & exit, per the spec.
 *
 * FOCUS MODE REVERSED — 2026-09-07, founder direction ("bring portal
 * header menu on this page as well"): the reduced, nav-less header is
 * replaced with the full `PublicShell` chrome (primary nav, Sign in,
 * Explore courses CTA, footer) used by every other public page — this
 * page no longer reads as an isolated flow disconnected from the rest of
 * the site. The progress indicator and "Save & exit" link are NOT
 * dropped — nothing here removes functionality that existed — they now
 * render as their own slim bar directly beneath the main header, still
 * only while `stage !== "idle"`, same condition as before.
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
 *
 * REDESIGNED 2026-09-07, founder direction ("match it with portal theme")
 * — this page predated the visual pass components/HomeDiagnostic.tsx went
 * through the same day (soft gradient background, the gauge illustration,
 * the trust-points card, a wider/rounder question card) and had fallen
 * visibly behind it: a bare icon-in-box, three unstyled `text-label`
 * bullets, a flat white background, no shadow anywhere. Brought in line:
 * - Background: same soft radial-gradient-on-pale-lavender treatment as
 *   the homepage section, applied to this page's own wrapper.
 * - Idle stage: `GlyphTarget` + the three bare bullets replaced by
 *   `DiagnosticIllustration` + `DiagnosticTrustCard` — the exact shared
 *   components the homepage now uses (see DiagnosticIntro.tsx's own
 *   header comment for why these were extracted to be shared rather than
 *   duplicated a second time). `DiagnosticStartCard` below is untouched
 *   (content/logic already shared and out of scope here).
 * - Question/insight stage: `DiagnosticQuestionCanvas` now gets the same
 *   `cardClassName`/`cardStyle` widening (860px, 22px radius) the
 *   homepage embed already uses, via the props added to that component
 *   for exactly this purpose.
 * Content and functionality are unchanged — tier selector, Start button,
 * Save & exit, Cancel test, resume-in-progress, all identical to before.
 */

const STORAGE_KEY = "mockup:diagnostic:in-progress";

type SavedProgress = {
  index: number;
  answers: (string | null)[];
};

type Stage = "idle" | "question" | "insight";

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
    <PublicShell>
      <div className="relative overflow-hidden bg-[#eef2fc]">
        {/* Soft background gradient — same treatment as the homepage's
            "Not sure where you stand?" section (components/HomeDiagnostic.tsx),
            added 2026-09-07 so this page reads as the same product rather
            than a flat-white outlier once you click through. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(85% 130% at 25% 20%, rgba(47,95,224,0.06), transparent 75%)",
          }}
        />
        {/* Progress + Save & exit — moved 2026-09-07 from this page's own
            (now-removed) header into a slim bar beneath PublicShell's main
            nav. Same condition as before (`stage !== "idle"`), same two
            pieces of content, same behaviour — only the surrounding chrome
            changed. Not sticky: PublicShell's own header already is, and
            two stacked sticky bars is more than this needs. */}
        {stage !== "idle" && (
          <div className="relative border-b border-[var(--color-line)] bg-white/70 px-6 py-2.5 backdrop-blur">
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
            {/* Two-column layout — identical shared pieces to the
                homepage's embed (DiagnosticIllustration, DiagnosticTrustCard):
                see this file's header comment. The three plain-text bullets
                that used to sit here are gone, not lost — DiagnosticTrustCard
                carries the same three points plus the description line each
                one already has on the homepage. */}
            <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex max-w-[520px] items-start gap-5">
                <div className="hidden sm:block">
                  <DiagnosticIllustration />
                </div>
                <div>
                  <p className="text-label mb-2 text-[var(--color-primary)]">
                    Free skill diagnostic
                  </p>
                  <h1 className="text-h1 mb-2">Not sure where you stand?</h1>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    The free diagnostic locates you across our capability
                    areas and names your gaps in plain language — before you
                    commit to anything.
                  </p>
                </div>
              </div>
              <DiagnosticTrustCard className="sm:w-[280px]" />
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
            cardClassName="max-w-[860px]"
            cardStyle={{ borderRadius: "22px" }}
          />
        )}
        </div>
      </div>
    </PublicShell>
  );
}
