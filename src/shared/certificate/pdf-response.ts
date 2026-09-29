/*
 * The HTTP response for a certificate PDF download (Milestone 15, Req 6).
 * The route handler authorises first, renders, then returns this. Never
 * cacheable (it is a personal document behind the same gate as the on-screen
 * one), always a download, never sniffed.
 */

/** A filename safe in a header: only [A-Za-z0-9._-]; anything else becomes "-". */
export function safePdfFilename(name: string): string {
  const base = name.replace(/\.pdf$/i, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[.-]+|[.-]+$/g, "");
  return `${base || "certificate"}.pdf`;
}

export function pdfResponse(bytes: Uint8Array, filename: string): Response {
  return new Response(bytes as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="${safePdfFilename(filename)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** 422 for a certificate whose text the PDF's standard fonts cannot draw (a
 *  name in a script outside Windows-1252). The on-screen certificate and its
 *  Print button are unaffected; embedding a wider font is a separate decision. */
export function unsupportedTextResponse(): Response {
  return new Response(
    "This certificate contains characters the PDF cannot draw yet. Use Print / Save as PDF on the certificate page, or contact us and we will help.",
    { status: 422, headers: { "Cache-Control": "no-store" } },
  );
}
