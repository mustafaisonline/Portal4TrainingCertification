import { describe, expect, it } from "vitest";
import { trainerProfileUrl } from "@/modules/catalogue/experts/profile-url";

const MEDIUM = "https://medium.com/@mustafaisonline/profile-mustafa-qizilbash-2fb7a294f40f";
const LINKEDIN = "https://www.linkedin.com/in/mustafa-qizilbash/";

describe("trainerProfileUrl — the only place a trainer's name may link (M7 link rule)", () => {
  it("prefers the Medium profile", () => {
    expect(trainerProfileUrl({ profile: { mediumProfile: MEDIUM, linkedin: LINKEDIN } })).toBe(MEDIUM);
  });

  it("falls back to LinkedIn when there is no Medium profile", () => {
    expect(trainerProfileUrl({ profile: { linkedin: LINKEDIN } })).toBe(LINKEDIN);
    expect(trainerProfileUrl({ profile: { mediumProfile: "", linkedin: LINKEDIN } })).toBe(LINKEDIN);
    expect(trainerProfileUrl({ profile: { mediumProfile: "   ", linkedin: LINKEDIN } })).toBe(LINKEDIN);
  });

  it("falls back to LinkedIn when the Medium value is unusable", () => {
    expect(trainerProfileUrl({ profile: { mediumProfile: "javascript:alert(1)", linkedin: LINKEDIN } })).toBe(LINKEDIN);
    expect(trainerProfileUrl({ profile: { mediumProfile: "http://medium.com/@x", linkedin: LINKEDIN } })).toBe(LINKEDIN);
  });

  it("is null when there is no URL at all — so no link is shown", () => {
    expect(trainerProfileUrl({ profile: {} })).toBeNull();
    expect(trainerProfileUrl({ profile: null })).toBeNull();
    expect(trainerProfileUrl({})).toBeNull();
    expect(trainerProfileUrl(null)).toBeNull();
    expect(trainerProfileUrl(undefined)).toBeNull();
  });

  it("rejects anything that is not a well-formed https URL", () => {
    const bad = [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "http://medium.com/@x",
      "ftp://medium.com/@x",
      "//medium.com/@x",
      "/mustafa-qizilbash",
      "medium.com/@x",
      "https://",
      "https:///nohost",
      "not a url",
      "https://user:secret@medium.com/@x",
    ];
    for (const value of bad) {
      expect(trainerProfileUrl({ profile: { mediumProfile: value } }), value).toBeNull();
      expect(trainerProfileUrl({ profile: { linkedin: value } }), value).toBeNull();
    }
  });

  it("ignores non-string values from the stored JSON", () => {
    expect(trainerProfileUrl({ profile: { mediumProfile: 42, linkedin: { url: LINKEDIN } } })).toBeNull();
  });

  it("returns the trimmed, normalised https URL", () => {
    expect(trainerProfileUrl({ profile: { mediumProfile: `  ${MEDIUM}  ` } })).toBe(MEDIUM);
  });
});
