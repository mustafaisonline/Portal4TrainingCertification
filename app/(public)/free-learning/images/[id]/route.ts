import { getTopicImage } from "@/modules/free-learning/book.repository";

/*
 * GET /free-learning/images/<id> — a topic image from the database
 * (Milestone 14 Phase 2, founder decision P8: images live in PostgreSQL).
 * Public, like the topic it belongs to: an image of an unpublished topic is
 * a 404. Immutable per id (a re-import creates new ids), so it caches long.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const image = await getTopicImage(id);
  if (!image || !image.published) return new Response(null, { status: 404 });
  const body = new Uint8Array(image.bytes);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": image.mime,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
