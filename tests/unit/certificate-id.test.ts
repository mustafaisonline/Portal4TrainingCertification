import { describe, expect, it } from "vitest";
import { ID_ALPHABET } from "@/modules/certificates/constants";
import { generateCertificateId } from "@/modules/certificates/id";
import { normaliseId } from "@/modules/certificates/rules";

/* M6 plan §6 criterion 2: the ID shape, alphabet and generation source. */

const SHAPE = /^DAA-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

describe("certificate ID generation", () => {
  it("produces DAA-YYYY-XXXX-XXXX from the 31-symbol alphabet with the real random source", () => {
    for (let i = 0; i < 200; i += 1) {
      const id = generateCertificateId(2026);
      expect(id).toMatch(SHAPE);
      expect(normaliseId(id)).toBe(id);
    }
  });

  it("the alphabet has 31 distinct symbols and none of 0, O, 1, I, L", () => {
    expect(ID_ALPHABET).toHaveLength(31);
    expect(new Set(ID_ALPHABET).size).toBe(31);
    expect(ID_ALPHABET).toMatch(/^[2-9A-HJ-NP-Z]+$/);
    for (const bad of ["0", "O", "1", "I", "L"]) expect(ID_ALPHABET.includes(bad)).toBe(false);
  });

  it("is deterministic with an injected random source, which is always asked for the alphabet size", () => {
    const calls: number[] = [];
    let i = 0;
    const random = (max: number) => {
      calls.push(max);
      return i++ % max;
    };
    expect(generateCertificateId(2026, random)).toBe("DAA-2026-2345-6789");
    expect(calls).toEqual(Array(8).fill(ID_ALPHABET.length));
    expect(generateCertificateId(2026, () => ID_ALPHABET.length - 1)).toBe("DAA-2026-ZZZZ-ZZZZ");
  });

  it("embeds the issue year", () => {
    expect(generateCertificateId(2031, () => 0)).toBe("DAA-2031-2222-2222");
    expect(generateCertificateId(2026, () => 0).slice(0, 9)).toBe("DAA-2026-");
  });
});
