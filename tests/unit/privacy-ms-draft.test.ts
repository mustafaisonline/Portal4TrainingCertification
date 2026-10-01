import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { privacyPolicy } from "@/content/legal/privacy";
import { privacyPolicyMs } from "@/content/legal/privacy-ms";

/*
 * CR-2026-10-02-0628 — the Bahasa Malaysia Privacy notice is an UNREVIEWED,
 * UNPUBLISHED draft. These tests keep it (a) honest — still a draft, imported
 * by nothing, so it cannot reach a page by accident — and (b) in step with the
 * English notice that is in force: same sections, same numbering, same
 * paragraph and bullet counts, and every figure in the English text present in
 * the translation.
 */

const en = privacyPolicy.sections;
const ms = privacyPolicyMs.sections;
const digits = (t: string): string[] => t.match(/\d+/g) ?? [];
const sectionText = (s: (typeof en)[number]) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])].join("\n");

describe("privacy-ms.ts (Bahasa Malaysia DRAFT)", () => {
  it("is a draft with a DRAFT-MS version — never mistaken for the published notice", () => {
    expect(privacyPolicyMs.status).toBe("draft");
    expect(privacyPolicyMs.version).toMatch(/^DRAFT-MS-\d{4}-\d{2}-\d{2}$/);
    expect(privacyPolicyMs.key).toBe("privacy");
  });

  it("is imported by no application code (no route, link or sitemap entry yet)", () => {
    const roots = ["app", "src"];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = path.join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(name) && !p.endsWith(path.join("legal", "privacy-ms.ts")) && /privacy-ms/.test(readFileSync(p, "utf8"))) offenders.push(p);
      }
    };
    for (const r of roots) walk(path.join(process.cwd(), r));
    expect(offenders, "publishing it is a founder decision (CR-2026-10-02-0628)").toEqual([]);
  });

  it("mirrors the English notice: same sections, numbering, paragraph and bullet counts", () => {
    expect(ms.length).toBe(en.length);
    ms.forEach((s, i) => {
      expect(s.heading.split(".")[0], `section ${i + 1} number`).toBe(en[i]!.heading.split(".")[0]);
      expect(s.paragraphs.length, `section ${i + 1} paragraphs`).toBe(en[i]!.paragraphs.length);
      expect(s.bullets?.length ?? 0, `section ${i + 1} bullets`).toBe(en[i]!.bullets?.length ?? 0);
    });
  });

  it("keeps every figure of the English text (periods, ages, ids, contact)", () => {
    ms.forEach((s, i) => {
      const missing = digits(sectionText(en[i]!)).filter((d) => !digits(sectionText(s)).includes(d) && !["2026", "10", "02", "2"].includes(d));
      expect(missing, `section ${i + 1} is missing figure(s) ${missing.join(", ")}`).toEqual([]);
    });
    const text = ms.map(sectionText).join("\n");
    expect(text).toContain("sales@yourpartnertechnologies.com");
    expect(text).toContain("202401023226");
  });

  it("has no [placeholder] and no empty paragraph or bullet", () => {
    const text = ms.map(sectionText).join("\n");
    expect(text.match(/\[[^\]]+\]/g) ?? []).toEqual([]);
    for (const s of ms) {
      for (const p of s.paragraphs) expect(p.trim().length).toBeGreaterThan(0);
      for (const b of s.bullets ?? []) expect(b.trim().length).toBeGreaterThan(0);
    }
  });
});
