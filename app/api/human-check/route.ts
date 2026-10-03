import { NextResponse } from "next/server";
import { createHumanChallenge, humanCheckBypassed, type ChallengeKind } from "@/modules/identity/human-check";
import { clientKeyOf, fixedWindowOverLimit } from "@/modules/platform/rate-limit";

/*
 * GET /api/human-check[?kind=sum] — a fresh sign-up challenge (CR-2026-10-03-1245).
 * Returns the pieces of a puzzle, never its answer. Rate-limited per client
 * (20 a 10 minutes, counted in the database) so it cannot be used to fill the
 * table. `{ required: false }` only in the test environment's bypass.
 */
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (humanCheckBypassed(request.headers)) return NextResponse.json({ required: false }, { headers });

  const client = clientKeyOf((request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "local").split(",")[0]!);
  if (await fixedWindowOverLimit(`humancheck:${client}`, WINDOW_MS, MAX_PER_WINDOW)) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429, headers });
  }
  const kind: ChallengeKind = new URL(request.url).searchParams.get("kind") === "sum" ? "sum" : "tiles";
  return NextResponse.json({ required: true, challenge: await createHumanChallenge(kind) }, { headers });
}
