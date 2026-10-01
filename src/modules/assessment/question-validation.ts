import { CATEGORY_MAX, CATEGORY_MIN, DESCRIPTION_MAX, EMAIL_MAX, MODEL_ANSWER_MAX, MODEL_ANSWER_MIN, NAME_MAX, NAME_MIN, OPTION_MAX, OPTIONS_PER_QUESTION, SLUG_MAX, SOURCE_MAX, STEM_MAX, STEM_MIN } from "./constants";
import { AssessmentError } from "./errors";

/*
 * Pure validators for role-test content (questions, roles, organisations).
 * No database import, so a form (client) and the repositories share them —
 * like `profile-validation.ts`. Every function trims, checks and returns the
 * normalised value, or throws `AssessmentError("invalid_input")`.
 */

// eslint-disable-next-line no-control-regex -- refuses control characters other than tab / line breaks
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type QuestionContent = {
  category: string;
  stem: string;
  /** Exactly five, in display order; exactly one `isCorrect`. */
  options: { text: string; isCorrect: boolean }[];
  modelAnswer: string;
  source?: string | null;
};

export type ValidQuestionContent = {
  category: string;
  stem: string;
  options: { text: string; isCorrect: boolean }[];
  modelAnswer: string;
  source: string | null;
};

function bad(prefix: string, message: string): never {
  throw new AssessmentError("invalid_input", prefix ? `${prefix}: ${message}` : message);
}

function text(value: unknown, label: string, min: number, max: number, prefix: string): string {
  const s = String(value ?? "").trim();
  if (s.length < min || s.length > max) bad(prefix, `${label} must be ${min}–${max} characters`);
  if (CONTROL_CHARS.test(s)) bad(prefix, `${label} contains control characters`);
  return s;
}

/** Trim and check one question. `index` (0-based) prefixes the message for batch imports. */
export function validateQuestionContent(raw: QuestionContent, index?: number): ValidQuestionContent {
  const prefix = index === undefined ? "" : `question ${index + 1}`;
  const category = text(String(raw.category ?? "").replace(/\s+/g, " "), "the category", CATEGORY_MIN, CATEGORY_MAX, prefix);
  const stem = text(raw.stem, "the question", STEM_MIN, STEM_MAX, prefix);
  if (!Array.isArray(raw.options) || raw.options.length !== OPTIONS_PER_QUESTION) bad(prefix, `exactly ${OPTIONS_PER_QUESTION} options are required`);
  const options = raw.options.map((o) => ({ text: text(o?.text, "every option", 1, OPTION_MAX, prefix), isCorrect: o?.isCorrect === true }));
  if (options.filter((o) => o.isCorrect).length !== 1) bad(prefix, "exactly one option must be correct");
  if (new Set(options.map((o) => o.text.toLowerCase())).size !== options.length) bad(prefix, "options must be distinct");
  const modelAnswer = text(raw.modelAnswer, "the model answer", MODEL_ANSWER_MIN, MODEL_ANSWER_MAX, prefix);
  const source = raw.source === undefined || raw.source === null || String(raw.source).trim() === "" ? null : text(raw.source, "the source note", 1, SOURCE_MAX, prefix);
  return { category, stem, options, modelAnswer, source };
}

/** Lower-case URL slug of a name ("Data Engineer" → "data-engineer"); "" when nothing usable remains. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export function validateSlug(value: string): string {
  const slug = String(value ?? "").trim();
  if (!SLUG_RE.test(slug) || slug.length > SLUG_MAX) bad("", `the URL name must be lower-case letters, digits and single hyphens (up to ${SLUG_MAX} characters)`);
  return slug;
}

export function validateName(value: unknown, label = "the name"): string {
  return text(String(value ?? "").replace(/\s+/g, " "), label, NAME_MIN, NAME_MAX, "");
}

export function validateDescription(value: unknown): string {
  return text(value, "the description", 0, DESCRIPTION_MAX, "");
}

export function validateContactEmail(value: unknown): string {
  const email = String(value ?? "").trim().toLowerCase();
  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) bad("", "a valid contact email is required");
  return email;
}

/** A logo is a site path ("/logos/ypt.svg") or an https URL; empty means none. */
export function validateLogoPath(value: unknown): string | null {
  const s = String(value ?? "").trim();
  if (s === "") return null;
  const shapeOk = (s.startsWith("/") && !s.startsWith("//")) || /^https:\/\//.test(s);
  if (s.length > 500 || CONTROL_CHARS.test(s) || /\s/.test(s) || !shapeOk) bad("", "the logo must be a site path starting with / or an https:// address");
  return s;
}
