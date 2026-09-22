import { describe, expect, it } from "vitest";
import { csvField, csvFilename, toCsv } from "@/modules/reports/csv";

/*
 * Hand-written CSV (src/modules/reports/csv.ts) — Milestone 8 plan §4
 * criterion 5: commas, quotes and newlines are quoted per RFC 4180, and a
 * cell that a spreadsheet would evaluate as a formula is neutralised.
 */
describe("csvField", () => {
  it("leaves plain text, numbers and booleans alone", () => {
    expect(csvField("hello")).toBe("hello");
    expect(csvField(42)).toBe("42");
    expect(csvField(-12.5)).toBe("-12.5");
    expect(csvField(BigInt(499900))).toBe("499900");
    expect(csvField(true)).toBe("true");
    expect(csvField(false)).toBe("false");
  });

  it("writes null and undefined as empty fields and dates as ISO instants", () => {
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
    expect(csvField(new Date("2026-09-23T01:02:03.000Z"))).toBe("2026-09-23T01:02:03.000Z");
    expect(csvField(new Date("not a date"))).toBe("");
  });

  it("quotes a field containing a comma, a quote, a CR or an LF, doubling inner quotes", () => {
    expect(csvField("Kuala Lumpur, Malaysia")).toBe('"Kuala Lumpur, Malaysia"');
    expect(csvField('She said "hi"')).toBe('"She said ""hi"""');
    expect(csvField("line one\nline two")).toBe('"line one\nline two"');
    expect(csvField("line one\r\nline two")).toBe('"line one\r\nline two"');
    expect(csvField('a,"b"\nc')).toBe('"a,""b""\nc"');
  });

  it.each(["=1+1", "+60123456789", "-cmd", "@SUM(A1)", "\tstart", "\rstart"])("prefixes a string starting with a formula trigger (%j) with an apostrophe", (input) => {
    const out = csvField(input);
    expect(out.replace(/^"/, "").startsWith("'")).toBe(true);
  });

  it("applies the formula guard before quoting, so a triggering field with a comma is both prefixed and quoted", () => {
    expect(csvField("=HYPERLINK(\"http://evil\",\"x\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\",\"\"x\"\")\"");
    expect(csvField("-1,000")).toBe("\"'-1,000\"");
  });

  it("does not guard a negative NUMBER (it is not attacker text)", () => {
    expect(csvField(-1000)).toBe("-1000");
  });
});

describe("toCsv", () => {
  it("emits the header row first and CRLF record separators, ending with CRLF", () => {
    const out = toCsv(["a", "b"], [["1", "2"], ["3", "4"]]);
    expect(out).toBe("a,b\r\n1,2\r\n3,4\r\n");
  });

  it("pads short rows and cuts long rows to the header width", () => {
    const out = toCsv(["a", "b", "c"], [["1"], ["1", "2", "3", "4"]]);
    expect(out).toBe("a,b,c\r\n1,,\r\n1,2,3\r\n");
  });

  it("quotes headers too", () => {
    expect(toCsv(['Net "after" refunds', "Fees, known"], [])).toBe('"Net ""after"" refunds","Fees, known"\r\n');
  });

  it("round-trips a mixed row", () => {
    const out = toCsv(["Name", "Email", "Amount", "Note"], [["Ali, Bin", "ali@example.test", 4999, "=2+2"]]);
    expect(out).toBe('Name,Email,Amount,Note\r\n"Ali, Bin",ali@example.test,4999,\'=2+2\r\n');
  });
});

describe("csvFilename", () => {
  it("lower-cases, hyphenates and dates the stem", () => {
    expect(csvFilename("revenue-by-month", "2026-09-23")).toBe("revenue-by-month-2026-09-23.csv");
    expect(csvFilename("Registrations per Offering!", "2026-09-23")).toBe("registrations-per-offering-2026-09-23.csv");
    expect(csvFilename("***", "2026-09-23")).toBe("report-2026-09-23.csv");
  });
});
