import { randomInt } from "node:crypto";
import { MIN_PRIVATE_ROLE_QUESTIONS, ROLE_TEST_TIME_LIMIT_MS } from "./constants";

/*
 * The role tests' PURE rules (CR-2026-10-01-1711): no database, no framework —
 * the repositories, the pages and the tests share ONE definition.
 *
 *   - A test = ALL of the organisation's approved questions for the role (a
 *     random subset when there are more than `cap`, 20) + random shared-bank
 *     questions up to `size` (100), shuffled, no duplicates. Without an
 *     organisation it is the shared bank only. A fresh draw every attempt.
 *   - Time limit 90 minutes from `started_at` — DERIVED (no column).
 *   - Percentage = score × 100 / size, rounded DOWN. No pass mark, no grade.
 */

export type RandomInt = (maxExclusive: number) => number;

/** Fisher–Yates; returns a NEW array. */
function shuffled<T>(items: readonly T[], random: RandomInt): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = random(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** The question ids of ONE test. `random` is injectable (default: crypto `randomInt`). */
export function selectQuestionIds(input: {
  organisationQuestionIds: readonly string[];
  sharedQuestionIds: readonly string[];
  size: number;
  cap: number;
  random?: RandomInt;
}): string[] {
  const random = input.random ?? randomInt;
  const size = Math.max(0, Math.floor(input.size));
  const cap = Math.max(0, Math.floor(input.cap));
  const own = [...new Set(input.organisationQuestionIds)];
  const ownSet = new Set(own);
  const shared = [...new Set(input.sharedQuestionIds)].filter((id) => !ownSet.has(id));
  const ownTake = Math.min(own.length, cap, size);
  const chosenOwn = own.length > ownTake ? shuffled(own, random).slice(0, ownTake) : own;
  const fill = shuffled(shared, random).slice(0, Math.max(0, size - chosenOwn.length));
  return shuffled([...chosenOwn, ...fill], random);
}

/** Whole-number percentage, rounded DOWN. */
export function percentOf(score: number, size: number): number {
  if (!(size > 0) || !Number.isFinite(score)) return 0;
  return Math.floor((score * 100) / size);
}

/** The moment the attempt's time is up (derived — nothing is stored). */
export function attemptDeadline(startedAt: Date): Date {
  return new Date(startedAt.getTime() + ROLE_TEST_TIME_LIMIT_MS);
}

/** True from the deadline itself onward. */
export function isExpired(startedAt: Date, now: Date): boolean {
  return now.getTime() >= attemptDeadline(startedAt).getTime();
}

export type BreakdownItem = { category: string; correct: boolean };
export type CategoryScore = { category: string; correct: number; total: number };

/** Correct / total per category, categories in alphabetical order. */
export function categoryBreakdown(items: readonly BreakdownItem[]): CategoryScore[] {
  const by = new Map<string, CategoryScore>();
  for (const it of items) {
    const row = by.get(it.category) ?? { category: it.category, correct: 0, total: 0 };
    row.total += 1;
    if (it.correct) row.correct += 1;
    by.set(it.category, row);
  }
  return [...by.values()].sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Is a role listed (shown to people as a card)? The role must be published.
 *  - A SHARED role: when the shared bank has reviewed questions OR the
 *    organisation has approved questions for it (organisation mode).
 *  - An organisation's PRIVATE role: only with at least
 *    `MIN_PRIVATE_ROLE_QUESTIONS` (10) approved questions of that organisation.
 */
export function isRoleListed(input: { isPrivate: boolean; published: boolean; reviewedSharedCount: number; approvedOrganisationCount: number }): boolean {
  if (!input.published) return false;
  if (input.isPrivate) return input.approvedOrganisationCount >= MIN_PRIVATE_ROLE_QUESTIONS;
  return input.reviewedSharedCount > 0 || input.approvedOrganisationCount > 0;
}
