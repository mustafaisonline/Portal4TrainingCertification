/*
 * Pure vocabulary for the trainings admin screens (M12 WP2) — labels and
 * option lists with NO database import, so the client-side forms can use
 * them without dragging the Prisma layer into the browser bundle. The
 * repository re-exports nothing from here; server code imports it directly.
 */

import type { PriceRegion, ProgrammeLevel, ProgrammeStatus } from "./types";

export const PROGRAMME_STATUSES: readonly ProgrammeStatus[] = ["unlisted", "published", "retired"];
export const PROGRAMME_LEVELS: readonly ProgrammeLevel[] = ["foundation", "practitioner", "architect", "executive", "builder", "mentorship"];

export const PROGRAMME_STATUS_LABEL: Record<ProgrammeStatus, string> = {
  unlisted: "Draft (unlisted)",
  published: "Published",
  retired: "Retired",
};

/** The four fee rows in the founder's order (M12 WP1). */
export const FEE_REGIONS: readonly PriceRegion[] = ["malaysia_hrdcorp", "malaysia", "pakistan", "international"];

/** Default currency per fee row — what the Fees screen pre-fills. */
export const FEE_DEFAULT_CURRENCY: Record<PriceRegion, string> = {
  malaysia_hrdcorp: "MYR",
  malaysia: "MYR",
  pakistan: "PKR",
  international: "USD",
};

/** The editorial sections of a training as the content editor names them
 *  (one form field each — see content-codec.ts for the text format). */
export const CONTENT_FIELDS = [
  "highlights",
  "whoShouldAttendIntro",
  "whoShouldAttendRoles",
  "rationaleHeading",
  "rationaleParagraphs",
  "rationaleProblems",
  "outcomes",
  "outcomeGroups",
  "whatYouGet",
  "included",
  "pedagogyIntro",
  "pedagogyMethods",
  "pedagogyIndustries",
  "benefitsIntro",
  "benefitsItems",
  "methodologyName",
  "methodologySteps",
  "afterHeading",
  "afterIntro",
  "afterItems",
  "faq",
  "paceNotes",
  "relationshipNote",
  "careerPaths",
  "valueStack",
  "valueStackTotal",
  "related",
  "externalResources",
  "mentorshipPackagesJson",
] as const;

export type ContentField = (typeof CONTENT_FIELDS)[number];
export type ContentForm = Record<ContentField, string>;
export type ContentFieldErrors = Partial<Record<ContentField, string>>;

/** Label, hint and whether the field is a single line, for the editor. */
export const CONTENT_FIELD_META: Record<ContentField, { label: string; hint: string; multiline: boolean; required?: boolean }> = {
  highlights: { label: "Highlights", hint: "One per line. Shown as the key facts under the title.", multiline: true, required: true },
  whoShouldAttendIntro: { label: "Who should attend — introduction", hint: "One or two sentences.", multiline: true, required: true },
  whoShouldAttendRoles: { label: "Who should attend — roles", hint: "One role per line.", multiline: true, required: true },
  rationaleHeading: { label: "Why this training — heading", hint: "", multiline: false, required: true },
  rationaleParagraphs: { label: "Why this training — paragraphs", hint: "Separate paragraphs with a blank line.", multiline: true, required: true },
  rationaleProblems: { label: "Why this training — problems it solves", hint: "One per line. Optional.", multiline: true },
  outcomes: { label: "Outcomes", hint: "One per line. Optional when outcome groups are used.", multiline: true },
  outcomeGroups: { label: "Outcome groups", hint: "Start a group with a line '## Group title'; the lines after it are that group's items.", multiline: true },
  whatYouGet: { label: "What you get out of this training", hint: "One per line.", multiline: true },
  included: { label: "What is included", hint: "One per line. Optional.", multiline: true },
  pedagogyIntro: { label: "How you learn — introduction", hint: "", multiline: true },
  pedagogyMethods: { label: "How you learn — methods", hint: "One per line.", multiline: true },
  pedagogyIndustries: { label: "How you learn — industries", hint: "One per line. Optional.", multiline: true },
  benefitsIntro: { label: "Benefits — introduction", hint: "", multiline: true },
  benefitsItems: { label: "Benefits — items", hint: "One per line.", multiline: true },
  methodologyName: { label: "Learning journey — name", hint: "e.g. Your learning journey", multiline: false },
  methodologySteps: { label: "Learning journey — steps", hint: "One per line as 'Title: what happens in this step'.", multiline: true },
  afterHeading: { label: "After this training — heading", hint: "", multiline: false },
  afterIntro: { label: "After this training — introduction", hint: "", multiline: true },
  afterItems: { label: "After this training — items", hint: "One per line.", multiline: true },
  faq: { label: "Questions and answers", hint: "Pairs of lines: 'Q: the question' then 'A: the answer' (an answer may run over several lines).", multiline: true },
  paceNotes: { label: "Pace notes", hint: "One per line, shown under the pace cards (e.g. participant numbers per format).", multiline: true },
  relationshipNote: { label: "Relationship note", hint: "One sentence placing this training relative to another. Optional.", multiline: true },
  careerPaths: { label: "Career paths", hint: "One per line as 'From | To | Challenge | How this helps'. Mentorship only.", multiline: true },
  valueStack: { label: "Value stack", hint: "One per line as 'Item | Value'. Optional; not rendered on the published pages today.", multiline: true },
  valueStackTotal: { label: "Value stack — total", hint: "", multiline: false },
  related: { label: "Related trainings", hint: "One training address (slug) per line, e.g. learn-vibe-coding.", multiline: true },
  externalResources: { label: "External resources", hint: "One per line as 'Label | https://url | Description'.", multiline: true },
  mentorshipPackagesJson: { label: "Mentorship packages (JSON)", hint: "Mentorship programme only. A JSON array of packages exactly as stored; leave blank otherwise.", multiline: true },
};
