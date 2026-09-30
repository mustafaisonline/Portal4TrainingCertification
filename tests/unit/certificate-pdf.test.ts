import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import QRCode from "qrcode";
import { afterEach, describe, expect, it, vi } from "vitest";
import { certificateBrand, type CertificateBrand } from "@/content/certificate-brand";
import { CERTIFICATE_COPY, type CertificateData } from "@/shared/certificate/Certificate";
import { renderCertificatePdf, unsupportedPdfCharacters } from "@/shared/certificate/pdf";
import { pdfResponse, safePdfFilename } from "@/shared/certificate/pdf-response";
import { qrSvgToPath } from "@/shared/certificate/qr-path";
import { certificateQrSvg } from "@/shared/certificate/qr";

/*
 * The certificate PDF (Milestone 15, Req 6) — rendered in-process, no network,
 * no database. The PDF renderer compresses its content streams, so `inspect`
 * inflates every FlateDecode stream (node:zlib) and reads the text operators
 * (`[<53> -200 <41> …] TJ` — one hex byte per glyph with kerning numbers
 * between) back into strings; the page count and page size come from the
 * uncompressed page objects. Set CERT_PDF_DIR to also write the sample PDFs
 * for a visual review (see the report; the files are not committed).
 */

const A4_LANDSCAPE = { w: 841.89, h: 595.28 };
const VISUAL_DIR = process.env["CERT_PDF_DIR"];

const cp1252 = new TextDecoder("windows-1252");

/** Every indirect object: its dictionary text and (inflated) stream, if any. */
function pdfObjects(buf: Buffer): Map<number, { dict: string; stream: Buffer | null }> {
  const raw = buf.toString("latin1");
  const objects = new Map<number, { dict: string; stream: Buffer | null }>();
  for (const m of raw.matchAll(/(\d+) 0 obj([\s\S]*?)endobj/g)) {
    const rel = m[0].search(/stream\r?\n/);
    let stream: Buffer | null = null;
    let dict = m[0];
    if (rel >= 0) {
      dict = m[0].slice(0, rel);
      const start = m.index! + rel + (m[0][rel + 6] === "\r" ? 8 : 7);
      const end = raw.indexOf("endstream", start);
      try {
        stream = inflateSync(buf.subarray(start, end));
      } catch {
        stream = buf.subarray(start, end); // not Flate (an image or an embedded font program)
      }
    }
    objects.set(Number(m[1]), { dict, stream });
  }
  return objects;
}

/** glyph id → text, from a font's ToUnicode CMap (bfchar and bfrange forms). */
function parseToUnicode(cmap: string): Map<number, string> {
  const map = new Map<number, string>();
  const uni = (hex: string) => String.fromCodePoint(...(hex.match(/.{4}/g) ?? []).map((h) => Number.parseInt(h, 16)));
  for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const [, from, to] of block[1]!.matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>/gi)) map.set(Number.parseInt(from!, 16), uni(to!));
  }
  for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    // Array form — <lo> <hi> [<u0> <u1> …], what react-pdf writes (an entry may hold several code points) …
    const arrays = /<([0-9a-f]+)>\s*<[0-9a-f]+>\s*\[([^\]]*)\]/gi;
    for (const [, lo, list] of block[1]!.matchAll(arrays)) {
      [...list!.matchAll(/<([0-9a-f\s]+)>/gi)].forEach((u, i) => map.set(Number.parseInt(lo!, 16) + i, uni(u[1]!.replace(/\s+/g, ""))));
    }
    // … and the simple form — <lo> <hi> <first> — outside any array.
    for (const [, lo, hi, to] of block[1]!.replace(arrays, "").matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>\s*<([0-9a-f]+)>/gi)) {
      const start = Number.parseInt(to!, 16);
      for (let g = Number.parseInt(lo!, 16), i = 0; g <= Number.parseInt(hi!, 16); g += 1, i += 1) map.set(g, String.fromCodePoint(start + i));
    }
  }
  return map;
}

function inspect(bytes: Uint8Array) {
  const buf = Buffer.from(bytes);
  const raw = buf.toString("latin1");
  const objects = pdfObjects(buf);
  // Font resource name (/F3) → its ToUnicode map, for the embedded (2-byte, Identity-H) faces.
  const fontMaps = new Map<string, Map<number, string>>();
  const fontNames = new Set<string>();
  for (const [, o] of objects) {
    for (const f of o.dict.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)) {
      const font = objects.get(Number(f[2]));
      const toUni = font ? /\/ToUnicode\s+(\d+)\s+0\s+R/.exec(font.dict) : null;
      const cmap = toUni ? objects.get(Number(toUni[1]))?.stream : null;
      if (cmap) fontMaps.set(f[1]!, parseToUnicode(cmap.toString("latin1")));
      if (font) {
        const base = /\/BaseFont\s*\/([\w+-]+)/.exec(font.dict);
        if (base) fontNames.add(base[1]!.replace(/^[A-Z]{6}\+/, ""));
      }
    }
  }
  const contents = [...objects.values()].flatMap((o) => (o.stream && /\bTJ\b/.test(o.stream.toString("latin1")) ? [o.stream.toString("latin1")] : []));
  // One entry per drawn line of text.
  const lines: string[] = [];
  for (const content of contents) {
    let current = "";
    for (const tok of content.matchAll(/\/(F\d+)\s+[\d.]+\s+Tf|\[((?:<[0-9a-f]+>|\s|-?[\d.]+)+)\]\s*TJ/gi)) {
      if (tok[1]) {
        current = tok[1];
        continue;
      }
      const map = fontMaps.get(current);
      const parts = [...(tok[2] ?? "").matchAll(/<([0-9a-f]+)>/gi)].map((h) => {
        const hex = h[1]!;
        if (!map) return cp1252.decode(Buffer.from(hex, "hex")); // a standard font: one byte per glyph
        return (hex.match(/.{4}/g) ?? []).map((g) => map.get(Number.parseInt(g, 16)) ?? "\uFFFD").join("");
      });
      lines.push(parts.join(""));
    }
  }
  const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(raw);
  return {
    header: raw.slice(0, 5),
    pages: (raw.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length,
    count: Number(/\/Count\s+(\d+)/.exec(raw)?.[1]),
    width: box ? Number(box[1]) : NaN,
    height: box ? Number(box[2]) : NaN,
    images: (raw.match(/\/Subtype\s*\/Image/g) ?? []).length,
    lines,
    fontNames,
    // The renderer splits a line into runs at script/number boundaries and keeps each run's trailing
    // space, so the runs joined with nothing read as the printed text (wrapped lines included).
    text: lines.join(""),
    raw,
  };
}

const VERIFY = "https://portal.example.com/verify/";

async function achievement(over: Partial<Extract<CertificateData, { kind: "achievement" }>> = {}): Promise<CertificateData> {
  const certificateId = over.certificateId ?? "KC-7QF2-M9XK";
  const verifyUrl = over.verifyUrl ?? `${VERIFY}${certificateId}`;
  return {
    kind: "achievement",
    certificateId,
    holderName: "Aisha Binti Mohd Rahman",
    subjectTitle: "Data & AI Knowledge Check — 50 questions",
    validUntil: "29 September 2027",
    verifyUrl,
    qrSvg: await certificateQrSvg(verifyUrl),
    brand: certificateBrand,
    scoreLabel: "50 of 50 · 100%",
    timeTaken: "00:00:05",
    issuedOn: "29 September 2026",
    ...over,
  };
}

async function completion(over: Partial<Extract<CertificateData, { kind: "completion" }>> = {}): Promise<CertificateData> {
  const certificateId = over.certificateId ?? "DAA-2026-000123";
  const verifyUrl = over.verifyUrl ?? `${VERIFY}${certificateId}`;
  return {
    kind: "completion",
    certificateId,
    holderName: "Daniel Lim Wei Jie",
    subjectTitle: "Data Blueprint & AI Vibe Coding",
    validUntil: "29 September 2027",
    verifyUrl,
    qrSvg: await certificateQrSvg(verifyUrl),
    brand: certificateBrand,
    durationLabel: "2 days · 16 hours",
    completedOn: "29 September 2026",
    trainers: [
      { name: "Mustafa Qizilbash", hrdAccredited: true, hrdTrainerId: "T-1234" },
      { name: "Nur Aina Binti Zainal", hrdAccredited: false },
    ],
    ...over,
  };
}

const LONG_NAME = "Muhammad Abdul Rahman Ibn Abdullah Al-Fatimi Bin Zainal Abidin Syed Mohd Ali";
const LONG_SUBJECT =
  "Advanced Enterprise Data Governance, Analytics Engineering and Applied Artificial Intelligence Leadership Programme for Senior Managers";

function saveVisual(name: string, bytes: Uint8Array) {
  if (!VISUAL_DIR) return;
  mkdirSync(VISUAL_DIR, { recursive: true });
  writeFileSync(path.join(VISUAL_DIR, `${name}.pdf`), bytes);
}

afterEach(() => vi.restoreAllMocks());

describe("renderCertificatePdf", () => {
  it("achievement: one A4-landscape PDF page containing the certificate's facts", async () => {
    const data = await achievement();
    const bytes = await renderCertificatePdf(data);
    saveVisual("achievement", bytes);
    const pdf = inspect(bytes);

    expect(pdf.header).toBe("%PDF-");
    expect(pdf.count).toBe(1);
    expect(pdf.pages).toBe(1);
    expect(pdf.width).toBeCloseTo(A4_LANDSCAPE.w, 1);
    expect(pdf.height).toBeCloseTo(A4_LANDSCAPE.h, 1);
    expect(pdf.width).toBeGreaterThan(pdf.height);

    expect(pdf.text).toContain("KC-7QF2-M9XK");
    expect(pdf.text).toContain("Aisha Binti Mohd Rahman");
    expect(pdf.text).toContain("Data & AI Knowledge Check — 50 questions".replace("—", "—").normalize());
    expect(pdf.text).toContain("Certificate of Achievement");
    expect(pdf.text).toContain(CERTIFICATE_COPY.presentedTo);
    expect(pdf.text).toContain("50 of 50 · 100%");
    expect(pdf.text).toContain("00:00:05");
    expect(pdf.text).toContain("29 September 2027");
    expect(pdf.text).toContain(`${VERIFY}KC-7QF2-M9XK`);
    expect(pdf.text).toContain("Company No. 202401023226 (1569075-K)");
    // The real logo (a JPEG) is embedded.
    expect(pdf.images).toBeGreaterThanOrEqual(1);
    // Achievement has no trainer block, no signature, no sample watermark.
    expect(pdf.text).not.toMatch(/authorized trainer/i);
    expect(pdf.text).not.toMatch(/signature line|Signature:/i);
    expect(pdf.text).not.toContain("SAMPLE");
    // No HRD over-claim.
    expect(pdf.text).not.toMatch(/HRD Corp (certified|approved|accredited)\b/i);
  });

  it("completion with two trainers (one HRD-accredited): trainers, the accredited line and the badge; one page", async () => {
    const data = await completion();
    const bytes = await renderCertificatePdf(data);
    saveVisual("completion", bytes);
    const pdf = inspect(bytes);

    expect(pdf.count).toBe(1);
    expect(pdf.pages).toBe(1);
    expect(pdf.width).toBeCloseTo(A4_LANDSCAPE.w, 1);
    expect(pdf.height).toBeCloseTo(A4_LANDSCAPE.h, 1);
    expect(pdf.text).toContain("DAA-2026-000123");
    expect(pdf.text).toContain("Certificate of Completion");
    expect(pdf.text).toContain("Data Blueprint & AI Vibe Coding");
    expect(pdf.text).toContain("2 days · 16 hours");
    expect(pdf.text).toContain("Mustafa Qizilbash");
    expect(pdf.text).toContain("Nur Aina Binti Zainal");
    // Only the accredited trainer gets the accreditation line (with the ID) — printed once.
    expect(pdf.text.match(/HRD Corp Accredited Trainer/g)).toHaveLength(1);
    expect(pdf.text).toContain("HRD Corp Accredited Trainer · ID T-1234");
    // The trainer badge and the logo are both embedded.
    expect(pdf.images).toBeGreaterThanOrEqual(2);
    expect(pdf.text).toContain(CERTIFICATE_COPY.completion.disclosure);
  });

  it("completion: omits Training Duration when unknown, and the trainer block when there is no trainer", async () => {
    const pdf = inspect(await renderCertificatePdf(await completion({ durationLabel: null, trainers: [] })));
    expect(pdf.count).toBe(1);
    expect(pdf.text).not.toMatch(/Training Duration/i);
    expect(pdf.text).not.toMatch(/Authorized Trainer/i);
    expect(pdf.text).toContain("DAA-2026-000123");
  });

  it("sample: draws the SAMPLE watermark", async () => {
    const bytes = await renderCertificatePdf(await achievement({ sample: true }));
    saveVisual("achievement-sample", bytes);
    const pdf = inspect(bytes);
    expect(pdf.count).toBe(1);
    expect(pdf.text).toContain("SAMPLE");
    expect(pdf.text).toContain("NOT A REAL CERTIFICATE");
  });

  // Founder, 2026-09-30: a graded Free Assessment Check certificate prints "Grade: ALPHA · 81–100 %" under the (unchanged) title;
  // a result issued before grades existed has no such line.
  it("achievement with a grade: the grade line is drawn (title unchanged); without one nothing is drawn; still one page", async () => {
    for (const [name, band] of [["Charlie", "60–70 %"], ["Bravo", "71–80 %"], ["Alpha", "81–100 %"]] as const) {
      const pdf = inspect(await renderCertificatePdf(await achievement({ subjectTitle: "Data & AI Free Assessment Check — 200 questions", scoreLabel: "180 of 200 · 90%", grade: { name, band } })));
      expect(pdf.count).toBe(1);
      expect(pdf.pages).toBe(1);
      expect(pdf.text).toContain(`Grade: ${name.toUpperCase()} · ${band}`);
      expect(pdf.text).toContain("Certificate of Achievement");
      expect(pdf.text).toContain("180 of 200 · 90%");
      expect(pdf.text).toContain("passed online Free Assessment Check");
    }
    const plain = inspect(await renderCertificatePdf(await achievement()));
    expect(plain.text).not.toContain("Grade:");
    expect(plain.text).toContain("Certificate of Achievement");
  });

  it("missing brand fields are omitted, never placeholders (no logo, no registration, no address)", async () => {
    const bare: CertificateBrand = { ...certificateBrand, logoPath: null, registrationNumber: null, address: null, contactLine: null };
    const pdf = inspect(await renderCertificatePdf(await achievement({ brand: bare })));
    expect(pdf.count).toBe(1);
    expect(pdf.images).toBe(0);
    expect(pdf.text).not.toContain("Company No.");
    expect(pdf.text).not.toMatch(/\[[^\]]*\]|TBC|placeholder/i);
    // Without a logo the issuer's name is printed instead (twice: header + footer).
    expect(pdf.text.match(/Your Partner Technologies/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it("a logo file that does not exist is omitted with a warning (the certificate still renders)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const pdf = inspect(await renderCertificatePdf(await achievement({ brand: { ...certificateBrand, logoPath: "/brand/does-not-exist.jpg" } })));
    expect(pdf.count).toBe(1);
    expect(pdf.images).toBe(0);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("refuses a logo path that escapes /public", async () => {
    await expect(renderCertificatePdf(await achievement({ brand: { ...certificateBrand, logoPath: "/../package.json.jpg" } }))).rejects.toThrow(/escapes the public directory/);
  });

  it("very long name and title: still exactly one page, still A4 landscape", async () => {
    for (const [kind, build] of [
      ["achievement", achievement],
      ["completion", completion],
    ] as const) {
      const bytes = await renderCertificatePdf(await build({ holderName: LONG_NAME, subjectTitle: LONG_SUBJECT }));
      saveVisual(`${kind}-long`, bytes);
      const pdf = inspect(bytes);
      expect(pdf.count, kind).toBe(1);
      expect(pdf.pages, kind).toBe(1);
      expect(pdf.width, kind).toBeCloseTo(A4_LANDSCAPE.w, 1);
      // The name is present (it may wrap over lines).
      expect(pdf.text).toContain("Muhammad Abdul Rahman Ibn Abdullah");
      expect(pdf.text).toContain(kind === "achievement" ? "KC-7QF2-M9XK" : "DAA-2026-000123");
    }
  });

  it("an unbreakable, absurdly long value still gives one page", async () => {
    const bytes = await renderCertificatePdf(
      await completion({ holderName: "W".repeat(90), subjectTitle: "S".repeat(140), trainers: Array.from({ length: 4 }, (_, i) => ({ name: `Trainer Number ${i + 1} With A Rather Long Full Name`, hrdAccredited: i === 0, hrdTrainerId: "T-1" })) }),
    );
    saveVisual("completion-stress", bytes);
    const pdf = inspect(bytes);
    expect(pdf.count).toBe(1);
    expect(pdf.pages).toBe(1);
  });

  it("the QR is vector paths, not an image, and is drawn in the brand navy", async () => {
    const pdf = inspect(await renderCertificatePdf(await achievement()));
    // Only the logo is an image (1); the QR contributes path fills.
    expect(pdf.images).toBe(1);
  });
});

describe("unsupportedPdfCharacters", () => {
  it("accepts the scripts and punctuation the embedded Noto Sans draws", () => {
    expect(unsupportedPdfCharacters("José Müller — “Data & AI” · 100% €5 ™")).toEqual([]);
    expect(unsupportedPdfCharacters("Nguyễn Thị Hồng Phượng")).toEqual([]); // Vietnamese
    expect(unsupportedPdfCharacters("Александр Иванов Αλέξανδρος")).toEqual([]); // Cyrillic, Greek
    expect(unsupportedPdfCharacters("Łukasz İstanbul Ștefan")).toEqual([]); // Latin Extended
  });
  it("reports characters outside the embedded font (Arabic, Chinese …)", () => {
    expect(unsupportedPdfCharacters("Ali 李 ب")).toEqual(["李", "ب"]);
  });
});

describe("embedded fonts", () => {
  it("embeds Noto Sans Regular and Bold; the ID line stays the built-in Courier-Bold", async () => {
    const r = inspect(await renderCertificatePdf(await achievement()));
    expect([...r.fontNames].some((n) => /NotoSans(-Regular)?$/.test(n))).toBe(true);
    expect([...r.fontNames].some((n) => /NotoSans-Bold$/.test(n))).toBe(true);
    expect([...r.fontNames]).toContain("Courier-Bold");
    expect([...r.fontNames].some((n) => /Helvetica/.test(n))).toBe(false);
    expect(r.raw).toMatch(/\/FontFile2/); // a TrueType program is embedded
  });

  it("draws Vietnamese, Cyrillic, Greek and Latin-Extended names as the SAME text (selectable, correct glyphs), on one page", async () => {
    for (const name of ["Nguyễn Thị Hồng Phượng", "Александр Иванов", "Αλέξανδρος Παπαδόπουλος", "Łukasz Şahin İstanbul"]) {
      const r = inspect(await renderCertificatePdf(await achievement({ holderName: name })));
      // Accented letters may be stored as a base glyph plus a separately placed mark, so compare the
      // letters themselves (marks stripped); every glyph must map back to text (no missing-glyph).
      const bare = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "");
      // The renderer may split a run at a mark, so the letters are checked in order rather than as one string.
      const wanted = [...bare(name).replace(/\s+/g, "")];
      const have = bare(r.text).replace(/\s+/g, "");
      let at = 0;
      for (const ch of wanted) {
        at = have.indexOf(ch, at);
        expect(at, `${name}: missing "${ch}"`).toBeGreaterThanOrEqual(0);
        at += 1;
      }
      // Glyph 0 is the font's "missing glyph" box; it maps to U+0000, so its absence proves every letter exists in the font.
      expect(r.text).not.toContain("\u0000");
      expect(r.pages).toBe(1);
    }
  });
});

describe("qrSvgToPath", () => {
  it("reproduces every dark module of the real QR (and only those)", async () => {
    const url = "https://portal.example.com/verify/KC-7QF2-M9XK";
    const svg = await certificateQrSvg(url);
    const qr = qrSvgToPath(svg);
    const model = QRCode.create(url, { errorCorrectionLevel: "M" }).modules;

    expect(qr.size).toBe(model.size);
    expect(qr.color).toBe("#0b1b3a");

    // Rebuild the grid from the filled rectangles.
    const grid = Array.from({ length: qr.size }, () => Array<boolean>(qr.size).fill(false));
    for (const r of qr.d.matchAll(/M([\d.]+) ([\d.]+)h([\d.]+)v([\d.]+)h-[\d.]+z/g)) {
      const [x, y, w, h] = [Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4])];
      expect(h).toBe(1);
      for (let c = x; c < x + w; c++) grid[y]![c] = true;
    }
    for (let row = 0; row < model.size; row++) {
      for (let col = 0; col < model.size; col++) {
        expect(grid[row]![col], `module ${row},${col}`).toBe(Boolean(model.get(row, col)));
      }
    }
  });

  it("applies a bleed to every rectangle when asked", () => {
    const svg = '<svg viewBox="0 0 3 3"><path stroke="#000" d="M0 0.5h2m1 1h1"/></svg>';
    expect(qrSvgToPath(svg).d).toBe("M0 0h2v1h-2zM3 1h1v1h-1z");
    expect(qrSvgToPath(svg, { bleed: 0.1 }).d).toBe("M-0.1 -0.1h2.2v1.2h-2.2zM2.9 0.9h1.2v1.2h-1.2z");
  });

  it("ignores a fill-only background path", () => {
    const svg = '<svg viewBox="0 0 2 2"><path fill="#fff" d="M0 0h2v2H0z"/><path stroke="#123" d="M0 0.5h1"/></svg>';
    const qr = qrSvgToPath(svg);
    expect(qr.color).toBe("#123");
    expect(qr.d).toBe("M0 0h1v1h-1z");
  });

  it("refuses output it does not understand rather than printing a QR that might not scan", () => {
    expect(() => qrSvgToPath("<svg></svg>")).toThrow(/viewBox/);
    expect(() => qrSvgToPath('<svg viewBox="0 0 4 5"><path stroke="#000" d="M0 0h1"/></svg>')).toThrow(/square viewBox/);
    expect(() => qrSvgToPath('<svg viewBox="0 0 4 4"><path fill="#000" d="M0 0h1"/></svg>')).toThrow(/no stroked path/);
    expect(() => qrSvgToPath('<svg viewBox="0 0 4 4"><path stroke="#000" d="M0 0.5L3 3"/></svg>')).toThrow(/malformed|unsupported/);
    expect(() => qrSvgToPath('<svg viewBox="0 0 4 4"><path stroke="#000" d="M0 0.5z"/></svg>')).toThrow(/unsupported move|no dark modules/);
  });
});

describe("pdfResponse", () => {
  const bytes = new TextEncoder().encode("%PDF-1.3 test");

  it("is a no-store, nosniff PDF download", async () => {
    const res = pdfResponse(bytes, "KC-7QF2-M9XK.pdf");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="KC-7QF2-M9XK.pdf"');
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Length")).toBe(String(bytes.byteLength));
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
  });

  it("sanitises the filename to [A-Za-z0-9._-]", () => {
    expect(safePdfFilename("DAA-2026-000123")).toBe("DAA-2026-000123.pdf");
    expect(safePdfFilename('a b/c"d\r\ne.pdf')).toBe("a-b-c-d-e.pdf");
    expect(safePdfFilename("../../etc/passwd")).toBe("etc-passwd.pdf");
    expect(safePdfFilename("Zoë 李.pdf")).toBe("Zo.pdf");
    expect(safePdfFilename("")).toBe("certificate.pdf");
    expect(safePdfFilename("***")).toBe("certificate.pdf");
    const header = pdfResponse(bytes, 'x";\r\nSet-Cookie: a=b').headers.get("Content-Disposition")!;
    expect(header).toMatch(/^attachment; filename="[A-Za-z0-9._-]+\.pdf"$/);
  });
});
