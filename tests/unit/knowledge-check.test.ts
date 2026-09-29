import { describe, expect, it } from "vitest";
import { generateKnowledgeCheckId, isKnowledgeCheckSize, KNOWLEDGE_CHECK_ID_RE, knowledgeCheckStatus, passed } from "@/modules/free-learning/knowledge-check.repository";

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

/*
 * What a verifier is told about a Knowledge Check — Milestone 15, Req 5 and
 * Q8b (founder, 2026-09-29): valid one year from the pass date (MYT calendar
 * date, last day inclusive), revoked wins, a fail has no validity.
 */
describe("knowledgeCheckStatus", () => {
  const finishedAt = new Date("2026-03-15T02:00:00Z"); // 10:00 MYT, 15 March
  it("a pass is valid for one year from the pass date, the last day inclusive", () => {
    expect(knowledgeCheckStatus({ passed: true, finishedAt, revokedAt: null }, "2026-03-16")).toEqual({ status: "valid", expiresOn: "2027-03-15" });
    expect(knowledgeCheckStatus({ passed: true, finishedAt, revokedAt: null }, "2027-03-15").status).toBe("valid");
    expect(knowledgeCheckStatus({ passed: true, finishedAt, revokedAt: null }, "2027-03-16").status).toBe("expired");
  });

  it("the pass date is the MYT calendar date, not the UTC one", () => {
    const lateUtc = new Date("2026-03-15T17:30:00Z"); // 01:30 MYT on 16 March
    expect(knowledgeCheckStatus({ passed: true, finishedAt: lateUtc, revokedAt: null }, "2026-03-16").expiresOn).toBe("2027-03-16");
  });

  it("revoked wins over valid and over expired", () => {
    const revokedAt = new Date("2026-04-01T00:00:00Z");
    expect(knowledgeCheckStatus({ passed: true, finishedAt, revokedAt }, "2026-04-02").status).toBe("revoked");
    expect(knowledgeCheckStatus({ passed: true, finishedAt, revokedAt }, "2030-01-01").status).toBe("revoked");
  });

  it("a result that did not pass has no validity date", () => {
    expect(knowledgeCheckStatus({ passed: false, finishedAt, revokedAt: null }, "2026-03-16")).toEqual({ status: "not_passed", expiresOn: null });
  });
});
