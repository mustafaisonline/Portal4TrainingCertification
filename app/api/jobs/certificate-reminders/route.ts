import { timingSafeEqual } from "node:crypto";
import { runCertificateReminders } from "@/modules/certificates/reminders.service";

/*
 * POST /api/jobs/certificate-reminders (M7 plan §2.3; default F2). The
 * scheduler the hosting decision provides (Vercel Cron, a system cron
 * `curl`, a CI schedule) calls this with `Authorization: Bearer
 * <JOBS_SECRET>`. Stateless and safe to repeat: the service recomputes what
 * is due and skips what it already queued.
 *
 *   503 `jobs_disabled`  JOBS_SECRET is unset — the job is switched off
 *   401 `unauthorised`   header missing or token differs (constant-time)
 *   200 counts           every certificate handled
 *   500 counts           one or more certificates failed (they retry next
 *                        run); the scheduler sees a non-2xx and alerts
 *
 * Only POST is exported; Next answers every other method with 405. The
 * token is never logged.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim() || null;
}

function tokenMatches(given: string, expected: string): boolean {
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request): Promise<Response> {
  const secret = process.env["JOBS_SECRET"];
  if (!secret) {
    return Response.json({ error: "jobs_disabled" }, { status: 503 });
  }
  const token = bearerToken(req);
  if (!token || !tokenMatches(token, secret)) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }
  try {
    const result = await runCertificateReminders();
    return Response.json(result, { status: result.failed > 0 ? 500 : 200 });
  } catch (err) {
    console.error("[jobs] certificate-reminders run failed", err);
    return Response.json({ error: "run_failed" }, { status: 500 });
  }
}
