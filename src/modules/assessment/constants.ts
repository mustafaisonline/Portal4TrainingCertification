/*
 * Role tests — Prepare for Interview and Organisation Interview Screening
 * (CR-2026-10-01-1711, P2–P4). PURE constants (no database, no framework) so
 * client components, the repositories, the pages and the tests share ONE
 * definition. Founder decisions: 100 questions, 90 minutes, an organisation's
 * own approved questions always appear (up to 20), a private role needs at least
 * 10 approved questions before it is listed.
 */

/** A test draws up to this many questions (fewer while a bank is smaller). */
export const ROLE_TEST_SIZE = 100;
/** Ninety minutes from `started_at` — DERIVED, no column; the server enforces it. */
export const ROLE_TEST_TIME_LIMIT_MS = 90 * 60_000;
/** At most this many of an organisation's own approved questions go into one test. */
export const ORG_QUESTION_CAP = 20;
/** An organisation's PRIVATE role is listed only with at least this many approved questions. */
export const MIN_PRIVATE_ROLE_QUESTIONS = 10;
/** Every question has exactly five options and exactly one correct. */
export const OPTIONS_PER_QUESTION = 5;
/** Questions on one page of a running test. */
export const QUESTIONS_PER_PAGE = 10;
/** Rows per page of the administrator's / organisation's question and result lists. */
export const ADMIN_PAGE_SIZE = 20;
/** The most rows one results export returns. */
export const RESULTS_EXPORT_LIMIT = 5000;

export const QUESTION_STATUSES = ["draft", "pending", "reviewed", "rejected"] as const;
export type RoleQuestionStatus = (typeof QUESTION_STATUSES)[number];
/** Statuses in which a question may still be edited or deleted (never `reviewed`). */
export const EDITABLE_STATUSES: readonly RoleQuestionStatus[] = ["draft", "pending", "rejected"];

export const ORGANISATION_TYPES = ["company", "education"] as const;
export type OrganisationType = (typeof ORGANISATION_TYPES)[number];

/* Content limits (characters, after trimming). */
export const CATEGORY_MIN = 2;
export const CATEGORY_MAX = 80;
export const STEM_MIN = 10;
export const STEM_MAX = 1000;
export const OPTION_MAX = 500;
export const MODEL_ANSWER_MIN = 20;
export const MODEL_ANSWER_MAX = 6000;
export const SOURCE_MAX = 500;
export const NAME_MIN = 2;
export const NAME_MAX = 120;
export const DESCRIPTION_MAX = 1000;
export const SLUG_MAX = 80;
export const EMAIL_MAX = 254;
