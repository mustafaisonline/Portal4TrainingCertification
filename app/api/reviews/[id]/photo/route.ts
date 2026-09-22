import { getPublicReviewPhoto } from "@/modules/reviews/repository";

/*
 * GET /api/reviews/[id]/photo (requirements §7.3). The reviewer's profile
 * photo ONLY when that review is publicly visible AND the reviewer consented
 * to the photo — the repository applies both rules; anything else is 404.
 * Public and cacheable for an hour (the card is public anyway); the ETag is
 * the upload time. /api/me/photo stays private and separate.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const photo = await getPublicReviewPhoto(id);
  if (!photo) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

  const etag = `"${photo.updatedAt.getTime()}"`;
  const headers = {
    "Content-Type": photo.mime,
    "Cache-Control": "public, max-age=3600",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

  const body = new Uint8Array(new ArrayBuffer(photo.bytes.byteLength));
  body.set(photo.bytes);
  return new Response(body, { status: 200, headers: { ...headers, "Content-Length": String(body.byteLength) } });
}
