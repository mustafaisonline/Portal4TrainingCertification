import { processOutbox } from "@/modules/notifications/outbox.service";
import { jobsAuthProblem } from "@/modules/platform/jobs-auth";

/*
 * POST /api/jobs/email-outbox (CR-2026-10-03-1225 slice 2) — the once-a-minute retry worker. Same bearer-secret
 * rules as the reminders job (503 jobs_disabled · 401 unauthorised). Stateless and safe to repeat: it claims the
 * queued emails that are due (see outbox.service.ts), sends up to 25, and reports counts.
 *
 *   200 counts        (also when it skipped because the portal is log-only — `skipped` says why)
 *   500 run_failed    unexpected error; the scheduler sees a non-2xx
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const denied = jobsAuthProblem(req);
  if (denied) return denied;
  try {
    return Response.json(await processOutbox(), { status: 200 });
  } catch (err) {
    console.error("[jobs] email-outbox run failed", err);
    return Response.json({ error: "run_failed" }, { status: 500 });
  }
}
