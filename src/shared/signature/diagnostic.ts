/*
 * PORTED 2026-09-21 from project-artifacts/mockup/data/questions.ts
 * (the UI constants only — ADR-045). The ten questions themselves are NOT
 * here: they are seeded data, read through
 * `@/modules/catalogue/diagnostic/repository`. `data/results.ts`
 * (`selectFixture`, the canned A/B result fixtures) is NEVER-PORT
 * (MILESTONE_3_EXECUTION_PLAN §2.7, §9) and has no counterpart here.
 *
 * Shared by both diagnostic entry points — the homepage embed
 * (`@/shared/marketing/HomeDiagnostic`) and the standalone /diagnostic
 * pages — so they can never drift apart on copy or on the per-browser
 * storage contract.
 */

import type { DiagnosticQuestionRecord } from "@/modules/catalogue/diagnostic/repository";

/** The shape the signature components need from a question — a repository
 *  record satisfies it structurally. */
export type DiagnosticQuestion = Pick<DiagnosticQuestionRecord, "scenario" | "options">;

/** Appended by the UI as an equal, unpenalised option — never stored. */
export const UNSURE_OPTION = "I'm not sure";

/**
 * Mid-flow "calibrating" pause. The mockup's canned `text` ("You're reading
 * strongly on data modelling and pipeline reliability…") asserted a reading
 * of the visitor's answers that nothing computes, so it is NOT carried over;
 * both entry points render `insightText()` instead — a factual line built
 * from the question set itself. The position is kept.
 */
export const INSIGHT_CARD = {
  afterQuestionIndex: 5, // 1-indexed question number, matches §4 "roughly every 5"
};

/** Factual mid-flow copy: progress so far plus the capability areas the
 *  remaining questions cover — read from the question set, never from the
 *  answers. `remainingAreaNames` should already be de-duplicated, in order. */
export function insightText(answered: number, total: number, remainingAreaNames: string[]): string {
  return remainingAreaNames.length > 0
    ? `You've answered ${answered} of ${total}. The remaining questions look at how you reason about ${formatList(remainingAreaNames)}.`
    : `You've answered ${answered} of ${total}.`;
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Question-count tiers as published on the start card. Only the smallest
 * tier is backed by the seeded question set; the others render as
 * "(soon)" and are not backed by a question bank.
 *
 * ⚠ Named tiers on a paid certificate sit in tension with DR-01 ("one
 * credential, no ladder, no bands"). Carried over from the mockup as
 * founder-reviewed copy; flagged for founder review, not resolved here.
 */
export const QUESTION_COUNT_TIERS = [
  { count: 10, tier: "Basic" },
  { count: 50, tier: "Associate" },
  { count: 100, tier: "Professional" },
  { count: 200, tier: "Master" },
] as const;

/*
 * Per-browser storage (UI continuity only — never authoritative, never a
 * business record; CLAUDE.md persistence rule: preferences and in-progress
 * UI state may live client-side, product data may not). Keys renamed from
 * the mockup's `mockup:` prefix on port, as `p4tc:theme` was.
 */

/** In-progress answers, so a walkthrough started on the homepage can be
 *  resumed on /diagnostic and vice versa. */
export const DIAGNOSTIC_PROGRESS_STORAGE_KEY = "p4tc:diagnostic:in-progress";

/** The completed answers handed from the walkthrough to /diagnostic/result
 *  (which renders an honest per-area summary of them — plan §6.5). */
export const DIAGNOSTIC_RESULT_STORAGE_KEY = "p4tc:diagnostic:completed";

export type SavedProgress = {
  index: number;
  answers: (string | null)[];
};

export type CompletedAnswer = {
  code: string;
  domainCode: string;
  domainName: string;
  scenario: string;
  selected: string | null;
};

export type CompletedDiagnostic = {
  completedAt: string;
  answers: CompletedAnswer[];
};

/** Best-effort read of the completed walkthrough; `null` when absent,
 *  unreadable or malformed. */
export function readCompletedDiagnostic(): CompletedDiagnostic | null {
  try {
    const raw = window.localStorage.getItem(DIAGNOSTIC_RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as CompletedDiagnostic).answers)
    ) {
      return parsed as CompletedDiagnostic;
    }
    return null;
  } catch {
    return null;
  }
}
