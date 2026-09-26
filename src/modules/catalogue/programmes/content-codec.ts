/*
 * Content codec (M12 WP2, decision L9: every editorial section editable).
 *
 * `programmes.content` is a JSON column of ~20 sections. The content editor
 * is a plain form — no rich-text dependency (Rule 5) — so each section is
 * ONE text field with a small, documented line format (constants.ts
 * CONTENT_FIELD_META carries the hints the screen shows):
 *   lists            one item per line
 *   paragraphs       blank-line separated
 *   outcome groups   "## Title" starts a group; following lines are items
 *   steps            "Title: body"
 *   career paths     "From | To | Challenge | Helps"
 *   value stack      "Item | Value"
 *   resources        "Label | url | Description"
 *   FAQ              "Q: …" then "A: …" (answer may span lines)
 *   packages         raw JSON (mentorship only)
 * Both directions are pure functions so they are unit-tested exactly, and
 * `contentToForm(formToContent(x)) === x` for well-formed input.
 *
 * Module points (`programme_modules.points`) have their own two helpers at
 * the bottom with the same idea: "## Group" and "> description" lines.
 */

import type { ContentFieldErrors, ContentForm } from "./constants";
import { CONTENT_FIELDS } from "./constants";
import { normaliseModulePoints } from "./module-points";
import type { MentorshipPackage, ModulePoint, ModulePointGroup, ProgrammeContent } from "./types";

const lines = (v: string): string[] =>
  v
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
const joinLines = (v: string[] | undefined): string => (v ?? []).join("\n");
const paragraphs = (v: string): string[] =>
  v
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s*\r?\n\s*/g, " ").trim())
    .filter((p) => p.length > 0);
const joinParagraphs = (v: string[] | undefined): string => (v ?? []).join("\n\n");
const pipe = (v: string): string[] => v.split("|").map((s) => s.trim());
const text = (v: string | undefined): string => (v ?? "").trim();

export function emptyContentForm(): ContentForm {
  return Object.fromEntries(CONTENT_FIELDS.map((f) => [f, ""])) as ContentForm;
}

/** JSON → the editor's fields. Unknown keys are dropped (they were never rendered). */
export function contentToForm(c: ProgrammeContent): ContentForm {
  return {
    highlights: joinLines(c.highlights),
    whoShouldAttendIntro: text(c.whoShouldAttend?.intro),
    whoShouldAttendRoles: joinLines(c.whoShouldAttend?.roles),
    rationaleHeading: text(c.rationale?.heading),
    rationaleParagraphs: joinParagraphs(c.rationale?.paragraphs),
    rationaleProblems: joinLines(c.rationale?.problems),
    outcomes: joinLines(c.outcomes),
    outcomeGroups: (c.outcomeGroups ?? []).map((g) => [`## ${g.title}`, ...g.items].join("\n")).join("\n"),
    whatYouGet: joinLines(c.whatYouGet),
    included: joinLines(c.included),
    pedagogyIntro: text(c.pedagogy?.intro),
    pedagogyMethods: joinLines(c.pedagogy?.methods),
    pedagogyIndustries: joinLines(c.pedagogy?.industries),
    benefitsIntro: text(c.benefits?.intro),
    benefitsItems: joinLines(c.benefits?.items),
    methodologyName: text(c.methodology?.name),
    methodologySteps: (c.methodology?.steps ?? []).map((s) => `${s.title}: ${s.body}`).join("\n"),
    afterHeading: text(c.afterThisTraining?.heading),
    afterIntro: text(c.afterThisTraining?.intro),
    afterItems: joinLines(c.afterThisTraining?.items),
    faq: (c.faq ?? []).map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n"),
    paceNotes: joinLines(c.paceNotes),
    relationshipNote: text(c.relationshipNote),
    careerPaths: (c.careerPaths ?? []).map((p) => [p.from, p.to, p.challenge, p.helps].join(" | ")).join("\n"),
    valueStack: (c.valueStack ?? []).map((v) => `${v.item} | ${v.value}`).join("\n"),
    valueStackTotal: text(c.valueStackTotal),
    related: joinLines(c.related),
    externalResources: (c.externalResources ?? []).map((r) => [r.label, r.url, r.description].join(" | ")).join("\n"),
    mentorshipPackagesJson: c.mentorshipPackages ? JSON.stringify(c.mentorshipPackages, null, 2) : "",
  };
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_RE = /^https?:\/\/\S+$/i;

/** The editor's fields → JSON, with one message per field that cannot be
 *  read. `content` is returned only when there are no errors. */
export function formToContent(form: ContentForm): { content: ProgrammeContent | null; errors: ContentFieldErrors } {
  const errors: ContentFieldErrors = {};
  const f = (k: keyof ContentForm) => form[k] ?? "";

  const highlights = lines(f("highlights"));
  if (highlights.length === 0) errors.highlights = "Add at least one highlight.";

  const wsaIntro = text(f("whoShouldAttendIntro"));
  const wsaRoles = lines(f("whoShouldAttendRoles"));
  if (!wsaIntro) errors.whoShouldAttendIntro = "Write the introduction.";
  if (wsaRoles.length === 0) errors.whoShouldAttendRoles = "Add at least one role.";

  const rHeading = text(f("rationaleHeading"));
  const rParagraphs = paragraphs(f("rationaleParagraphs"));
  if (!rHeading) errors.rationaleHeading = "Write the heading.";
  if (rParagraphs.length === 0) errors.rationaleParagraphs = "Write at least one paragraph.";
  const rProblems = lines(f("rationaleProblems"));

  const outcomes = lines(f("outcomes"));
  const outcomeGroups: { title: string; items: string[] }[] = [];
  for (const line of lines(f("outcomeGroups"))) {
    if (line.startsWith("## ")) outcomeGroups.push({ title: line.slice(3).trim(), items: [] });
    else if (outcomeGroups.length === 0) {
      errors.outcomeGroups = "Start with a group title line: '## Title'.";
      break;
    } else outcomeGroups[outcomeGroups.length - 1]!.items.push(line);
  }
  if (!errors.outcomeGroups && outcomeGroups.some((g) => !g.title || g.items.length === 0)) errors.outcomeGroups = "Every group needs a title and at least one item.";

  const steps: { title: string; body: string }[] = [];
  for (const line of lines(f("methodologySteps"))) {
    const i = line.indexOf(":");
    if (i <= 0 || !line.slice(i + 1).trim()) {
      errors.methodologySteps = `Write each step as 'Title: body' — could not read: "${line}"`;
      break;
    }
    steps.push({ title: line.slice(0, i).trim(), body: line.slice(i + 1).trim() });
  }
  const methodologyName = text(f("methodologyName"));
  if (!errors.methodologySteps && (methodologyName ? steps.length === 0 : steps.length > 0)) {
    errors.methodologySteps = "Give the learning journey both a name and at least one step, or leave both blank.";
  }

  const faq: { q: string; a: string }[] = [];
  {
    let current: { q: string; a: string } | null = null;
    for (const line of lines(f("faq"))) {
      if (/^Q:/i.test(line)) {
        if (current) faq.push(current);
        current = { q: line.slice(2).trim(), a: "" };
      } else if (/^A:/i.test(line)) {
        if (!current) {
          errors.faq = "An answer line 'A:' must follow a question line 'Q:'.";
          break;
        }
        current.a = (current.a ? `${current.a} ` : "") + line.slice(2).trim();
      } else if (current) {
        current.a = (current.a ? `${current.a} ` : "") + line;
      } else {
        errors.faq = "Start with a question line: 'Q: …'.";
        break;
      }
    }
    if (current) faq.push(current);
    if (!errors.faq && faq.some((x) => !x.q || !x.a)) errors.faq = "Every question needs an answer.";
  }

  const careerPaths: NonNullable<ProgrammeContent["careerPaths"]> = [];
  for (const line of lines(f("careerPaths"))) {
    const parts = pipe(line);
    if (parts.length !== 4 || parts.some((p) => !p)) {
      errors.careerPaths = `Write each path as 'From | To | Challenge | Helps' — could not read: "${line}"`;
      break;
    }
    careerPaths.push({ from: parts[0]!, to: parts[1]!, challenge: parts[2]!, helps: parts[3]! });
  }

  const valueStack: { item: string; value: string }[] = [];
  for (const line of lines(f("valueStack"))) {
    const parts = pipe(line);
    if (parts.length !== 2 || parts.some((p) => !p)) {
      errors.valueStack = `Write each line as 'Item | Value' — could not read: "${line}"`;
      break;
    }
    valueStack.push({ item: parts[0]!, value: parts[1]! });
  }

  const related = lines(f("related"));
  const badSlug = related.find((s) => !SLUG_RE.test(s));
  if (badSlug) errors.related = `"${badSlug}" is not a training address (lowercase letters, digits and hyphens).`;

  const externalResources: { label: string; url: string; description: string }[] = [];
  for (const line of lines(f("externalResources"))) {
    const parts = pipe(line);
    if (parts.length !== 3 || parts.some((p) => !p) || !URL_RE.test(parts[1]!)) {
      errors.externalResources = `Write each resource as 'Label | https://url | Description' — could not read: "${line}"`;
      break;
    }
    externalResources.push({ label: parts[0]!, url: parts[1]!, description: parts[2]! });
  }

  let mentorshipPackages: MentorshipPackage[] | undefined;
  const pkgRaw = text(f("mentorshipPackagesJson"));
  if (pkgRaw) {
    try {
      const parsed: unknown = JSON.parse(pkgRaw);
      if (!Array.isArray(parsed) || parsed.some((p) => !p || typeof p !== "object" || typeof (p as MentorshipPackage).name !== "string" || typeof (p as MentorshipPackage).pricing !== "object")) {
        errors.mentorshipPackagesJson = "Must be a JSON array of packages, each with at least 'name' and 'pricing'.";
      } else mentorshipPackages = parsed as MentorshipPackage[];
    } catch {
      errors.mentorshipPackagesJson = "This is not valid JSON.";
    }
  }

  const pedIntro = text(f("pedagogyIntro"));
  const pedMethods = lines(f("pedagogyMethods"));
  const pedIndustries = lines(f("pedagogyIndustries"));
  if ((pedIntro || pedIndustries.length) && pedMethods.length === 0) errors.pedagogyMethods = "List at least one method, or clear the other 'How you learn' fields.";
  const benIntro = text(f("benefitsIntro"));
  const benItems = lines(f("benefitsItems"));
  if (benIntro && benItems.length === 0) errors.benefitsItems = "List at least one benefit, or clear the introduction.";
  const afterHeading = text(f("afterHeading"));
  const afterIntro = text(f("afterIntro"));
  const afterItems = lines(f("afterItems"));
  if ((afterHeading || afterIntro || afterItems.length) && !(afterHeading && afterIntro && afterItems.length)) {
    errors.afterItems = "'After this training' needs a heading, an introduction and at least one item — or all three blank.";
  }

  if (Object.keys(errors).length) return { content: null, errors };

  const content: ProgrammeContent = {
    highlights,
    whoShouldAttend: { intro: wsaIntro, roles: wsaRoles },
    rationale: { heading: rHeading, paragraphs: rParagraphs, ...(rProblems.length ? { problems: rProblems } : {}) },
    related,
  };
  if (outcomes.length) content.outcomes = outcomes;
  if (outcomeGroups.length) content.outcomeGroups = outcomeGroups;
  const whatYouGet = lines(f("whatYouGet"));
  if (whatYouGet.length) content.whatYouGet = whatYouGet;
  const included = lines(f("included"));
  if (included.length) content.included = included;
  if (pedMethods.length) content.pedagogy = { intro: pedIntro, methods: pedMethods, ...(pedIndustries.length ? { industries: pedIndustries } : {}) };
  if (benItems.length) content.benefits = { intro: benIntro, items: benItems };
  if (methodologyName) content.methodology = { name: methodologyName, steps };
  if (afterHeading) content.afterThisTraining = { heading: afterHeading, intro: afterIntro, items: afterItems };
  if (faq.length) content.faq = faq;
  const paceNotes = lines(f("paceNotes"));
  if (paceNotes.length) content.paceNotes = paceNotes;
  const relationshipNote = text(f("relationshipNote"));
  if (relationshipNote) content.relationshipNote = relationshipNote;
  if (careerPaths.length) content.careerPaths = careerPaths;
  if (valueStack.length) content.valueStack = valueStack;
  const valueStackTotal = text(f("valueStackTotal"));
  if (valueStackTotal) content.valueStackTotal = valueStackTotal;
  if (externalResources.length) content.externalResources = externalResources;
  if (mentorshipPackages) content.mentorshipPackages = mentorshipPackages;
  return { content, errors };
}

/* ------------------------------------------------------------ module points */

/** `programme_modules.points` → editor text: plain points one per line;
 *  a group is "## Title", an optional "> description", then its points. */
export function modulePointsToText(points: ModulePoint[] | null): string {
  if (!points) return "";
  return points
    .map((p) => {
      if (typeof p === "string") return p;
      const g = p as ModulePointGroup;
      return [`## ${g.title}`, ...(g.description ? [`> ${g.description}`] : []), ...(g.points ?? [])].join("\n");
    })
    .join("\n");
}

/** Editor text → the column's JSON; null when empty. A "> description" line
 *  outside a group is an error. */
export function textToModulePoints(value: string): { points: ModulePoint[] | null; error?: string } {
  const out: ModulePoint[] = [];
  for (const line of lines(value)) {
    if (line.startsWith("## ")) {
      out.push({ title: line.slice(3).trim() });
      continue;
    }
    const last = out[out.length - 1];
    const group = last && typeof last !== "string" ? (last as ModulePointGroup) : null;
    if (line.startsWith("> ")) {
      if (!group) return { points: null, error: "A '> description' line must follow a '## Group' line." };
      group.description = line.slice(2).trim();
      continue;
    }
    if (group) group.points = [...(group.points ?? []), line];
    else out.push(line);
  }
  return { points: normaliseModulePoints(out) };
}
