import { describe, expect, it } from "vitest";
import { ORGANISATION_RESULTS_HEADERS, organisationResultsCsv, type ResultCsvRow } from "../../src/modules/assessment/organisation-results-csv";

const row = (over: Partial<ResultCsvRow> = {}): ResultCsvRow => ({
  candidateName: "Ada Lovelace",
  candidateEmail: "ada@example.test",
  roleName: "Data Engineer",
  score: 42,
  size: 100,
  percent: 42,
  finishedAt: new Date("2026-10-01T08:30:00.000Z"),
  timeTakenMs: 754_000,
  ...over,
});

describe("organisationResultsCsv", () => {
  it("writes the header row first, CRLF line ends, and one record per result", () => {
    const lines = organisationResultsCsv([row(), row({ candidateName: "Bo" })]).split("\r\n");
    expect(lines[0]).toBe(ORGANISATION_RESULTS_HEADERS.join(","));
    expect(lines[1]).toBe("Ada Lovelace,ada@example.test,Data Engineer,42,100,42,12.6,2026-10-01T08:30:00.000Z");
    expect(lines[2]).toMatch(/^Bo,/);
    expect(lines[3]).toBe(""); // trailing CRLF
  });

  it("quotes commas, quotes and line breaks in a name", () => {
    const body = organisationResultsCsv([row({ candidateName: 'Lee, "Jo"\nSmith' })]);
    expect(body).toContain('"Lee, ""Jo""\nSmith"');
  });

  it("neutralises spreadsheet formulas in text cells (= + - @)", () => {
    for (const bad of ["=SUM(A1)", "+1", "-2", "@cmd"]) {
      const body = organisationResultsCsv([row({ candidateName: bad, roleName: bad })]);
      expect(body.split("\r\n")[1]!.startsWith(`'${bad}`)).toBe(true);
      expect(body).not.toMatch(new RegExp(`(^|,)${bad.replace(/[+()]/g, "\\$&")}`, "m"));
    }
  });

  it("an empty list is just the header", () => {
    expect(organisationResultsCsv([])).toBe(`${ORGANISATION_RESULTS_HEADERS.join(",")}\r\n`);
  });
});
