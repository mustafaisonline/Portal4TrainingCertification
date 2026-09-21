import { describe, expect, it } from "vitest";
import { parsePublishedDocuments } from "@/modules/identity/legal-documents";

describe("published legal documents (consent gate, M2 plan §6.9)", () => {
  it("returns the versions when every required document is present", () => {
    expect(parsePublishedDocuments('{"terms":"2026-10-01","privacy":"v1.2"}')).toEqual({
      terms: "2026-10-01",
      privacy: "v1.2",
    });
  });

  it("treats a missing, partial or malformed setting as unpublished", () => {
    expect(parsePublishedDocuments(undefined)).toBeNull();
    expect(parsePublishedDocuments("")).toBeNull();
    expect(parsePublishedDocuments("not json")).toBeNull();
    expect(parsePublishedDocuments("[]")).toBeNull();
    expect(parsePublishedDocuments('{"terms":"2026-10-01"}')).toBeNull();
    expect(parsePublishedDocuments('{"terms":"","privacy":"x"}')).toBeNull();
    expect(parsePublishedDocuments('{"terms":"a b","privacy":"x"}')).toBeNull();
    expect(parsePublishedDocuments('{"terms":1,"privacy":"x"}')).toBeNull();
  });
});
