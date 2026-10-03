import { redirect } from "next/navigation";
import { getAttendanceSheet } from "@/modules/attendance/repository";
import { participantsCsv } from "@/modules/attendance/participants-tools";
import { formatDateRange } from "@/shared/util/dates";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { todayIso } from "@/modules/certificates/dates";
import { csvFilename } from "@/modules/reports/csv";

/*
 * GET /admin/attendance/[offeringId]/export.csv — the confirmed (paid) participants of one date as a CSV attachment
 * (CR-2026-10-03-2045, option B). A route handler is not covered by the page's gate, so it re-checks: signed out →
 * sign-in; neither an administrator nor a Trainer with a profile → 403. The scope comes from the SESSION, so a
 * Trainer's request for a date that is not theirs is a 404 and reveals nothing. Personal data: never cached.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const plain = (body: string, status: number): Response => new Response(body, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(_req: Request, ctx: { params: Promise<{ offeringId: string }> }): Promise<Response> {
  const { offeringId } = await ctx.params;
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/attendance/${offeringId}`)}`);
    return plain("Forbidden", 403);
  }
  const sheet = await getAttendanceSheet(offeringId, access.scope);
  if (!sheet) return plain("Not found", 404);
  const dates = formatDateRange(sheet.offering.startsOn, sheet.offering.endsOn);
  return new Response(participantsCsv(sheet, dates), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename(`participants-${sheet.offering.programmeSlug}`, todayIso(new Date()))}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
