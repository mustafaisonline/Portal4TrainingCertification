import { readFileSync } from "node:fs";
import path from "node:path";
import { Circle, Defs, Document, Font, G, Image, LinearGradient, Page, Path, Polygon, Rect, renderToBuffer, Stop, Svg, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { CertificateBrand } from "@/content/certificate-brand";
import { CERTIFICATE_COPY, type CertificateData } from "./Certificate";
import { fitStep } from "./format";
import { qrSvgToPath } from "./qr-path";

/*
 * THE CERTIFICATE AS A TRUE VECTOR PDF (Milestone 15, Requirement 6).
 *
 * Server-only. `@react-pdf/renderer` (approved by the founder, Q2) writes the
 * page as PDF drawing operations — text, lines and paths — so it is sharp at
 * any zoom and prints exactly; nothing here is a screenshot and no headless
 * browser is involved.
 *
 * It reproduces `Certificate.tsx`, the on-screen design, with the same
 * geometry. The on-screen sheet is sized in `cqw` (1% of the sheet width); the
 * A4-landscape page is 297 mm = 841.89 pt wide, so 1 cqw = 8.4189 pt here and
 * every number below is the same number as in Certificate.tsx, passed through
 * `cq()`. The same `CERTIFICATE_COPY`, the same `fitStep` thresholds, the same
 * colours, the same omission rules (a missing brand field is left out, never a
 * placeholder; no signature; the only HRD statement is a trainer's own).
 *
 * FONTS: Noto Sans Regular and Bold (SIL Open Font License; public/fonts/
 * noto-sans, with its NOTICE.txt) are EMBEDDED, so accented Latin, Vietnamese,
 * Cyrillic and Greek names draw correctly and the text stays selectable. The
 * monospaced ID line is the built-in Courier-Bold (ASCII only). The fonts do
 * not cover Arabic/Urdu or Chinese/Japanese/Korean: a name in those scripts
 * is refused by the download routes (`unsupportedPdfCharacters`) with a clear
 * message, and the browser's Print / Save as PDF on the certificate page
 * still draws it.
 *
 * DELIBERATE DIFFERENCES from the screen version: no CSS gradients/shadows
 * (the ornament rule is an SVG gradient, the sheet's screen-only shadow and
 * outer hairline are omitted), `text-wrap: balance` has no PDF equivalent (a
 * long title is centred and wraps normally), and the semi-bold (600) weights
 * print as bold because only the regular and bold faces are embedded.
 */

/** Embeds the two Noto Sans faces (idempotent; re-registering a family just replaces it). */
function registerFonts(publicDir: string) {
  const dir = path.join(publicDir, "fonts", "noto-sans");
  Font.register({ family: SANS, src: path.join(dir, "NotoSans-Regular.ttf") });
  Font.register({ family: SANS_BOLD, src: path.join(dir, "NotoSans-Bold.ttf") });
}

/** 1 cqw in PDF points on the A4-landscape page (297 mm = 841.89 pt). */
export const PDF_PAGE = { width: 841.89, height: 595.28 } as const;
const CQW = PDF_PAGE.width / 100;
const cq = (n: number) => n * CQW;

/*
 * No hyphenation of ordinary words (the screen version does none), but a word
 * too long for any line (an unbroken run of 24+ characters, e.g. a very long
 * name or code) may break every 12 characters — the PDF counterpart of the
 * screen's `overflow-wrap: anywhere` — instead of running off the page.
 * (react-pdf's hyphenation setting is process-wide; certificates are the only
 * PDF this application renders.)
 */
Font.registerHyphenationCallback((word) => {
  if (word.length < 24) return [word];
  return word.match(/.{1,12}/gu) ?? [word];
});

const NAVY = "#0b1b3a";
const BLUE = "#1e3a8a";
const ACCENT = "#2563eb";
const MUTED = "#4b5563";
const HAIRLINE = "#c9d3e6";

const SANS = "NotoSans";
const SANS_BOLD = "NotoSans-Bold";
const MONO_BOLD = "Courier-Bold";

/** Yoga shrinks flex children by default; a drawing must keep its size. */
const NO_SHRINK = { flexShrink: 0 } as const;

/** Type at `size` cqw with the on-screen line height (1.25). `tracking` is em. */
function type(size: number, opts: { bold?: boolean; color?: string; tracking?: number; upper?: boolean; center?: boolean } = {}) {
  return {
    fontFamily: opts.bold ? SANS_BOLD : SANS,
    fontSize: cq(size),
    lineHeight: 1.25,
    color: opts.color ?? NAVY,
    ...(opts.tracking ? { letterSpacing: opts.tracking * cq(size) } : {}),
    ...(opts.upper ? { textTransform: "uppercase" as const } : {}),
    ...(opts.center ? { textAlign: "center" as const } : {}),
  };
}

/** Code-point ranges the embedded Noto Sans draws: Basic Latin, Latin-1, Latin
 *  Extended-A/B (Turkish, Polish, Czech …), combining marks, Greek, Cyrillic,
 *  Latin Extended Additional (Vietnamese), general punctuation, € and ™. */
const DRAWABLE: ReadonlyArray<readonly [number, number]> = [
  [0x20, 0x7e],
  [0xa0, 0x24f],
  [0x300, 0x36f],
  [0x370, 0x3ff],
  [0x400, 0x52f],
  [0x1e00, 0x1eff],
  [0x2010, 0x2027],
  [0x2030, 0x205e],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
];

/** The characters of `text` the PDF cannot draw (outside the embedded font's coverage). */
export function unsupportedPdfCharacters(text: string): string[] {
  const bad = new Set<string>();
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (!DRAWABLE.some(([lo, hi]) => code >= lo && code <= hi)) bad.add(ch);
  }
  return [...bad];
}

/** A file under /public read at render time (never outside /public). */
function readPublicAsset(publicDir: string, assetPath: string): { data: Buffer; format: "jpg" | "png" } | null {
  const ext = path.extname(assetPath).toLowerCase();
  const format = ext === ".png" ? "png" : ext === ".jpg" || ext === ".jpeg" ? "jpg" : null;
  if (!format) {
    console.warn(`certificate pdf: ${assetPath} is not a PNG/JPEG, so it is omitted`);
    return null;
  }
  const root = path.resolve(publicDir);
  const file = path.resolve(root, `.${assetPath.startsWith("/") ? "" : "/"}${assetPath}`);
  if (!file.startsWith(root + path.sep)) {
    throw new Error(`certificate pdf: asset path escapes the public directory: ${assetPath}`);
  }
  try {
    // The path was confined to /public just above; the bundler cannot know that.
    return { data: readFileSync(/*turbopackIgnore: true*/ file), format };
  } catch (error) {
    console.warn(`certificate pdf: could not read ${assetPath} (${(error as Error).message}); it is omitted`);
    return null;
  }
}

function Label({ children }: { children: ReactNode }) {
  return <Text style={type(0.85, { bold: true, color: MUTED, tracking: 0.16, upper: true })}>{children}</Text>;
}

/** The Academy mark (LogoMark.tsx), 30 × 30 viewBox. */
function LogoMarkPdf({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" style={NO_SHRINK}>
      <Rect x={1} y={1} width={28} height={28} rx={8} ry={8} stroke={ACCENT} strokeOpacity={0.4} strokeWidth={1.5} fill="none" />
      <Path d="M8 21 L13.5 14.5 L17 17 L22 9" stroke={ACCENT} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={22} cy={9} r={2.3} fill={ACCENT} />
      <Circle cx={8} cy={21} r={1.6} fill={ACCENT} fillOpacity={0.55} />
    </Svg>
  );
}

const MOTIF_NODES: [number, number][] = [
  [6, 60], [28, 42], [52, 50], [74, 26], [100, 34], [116, 12], [34, 18], [58, 8], [60, 72], [88, 66], [114, 58],
];

/** The faint data-network motif (Certificate.tsx `Motif`); its two opacities
 *  are multiplied out (group × element) so the result matches the screen. */
function MotifPdf({ widthCq, opacity, rotate, style }: { widthCq: number; opacity: number; rotate?: boolean; style: Record<string, number> }) {
  const w = cq(widthCq);
  return (
    <Svg viewBox="0 0 120 80" width={w} height={(w * 80) / 120} style={{ position: "absolute", ...style }}>
      <G transform={rotate ? "rotate(180 60 40)" : undefined}>
        <G stroke={ACCENT} strokeWidth={0.5} strokeOpacity={0.5 * opacity} fill="none">
          <Path d="M6 60 L28 42 L52 50 L74 26 L100 34 L116 12" />
          <Path d="M28 42 L34 18 L58 8 L74 26" />
          <Path d="M52 50 L60 72 L88 66 L100 34" />
          <Path d="M88 66 L114 58" />
        </G>
        {MOTIF_NODES.map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.4} fill={ACCENT} fillOpacity={0.55 * opacity} />
        ))}
      </G>
    </Svg>
  );
}

/** The diamond-and-lines ornament under the title (24 cqw wide). */
function OrnamentPdf() {
  // Units are 0.1 cqw: 240 wide. Two 1-unit lines fading out to the sides and a 7-unit diamond between them.
  // The diamond (a rotated square) pokes out of the 7-unit strip, as it does on screen, so the drawing
  // is 13 units tall (3 spare above and below) and pulled back with negative margins to keep the layout height 0.7 cqw.
  const lineW = 108.5;
  return (
    <Svg viewBox="0 -3 240 13" width={cq(24)} height={cq(1.3)} style={{ ...NO_SHRINK, marginVertical: cq(-0.3) }}>
      <Defs>
        <LinearGradient id="ornL" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={ACCENT} stopOpacity={0} />
          <Stop offset="1" stopColor={ACCENT} stopOpacity={1} />
        </LinearGradient>
        <LinearGradient id="ornR" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={ACCENT} stopOpacity={1} />
          <Stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={3} width={lineW} height={1} fill="url(#ornL)" />
      <Polygon points="120,-1.45 124.95,3.5 120,8.45 115.05,3.5" fill={ACCENT} />
      <Rect x={240 - lineW} y={3} width={lineW} height={1} fill="url(#ornR)" />
    </Svg>
  );
}

function QrPdf({ svg, size }: { svg: string; size: number }) {
  const qr = qrSvgToPath(svg, { bleed: 0.015 });
  return (
    <Svg viewBox={`0 0 ${qr.size} ${qr.size}`} width={size} height={size} style={NO_SHRINK}>
      <Path d={qr.d} fill={qr.color} />
    </Svg>
  );
}

export type CertificatePdfOptions = {
  /** Where `brand.logoPath` and the trainer badge resolve from. Default: `<cwd>/public`. */
  publicDir?: string;
};

type Assets = { logo: ReturnType<typeof readPublicAsset>; hrdLogo: ReturnType<typeof readPublicAsset>; badge: ReturnType<typeof readPublicAsset> };

function loadAssets(data: CertificateData, publicDir: string): Assets {
  const { brand } = data;
  const trainerBadge = data.kind === "completion" && data.trainers.some((t) => t.hrdAccredited);
  return {
    logo: brand.logoPath ? readPublicAsset(publicDir, brand.logoPath) : null,
    hrdLogo: brand.hrdCorpLogoPath && brand.hrdCorpLogoAuthorised ? readPublicAsset(publicDir, brand.hrdCorpLogoPath) : null,
    badge: trainerBadge ? readPublicAsset(publicDir, "/hrd-corp/accredited-trainer-badge.png") : null,
  };
}

function CertificatePage({ data, assets }: { data: CertificateData; assets: Assets }) {
  const brand: CertificateBrand = data.brand;
  const copy = CERTIFICATE_COPY[data.kind];
  const nameFit = fitStep(data.holderName, [26, 40]);
  const subjectFit = fitStep(data.subjectTitle, [44, 80]);
  const nameSize = { base: 4.2, small: 3.4, smaller: 2.8 }[nameFit];
  const subjectSize = { base: 2.4, small: 1.95, smaller: 1.65 }[subjectFit];

  const details: { label: string; value: string; pill?: boolean }[] =
    data.kind === "achievement"
      ? [
          { label: "Score", value: data.scoreLabel },
          { label: "Result", value: "PASSED", pill: true },
          { label: "Time Taken", value: data.timeTaken },
          { label: "Date Issued", value: data.issuedOn },
          { label: "Valid Until", value: data.validUntil },
        ]
      : [
          ...(data.durationLabel ? [{ label: "Training Duration", value: data.durationLabel }] : []),
          { label: "Completion Date", value: data.completedOn },
          { label: "Valid Until", value: data.validUntil },
        ];

  const legalBits = [brand.legalName, brand.registrationNumber ? `Company No. ${brand.registrationNumber}` : null, brand.address, brand.contactLine].filter(Boolean);
  const trainers = data.kind === "completion" ? data.trainers : [];
  const completion = data.kind === "completion";

  const verifyBlock = (
    <View style={{ flexDirection: "row", alignItems: "flex-end", columnGap: cq(1.6) }}>
      <QrPdf svg={data.qrSvg} size={cq(10)} />
      <View style={{ maxWidth: cq(30) }}>
        <Label>Verify this certificate</Label>
        <Text style={{ ...type(0.95), marginTop: cq(0.3), marginBottom: cq(0.8) }}>{data.verifyUrl}</Text>
        <Label>Certificate ID</Label>
        <Text style={{ ...type(1.35, { bold: true, tracking: 0.04 }), fontFamily: MONO_BOLD, marginTop: cq(0.3) }}>{data.certificateId}</Text>
      </View>
    </View>
  );

  return (
    <Page size="A4" orientation="landscape" wrap={false} style={{ backgroundColor: "#ffffff", padding: 0 }}>
      {/* One fixed-size root: the page's own height comes from in-flow content, and everything below is absolutely positioned. */}
      <View style={{ width: PDF_PAGE.width, height: PDF_PAGE.height }}>
      {/* Frame: a navy rule and a fine blue hairline inside it. */}
      <View style={{ position: "absolute", top: cq(2), left: cq(2), right: cq(2), bottom: cq(2), borderWidth: cq(0.3), borderStyle: "solid", borderColor: BLUE }} />
      <View style={{ position: "absolute", top: cq(3), left: cq(3), right: cq(3), bottom: cq(3), borderWidth: cq(0.1), borderStyle: "solid", borderColor: ACCENT, opacity: 0.45 }} />
      <MotifPdf widthCq={30} opacity={0.16} style={{ top: cq(3.4), right: cq(3.4) }} />
      <MotifPdf widthCq={26} opacity={0.12} rotate style={{ bottom: cq(3.4), left: cq(3.4) }} />

      {data.sample ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", transform: "rotate(-18deg)", opacity: 0.08 }}>
          <Text style={{ ...type(16, { bold: true, color: BLUE, tracking: 0.2 }), lineHeight: 1.25 }}>SAMPLE</Text>
          <Text style={type(2.4, { bold: true, color: BLUE, tracking: 0.2 })}>NOT A REAL CERTIFICATE</Text>
        </View>
      ) : null}

      <View style={{ position: "absolute", top: cq(5), bottom: cq(5), left: cq(6.2), right: cq(6.2), flexDirection: "column", justifyContent: "space-between", rowGap: cq(0.8) }}>
        {/* Header: the Academy lockup and the issuer */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", columnGap: cq(3) }}>
          <View style={{ flexDirection: "row", alignItems: "center", columnGap: cq(1.1) }}>
            <LogoMarkPdf size={cq(3.4)} />
            <View>
              <Text style={type(2.05, { bold: true, tracking: -0.01 })}>Data &amp; AI Academy</Text>
              <Text style={type(0.85, { bold: true, color: MUTED, tracking: 0.22, upper: true })}>Training &amp; Certification</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", columnGap: cq(2) }}>
            {assets.hrdLogo ? <Image src={assets.hrdLogo} style={{ height: cq(3.6), ...NO_SHRINK }} /> : null}
            {assets.logo ? (
              <Image src={assets.logo} style={{ height: cq(8), marginVertical: cq(-1.6), ...NO_SHRINK }} />
            ) : (
              <Text style={{ ...type(1.35, { bold: true, color: BLUE }), textAlign: "right" }}>{brand.legalName}</Text>
            )}
          </View>
        </View>

        {/* Title, recipient and subject */}
        <View style={{ alignItems: "center", rowGap: cq(0.7) }}>
          <Text style={{ ...type(1.1, { bold: true, color: ACCENT, tracking: 0.42, upper: true }), paddingLeft: 0.42 * cq(1.1) }}>Data &amp; AI Academy</Text>
          <Text style={type(4.4, { bold: true, tracking: -0.02 })}>{copy.title}</Text>
          <OrnamentPdf />
          <Text style={type(1.55, { color: MUTED })}>{CERTIFICATE_COPY.presentedTo}</Text>
          <Text style={{ ...type(nameSize, { bold: true, tracking: -0.015, center: true }), maxWidth: cq(76) }}>{data.holderName}</Text>
          <View style={{ width: cq(40), height: cq(0.12), backgroundColor: HAIRLINE }} />
          <Text style={type(1.55, { color: MUTED })}>{copy.verb}</Text>
          <Text style={{ ...type(subjectSize, { bold: true, center: true }), maxWidth: cq(76) }}>{data.subjectTitle}</Text>
        </View>

        {/* Type-specific facts */}
        <View
          style={{
            flexDirection: "row",
            columnGap: cq(2),
            paddingVertical: cq(0.8),
            borderTopWidth: cq(0.1),
            borderBottomWidth: cq(0.1),
            borderTopStyle: "solid",
            borderBottomStyle: "solid",
            borderTopColor: HAIRLINE,
            borderBottomColor: HAIRLINE,
          }}
        >
          {details.map((d) => (
            <View key={d.label} style={{ flex: 1, alignItems: "center", rowGap: cq(0.35) }}>
              <Label>{d.label}</Label>
              {d.pill ? (
                <View style={{ backgroundColor: "#e6f4ec", borderRadius: cq(2), paddingVertical: cq(0.15), paddingHorizontal: cq(0.9) }}>
                  <Text style={type(1.6, { bold: true, color: "#14663d", tracking: 0.1 })}>{d.value}</Text>
                </View>
              ) : (
                <Text style={{ ...type(1.6, { bold: true }), textAlign: "center" }}>{d.value}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Trainer (Professional only) and verification. No signature, no signature line. */}
        {completion ? (
          <View style={{ flexDirection: "row", alignItems: "flex-end", columnGap: cq(4) }}>
            <View style={{ flex: 1.1 }}>
              {trainers.length > 0 ? (
                <>
                  <Label>{trainers.length === 1 ? "Authorized Trainer / Instructor" : "Authorized Trainers / Instructors"}</Label>
                  <View style={{ marginTop: cq(0.5), rowGap: cq(0.6) }}>
                    {trainers.map((t) => (
                      <View key={t.name} style={{ flexDirection: "row", alignItems: "center", columnGap: cq(0.8) }}>
                        {t.hrdAccredited && assets.badge ? <Image src={assets.badge} style={{ width: cq(3.2), height: cq(3.2), ...NO_SHRINK }} /> : null}
                        <View>
                          <Text style={type(1.35, { bold: true })}>{t.name}</Text>
                          {t.hrdAccredited ? (
                            <Text style={type(0.9, { color: MUTED })}>
                              HRD Corp Accredited Trainer{t.hrdTrainerId ? ` · ID ${t.hrdTrainerId}` : ""}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
            <View style={{ flex: 1.2, alignItems: "flex-end" }}>{verifyBlock}</View>
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>{verifyBlock}</View>
        )}

        {/* Footer: issuer details and the plain disclosures */}
        <View style={{ alignItems: "center", borderTopWidth: cq(0.1), borderTopStyle: "solid", borderTopColor: HAIRLINE, paddingTop: cq(0.8) }}>
          <Text style={type(0.95, { color: MUTED, center: true })}>{legalBits.join(" · ")}</Text>
          <Text style={{ ...type(0.88, { color: MUTED, center: true }), marginTop: cq(0.3) }}>
            {copy.disclosure} {CERTIFICATE_COPY.systemGenerated} {CERTIFICATE_COPY.validity}
          </Text>
        </View>
      </View>
      </View>
    </Page>
  );
}

/** The document element — exported so tests can render it their own way. */
export function certificateDocument(data: CertificateData, options: CertificatePdfOptions = {}) {
  const publicDir = options.publicDir ?? path.join(process.cwd(), "public");
  registerFonts(publicDir);
  const assets = loadAssets(data, publicDir);
  const copy = CERTIFICATE_COPY[data.kind];
  return (
    <Document title={`${copy.title} ${data.certificateId}`} author={data.brand.legalName} subject={data.subjectTitle} creator="Data & AI Academy" producer="Data & AI Academy">
      <CertificatePage data={data} assets={assets} />
    </Document>
  );
}

/**
 * Render one certificate to a single-page A4-landscape vector PDF.
 * Server-only. The caller is responsible for authorisation.
 */
export async function renderCertificatePdf(data: CertificateData, options: CertificatePdfOptions = {}): Promise<Uint8Array> {
  const buffer = await renderToBuffer(certificateDocument(data, options));
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
