import type { EmailMessage } from "@/modules/notifications/email";
import { CERTIFICATE_TIMEZONE } from "./constants";
import { daysBetween, formatCalendarDate } from "./dates";
import type { StatusInput } from "./rules";

/*
 * Renewal reminders — the PURE rule (Milestone 7; MILESTONE_7_EXECUTION_PLAN
 * .md §2.1, defaults F1 and F4; COMPLETION_CERTIFICATE_REQUIREMENTS.md §3.3
 * R-L7). No clock reads, no database: callers pass today's MYT calendar date
 * (`todayIso` from ./dates), exactly as rules.ts does.
 *
 * Three stages, each due ONCE per expiry cycle (the service enforces "once"
 * through the audit log; this file only answers "which stage is due today"):
 *
 *   before_30   30 ≥ days left > 7    — the renewal window has opened
 *   before_7     7 ≥ days left ≥ 0    — last week, expiry day included
 *   lapsed_1    −1 ≥ days left ≥ −30  — expired; renewal is still open
 *
 * Only the MOST specific stage is due at a time: a certificate first seen
 * with 6 days left gets the 7-day reminder, never a late 30-day one (plan
 * §2.1). A revoked certificate is never reminded (F4). Beyond 30 days after
 * expiry nothing is sent — a holder who let the certificate lapse a month
 * ago has had all three messages (or missed the cycle before the job
 * existed) and must not be nagged indefinitely; the service's scan window
 * is the same ±30 days, so the two agree by construction.
 */

export const REMINDER_STAGES = ["before_30", "before_7", "lapsed_1"] as const;
export type ReminderStage = (typeof REMINDER_STAGES)[number];

/** How far either side of today the job looks (calendar days, MYT). */
export const REMINDER_WINDOW_DAYS = 30;

export const REMINDER_STAGE_LABEL: Record<ReminderStage, string> = {
  before_30: "30 days before expiry",
  before_7: "7 days before expiry",
  lapsed_1: "After expiry",
};

export function isReminderStage(value: unknown): value is ReminderStage {
  return typeof value === "string" && (REMINDER_STAGES as readonly string[]).includes(value);
}

/** `outbound_emails.template_key` for a stage: "certificate.reminder.before_30". */
export function reminderTemplateKey(stage: ReminderStage): string {
  return `certificate.reminder.${stage}`;
}

/** The one stage due for this certificate today, or null. */
export function dueStage(c: StatusInput, today: string): ReminderStage | null {
  if (c.revokedAt) return null;
  const left = daysBetween(today, c.expiresOn);
  if (left >= 0 && left <= 7) return "before_7";
  if (left > 7 && left <= 30) return "before_30";
  if (left <= -1 && left >= -REMINDER_WINDOW_DAYS) return "lapsed_1";
  return null;
}

/** As a list — empty, or exactly one element (plan §2.1). */
export function dueStages(c: StatusInput, today: string): ReminderStage[] {
  const stage = dueStage(c, today);
  return stage ? [stage] : [];
}

/* ---------------------------------------------------------------- messages */

/** "USD 10.00" — two decimals always, the way the fee screen prints it. */
export function formatFee(amountMinor: number, currency: string): string {
  return `${currency} ${(amountMinor / 100).toFixed(2)}`;
}

const SIGN_OFF = "\n\n— Data & AI Academy\nThis is an automated message; replies are not monitored.";

export type ReminderMessageInput = {
  stage: ReminderStage;
  to: string;
  name: string;
  certificateId: string;
  programmeTitle: string;
  /** Calendar date (YYYY-MM-DD). */
  expiresOn: string;
  /** Absolute link to the holder's certificate page, where renewal starts. */
  renewalUrl: string;
  /** The fee in force now; null only on a database that was never seeded. */
  fee: { amountMinor: number; currency: string } | null;
};

export function reminderSubject(stage: ReminderStage, certificateId: string, expiresOn: string): string {
  const date = formatCalendarDate(expiresOn);
  switch (stage) {
    case "before_30":
      return `Your certificate ${certificateId} expires on ${date}`;
    case "before_7":
      return `One week left: certificate ${certificateId} expires on ${date}`;
    case "lapsed_1":
      return `Your certificate ${certificateId} expired on ${date}`;
  }
}

function feeSentence(fee: ReminderMessageInput["fee"]): string {
  return fee ? `Renewal costs ${formatFee(fee.amountMinor, fee.currency)} and extends the certificate by 12 months.` : "Renewal extends the certificate by 12 months.";
}

/** Plain text, like every certificate email (emails.ts). Names the holder,
 *  the certificate ID, the expiry date, the fee and where to renew. */
export function reminderMessage(input: ReminderMessageInput): EmailMessage {
  const date = formatCalendarDate(input.expiresOn);
  const opening =
    input.stage === "before_30"
      ? `Your Certificate of Completion for ${input.programmeTitle} is active until ${date}. Renewal is open from now until the certificate lapses — and after.`
      : input.stage === "before_7"
        ? `Your Certificate of Completion for ${input.programmeTitle} expires in a week, on ${date}. Renewing before then keeps it active without a gap.`
        : `Your Certificate of Completion for ${input.programmeTitle} expired on ${date}. It no longer verifies as active, but you can still renew it.`;
  const timing = input.stage === "lapsed_1" ? "A renewal now runs for 12 months from the day you renew." : "A renewal made on time runs from the current expiry date, so no paid time is lost.";
  return {
    to: input.to,
    templateKey: reminderTemplateKey(input.stage),
    subject: reminderSubject(input.stage, input.certificateId, input.expiresOn),
    text:
      `Hello ${input.name},\n\n` +
      `${opening}\n\n` +
      `Certificate ID: ${input.certificateId}\n` +
      `${input.stage === "lapsed_1" ? "Expired on" : "Active until"}: ${date}\n\n` +
      `${feeSentence(input.fee)} ${timing}\n\n` +
      `Renew from your account:\n${input.renewalUrl}\n\n` +
      `If you have already renewed, thank you — no further action is needed.` +
      SIGN_OFF,
  };
}

/* ------------------------------------------------------------ run display */

const runTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: CERTIFICATE_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "23 Sep 2026, 08:00 MYT" — when the job last ran, in the certificate zone. */
export function formatRunTime(at: Date): string {
  return `${runTimeFormat.format(at)} MYT`;
}
