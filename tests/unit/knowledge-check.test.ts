import { describe, expect, it } from "vitest";
import { generateKnowledgeCheckId, isKnowledgeCheckSize, KNOWLEDGE_CHECK_ID_RE, passed } from "@/modules/free-learning/knowledge-check.repository";

/*
 * Knowledge Check rules (Milestone 14 Phase 4; P12): the ID shape (the
 * certificate alphabet, a KC prefix so it can never be mistaken for a
 * Certificate of Completion), the sizes, and the 70 % pass mark.
 */
describe("knowledge check", () => {
  it("IDs are KC-YYYY-XXXX-XXXX from the 31-symbol alphabet; deterministic with an injected source", () => {
    const id = generateKnowledgeCheckId(2026, () => 0);
    expect(id).toBe("KC-2026-2222-2222");
    expect(KNOWLEDGE_CHECK_ID_RE.test(id)).toBe(true);
    expect(KNOWLEDGE_CHECK_ID_RE.test("DAA-2026-2222-2222")).toBe(false);
    expect(KNOWLEDGE_CHECK_ID_RE.test("KC-2026-0000-1111")).toBe(false); // 0 and 1 are not in the alphabet
    const random = generateKnowledgeCheckId(2026);
    expect(KNOWLEDGE_CHECK_ID_RE.test(random)).toBe(true);
  });

  it("sizes are exactly 50, 100 and 200", () => {
    expect([50, 100, 200].every(isKnowledgeCheckSize)).toBe(true);
    expect([0, 10, 49, 51, 150, 201].some(isKnowledgeCheckSize)).toBe(false);
  });

  it("passes at 70 % and above, never below, never on an empty check", () => {
    expect(passed(35, 50)).toBe(true);
    expect(passed(34, 50)).toBe(false);
    expect(passed(70, 100)).toBe(true);
    expect(passed(69, 100)).toBe(false);
    expect(passed(140, 200)).toBe(true);
    expect(passed(0, 0)).toBe(false);
  });
});
