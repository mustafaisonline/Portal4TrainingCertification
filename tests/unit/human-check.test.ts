import { describe, expect, it } from "vitest";
import { buildSumChallenge, buildTilesChallenge, humanCheckBypassed, normaliseTilesAnswer, SHAPES } from "@/modules/identity/human-check";
import { emailVerificationRequired } from "@/modules/identity/email-verification";

/*
 * The sign-up human check, pure parts (CR-2026-10-03-1245): the puzzles are fair,
 * the answer normalisation is strict, and the test bypass cannot work in a real
 * environment. The database half (single use, expiry, replay) is in
 * tests/integration/human-check.test.ts.
 */

function seeded(seed: number) {
  let s = seed;
  return (max: number) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return Math.floor((s / 4294967296) * max);
  };
}

describe("buildTilesChallenge", () => {
  it("makes nine labelled tiles and a prompt naming ONE shape that 2–4 of them match", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const c = buildTilesChallenge(seeded(seed));
      expect(c.tiles).toHaveLength(9);
      const target = SHAPES.find((s) => c.prompt === `Tap every ${s}.`);
      expect(target, c.prompt).toBeDefined();
      const hits = c.tiles.flatMap((t, i) => (t.shape === target ? [i] : []));
      expect(hits.length).toBeGreaterThanOrEqual(2);
      expect(hits.length).toBeLessThanOrEqual(4);
      expect(c.answer).toBe(hits.join(","));
      for (const t of c.tiles) expect(t.label).toBe(`${t.colour[0]!.toUpperCase()}${t.colour.slice(1)} ${t.shape}`);
    }
  });

  it("never reveals the answer in what the browser is sent (the tiles carry shape and colour only)", () => {
    const c = buildTilesChallenge(seeded(7));
    for (const t of c.tiles) expect(Object.keys(t).sort()).toEqual(["colour", "label", "shape"]);
  });
});

describe("buildSumChallenge", () => {
  it("asks for the sum of two small numbers in words, and the answer is that sum", () => {
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    for (let seed = 1; seed <= 100; seed++) {
      const c = buildSumChallenge(seeded(seed));
      const m = /^What is (\w+) plus (\w+)\? Type the number\.$/.exec(c.prompt);
      expect(m, c.prompt).not.toBeNull();
      expect(Number(c.answer)).toBe(words.indexOf(m![1]!) + words.indexOf(m![2]!));
    }
  });
});

describe("normaliseTilesAnswer", () => {
  it("sorts, de-duplicates and range-checks tile positions", () => {
    expect(normaliseTilesAnswer("3,0,5,3")).toBe("0,3,5");
    expect(normaliseTilesAnswer([4, 1])).toBe("1,4");
    expect(normaliseTilesAnswer(" 2 , 1 ")).toBe("1,2");
  });

  it("refuses anything that is not a list of positions 0–8", () => {
    for (const bad of ["", "9", "-1", "a", "1,,2", "1;2", "01x", "1.5", "0,1,2,3,4,5,6,7,8,0"]) expect(normaliseTilesAnswer(bad), bad).toBe("");
    expect(normaliseTilesAnswer([])).toBe("");
  });
});

describe("humanCheckBypassed — the test escape hatch cannot be used for real", () => {
  const header = (v: string | null) => ({ get: (n: string) => (n === "x-test-no-human-check" ? v : null) });
  const local = { APP_ENV: "test", APP_BASE_URL: "http://localhost:3101" };
  it("works only in the test environment, with a localhost base URL, AND only with the exact header value", () => {
    expect(humanCheckBypassed(header("1"), local)).toBe(true);
    expect(humanCheckBypassed(header("1"), { APP_ENV: "test", APP_BASE_URL: "http://127.0.0.1:3101" })).toBe(true);
    expect(humanCheckBypassed(header("0"), local)).toBe(false);
    expect(humanCheckBypassed(header(null), local)).toBe(false);
  });
  it("stays CLOSED if APP_ENV=test is set by mistake on a real deployment (public base URL, missing or malformed URL)", () => {
    for (const APP_BASE_URL of ["https://dataainexus.com", "https://localhost.evil.example", "http://198.199.67.177", "", "not a url", undefined]) {
      expect(humanCheckBypassed(header("1"), { APP_ENV: "test", APP_BASE_URL }), String(APP_BASE_URL)).toBe(false);
    }
  });
  it("is ignored in production and development, whatever the header says", () => {
    expect(humanCheckBypassed(header("1"), { NODE_ENV: "production" })).toBe(false);
    expect(humanCheckBypassed(header("1"), { NODE_ENV: "development" })).toBe(false);
    expect(humanCheckBypassed(header("1"), {})).toBe(false);
    expect(humanCheckBypassed(null, local)).toBe(false);
    expect(humanCheckBypassed(undefined, local)).toBe(false);
  });
});

describe("emailVerificationRequired", () => {
  it("is OFF unless the setting is exactly true (so a typo can never lock people out)", () => {
    expect(emailVerificationRequired({})).toBe(false);
    expect(emailVerificationRequired({ REQUIRE_EMAIL_VERIFICATION: "" })).toBe(false);
    expect(emailVerificationRequired({ REQUIRE_EMAIL_VERIFICATION: "yes" })).toBe(false);
    expect(emailVerificationRequired({ REQUIRE_EMAIL_VERIFICATION: "1" })).toBe(false);
    expect(emailVerificationRequired({ REQUIRE_EMAIL_VERIFICATION: "true" })).toBe(true);
    expect(emailVerificationRequired({ REQUIRE_EMAIL_VERIFICATION: " TRUE " })).toBe(true);
  });
});
