import type { Metadata } from "next";
import { authorise } from "@/modules/identity/session";
import { buildAllReports } from "@/modules/reports/registry";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * /admin/reports — every report in the catalogue as a table, each with a
 * CSV download (Milestone 8 plan §2 item 6). Computed from the tables on
 * this request; the download is the same data through
 * app/admin/reports/[report]/csv/route.ts.
 */
export const metadata: Metadata = { title: "Reports" };

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const gate = await authorise("platform_admin");
  if (!gate.ok) return null; // the layout has already refused
  const now = new Date();
  const reports = await buildAllReports(now);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Figures</p>
        <h1 className="text-display" data-testid="admin-reports-title">
          Reports
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          Computed from the database at {formatTimestamp(now)}. Months are Malaysia calendar months; amounts stay in each order&apos;s own currency. Download any table as CSV for a spreadsheet.
        </p>
      </header>

      {reports.map((report) => (
        <Card key={report.key} variant="panel" className="p-0" data-testid={`report-${report.key}`}>
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6">
            <div>
              <h2 className="text-h2">{report.title}</h2>
              <p className="text-body-sm mt-1 max-w-[70ch] text-[var(--color-ink-quiet)]">{report.description}</p>
            </div>
            <Button variant="secondary" href={`/admin/reports/${report.key}/csv`} prefetch={false} data-testid={`report-csv-${report.key}`}>
              Download CSV
            </Button>
          </div>
          {/* A scrollable region must be keyboard-reachable (axe
              scrollable-region-focusable): the tables hold no links, so the
              container itself takes focus. */}
          <div className="mt-4 overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]" tabIndex={0} role="region" aria-label={`${report.title} table`}>
            <table className="text-body-sm w-full border-collapse" data-testid={`report-table-${report.key}`}>
              <thead>
                <tr className="border-t border-b border-[var(--color-line)] text-left">
                  {report.headers.map((h) => (
                    <th key={h} scope="col" className="text-label px-6 py-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.display.length === 0 ? (
                  <tr>
                    <td colSpan={report.headers.length} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                      Nothing to report yet.
                    </td>
                  </tr>
                ) : (
                  report.display.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="report-row">
                      {row.map((cell, j) => (
                        <td key={j} className="px-6 py-3 whitespace-nowrap text-[var(--color-ink)]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {report.note ? <p className="text-body-sm px-6 py-4 text-[var(--color-ink-faint)]">{report.note}</p> : <div className="pb-2" />}
        </Card>
      ))}
    </div>
  );
}
