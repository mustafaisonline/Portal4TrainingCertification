import { describe, expect, it } from "vitest";
import { CONTENT_FIELDS } from "@/modules/catalogue/programmes/constants";
import { contentToForm, emptyContentForm, formToContent, modulePointsToText, textToModulePoints } from "@/modules/catalogue/programmes/content-codec";
import type { ProgrammeContent } from "@/modules/catalogue/programmes/types";
import { courses } from "../../prisma/seed-data/courses";

/*
 * The content codec (M12 WP2, L9): the editor's text fields ↔ the JSON the
 * public page renders. Proven on the REAL seed content of every training:
 * form → JSON → form is the identity, and JSON → form → JSON loses nothing
 * the page reads. Then the line formats and their error messages.
 */

/** The seed's Course → the ProgrammeContent the seed writes (same mapping as prisma/seed.ts). */
function seedContent(c: (typeof courses)[number]): ProgrammeContent {
  return JSON.parse(
    JSON.stringify({
      highlights: c.highlights,
      whoShouldAttend: c.whoShouldAttend,
      rationale: c.rationale,
      outcomes: c.outcomes,
      outcomeGroups: c.outcomeGroups,
      included: c.included,
      pedagogy: c.pedagogy,
      benefits: c.benefits,
      careerPaths: c.careerPaths,
      methodology: c.methodology,
      valueStack: c.valueStack,
      valueStackTotal: c.valueStackTotal,
      related: c.related,
      externalResources: c.externalResources,
      relationshipNote: c.relationshipNote,
      afterThisTraining: c.afterThisTraining,
      faq: c.faq,
      whatYouGet: c.whatYouGet,
      paceNotes: c.paceNotes,
    }),
  );
}

describe("content codec — round trip on every seeded training", () => {
  for (const c of courses) {
    it(`${c.slug}: JSON → form → JSON is lossless, and form → JSON → form is the identity`, () => {
      const original = seedContent(c);
      const form = contentToForm(original);
      const { content, errors } = formToContent(form);
      expect(errors).toEqual({});
      expect(content).toEqual(original);
      expect(contentToForm(content!)).toEqual(form);
    });
  }

  it("emptyContentForm has every field, all blank", () => {
    const f = emptyContentForm();
    expect(Object.keys(f).sort()).toEqual([...CONTENT_FIELDS].sort());
    expect(Object.values(f).every((v) => v === "")).toBe(true);
  });
});

describe("content codec — formats and errors", () => {
  const minimal = { ...emptyContentForm(), highlights: "A\nB", whoShouldAttendIntro: "Intro.", whoShouldAttendRoles: "Analyst\nEngineer", rationaleHeading: "Why", rationaleParagraphs: "P1.\n\nP2 line a\nP2 line b." };

  it("the minimum: highlights, who should attend, rationale; paragraphs join wrapped lines", () => {
    const { content, errors } = formToContent(minimal);
    expect(errors).toEqual({});
    expect(content).toEqual({
      highlights: ["A", "B"],
      whoShouldAttend: { intro: "Intro.", roles: ["Analyst", "Engineer"] },
      rationale: { heading: "Why", paragraphs: ["P1.", "P2 line a P2 line b."] },
      related: [],
    });
  });

  it("reports the required sections by name", () => {
    const { content, errors } = formToContent(emptyContentForm());
    expect(content).toBeNull();
    expect(Object.keys(errors).sort()).toEqual(["highlights", "rationaleHeading", "rationaleParagraphs", "whoShouldAttendIntro", "whoShouldAttendRoles"]);
  });

  it("outcome groups: '## Title' then items; an item before any title is an error", () => {
    expect(formToContent({ ...minimal, outcomeGroups: "## One\na\nb\n## Two\nc" }).content?.outcomeGroups).toEqual([
      { title: "One", items: ["a", "b"] },
      { title: "Two", items: ["c"] },
    ]);
    expect(formToContent({ ...minimal, outcomeGroups: "orphan\n## One\na" }).errors.outcomeGroups).toMatch(/Start with a group title/);
    expect(formToContent({ ...minimal, outcomeGroups: "## Empty" }).errors.outcomeGroups).toMatch(/at least one item/);
  });

  it("learning journey: 'Title: body' steps, name and steps together or not at all", () => {
    expect(formToContent({ ...minimal, methodologyName: "Journey", methodologySteps: "Plan: think\nBuild: make it" }).content?.methodology).toEqual({
      name: "Journey",
      steps: [
        { title: "Plan", body: "think" },
        { title: "Build", body: "make it" },
      ],
    });
    expect(formToContent({ ...minimal, methodologyName: "Journey" }).errors.methodologySteps).toBeDefined();
    expect(formToContent({ ...minimal, methodologySteps: "Plan: think" }).errors.methodologySteps).toBeDefined();
    expect(formToContent({ ...minimal, methodologyName: "J", methodologySteps: "no colon here" }).errors.methodologySteps).toMatch(/could not read/);
  });

  it("FAQ: Q:/A: pairs, multi-line answers, and the two malformed shapes", () => {
    expect(formToContent({ ...minimal, faq: "Q: One?\nA: Yes\nstill yes\n\nQ: Two?\nA: No" }).content?.faq).toEqual([
      { q: "One?", a: "Yes still yes" },
      { q: "Two?", a: "No" },
    ]);
    expect(formToContent({ ...minimal, faq: "A: answer first" }).errors.faq).toMatch(/must follow/);
    expect(formToContent({ ...minimal, faq: "Q: unanswered?" }).errors.faq).toMatch(/needs an answer/);
  });

  it("pipe formats: career paths (4), value stack (2), external resources (3 with a URL)", () => {
    const ok = formToContent({
      ...minimal,
      careerPaths: "Analyst | Architect | No portfolio | Builds one",
      valueStack: "Workbook | RM 100",
      valueStackTotal: "RM 100",
      externalResources: "YPT | https://example.com/x | A page",
    });
    expect(ok.errors).toEqual({});
    expect(ok.content?.careerPaths).toEqual([{ from: "Analyst", to: "Architect", challenge: "No portfolio", helps: "Builds one" }]);
    expect(ok.content?.valueStack).toEqual([{ item: "Workbook", value: "RM 100" }]);
    expect(ok.content?.externalResources).toEqual([{ label: "YPT", url: "https://example.com/x", description: "A page" }]);
    expect(formToContent({ ...minimal, careerPaths: "only | three | parts" }).errors.careerPaths).toMatch(/could not read/);
    expect(formToContent({ ...minimal, externalResources: "Label | not-a-url | Desc" }).errors.externalResources).toMatch(/could not read/);
  });

  it("related must be training addresses; packages must be a JSON array with name and pricing", () => {
    expect(formToContent({ ...minimal, related: "learn-vibe-coding\nData Blueprint" }).errors.related).toMatch(/"Data Blueprint"/);
    expect(formToContent({ ...minimal, mentorshipPackagesJson: "{" }).errors.mentorshipPackagesJson).toMatch(/not valid JSON/);
    expect(formToContent({ ...minimal, mentorshipPackagesJson: '[{"name":"x"}]' }).errors.mentorshipPackagesJson).toMatch(/name.*pricing/);
    expect(formToContent({ ...minimal, mentorshipPackagesJson: '[{"name":"x","pricing":{}}]' }).content?.mentorshipPackages).toEqual([{ name: "x", pricing: {} }]);
  });

  it("dependent groups: methods without intro is fine, intro without methods is not; 'after this training' is all or nothing", () => {
    expect(formToContent({ ...minimal, pedagogyMethods: "Labs" }).content?.pedagogy).toEqual({ intro: "", methods: ["Labs"] });
    expect(formToContent({ ...minimal, pedagogyIntro: "We do" }).errors.pedagogyMethods).toBeDefined();
    expect(formToContent({ ...minimal, afterHeading: "After" }).errors.afterItems).toBeDefined();
    expect(formToContent({ ...minimal, afterHeading: "After", afterIntro: "You can", afterItems: "ship" }).content?.afterThisTraining).toEqual({ heading: "After", intro: "You can", items: ["ship"] });
  });
});

describe("module points codec", () => {
  it("round-trips the flagship's grouped curriculum and a flat list", () => {
    const flagship = courses.find((c) => c.slug === "data-blueprint-ai-vibe-coding")!;
    for (const m of flagship.modules) {
      const original = JSON.parse(JSON.stringify(m.points ?? null));
      const text = modulePointsToText(original);
      const { points, error } = textToModulePoints(text);
      expect(error).toBeUndefined();
      expect(points).toEqual(original);
    }
    expect(textToModulePoints("a\nb").points).toEqual(["a", "b"]);
    expect(modulePointsToText(["a", "b"])).toBe("a\nb");
  });

  it("groups: '## Title', optional '> description', then that group's points; a stray description is an error; blank = null", () => {
    expect(textToModulePoints("intro\n## G1\n> about g1\np1\np2\n## G2\nq1").points).toEqual(["intro", { title: "G1", description: "about g1", points: ["p1", "p2"] }, { title: "G2", points: ["q1"] }]);
    expect(textToModulePoints("> lonely").error).toMatch(/must follow/);
    expect(textToModulePoints("  \n").points).toBeNull();
  });
});
