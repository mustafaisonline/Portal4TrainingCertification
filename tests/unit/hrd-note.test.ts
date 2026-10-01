import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HRD_CLAIM_NOTE } from "@/content/hrd-corp";
import { faqGroups } from "../../prisma/seed-data/faq";
import { privacyPolicy } from "@/content/legal/privacy";

/*
 * The founder's HRD wording (2026-09-30, modification.md M8): wherever the
 * portal mentions HRD Corp it says who can claim. One constant
 * (`HRD_CLAIM_NOTE`); this test fails if a component that talks about HRD Corp
 * stops using it, or if the sentence drifts.
 */
const ROOT = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

describe("HRD claim note", () => {
  it("is the founder's sentence", () => {
    expect(HRD_CLAIM_NOTE).toBe("HRD Corp claims are for Malaysian citizens and are normally made through an employer registered with HRD Corp.");
  });

  it.each([
    "src/shared/marketing/HomeHero.tsx",
    "src/shared/marketing/HrdCorpSections.tsx",
    "src/shared/marketing/ProgrammePricing.tsx",
    "src/shared/marketing/CourseCard.tsx",
    "app/(public)/programs/page.tsx",
    "app/account/profile/ProfileForm.tsx",
    "app/admin/trainings/[id]/fees/page.tsx",
  ])("%s renders the note wherever it speaks of HRD Corp", (file) => {
    const src = read(file);
    expect(src).toMatch(/\bHRD/i); // the file does mention HRD Corp …
    expect(src, `${file} must use HRD_CLAIM_NOTE`).toContain("HRD_CLAIM_NOTE"); // … so it must carry the note
  });

  it("the privacy policy and the FAQ (seed data) carry the sentence next to their HRD mentions", () => {
    const privacyText = JSON.stringify(privacyPolicy);
    expect(privacyText).toContain(HRD_CLAIM_NOTE);
    const hrdFaqs = faqGroups.flatMap((g) => g.items).filter((f) => /HRD/i.test(f.q + f.a));
    expect(hrdFaqs.length).toBeGreaterThan(0);
    for (const f of hrdFaqs) expect(f.a, f.q).toContain(HRD_CLAIM_NOTE);
  });
});
