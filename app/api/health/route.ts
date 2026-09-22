import { healthCheck } from "@/config/health";

/*
 * GET /api/health (Milestone 9 §2 item 1). Public, unauthenticated, cheap.
 * 200 when the database answers; 503 otherwise. Never cached — every probe
 * is a real round-trip, which is the point of an uptime check.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const report = await healthCheck();
  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
