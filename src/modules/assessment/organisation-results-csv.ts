import { toCsv } from "@/modules/reports/csv";

/*
 * The organisation's results export (CR-2026-10-01-1711, P4): the table the
 * Results tab shows, as RFC 4180 CSV. Pure — `toCsv` already quotes fields and
 * guards spreadsheet formulas (a candidate's NAME is typed by a member of the
 * public, so a cell starting = + - @ is written with a leading quote).
 */

export const ORGANISATION_RESULTS_HEADERS = ["Candidate name", "Email", "Role", "Score", "Out of", "Percent", "Time taken (minutes)", "Finished (UTC)"] as const;

export type ResultCsvRow = {
  candidateName: string;
  candidateEmail: string;
  roleName: string;
  score: number;
  size: number;
  percent: number;
  finishedAt: Date;
  timeTakenMs: number;
};

export function organisationResultsCsv(rows: readonly ResultCsvRow[]): string {
  return toCsv(
    ORGANISATION_RESULTS_HEADERS,
    rows.map((r) => [r.candidateName, r.candidateEmail, r.roleName, r.score, r.size, r.percent, Math.round(r.timeTakenMs / 6000) / 10, r.finishedAt]),
  );
}
