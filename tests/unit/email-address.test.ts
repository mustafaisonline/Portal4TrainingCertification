import { describe, expect, it } from "vitest";
import { isPlainEmailAddress } from "@/shared/util/email-address";

describe("isPlainEmailAddress", () => {
  it("accepts ordinary addresses, including plus-tags, dots, hyphens and sub-domains", () => {
    for (const ok of ["aisha@example.com", "a.b+tag@mail.example.co.uk", "first-last@sub.dataainexus.com", "x_y@a-b.org", "e2e-contact-sender-1a2b3c4d@example.test", "A@B.CO"]) expect(isPlainEmailAddress(ok), ok).toBe(true);
  });

  it("refuses lists, display names, quotes, comments, brackets and anything that could be read as more than one address", () => {
    for (const bad of ["a,c@d.com", "a;c@d.com", "<a@b.com>", "Aisha <a@b.com>", '"a b"@c.com', "a@b.com, c@d.com", "(x)a@b.com", "a@b@c.com", "a\\b@c.com", "a[b]@c.com", "a:b@c.com"]) expect(isPlainEmailAddress(bad), bad).toBe(false);
  });

  it("refuses the legacy-MTA characters (%, |, backtick, quotes, braces) in the local part", () => {
    for (const bad of ["a%x@b.com", "a|b@c.com", "a`b@c.com", "a'b@c.com", "a{b}@c.com", "a!b@c.com", "a=b@c.com", "a/b@c.com", "a?b@c.com", "a~b@c.com", "a$b@c.com"]) expect(isPlainEmailAddress(bad), bad).toBe(false);
  });

  it("refuses whitespace, control characters and non-ASCII", () => {
    for (const bad of ["a b@c.com", "a@b.com ", " a@b.com", "a@b.com\n", "a@b.com\r\nBcc: x@y.com", "a\u0000@b.com", "ä@b.com", "a@bücher.de"]) expect(isPlainEmailAddress(bad), JSON.stringify(bad)).toBe(false);
  });

  it("refuses malformed structure", () => {
    for (const bad of ["", "a", "@b.com", "a@", "a@b", "a@b.", "a@.com", "a@b..com", ".a@b.com", "a.@b.com", "a..b@c.com", "a@-b.com", "a@b-.com", "a@b.c", "a@b.c0m", "a@b.123", "a@1.2.3.4"]) expect(isPlainEmailAddress(bad), bad).toBe(false);
  });

  it("enforces the length limits", () => {
    expect(isPlainEmailAddress(`${"a".repeat(64)}@example.com`)).toBe(true);
    expect(isPlainEmailAddress(`${"a".repeat(65)}@example.com`)).toBe(false);
    expect(isPlainEmailAddress(`a@${"b".repeat(64)}.com`)).toBe(false);
    expect(isPlainEmailAddress(`a@${"b.".repeat(130)}com`)).toBe(false); // over 254
  });

  it("is linear: the input that froze the old regex (quadratic backtracking) is rejected in milliseconds", () => {
    for (const n of [20_000, 200_000, 2_000_000]) {
      const evil = `a@${".".repeat(n)} x`;
      const t0 = performance.now();
      expect(isPlainEmailAddress(evil)).toBe(false);
      expect(performance.now() - t0, `n=${n}`).toBeLessThan(50);
    }
    const t0 = performance.now();
    expect(isPlainEmailAddress("a@" + "a.".repeat(1_000_000) + "c")).toBe(false);
    expect(performance.now() - t0).toBeLessThan(50);
  });
});
