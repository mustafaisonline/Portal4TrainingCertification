import { toCsv } from "@/modules/reports/csv";

/*
 * "Register your interest" — the pure rules (CR-2026-10-01-2138; no database,
 * safe for tests and for client components).
 *
 * The form: email is required; full name, mobile number and date of birth are
 * optional; the person must tick that the trainer of this training may contact
 * them. Everything is validated here, on the server side of the action, never
 * only in the browser.
 *
 * The email helpers exist because the portal has no email provider yet
 * (EMAIL_TRANSPORT=log): a trainer tells the interested people about a
 * schedule by copying the addresses, opening a ready-made BCC message, or
 * downloading a CSV — and then marking them notified. Real sending is a
 * separate approval.
 */

export const INTEREST_EMAIL_MAX = 254;
export const INTEREST_NAME_MAX = 120;
export const INTEREST_MOBILE_MAX = 24;

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const MOBILE_RE = /^\+?[0-9][0-9 ()\-]{5,22}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export type InterestFormRaw = {
  email: string;
  fullName?: string;
  mobile?: string;
  dateOfBirth?: string;
  consent: boolean;
};

export type InterestFormValues = {
  email: string;
  fullName: string | null;
  mobile: string | null;
  dateOfBirth: Date | null;
  consent: true;
};

export type InterestFormField = "email" | "fullName" | "mobile" | "dateOfBirth" | "consent";
export type InterestFormResult = { ok: true; values: InterestFormValues } | { ok: false; fieldErrors: Partial<Record<InterestFormField, string>> };

export function validateInterestForm(raw: InterestFormRaw, now = new Date()): InterestFormResult {
  const errors: Partial<Record<InterestFormField, string>> = {};

  const email = String(raw.email ?? "").trim().toLowerCase();
  if (!email) errors.email = "Enter your email address — it is required.";
  else if (email.length > INTEREST_EMAIL_MAX || CONTROL_CHARS.test(email) || !EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";

  const fullName = String(raw.fullName ?? "").replace(/\s+/g, " ").trim();
  if (fullName.length > INTEREST_NAME_MAX || CONTROL_CHARS.test(fullName)) errors.fullName = `Keep the name to ${INTEREST_NAME_MAX} characters.`;

  const mobile = String(raw.mobile ?? "").trim();
  if (mobile && (mobile.length > INTEREST_MOBILE_MAX || !MOBILE_RE.test(mobile))) errors.mobile = "Enter a mobile number with digits only, spaces, + - ( ), e.g. +60 12 345 6789.";

  let dateOfBirth: Date | null = null;
  const dobRaw = String(raw.dateOfBirth ?? "").trim();
  if (dobRaw) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobRaw);
    const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
    const valid = d !== null && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dobRaw;
    if (!valid) errors.dateOfBirth = "Enter your date of birth as a valid date.";
    else if (d!.getTime() > now.getTime() || d!.getUTCFullYear() < 1900) errors.dateOfBirth = "Enter a date of birth in the past.";
    else dateOfBirth = d;
  }

  if (raw.consent !== true) errors.consent = "Please tick the box so the trainer may contact you about this training.";

  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, values: { email, fullName: fullName || null, mobile: mobile || null, dateOfBirth, consent: true } };
}

/* -------------------------------------------------- the trainer's helpers */

export type InterestExportRow = {
  trainingTitle: string;
  formatName: string;
  fullName: string | null;
  email: string;
  mobile: string | null;
  dateOfBirth: Date | null;
  registeredAt: Date;
  feeWaived: boolean;
  notifiedAt: Date | null;
};

export const INTEREST_CSV_HEADERS = ["Training", "Format", "Full name", "Email", "Mobile", "Date of birth", "Registered (UTC)", "Fee", "Notified (UTC)"] as const;

/** RFC 4180 CSV; `toCsv` quotes fields and guards spreadsheet formulas (a name is typed by a member of the public). */
export function interestCsv(rows: readonly InterestExportRow[]): string {
  return toCsv(
    INTEREST_CSV_HEADERS,
    rows.map((r) => [r.trainingTitle, r.formatName, r.fullName ?? "", r.email, r.mobile ?? "", r.dateOfBirth ? r.dateOfBirth.toISOString().slice(0, 10) : "", r.registeredAt, r.feeWaived ? "Waived" : "Paid", r.notifiedAt ?? ""]),
  );
}

/** The addresses as one comma-separated line (de-duplicated, order kept). */
export function emailList(emails: readonly string[]): string {
  return [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))].join(", ");
}

export type InterestEmailDraftInput = {
  trainingTitle: string;
  formatName: string;
  /** Plain-text schedule lines the trainer can edit, e.g. "12–16 Jan 2027 · Live online". Empty when no date exists yet. */
  scheduleLines: readonly string[];
  /** Where the person registers (the training's public page). */
  registerUrl: string;
  /** The sender's name, for the sign-off. */
  trainerName?: string | null;
};

export type InterestEmailDraft = { subject: string; body: string };

export function interestEmailDraft(input: InterestEmailDraftInput): InterestEmailDraft {
  const schedule = input.scheduleLines.length > 0 ? input.scheduleLines.map((l) => `  • ${l}`).join("\n") : "  • (add the date, time and place here)";
  return {
    subject: `${input.trainingTitle} (${input.formatName}) — dates are now open`,
    body:
      `Hello,\n\n` +
      `You registered your interest in ${input.trainingTitle} — ${input.formatName}. Thank you.\n\n` +
      `The training is now scheduled:\n${schedule}\n\n` +
      `To take your place, please register on the portal:\n${input.registerUrl}\n\n` +
      `Seats are limited. If these dates do not suit you, reply to this email and tell us what would.\n\n` +
      `Kind regards,\n${input.trainerName?.trim() || "The trainer"}`,
  };
}

/** Browsers and mail apps cut a `mailto:` link near 2,000 characters; past this, only copy / CSV are offered. */
export const MAILTO_MAX_LENGTH = 1800;

/** A `mailto:` link with everyone in BCC, or null when it would be too long to open reliably. */
export function bccMailto(emails: readonly string[], draft: InterestEmailDraft): string | null {
  const list = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (list.length === 0) return null;
  const href = `mailto:?bcc=${encodeURIComponent(list.join(","))}&subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
  return href.length <= MAILTO_MAX_LENGTH ? href : null;
}
