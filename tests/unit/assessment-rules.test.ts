import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_GRADE_BANDS,
  ASSESSMENT_SIZE,
  ASSESSMENT_TIME_LIMIT_MS,
  assessmentGrade,
  attemptDeadline,
  gradeLabel,
  gradeOfResult,
  gradeScoreRange,
  isAttemptExpired,
  passMarkPercent,
  percentOf,
} from "@/modules/free-learning/assessment-rules";

/*
 * The Free Assessment Check's pure rules (founder, 2026-09-30; modification.md
 * D2, D6, D7, A2, A4): the whole-number percentage is rounded DOWN and banded
 * Charlie 60–70 / Bravo 71–80 / Alpha 81–100, below 60 nothing; of 200
 * questions that is Charlie 120–141, Bravo 142–161, Alpha 162–200. The time
 * limit is exactly three hours from the start.
 */
describe("assessmentGrade", () => {
  it("is exactly 200 questions in 3 hours", () => {
    expect(ASSESSMENT_SIZE).toBe(200);
    expect(ASSESSMENT_TIME_LIMIT_MS).toBe(10_800_000);
  });

  it("every boundary of 200 questions: 119/120, 141/142, 161/162", () => {
    expect(assessmentGrade(119, 200)).toBeNull();
    expect(assessmentGrade(120, 200)).toBe("charlie");
    expect(assessmentGrade(141, 200)).toBe("charlie");
    expect(assessmentGrade(142, 200)).toBe("bravo");
    expect(assessmentGrade(161, 200)).toBe("bravo");
    expect(assessmentGrade(162, 200)).toBe("alpha");
    expect(assessmentGrade(200, 200)).toBe("alpha");
    expect(assessmentGrade(0, 200)).toBeNull();
  });

  it("the percentage is rounded DOWN: 70.5 % is 70 % (Charlie), 80.5 % is 80 % (Bravo), 59.5 % is 59 % (none)", () => {
    expect(percentOf(141, 200)).toBe(70);
    expect(assessmentGrade(141, 200)).toBe("charlie"); // 70.5 %
    expect(percentOf(161, 200)).toBe(80);
    expect(assessmentGrade(161, 200)).toBe("bravo"); // 80.5 %
    expect(percentOf(119, 200)).toBe(59);
    expect(assessmentGrade(119, 200)).toBeNull(); // 59.5 %
    expect(percentOf(121, 200)).toBe(60); // 60.5 %
    expect(assessmentGrade(121, 200)).toBe("charlie");
    expect(percentOf(143, 200)).toBe(71); // 71.5 %
    expect(assessmentGrade(143, 200)).toBe("bravo");
  });

  it("matches the score bands of 200 exactly, for every possible score", () => {
    for (const grade of ["charlie", "bravo", "alpha"] as const) {
      const { min, max } = gradeScoreRange(grade, 200);
      for (let score = min; score <= max; score += 1) expect(assessmentGrade(score, 200)).toBe(grade);
    }
    expect(gradeScoreRange("charlie", 200)).toEqual({ min: 120, max: 141 });
    expect(gradeScoreRange("bravo", 200)).toEqual({ min: 142, max: 161 });
    expect(gradeScoreRange("alpha", 200)).toEqual({ min: 162, max: 200 });
  });

  it("the band text is the founder's", () => {
    expect(gradeLabel("charlie")).toEqual({ name: "Charlie", band: "60–70 %" });
    expect(gradeLabel("bravo")).toEqual({ name: "Bravo", band: "71–80 %" });
    expect(gradeLabel("alpha")).toEqual({ name: "Alpha", band: "81–100 %" });
    expect(ASSESSMENT_GRADE_BANDS.alpha.max).toBe(100);
  });

  it("an empty or nonsensical check has no grade", () => {
    expect(assessmentGrade(5, 0)).toBeNull();
    expect(percentOf(5, 0)).toBe(0);
    expect(assessmentGrade(Number.NaN, 200)).toBeNull();
  });
});

describe("old results keep old rules (D7)", () => {
  it("only a PASSED 200-question result carries a grade; earlier sizes never do", () => {
    expect(gradeOfResult({ score: 180, size: 200, passed: true })).toBe("alpha");
    expect(gradeOfResult({ score: 130, size: 200, passed: true })).toBe("charlie");
    expect(gradeOfResult({ score: 100, size: 100, passed: true })).toBeNull(); // an old 100
    expect(gradeOfResult({ score: 50, size: 50, passed: true })).toBeNull(); // an old 50
    expect(gradeOfResult({ score: 180, size: 200, passed: false })).toBeNull(); // the stored pass is never recomputed
    expect(gradeOfResult({ score: null, size: 200, passed: true })).toBeNull();
  });

  it("the pass mark is 60 % for 200 questions and the old 70 % for the earlier sizes", () => {
    expect(passMarkPercent(200)).toBe(60);
    expect(passMarkPercent(100)).toBe(70);
    expect(passMarkPercent(50)).toBe(70);
  });
});

describe("the deadline", () => {
  const started = new Date("2026-10-01T02:00:00.000Z");
  it("is started_at + 3 hours, and time is up from that instant on", () => {
    expect(attemptDeadline(started).toISOString()).toBe("2026-10-01T05:00:00.000Z");
    expect(isAttemptExpired(started, new Date("2026-10-01T04:59:59.999Z"))).toBe(false);
    expect(isAttemptExpired(started, new Date("2026-10-01T05:00:00.000Z"))).toBe(true);
    expect(isAttemptExpired(started, new Date("2026-10-02T00:00:00.000Z"))).toBe(true);
  });
});
