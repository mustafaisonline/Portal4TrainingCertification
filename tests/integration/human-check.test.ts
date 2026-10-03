import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { buildSumChallenge, buildTilesChallenge, createHumanChallenge, HUMAN_CHECK_TTL_MS, signUpHumanCheckProblem, verifyHumanChallenge } from "@/modules/identity/human-check";

/*
 * The human check against the REAL test database (CR-2026-10-03-1245): a challenge
 * is single use (consumed by the first attempt, right or wrong — also under a
 * parallel double submit), expires, cannot be replayed on another challenge, and
 * stores only a keyed hash.
 */

function seeded(seed: number) {
  let s = seed;
  return () => (max: number) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return Math.floor((s / 4294967296) * max);
  };
}
const created: string[] = [];
afterAll(async () => {
  await getPrisma().humanChallenge.deleteMany({ where: { id: { in: created } } });
  await disconnectPrisma();
});

/** A tiles challenge whose right answer the test knows: the same seeded rng builds the answer. */
async function tiles(seed: number, now: Date = new Date()) {
  const c = await createHumanChallenge("tiles", now, seeded(seed)());
  created.push(c.id);
  return { id: c.id, answer: buildTilesChallenge(seeded(seed)()).answer, public: c };
}

describe("verifyHumanChallenge", () => {
  it("accepts the right answer once, and only once", async () => {
    const { id, answer } = await tiles(11);
    expect(await verifyHumanChallenge(id, answer)).toBe(true);
    expect(await verifyHumanChallenge(id, answer)).toBe(false); // used
  });

  it("a wrong answer fails AND spends the challenge — the right answer afterwards no longer works", async () => {
    const { id, answer } = await tiles(12);
    expect(await verifyHumanChallenge(id, "0")).toBe(false);
    expect(await verifyHumanChallenge(id, answer)).toBe(false);
  });

  it("two parallel submissions of the right answer: exactly one wins", async () => {
    const { id, answer } = await tiles(13);
    const results = await Promise.all(Array.from({ length: 8 }, () => verifyHumanChallenge(id, answer)));
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("an expired challenge fails", async () => {
    const { id, answer } = await tiles(14, new Date(Date.now() - HUMAN_CHECK_TTL_MS - 60_000));
    expect(await verifyHumanChallenge(id, answer)).toBe(false);
  });

  it("an answer cannot be replayed on another challenge (the hash is bound to the id)", async () => {
    const a = await tiles(15);
    const b = await tiles(16);
    // Even if two puzzles share an answer string, their stored hashes differ — an answer is bound to ITS challenge.
    const rows = await getPrisma().humanChallenge.findMany({ where: { id: { in: [a.id, b.id] } }, select: { answerHash: true } });
    expect(new Set(rows.map((r) => r.answerHash)).size).toBe(2);
  });

  it("refuses malformed input without touching a challenge", async () => {
    const { id, answer } = await tiles(17);
    for (const [badId, badAnswer] of [[undefined, answer], [null, answer], [123, answer], ["not-a-uuid", answer], [id, undefined], [id, 5], [id, "x".repeat(200)]] as const) {
      expect(await verifyHumanChallenge(badId, badAnswer)).toBe(false);
    }
    expect(await verifyHumanChallenge(id, answer)).toBe(true); // none of the above spent it
  });

  it("the text alternative works the same way", async () => {
    const c = await createHumanChallenge("sum", new Date(), seeded(21)());
    created.push(c.id);
    const { answer } = buildSumChallenge(seeded(21)());
    expect(await verifyHumanChallenge(c.id, answer)).toBe(true);
    const d = await createHumanChallenge("sum", new Date(), seeded(22)());
    created.push(d.id);
    expect(await verifyHumanChallenge(d.id, "abc")).toBe(false);
  });

  it("stores only a keyed hash — never the answer", async () => {
    const { id, answer } = await tiles(18);
    const row = await getPrisma().humanChallenge.findUniqueOrThrow({ where: { id } });
    expect(row.answerHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.answerHash).not.toBe(answer);
    expect(row.answerHash).not.toContain(answer); // the answer text itself ("0,3,5") is not stored in any form
    expect(row.consumedAt).toBeNull();
  });
});

describe("signUpHumanCheckProblem", () => {
  it("passes a correct, fresh answer; fails a missing, wrong or reused one and a filled honeypot", async () => {
    const ok = await tiles(31);
    expect(await signUpHumanCheckProblem({ humanChallengeId: ok.id, humanAnswer: ok.answer }, null)).toBeNull();
    expect(await signUpHumanCheckProblem({ humanChallengeId: ok.id, humanAnswer: ok.answer }, null)).toBe("HUMAN_CHECK_FAILED"); // reused
    expect(await signUpHumanCheckProblem({}, null)).toBe("HUMAN_CHECK_FAILED");
    const trap = await tiles(32);
    expect(await signUpHumanCheckProblem({ humanChallengeId: trap.id, humanAnswer: trap.answer, hpCompany: "http://spam" }, null)).toBe("HUMAN_CHECK_FAILED");
  });
});
