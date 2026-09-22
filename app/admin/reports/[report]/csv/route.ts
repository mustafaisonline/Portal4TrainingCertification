import { redirect } from "next/navigation";
import { authorise } from "@/modules/identity/session";
import { todayIso } from "@/modules/certificates/dates";
import { csvFilename, toCsv } from "@/modules/reports/csv";
import { buildReport, isReportKey } from "@/modules/reports/registry";

/*
 * GET /admin/reports/[report]/csv (Milestone 8 plan §2 item 6). The same
 * table the page shows, as an RFC 4180 CSV attachment. A route handler is
 * not covered by the admin layout's gate, so it authorises `platform_admin`
 * itself: signed out → sign-in with a return path; no role → 403; unknown
 * report → 404. Never cached (personal data may be inside).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ report: string }> }): Promise<Response> {
  const gate = await authorise("platform_admin");
  if (!gate.ok) {
    if (gate.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/reports")}`);
    return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
  }
  const { report } = await params;
  if (!isReportKey(report)) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });

  const now = new Date();
  const table = await buildReport(report, now);
  const body = toCsv(table.headers, table.rows);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename(report, todayIso(now))}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
