import { getPhoto } from "@/modules/identity/profile.repository";
import { getCurrentUser } from "@/modules/identity/session";

/*
 * GET /api/me/photo (Milestone 5a plan §2 item 3). The signed-in person's OWN
 * profile photo — there is no id parameter, so the route can never serve
 * anyone else's. 401 when signed out, 404 when none. Marked private so no
 * shared cache keeps it; the ETag is the upload time, and the header menu
 * appends `?v=<time>` so a new upload is fetched at once.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });

  const photo = await getPhoto(user.id);
  if (!photo) return new Response(null, { status: 404 });

  const etag = `"${photo.updatedAt.getTime()}"`;
  const headers = {
    "Content-Type": photo.mime,
    "Cache-Control": "private, max-age=0, must-revalidate",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

  // A fresh ArrayBuffer-backed copy: the stored view may not be one.
  const body = new Uint8Array(new ArrayBuffer(photo.bytes.byteLength));
  body.set(photo.bytes);
  return new Response(body, { status: 200, headers: { ...headers, "Content-Length": String(body.byteLength) } });
}
