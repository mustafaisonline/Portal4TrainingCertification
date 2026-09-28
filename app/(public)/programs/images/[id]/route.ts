import { isUuid } from "@/modules/catalogue/offerings/repository";
import { getProgrammePhoto } from "@/modules/catalogue/programmes/repository";

/*
 * GET /programs/images/<id> — a training's photo, from the database
 * (founder, 2026-09-28: same interim-storage pattern as the participant
 * avatar, ADR-008 — bytes in Postgres, no object storage). Public: a
 * training photo carries nothing sensitive, and the id is a UUID, not a
 * guessable slug, so an admin can preview a draft training's photo through
 * this same URL before it is published. Mutable (a photo can be replaced at
 * the same id), so it is cached but revalidated by ETag, not "immutable".
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  if (!isUuid(id)) return new Response(null, { status: 404 });
  const photo = await getProgrammePhoto(id);
  if (!photo) return new Response(null, { status: 404 });

  const etag = `"${photo.updatedAt.getTime()}"`;
  const headers = {
    "Content-Type": photo.mime,
    "Cache-Control": "public, max-age=3600, must-revalidate",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

  const body = new Uint8Array(new ArrayBuffer(photo.bytes.byteLength));
  body.set(photo.bytes);
  return new Response(body, { status: 200, headers: { ...headers, "Content-Length": String(body.byteLength) } });
}
