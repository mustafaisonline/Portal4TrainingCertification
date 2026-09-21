import { describe, expect, it } from "vitest";
import { privacyPolicy } from "@/content/legal/privacy";
import { refundPolicy } from "@/content/legal/refund-policy";
import { termsOfService } from "@/content/legal/terms";
import { LEGAL_PLACEHOLDERS, type LegalDocument } from "@/content/legal/types";
import { sectionAnchor } from "@/shared/legal/LegalDocumentView";

/*
 * Legal drafts (2026-09-21). These are content, not logic, so the tests guard
 * the properties a reader depends on: every document is visibly a DRAFT, it
 * opens by saying so, it is substantial rather than a stub, it has no empty
 * paragraphs that would render as blank lines, and the refund policy carries
 * the founder's numbers (14 days / 50% / 7 days) so an edit cannot silently
 * drop or change the rule without a test noticing.
 */

const documents: LegalDocument[] = [termsOfService, privacyPolicy, refundPolicy];

function allText(doc: LegalDocument): string {
  return doc.sections
    .flatMap((s) => [
      s.heading,
      ...s.paragraphs,
      ...(s.bullets ?? []),
      ...(s.table ? [s.table.caption, ...s.table.columns, ...s.table.rows.flat()] : []),
    ])
    .join("\n");
}

describe("legal drafts (src/content/legal)", () => {
  it.each(documents)("$key is a clearly-labelled draft", (doc) => {
    expect(doc.status).toBe("draft");
    expect(doc.version).toBe("DRAFT-2026-09-21");
    expect(doc.version.startsWith("DRAFT-")).toBe(true);
    expect(doc.lastUpdated).toBe("2026-09-21");
    expect(doc.summary.trim().length).toBeGreaterThan(0);
  });

  it.each(documents)("$key opens with the 'About this draft' section", (doc) => {
    const first = doc.sections[0];
    expect(first?.heading).toBe("About this draft");
    expect(first?.paragraphs.join(" ")).toMatch(/Malaysian-qualified lawyer/);
    expect(first?.paragraphs.join(" ")).toMatch(/not yet in force/);
    // The placeholders the founder must fill in are listed up front.
    expect(first?.bullets?.length ?? 0).toBeGreaterThan(0);
  });

  it.each(documents)("$key has at least 8 sections and no empty paragraphs", (doc) => {
    expect(doc.sections.length).toBeGreaterThanOrEqual(8);
    for (const s of doc.sections) {
      expect(s.heading.trim().length).toBeGreaterThan(0);
      expect(s.paragraphs.length).toBeGreaterThan(0);
      for (const p of s.paragraphs) expect(p.trim().length).toBeGreaterThan(0);
      for (const b of s.bullets ?? []) expect(b.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(documents)("$key uses only the agreed placeholders (square brackets)", (doc) => {
    const text = allText(doc);
    // Every bracketed token is either an agreed placeholder, a to-be-named
    // provider, a retention period, or a "[Founder to confirm …]" note.
    const known = new Set<string>([...LEGAL_PLACEHOLDERS, "[to be named]", "[retention periods]"]);
    const found = text.match(/\[[^\]]+\]/g) ?? [];
    expect(found.length).toBeGreaterThan(0);
    const unknown = found.filter((t) => !known.has(t) && !t.startsWith("[Founder to confirm"));
    expect(unknown, `unexpected bracketed text: ${unknown.join(", ")}`).toEqual([]);
  });

  it.each(documents)("$key section headings produce unique anchors", (doc) => {
    const anchors = doc.sections.map((s) => sectionAnchor(s.heading));
    expect(new Set(anchors).size).toBe(anchors.length);
    for (const a of anchors) expect(a).toMatch(/^s-[a-z0-9-]+$/);
  });

  it("names the operator and never claims compliance", () => {
    for (const doc of documents) {
      const text = allText(doc);
      expect(text).toContain("Your Partner Technologies");
      expect(text).not.toMatch(/\b(is|are|fully) compliant\b/i);
      expect(text).not.toMatch(/complies with/i);
    }
  });

  it("the refund policy states the 14-day, 50% and 7-day rules", () => {
    const text = allText(refundPolicy);
    expect(text).toMatch(/14 or more calendar days/);
    expect(text).toMatch(/100%/);
    expect(text).toMatch(/7 to 13 calendar days/);
    expect(text).toMatch(/50%/);
    expect(text).toMatch(/Fewer than 7 days/);
    expect(text).toMatch(/No refund/);
    expect(text).toMatch(/Stripe/);
    // The schedule is a table so the three lines cannot drift apart.
    const table = refundPolicy.sections.find((s) => s.table)?.table;
    expect(table?.rows.map((r) => r[1])).toEqual([
      "100% of the amount paid",
      "50% of the amount paid",
      "No refund",
    ]);
  });

  it("the terms cross-refer to the same refund rule", () => {
    const text = allText(termsOfService);
    expect(text).toMatch(/14 or more calendar days/);
    expect(text).toMatch(/50% refund/);
    expect(text).toMatch(/fewer than 7 days/i);
  });
});
