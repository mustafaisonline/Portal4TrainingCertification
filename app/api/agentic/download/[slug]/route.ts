import { findAgenticItemBySlug } from "@/content/agentic/catalogue";
import { downloadAccess } from "@/modules/agentic/entitlements";
import { buildItemPackage } from "@/modules/agentic/package";
import { getCurrentUser } from "@/modules/identity/session";

/*
 * GET /api/agentic/download/[slug] — an agent or skill as a ZIP (CR-2026-10-04-0112). Session-gated and entitlement-gated:
 * signed out → 401 (the page sends people to sign in first); no ownership and no active pass → 403 (never the file); an
 * unknown slug → 404. Built on request from the catalogue, `no-store` (it is the buyer's own copy), never cached.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const plain = (body: string, status: number): Response => new Response(body, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return plain("Please sign in to download.", 401);
  const item = findAgenticItemBySlug(slug);
  if (!item) return plain("Not found", 404);
  if ((await downloadAccess(user.id, item.slug)) === "none") return plain("You do not have this download yet.", 403);
  const pkg = buildItemPackage(item);
  return new Response(new Uint8Array(pkg.bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${pkg.filename}"`,
      "Content-Length": String(pkg.bytes.length),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
