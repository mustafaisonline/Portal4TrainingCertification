import { redirect } from "next/navigation";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { todayIso } from "@/modules/certificates/dates";
import { interestCsv } from "@/modules/commerce/interest-rules";
import { listInterests, toExportRows } from "@/modules/commerce/interest.repository";
import { csvFilename } from "@/modules/reports/csv";

/*
 * GET /admin/interest/export.csv[?training=&format=&notified=] — the Users
 * Interest list as a CSV attachment (CR-2026-10-01-2138, F4). A route handler
 * is not covered by the page's gate, so it re-checks: signed out → sign-in;
 * neither administrator nor a Trainer with a profile → 403. The scope is
 * applied in the repository from the SESSION, never from the query, so a
 * Trainer's file holds only the people interested in their own trainings.
 * Personal data: never cached.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const plain = (body: string, status: number): Response => new Response(body, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(req: Request): Promise<Response> {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/interest")}`);
    return plain("Forbidden", 403);
  }
  const q = new URL(req.url).searchParams;
  const notified = q.get("notified") === "yes" ? "yes" : q.get("notified") === "no" ? "no" : undefined;
  const rows = await listInterests(access.scope, { formatId: q.get("format") ?? undefined, programmeId: q.get("training") ?? undefined, notified });
  return new Response(interestCsv(toExportRows(rows)), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename("users-interest", todayIso(new Date()))}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
