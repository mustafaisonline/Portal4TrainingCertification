import { describe, expect, it } from "vitest";
import { DEFAULT_RETURN_TO, safeReturnTo } from "@/shared/util/return-to";

describe("safeReturnTo (ACCOUNT reqs §6: same-site paths only)", () => {
  it("accepts ordinary same-site paths, with query and hash", () => {
    expect(safeReturnTo("/account")).toBe("/account");
    expect(safeReturnTo("/account/programme?x=1#top")).toBe("/account/programme?x=1#top");
  });

  it("falls back for empty or missing values", () => {
    expect(safeReturnTo(null)).toBe(DEFAULT_RETURN_TO);
    expect(safeReturnTo(undefined)).toBe(DEFAULT_RETURN_TO);
    expect(safeReturnTo("")).toBe(DEFAULT_RETURN_TO);
    expect(safeReturnTo("", "/admin")).toBe("/admin");
  });

  it("rejects absolute and protocol-relative URLs and backslash tricks", () => {
    for (const bad of [
      "https://evil.example/",
      "http://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "account",
      "/account\n",
      "/acc ount",
    ]) {
      expect(safeReturnTo(bad), bad).toBe(DEFAULT_RETURN_TO);
    }
  });

  it("never returns into the auth API or an oversized path", () => {
    expect(safeReturnTo("/api/auth/sign-out")).toBe(DEFAULT_RETURN_TO);
    expect(safeReturnTo("/" + "a".repeat(3000))).toBe(DEFAULT_RETURN_TO);
  });
});
