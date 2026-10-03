import { runCertificateReminders } from "@/modules/certificates/reminders.service";
import { purgeReadBefore } from "@/modules/notifications/notifications.repository";
import { runPassEndingReminders } from "@/modules/agentic/pass-reminders";
import { jobsAuthProblem } from "@/modules/platform/jobs-auth";

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

export async function POST(req: Request): Promise<Response> {
  const denied = jobsAuthProblem(req);
  if (denied) return denied;
  try {
    const result = await runCertificateReminders();
    // Daily housekeeping on the same schedule (CR-2026-10-03-1228): READ notifications older than 12 months go; unread stay.
    const notificationsPurged = await purgeReadBefore(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).catch((err) => {
      console.error("[jobs] notification retention failed", err);
      return 0;
    });
    // CR-2026-10-04-0113: the "your plan ends soon" emails ride on the same daily run (never able to fail it).
    const passReminders = await runPassEndingReminders().catch((err) => {
      console.error("[jobs] pass-ending reminders failed", err);
      return { considered: 0, queued: 0 };
    });
    return Response.json({ ...result, notificationsPurged, passReminders }, { status: result.failed > 0 ? 500 : 200 });
  } catch (err) {
    console.error("[jobs] certificate-reminders run failed", err);
    return Response.json({ error: "run_failed" }, { status: 500 });
  }
}
