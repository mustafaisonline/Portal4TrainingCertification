import { describe, expect, it } from "vitest";
import { privacyPolicy } from "@/content/legal/privacy";
import { refundPolicy } from "@/content/legal/refund-policy";
import { termsOfService } from "@/content/legal/terms";
import type { LegalDocument } from "@/content/legal/types";
import { sectionAnchor } from "@/shared/legal/LegalDocumentView";

/*
 * Legal documents (drafted 2026-09-21, published 2026-10-02). These are content, not logic, so the tests guard
 * the properties a reader depends on: every document is PUBLISHED with no draft notice or
 * unfilled placeholder, it is substantial rather than a stub, it has no empty
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

describe("legal documents (src/content/legal)", () => {
  it.each(documents)("$key is published, dated and versioned", (doc) => {
    expect(doc.status).toBe("published");
    expect(doc.version).toBe("2026-10-03");
    expect(doc.lastUpdated).toBe(doc.version);
    expect(doc.summary.trim().length).toBeGreaterThan(0);
  });

  it.each(documents)("$key carries no draft section, draft notice or effective-date placeholder", (doc) => {
    expect(doc.sections[0]?.heading).not.toBe("About this draft");
    const text = allText(doc);
    expect(text).not.toMatch(/not yet in force|DRAFT-|draft prepared for review/i);
    expect(text).toContain("Effective date of this version: 3 October 2026. Version: 2026-10-03.");
    // CR-2026-10-03-1246: the portal shows no email address — people are sent to the Contact Us page.
    expect(text).not.toContain("@");
    expect(text).toContain("Contact Us");
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

  it.each(documents)("$key has no unfilled [placeholder] left to publish", (doc) => {
    const found = allText(doc).match(/\[[^\]]+\]/g) ?? [];
    expect(found, `unfilled placeholder(s): ${found.join(", ")}`).toEqual([]);
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
