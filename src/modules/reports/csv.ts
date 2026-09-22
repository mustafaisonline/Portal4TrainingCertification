/*
 * Hand-written CSV (Milestone 8 plan §2 item 6: "no library — hand-written
 * CSV with proper quoting"). Pure: no I/O, no clock, safe in any runtime.
 *
 * Format — RFC 4180:
 *   - records end with CRLF; the header row comes first;
 *   - a field is wrapped in double quotes when it contains a comma, a double
 *     quote, a CR or an LF; a double quote inside is doubled ("");
 *   - anything else is written as is.
 *
 * Spreadsheet formula injection: Excel, Numbers and Sheets evaluate a cell
 * that begins with `=`, `+`, `-` or `@` (and some treat a leading tab or CR
 * the same way). A report can carry text a member of the public typed — an
 * enquiry message, a holder name, an email — so a STRING that starts with
 * one of those characters is prefixed with a single quote (`'`), which the
 * spreadsheet shows as text and never evaluates. Numbers are written raw
 * (a negative net figure stays `-12.5`) because they arrive as numbers, not
 * text, and are therefore never attacker-controlled formulas.
 */

export type CsvCell = string | number | bigint | boolean | Date | null | undefined;

const NEEDS_QUOTES = /[",\r\n]/;
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvField(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number" || typeof cell === "bigint") return String(cell);
  if (typeof cell === "boolean") return cell ? "true" : "false";
  if (cell instanceof Date) return Number.isNaN(cell.getTime()) ? "" : cell.toISOString();
  const text = FORMULA_PREFIX.test(cell) ? `'${cell}` : cell;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The header row, then one record per row; each row is padded or cut to
 *  the header's width so every record has the same number of fields. */
export function toCsv(headers: readonly string[], rows: readonly (readonly CsvCell[])[]): string {
  const width = headers.length;
  const line = (cells: readonly CsvCell[]) => {
    const out: string[] = [];
    for (let i = 0; i < width; i += 1) out.push(csvField(cells[i]));
    return out.join(",");
  };
  return [line(headers), ...rows.map(line)].join("\r\n") + "\r\n";
}

/** A safe attachment filename: lower-case, ASCII letters, digits and
 *  hyphens only, `.csv` appended. */
export function csvFilename(stem: string, dateIso: string): string {
  const clean = stem.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "report";
  return `${clean}-${dateIso}.csv`;
}
