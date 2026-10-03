import { bccMailto, emailList, type InterestEmailDraft } from "@/modules/commerce/interest-rules";
import { toCsv } from "@/modules/reports/csv";
import type { AttendanceSheet } from "./repository";

/*
 * The trainer's tools for the people who PAID for a date (CR-2026-10-03-2045, option B; founder 2026-10-03: the portal
 * does not send email for trainers — "show trainer who registered the interest or who paid"; they write from their own
 * DataAI Nexus mailbox). The same three tools as Users Interest: copy the addresses, open one message with everyone in
 * BCC, download a CSV. Pure — no I/O. Only what the attendance sheet already shows the trainer is exported.
 */

export const PARTICIPANTS_CSV_HEADERS = ["Training", "Dates", "Full name", "Email", "Date of birth", "Country", "Attended"] as const;

const attendedWord = (a: boolean | null) => (a === null ? "" : a ? "Yes" : "No");

/** RFC 4180 CSV via `toCsv` (quoting + spreadsheet-formula guard: names are typed by members of the public). */
export function participantsCsv(sheet: Pick<AttendanceSheet, "offering" | "rows">, datesLabel: string): string {
  return toCsv(
    PARTICIPANTS_CSV_HEADERS,
    sheet.rows.map((r) => [sheet.offering.programmeTitle, datesLabel, r.displayName, r.user.email, r.dateOfBirth ?? "", r.country ?? "", attendedWord(r.attended)]),
  );
}

export const participantEmails = (sheet: Pick<AttendanceSheet, "rows">): string => emailList(sheet.rows.map((r) => r.user.email));

/** A short, honest starting message for the trainer to edit — no invented policy, just the training and its dates. */
export function participantsDraft(trainingTitle: string, datesLabel: string, trainerName?: string | null): InterestEmailDraft {
  return {
    subject: `${trainingTitle} — ${datesLabel}`,
    body: `Hello,\n\nA note about ${trainingTitle} (${datesLabel}):\n\n(write your message here)\n\nKind regards,\n${trainerName?.trim() || "The trainer"}`,
  };
}

/** `mailto:` with everyone in BCC, or null when it would be too long to open reliably (then: copy the addresses). */
export function participantsMailto(sheet: Pick<AttendanceSheet, "rows">, draft: InterestEmailDraft): string | null {
  return bccMailto(sheet.rows.map((r) => r.user.email), draft);
}
