import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/session";
import { BELL_LATEST, latestNotifications, unreadCount } from "@/modules/notifications/notifications.repository";

/*
 * GET /api/me/notifications — what the header bell polls (CR-2026-10-03-1228):
 * the signed-in person's unread count and latest few notifications. Their own
 * only (the session decides who); 401 when signed out; never cached.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers });
  const [unread, latest] = await Promise.all([unreadCount(user.id), latestNotifications(user.id, BELL_LATEST)]);
  return NextResponse.json({ unread, latest: latest.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })) }, { headers });
}
