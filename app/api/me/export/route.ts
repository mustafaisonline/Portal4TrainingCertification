import { withTransaction } from "@/db/prisma";
import { buildDataExport, exportFilename } from "@/modules/identity/data-export";
import { getCurrentUser } from "@/modules/identity/session";
import { writeAudit } from "@/modules/platform/audit/repository";

/*
 * GET /api/me/export (M8 plan §2 item 7 — the PDPA access right). The
 * signed-in person's OWN records as a JSON attachment. There is no id
 * parameter and every query parameter is ignored, so the route can never
 * serve anyone else's data. 401 when signed out. Each download is audited
 * as `profile.exported` (actor = the person) in the same transaction that
 * reads the rows. `no-store`: nothing may keep a copy.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });

  const now = new Date();
  const data = await withTransaction(async (tx) => {
    const built = await buildDataExport(user.id, tx, now);
    if (!built) return null;
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "profile.exported",
      entityType: "user",
      entityId: user.id,
      after: { exportedAt: now.toISOString(), format: built.format, version: built.version },
    });
    return built;
  });
  if (!data) return new Response(null, { status: 401 });

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(now)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
