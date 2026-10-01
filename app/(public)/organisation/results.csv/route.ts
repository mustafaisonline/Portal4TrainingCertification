import { redirect } from "next/navigation";
import { todayIso } from "@/modules/certificates/dates";
import { isOrganisationUser } from "@/modules/identity/roles.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { listAllResultsForOrganisation } from "@/modules/assessment/attempts.repository";
import { organisationResultsCsv } from "@/modules/assessment/organisation-results-csv";
import { isOrganisationMember, organisationForUser } from "@/modules/assessment/organisations.repository";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { csvFilename } from "@/modules/reports/csv";

/*
 * GET /organisation/results.csv[?role=<role id>] — the Results tab as a CSV
 * attachment (CR-2026-10-01-1711, P4). A route handler is not covered by the
 * page's gate, so it re-checks: signed out → sign-in; no Organisation role or
 * not a member of the organisation → 403. The organisation comes from the
 * SESSION, never from the query. Only that organisation's candidates who
 * agreed to share their result are included. Never cached (personal data).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const plain = (body: string, status: number): Response => new Response(body, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?return-to=${encodeURIComponent("/organisation?tab=results")}`);
  if (!isOrganisationUser(user.roles)) return plain("Forbidden", 403);
  const organisation = await organisationForUser(user.id);
  if (!organisation || !(await isOrganisationMember(user.id, organisation.id))) return plain("Forbidden", 403);

  const role = new URL(req.url).searchParams.get("role") ?? "";
  if (role !== "" && !isUuid(role)) return plain("Not found", 404);
  const rows = await listAllResultsForOrganisation(organisation.id, role ? { roleId: role } : {});
  return new Response(organisationResultsCsv(rows), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename(`${organisation.slug}-results`, todayIso(new Date()))}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
