import { timingSafeEqual } from "node:crypto";

/*
 * The one bearer-secret check for every scheduled-job route (`/api/jobs/*`). The scheduler (a systemd timer running
 * `curl`) sends `Authorization: Bearer <JOBS_SECRET>`.
 *
 *   503 `jobs_disabled`  JOBS_SECRET is unset — the job is switched off
 *   401 `unauthorised`   header missing or token differs (constant-time compare)
 *
 * Returns null when the caller may proceed. The token is never logged.
 */
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

export function jobsAuthProblem(req: Request): Response | null {
  const secret = process.env["JOBS_SECRET"];
  if (!secret) return Response.json({ error: "jobs_disabled" }, { status: 503 });
  const token = bearerToken(req);
  if (!token || !tokenMatches(token, secret)) return Response.json({ error: "unauthorised" }, { status: 401 });
  return null;
}
