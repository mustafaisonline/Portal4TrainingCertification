import { describe, expect, it } from "vitest";
import { MIN_PRIVATE_ROLE_QUESTIONS, ORG_QUESTION_CAP, OPTIONS_PER_QUESTION, QUESTIONS_PER_PAGE, ROLE_TEST_SIZE, ROLE_TEST_TIME_LIMIT_MS } from "@/modules/assessment/constants";
import { attemptDeadline, categoryBreakdown, isExpired, isRoleListed, percentOf, selectQuestionIds } from "@/modules/assessment/rules";
import { AssessmentError } from "@/modules/assessment/errors";
import { slugify, validateContactEmail, validateLogoPath, validateQuestionContent, validateSlug } from "@/modules/assessment/question-validation";

/*
 * The role tests' pure rules (CR-2026-10-01-1711): the selection rule (all of
 * the organisation's questions up to the cap + shared fill, shuffled, no
 * duplicates, injectable random), the whole-number percentage, the derived
 * 90-minute deadline, the per-category breakdown, the "is this role listed"
 * rule, and the content validators.
 */

const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

/** A deterministic random: a small LCG, so a "fresh draw" is reproducible. */
function seeded(seed: number) {
  let s = seed;
  return (max: number) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return Math.floor((s / 4294967296) * max);
  };
}

describe("constants", () => {
  it("are the founder's numbers", () => {
    expect([ROLE_TEST_SIZE, ROLE_TEST_TIME_LIMIT_MS, ORG_QUESTION_CAP, MIN_PRIVATE_ROLE_QUESTIONS, OPTIONS_PER_QUESTION, QUESTIONS_PER_PAGE]).toEqual([100, 5_400_000, 20, 10, 5, 10]);
  });
});

describe("selectQuestionIds", () => {
  it("shared mode: a random 100 of a bigger bank, no duplicates, and fresh draws differ", () => {
    const shared = ids("s", 300);
    const a = selectQuestionIds({ organisationQuestionIds: [], sharedQuestionIds: shared, size: 100, cap: 20 });
    const b = selectQuestionIds({ organisationQuestionIds: [], sharedQuestionIds: shared, size: 100, cap: 20 });
    expect(a).toHaveLength(100);
    expect(new Set(a).size).toBe(100);
    expect(a.every((id) => shared.includes(id))).toBe(true);
    expect(a).not.toEqual(b);
  });

  it("a bank of exactly 100 gives all of it, shuffled", () => {
    const shared = ids("s", 100);
    const a = selectQuestionIds({ organisationQuestionIds: [], sharedQuestionIds: shared, size: 100, cap: 20 });
    expect([...a].sort()).toEqual([...shared].sort());
    expect(a).not.toEqual(shared);
  });

  it("a smaller bank gives all it has (never more than exists)", () => {
    expect(selectQuestionIds({ organisationQuestionIds: [], sharedQuestionIds: ids("s", 7), size: 100, cap: 20 })).toHaveLength(7);
  });

  it("ALL of the organisation's questions are in the test (up to the cap), plus shared fill to the size", () => {
    const own = ids("o", 12);
    for (let i = 0; i < 20; i += 1) {
      const t = selectQuestionIds({ organisationQuestionIds: own, sharedQuestionIds: ids("s", 300), size: 100, cap: 20 });
      expect(t).toHaveLength(100);
      expect(new Set(t).size).toBe(100);
      expect(own.every((id) => t.includes(id))).toBe(true);
      expect(t.filter((id) => id.startsWith("s"))).toHaveLength(88);
    }
  });

  it("more than the cap: a random subset of exactly the cap, which changes between draws", () => {
    const own = ids("o", 50);
    const sets = new Set<string>();
    for (let i = 0; i < 10; i += 1) {
      const t = selectQuestionIds({ organisationQuestionIds: own, sharedQuestionIds: ids("s", 300), size: 100, cap: 20, random: seeded(i + 1) });
      const mine = t.filter((id) => id.startsWith("o"));
      expect(mine).toHaveLength(20);
      expect(t).toHaveLength(100);
      sets.add(mine.sort().join(","));
    }
    expect(sets.size).toBeGreaterThan(1);
  });

  it("an organisation test of a small bank is the organisation's plus all shared, in one shuffled list", () => {
    const t = selectQuestionIds({ organisationQuestionIds: ids("o", 5), sharedQuestionIds: ids("s", 30), size: 35, cap: 20 });
    expect(t).toHaveLength(35);
    expect(new Set(t).size).toBe(35);
  });

  it("removes duplicates inside and across the two lists; an id in both counts as the organisation's", () => {
    const t = selectQuestionIds({ organisationQuestionIds: ["a", "a", "b"], sharedQuestionIds: ["b", "c", "c", "d"], size: 100, cap: 20 });
    expect([...t].sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("never exceeds the size, even when the cap is larger", () => {
    const t = selectQuestionIds({ organisationQuestionIds: ids("o", 30), sharedQuestionIds: ids("s", 30), size: 10, cap: 20 });
    expect(t).toHaveLength(10);
    expect(t.every((id) => id.startsWith("o"))).toBe(true);
  });

  it("uses the injected random (same random → same test) and the result is a shuffle, not a sort", () => {
    const input = { organisationQuestionIds: ids("o", 5), sharedQuestionIds: ids("s", 60), size: 40, cap: 20 };
    expect(selectQuestionIds({ ...input, random: seeded(7) })).toEqual(selectQuestionIds({ ...input, random: seeded(7) }));
    expect(selectQuestionIds({ ...input, random: seeded(7) })).not.toEqual(selectQuestionIds({ ...input, random: seeded(8) }));
  });

  it("size 0 or nothing to draw gives an empty test", () => {
    expect(selectQuestionIds({ organisationQuestionIds: ids("o", 3), sharedQuestionIds: ids("s", 3), size: 0, cap: 20 })).toEqual([]);
    expect(selectQuestionIds({ organisationQuestionIds: [], sharedQuestionIds: [], size: 100, cap: 20 })).toEqual([]);
  });
});

describe("percentOf, the deadline and expiry", () => {
  it("rounds the percentage DOWN", () => {
    expect(percentOf(0, 100)).toBe(0);
    expect(percentOf(70, 100)).toBe(70);
    expect(percentOf(2, 3)).toBe(66);
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(100, 100)).toBe(100);
    expect(percentOf(5, 0)).toBe(0);
  });

  it("the deadline is exactly 90 minutes after the start, and expiry begins AT the deadline", () => {
    const start = new Date("2026-10-01T10:00:00.000Z");
    expect(attemptDeadline(start).toISOString()).toBe("2026-10-01T11:30:00.000Z");
    expect(isExpired(start, new Date("2026-10-01T11:29:59.999Z"))).toBe(false);
    expect(isExpired(start, new Date("2026-10-01T11:30:00.000Z"))).toBe(true);
    expect(isExpired(start, new Date("2026-10-01T12:00:00.000Z"))).toBe(true);
  });
});

describe("categoryBreakdown", () => {
  it("counts correct / total per category, alphabetically", () => {
    expect(
      categoryBreakdown([
        { category: "Pipelines", correct: true },
        { category: "Modelling", correct: false },
        { category: "Pipelines", correct: false },
        { category: "Modelling", correct: false },
        { category: "Pipelines", correct: true },
      ]),
    ).toEqual([
      { category: "Modelling", correct: 0, total: 2 },
      { category: "Pipelines", correct: 2, total: 3 },
    ]);
    expect(categoryBreakdown([])).toEqual([]);
  });
});

describe("isRoleListed", () => {
  it("a shared role is listed when published and the shared bank has reviewed questions OR the organisation has approved ones", () => {
    expect(isRoleListed({ isPrivate: false, published: true, reviewedSharedCount: 5, approvedOrganisationCount: 0 })).toBe(true);
    expect(isRoleListed({ isPrivate: false, published: true, reviewedSharedCount: 0, approvedOrganisationCount: 1 })).toBe(true);
    expect(isRoleListed({ isPrivate: false, published: true, reviewedSharedCount: 0, approvedOrganisationCount: 0 })).toBe(false);
    expect(isRoleListed({ isPrivate: false, published: false, reviewedSharedCount: 50, approvedOrganisationCount: 5 })).toBe(false);
  });

  it("a private role needs at least 10 approved questions (the shared bank does not count) and publication", () => {
    expect(isRoleListed({ isPrivate: true, published: true, reviewedSharedCount: 500, approvedOrganisationCount: 9 })).toBe(false);
    expect(isRoleListed({ isPrivate: true, published: true, reviewedSharedCount: 0, approvedOrganisationCount: 10 })).toBe(true);
    expect(isRoleListed({ isPrivate: true, published: false, reviewedSharedCount: 0, approvedOrganisationCount: 40 })).toBe(false);
  });
});

describe("content validation", () => {
  const good = () => ({
    category: "Pipelines",
    stem: "Which approach makes a pipeline step idempotent?",
    options: [
      { text: "Upsert by a natural key", isCorrect: true },
      { text: "Append every run", isCorrect: false },
      { text: "Truncate the target silently", isCorrect: false },
      { text: "Rely on run order", isCorrect: false },
      { text: "Disable retries", isCorrect: false },
    ],
    modelAnswer: "An idempotent step can run twice and leave the same result; I would upsert on a natural key.",
  });
  const refuses = (mutate: (q: ReturnType<typeof good>) => void, text: RegExp) => {
    const q = good();
    mutate(q);
    expect(() => validateQuestionContent(q)).toThrowError(AssessmentError);
    expect(() => validateQuestionContent(q)).toThrowError(text);
  };

  it("accepts a good question and trims it", () => {
    const q = good();
    q.stem = `  ${q.stem}  `;
    expect(validateQuestionContent(q).stem).toBe(good().stem);
    expect(validateQuestionContent(good()).source).toBeNull();
  });

  it("refuses: not five options, no or two correct, duplicate options, empty or too-long fields, control characters", () => {
    refuses((q) => q.options.pop(), /exactly 5 options/);
    refuses((q) => (q.options[0]!.isCorrect = false), /exactly one option must be correct/);
    refuses((q) => (q.options[1]!.isCorrect = true), /exactly one option must be correct/);
    refuses((q) => (q.options[1]!.text = "upsert by a natural key"), /distinct/);
    refuses((q) => (q.options[2]!.text = "  "), /every option/);
    refuses((q) => (q.stem = "short"), /the question must be/);
    refuses((q) => (q.stem = "x".repeat(1001)), /the question must be/);
    refuses((q) => (q.modelAnswer = "too short"), /model answer/);
    refuses((q) => (q.category = " "), /category/);
    refuses((q) => (q.stem = `Which approach\u0000 makes a pipeline idempotent?`), /control characters/);
  });

  it("names the failing question of a batch", () => {
    expect(() => validateQuestionContent({ ...good(), stem: "x" }, 4)).toThrowError(/question 5: the question must be/);
  });

  it("slugs, URL names, emails and logo paths", () => {
    expect(slugify("Data Engineer")).toBe("data-engineer");
    expect(slugify("AI & ML Engineer!")).toBe("ai-and-ml-engineer");
    expect(slugify("   ")).toBe("");
    expect(validateSlug("data-engineer")).toBe("data-engineer");
    expect(() => validateSlug("Data Engineer")).toThrowError(AssessmentError);
    expect(() => validateSlug("-bad-")).toThrowError(AssessmentError);
    expect(validateContactEmail("  HR@Example.Test ")).toBe("hr@example.test");
    expect(() => validateContactEmail("nope")).toThrowError(AssessmentError);
    expect(validateLogoPath("")).toBeNull();
    expect(validateLogoPath("/logos/ypt.svg")).toBe("/logos/ypt.svg");
    expect(validateLogoPath("https://example.test/a.png")).toBe("https://example.test/a.png");
    expect(() => validateLogoPath("//evil.test/a.png")).toThrowError(AssessmentError);
    expect(() => validateLogoPath("javascript:alert(1)")).toThrowError(AssessmentError);
  });
});
