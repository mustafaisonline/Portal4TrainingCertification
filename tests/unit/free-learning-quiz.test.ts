import { describe, expect, it } from "vitest";
import { QuestionValidationError, validateQuestion } from "@/modules/free-learning/quiz.repository";

/*
 * Question validation (Milestone 14 Phase 3): exactly five distinct options,
 * exactly one correct by index, a bounded stem and explanation — the rule
 * every import and future editor must pass.
 */
const good = { stem: "Which of these is a primary key?", options: ["ID", "Name", "Address", "Phone", "Email"], correct: 0, explanation: "The ID identifies one row." };

describe("validateQuestion", () => {
  it("accepts a well-formed question, trimming and normalising", () => {
    const v = validateQuestion({ ...good, stem: `  ${good.stem}  `, explanation: " Why. " }, 0);
    expect(v.stem).toBe(good.stem);
    expect(v.options).toEqual(good.options);
    expect(v.correct).toBe(0);
    expect(v.explanation).toBe("Why.");
  });

  it.each([
    ["a short stem", { ...good, stem: "Why?" }],
    ["four options", { ...good, options: good.options.slice(0, 4) }],
    ["six options", { ...good, options: [...good.options, "Six"] }],
    ["an empty option", { ...good, options: ["ID", "", "Address", "Phone", "Email"] }],
    ["duplicate options", { ...good, options: ["ID", "id", "Address", "Phone", "Email"] }],
    ["correct out of range", { ...good, correct: 5 }],
    ["correct not an integer", { ...good, correct: 1.5 }],
  ])("rejects %s with the question's position in the message", (_label, raw) => {
    expect(() => validateQuestion(raw, 3)).toThrowError(QuestionValidationError);
    expect(() => validateQuestion(raw, 3)).toThrowError(/question 4:/);
  });

  it('refuses a stem that leans on "the chapter" — a question is read in a mixed 50-question check (UX review U6)', () => {
    expect(() => validateQuestion({ ...good, stem: "What does the chapter say metadata is?" }, 0)).toThrowError(/name its subject/);
    expect(() => validateQuestion({ ...good, stem: "In this chapter's example, which column is the key?" }, 0)).toThrowError(QuestionValidationError);
    expect(validateQuestion({ ...good, stem: "What is metadata, as I Am Datapedia! describes it?" }, 0).stem).toContain("metadata");
  });

  it("treats a blank explanation as none", () => {
    expect(validateQuestion({ ...good, explanation: "   " }, 0).explanation).toBeNull();
    expect(validateQuestion({ ...good, explanation: undefined }, 0).explanation).toBeNull();
  });
});
