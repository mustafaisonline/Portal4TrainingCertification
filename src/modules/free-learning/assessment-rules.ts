/*
 * The Free Assessment Check's rules — PURE (no database, no framework), so the
 * repository, the pages, the certificate and the tests share ONE definition.
 * Founder decisions of 2026-09-30 (modification.md §0b/§0c: D2, D5, D6, D7,
 * A2, A4):
 *
 *   - ONE size: 200 questions, drawn fresh from the whole reviewed bank.
 *   - ONE time limit: 3 hours from `started_at` — DERIVED (no column); the
 *     server is the authority (see `knowledge-check.repository.ts`).
 *   - Pass mark 60 %. Grades from the WHOLE-NUMBER percentage, rounded DOWN:
 *       Charlie 60–70 %  ·  Bravo 71–80 %  ·  Alpha 81–100 %  ·  below 60 % none.
 *     Of 200 questions: Charlie 120–141, Bravo 142–161, Alpha 162–200.
 *   - A grade is DERIVED from score and size, never stored.
 *
 * OLD RESULTS (D7). Attempts finished before this change keep exactly what was
 * issued: their size (50 / 100 / 200), their stored `passed` (decided at the old
 * 70 % mark) and no grade. The rule that tells old from new is the attempt's
 * SIZE — no new column is possible or needed:
 *     size === 200  → the current rules (60 % pass mark, graded);
 *     any other size → the legacy rules (70 % pass mark, never graded).
 * A legacy 200-question result that passed at 70 % therefore also shows the
 * grade its score earns (Charlie/Bravo/Alpha all lie within 70–100 %); one that
 * failed at 70 % stays failed — the stored `passed` is never recomputed.
 */

/** The one assessment size. */
export const ASSESSMENT_SIZE = 200;
export const ASSESSMENT_SIZES = [ASSESSMENT_SIZE] as const;

/** Three hours, in milliseconds. */
export const ASSESSMENT_TIME_LIMIT_MS = 3 * 60 * 60 * 1000;

/** The pass mark of the current rules (size 200). */
export const ASSESSMENT_PASS_PERCENT = 60;
/** The pass mark results of the earlier sizes (50 / 100) were decided at. */
export const LEGACY_PASS_PERCENT = 70;

export type AssessmentGrade = "charlie" | "bravo" | "alpha";

export const ASSESSMENT_GRADES: readonly AssessmentGrade[] = ["charlie", "bravo", "alpha"];

/** Inclusive whole-number percentage bands. */
export const ASSESSMENT_GRADE_BANDS: Record<AssessmentGrade, { name: string; min: number; max: number; band: string }> = {
  charlie: { name: "Charlie", min: 60, max: 70, band: "60–70 %" },
  bravo: { name: "Bravo", min: 71, max: 80, band: "71–80 %" },
  alpha: { name: "Alpha", min: 81, max: 100, band: "81–100 %" },
};

export function isAssessmentGrade(value: unknown): value is AssessmentGrade {
  return value === "charlie" || value === "bravo" || value === "alpha";
}

/** Whole-number percentage, rounded DOWN (70.5 % is 70 %; 80.5 % is 80 %). */
export function percentOf(score: number, size: number): number {
  if (!(size > 0) || !Number.isFinite(score)) return 0;
  return Math.floor((score * 100) / size);
}

/** The pass mark that applies to an attempt of this size (D7). */
export function passMarkPercent(size: number): number {
  return size === ASSESSMENT_SIZE ? ASSESSMENT_PASS_PERCENT : LEGACY_PASS_PERCENT;
}

/** Pure grade of a score: below the pass mark (60 %) there is none. */
export function assessmentGrade(score: number, size: number): AssessmentGrade | null {
  const pct = percentOf(score, size);
  if (pct >= ASSESSMENT_GRADE_BANDS.alpha.min) return "alpha";
  if (pct >= ASSESSMENT_GRADE_BANDS.bravo.min) return "bravo";
  if (pct >= ASSESSMENT_GRADE_BANDS.charlie.min) return "charlie";
  return null;
}

/** The grade a STORED result shows: only a passed result of the current size
 *  (200) carries one; a legacy size never does (D7). */
export function gradeOfResult(r: { score: number | null; size: number; passed: boolean | null }): AssessmentGrade | null {
  if (r.passed !== true || r.score === null || r.size !== ASSESSMENT_SIZE) return null;
  return assessmentGrade(r.score, r.size);
}

/** "Alpha · 81–100 %" — the grade line's text (the certificate upper-cases it). */
export function gradeLabel(grade: AssessmentGrade): { name: string; band: string } {
  const b = ASSESSMENT_GRADE_BANDS[grade];
  return { name: b.name, band: b.band };
}

/** The inclusive score range earning `grade` on `size` questions (used to
 *  filter by grade in the database). Charlie 120–141, Bravo 142–161, Alpha
 *  162–200 of 200. */
export function gradeScoreRange(grade: AssessmentGrade, size: number = ASSESSMENT_SIZE): { min: number; max: number } {
  const b = ASSESSMENT_GRADE_BANDS[grade];
  const min = Math.ceil((b.min * size) / 100);
  const max = Math.min(size, Math.ceil(((b.max + 1) * size) / 100) - 1);
  return { min, max };
}

/** The moment the attempt's time is up (derived — nothing is stored). */
export function attemptDeadline(startedAt: Date): Date {
  return new Date(startedAt.getTime() + ASSESSMENT_TIME_LIMIT_MS);
}

/** True from the deadline itself onward. */
export function isAttemptExpired(startedAt: Date, now: Date): boolean {
  return now.getTime() >= attemptDeadline(startedAt).getTime();
}
