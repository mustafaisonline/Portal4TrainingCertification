import type { CSSProperties, ReactNode } from "react";
import type { CertificateBrand } from "@/content/certificate-brand";
import { LogoMark } from "@/shared/chrome/LogoMark";
import { fitStep } from "./format";

/*
 * THE CERTIFICATE — one reusable design for both certificate types
 * (Milestone 15, Requirement 2; founder, 2026-09-29).
 *
 *   kind "achievement" — Assessment: a passed Free Assessment Check
 *   kind "completion"  — Professional Training: Certificate of Completion
 *
 * A4 LANDSCAPE, 297 × 210 mm, and it scales as one piece: the sheet is a CSS
 * container and every size below is in `cqw` (1% of the sheet's width), so the
 * on-screen preview, the browser print and (Requirement 6) the PDF are the
 * same proportions — nothing is a screenshot. In print the sheet is exactly
 * 297 × 209.5 mm with a zero page margin (a hair under 210 so rounding can
 * never spill a blank second page).
 *
 * Design: premium corporate, deliberately not a school certificate — a navy
 * double rule, a faint data-network motif in two corners, clean sans type, a
 * lot of white space, a QR beside the verification address. Fixed LIGHT
 * "paper" colours, so it reads and prints the same in dark mode.
 *
 * HONESTY (see `src/content/certificate-brand.ts`): nothing on this sheet is
 * invented. A missing logo / registration / address is simply omitted; there is
 * NO signature or signature line (founder, 2026-09-29: the certificate is
 * system-generated, and says so); the sheet NEVER claims to be "HRD Corp
 * certified, accredited or approved" — the only HRD statement it may carry is a
 * TRAINER's own accreditation, printed beside that trainer.
 *
 * It prints the STATUS-INDEPENDENT facts: the validity date, and the
 * verification address as the authority for the current status.
 */

const NAVY = "#0b1b3a";
const BLUE = "#1e3a8a";
const ACCENT = "#2563eb";
const MUTED = "#4b5563";
const HAIRLINE = "#c9d3e6";

export type CertificateTrainer = {
  name: string;
  hrdAccredited: boolean;
  hrdTrainerId?: string | null;
  /** The trainer's external profile (Medium, else LinkedIn; https only —
   *  `trainerProfileUrl`). The on-screen name links to it when present; absent
   *  = plain text. The PDF and the print sheet never link. */
  profileUrl?: string | null;
};

type Common = {
  certificateId: string;
  holderName: string;
  /** The exact name of the test or the training. */
  subjectTitle: string;
  /** Formatted "valid until" date. */
  validUntil: string;
  /** The verification address as printed. */
  verifyUrl: string;
  /** SVG markup from `certificateQrSvg(verifyUrl)`. */
  qrSvg: string;
  brand: CertificateBrand;
  /** A diagonal SAMPLE watermark — the admin preview only, never a real certificate. */
  sample?: boolean;
};

export type AchievementCertificate = Common & {
  kind: "achievement";
  scoreLabel: string;
  timeTaken: string;
  issuedOn: string;
  /** Charlie / Bravo / Alpha with its percentage band, e.g. { name: "Alpha", band: "81–100 %" } —
   *  printed as a prominent "Grade: ALPHA · 81–100 %" line under the title (founder, 2026-09-30).
   *  Absent for a result issued before grades existed, which prints exactly as issued. */
  grade?: { name: string; band: string };
};

export type CompletionCertificate = Common & {
  kind: "completion";
  durationLabel: string | null;
  completedOn: string;
  trainers: CertificateTrainer[];
};

export type CertificateData = AchievementCertificate | CompletionCertificate;

export const CERTIFICATE_COPY = {
  achievement: {
    title: "Certificate of Achievement",
    verb: "for successfully completing",
    disclosure:
      "This certificate recognises a passed online Free Assessment Check. It is not the Academy’s Certificate of Completion, which is earned by attending an expert-led training.",
  },
  completion: {
    title: "Certificate of Completion",
    verb: "for successfully completing",
    disclosure: "This certificate records completion of the training. It is not the Academy’s earned credential.",
  },
  presentedTo: "This certificate is proudly presented to",
  systemGenerated: "This certificate is system-generated and does not require a signature.",
  validity: "Validity is confirmed only at the verification address; a printed copy may be out of date.",
} as const;

/** `cqw`-based inline styles: one place, so the scale is a single idea. */
const cq = (n: number) => `${n}cqw`;
const font = (n: number, extra: CSSProperties = {}): CSSProperties => ({ fontSize: cq(n), lineHeight: 1.25, ...extra });

function Label({ children }: { children: ReactNode }) {
  return (
    <span style={font(0.85, { display: "block", textTransform: "uppercase", letterSpacing: "0.16em", color: MUTED, fontWeight: 600 })}>{children}</span>
  );
}

/** A faint data-network motif — original geometry, low opacity so nothing
 *  above it loses contrast. */
function Motif({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 80" aria-hidden="true" className={className} style={{ position: "absolute", pointerEvents: "none", ...style }} fill="none">
      <g stroke={ACCENT} strokeWidth={0.5} opacity={0.5}>
        <path d="M6 60 L28 42 L52 50 L74 26 L100 34 L116 12" />
        <path d="M28 42 L34 18 L58 8 L74 26" />
        <path d="M52 50 L60 72 L88 66 L100 34" />
        <path d="M88 66 L114 58" />
      </g>
      <g fill={ACCENT} opacity={0.55}>
        {[
          [6, 60], [28, 42], [52, 50], [74, 26], [100, 34], [116, 12], [34, 18], [58, 8], [60, 72], [88, 66], [114, 58],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.4} />
        ))}
      </g>
    </svg>
  );
}

export function Certificate(data: CertificateData) {
  const { brand } = data;
  const copy = CERTIFICATE_COPY[data.kind];
  const nameFit = fitStep(data.holderName, [26, 40]);
  const subjectFit = fitStep(data.subjectTitle, [44, 80]);
  const nameSize = { base: 4.2, small: 3.4, smaller: 2.8 }[nameFit];
  const subjectSize = { base: 2.4, small: 1.95, smaller: 1.65 }[subjectFit];

  const details: { label: string; value: ReactNode }[] =
    data.kind === "achievement"
      ? [
          { label: "Score", value: data.scoreLabel },
          {
            label: "Result",
            value: (
              <span
                data-testid="certificate-result"
                style={{ display: "inline-block", padding: `${cq(0.15)} ${cq(0.9)}`, borderRadius: cq(2), background: "#e6f4ec", color: "#14663d", fontWeight: 700, letterSpacing: "0.1em" }}
              >
                PASSED
              </span>
            ),
          },
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

  return (
    <>
      {/* Print setup for THIS page only (a certificate page is the only place this
          component renders): A4 landscape, no margin, the sheet at exactly A4.
          Everything that is neither the sheet, inside it, nor an ancestor of it
          is removed from the layout (display:none, not just hidden — hidden
          elements still occupy space and would push the print onto extra pages). */}
      <style>{`
        .certificate-sheet { position: relative; }
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; }
          body *:not(:has(.certificate-sheet)):not(.certificate-sheet):not(.certificate-sheet *) { display: none !important; }
          /* The sheet's ancestors (layout wrappers with padding, or a full-height min-h-dvh) must add nothing to the page. */
          body *:has(.certificate-sheet) { height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; border: 0 !important; }
          .certificate-sheet { position: absolute !important; left: 0 !important; top: 0 !important; width: 297mm !important; height: 209.5mm !important; aspect-ratio: auto !important; box-shadow: none !important; border: 0 !important; break-inside: avoid; }
        }
      `}</style>

      <article
        className="print-area certificate-sheet"
        data-testid="certificate"
        data-kind={data.kind}
        aria-label={`${copy.title} ${data.certificateId}`}
        style={{
          width: "100%",
          aspectRatio: "297 / 210",
          containerType: "inline-size",
          overflow: "hidden",
          background: "#ffffff",
          color: NAVY,
          border: `1px solid ${HAIRLINE}`,
          boxShadow: "0 10px 30px rgba(16,24,40,0.10)",
        }}
      >
        {/* Frame: a navy rule and a fine blue hairline inside it. */}
        <div aria-hidden="true" style={{ position: "absolute", inset: cq(2), border: `${cq(0.3)} solid ${BLUE}` }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: cq(3), border: `${cq(0.1)} solid ${ACCENT}`, opacity: 0.45 }} />
        <Motif style={{ top: cq(3.4), right: cq(3.4), width: cq(30), opacity: 0.16 }} />
        <Motif style={{ bottom: cq(3.4), left: cq(3.4), width: cq(26), opacity: 0.12, transform: "rotate(180deg)" }} />

        {data.sample ? (
          <div
            aria-hidden="true"
            data-testid="certificate-sample"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              transform: "rotate(-18deg)",
              color: "rgba(30,58,138,0.08)",
              fontWeight: 800,
              letterSpacing: "0.2em",
              whiteSpace: "nowrap",
            }}
          >
            <span style={font(16)}>SAMPLE</span>
            <span style={font(2.4)}>NOT A REAL CERTIFICATE</span>
          </div>
        ) : null}

        <div style={{ position: "absolute", inset: `${cq(5)} ${cq(6.2)}`, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: cq(0.8) }}>
          {/* ── Header: the Academy lockup and the issuer ── */}
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: cq(3) }}>
            <div style={{ display: "flex", alignItems: "center", gap: cq(1.1) }}>
              <LogoMark style={{ width: cq(3.4), height: cq(3.4), color: ACCENT }} />
              <div>
                <p style={font(2.05, { fontWeight: 700, letterSpacing: "-0.01em" })}>Data &amp; AI Academy</p>
                <p style={font(0.85, { textTransform: "uppercase", letterSpacing: "0.22em", color: MUTED, fontWeight: 600 })}>Training &amp; Certification</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: cq(2) }} data-testid="certificate-issuer">
              {brand.hrdCorpLogoPath && brand.hrdCorpLogoAuthorised ? (
                // eslint-disable-next-line @next/next/no-img-element -- a fixed print asset
                <img src={brand.hrdCorpLogoPath} alt="HRD Corp" style={{ height: cq(3.6), width: "auto" }} />
              ) : null}
              {brand.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element -- a fixed print asset
                <img src={brand.logoPath} alt={brand.legalName} data-testid="certificate-logo" style={{ height: cq(8), width: "auto", display: "block", margin: `${cq(-1.6)} 0` }} />
              ) : (
                <p style={font(1.35, { fontWeight: 700, color: BLUE, textAlign: "right" })}>{brand.legalName}</p>
              )}
            </div>
          </header>

          {/* ── Title, recipient and subject ── */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: cq(0.7) }}>
            <p style={font(1.1, { textTransform: "uppercase", letterSpacing: "0.42em", color: ACCENT, fontWeight: 700, paddingLeft: "0.42em" })}>Data &amp; AI Academy</p>
            <h2 style={font(4.4, { fontWeight: 800, letterSpacing: "-0.02em", color: NAVY })} data-testid="certificate-title">
              {copy.title}
            </h2>
            {data.kind === "achievement" && data.grade ? (
              // The grade takes the place of the ornament: "Grade: ALPHA · 81–100 %" between the same hairlines.
              <div style={{ display: "flex", alignItems: "center", gap: cq(1.2), width: cq(44), margin: `${cq(-0.25)} 0` }}>
                <span aria-hidden="true" style={{ flex: 1, height: cq(0.1), background: `linear-gradient(90deg, transparent, ${ACCENT})` }} />
                <p data-testid="certificate-grade" style={font(1.7, { fontWeight: 800, letterSpacing: "0.08em", color: BLUE, whiteSpace: "nowrap" })}>
                  Grade: {data.grade.name.toUpperCase()} · {data.grade.band}
                </p>
                <span aria-hidden="true" style={{ flex: 1, height: cq(0.1), background: `linear-gradient(270deg, transparent, ${ACCENT})` }} />
              </div>
            ) : (
              <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: cq(0.8), width: cq(24) }}>
                <span style={{ flex: 1, height: cq(0.1), background: `linear-gradient(90deg, transparent, ${ACCENT})` }} />
                <span style={{ width: cq(0.7), height: cq(0.7), background: ACCENT, transform: "rotate(45deg)" }} />
                <span style={{ flex: 1, height: cq(0.1), background: `linear-gradient(270deg, transparent, ${ACCENT})` }} />
              </div>
            )}
            <p style={font(1.55, { color: MUTED })}>{CERTIFICATE_COPY.presentedTo}</p>
            <p
              data-testid="certificate-holder"
              style={font(nameSize, { fontWeight: 800, letterSpacing: "-0.015em", maxWidth: cq(76), overflowWrap: "anywhere", textWrap: "balance" as CSSProperties["textWrap"] })}
            >
              {data.holderName}
            </p>
            <div aria-hidden="true" style={{ width: cq(40), height: cq(0.12), background: HAIRLINE }} />
            <p style={font(1.55, { color: MUTED })}>{copy.verb}</p>
            <p
              data-testid="certificate-subject"
              style={font(subjectSize, { fontWeight: 700, maxWidth: cq(76), overflowWrap: "anywhere", textWrap: "balance" as CSSProperties["textWrap"] })}
            >
              {data.subjectTitle}
            </p>
          </div>

          {/* ── Type-specific facts ── */}
          <dl
            data-testid="certificate-details"
            style={{ display: "grid", gridTemplateColumns: `repeat(${details.length}, minmax(0, 1fr))`, gap: cq(2), textAlign: "center", margin: 0, padding: `${cq(0.8)} 0`, borderTop: `${cq(0.1)} solid ${HAIRLINE}`, borderBottom: `${cq(0.1)} solid ${HAIRLINE}` }}
          >
            {details.map((d) => (
              <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: cq(0.35) }}>
                <dt>
                  <Label>{d.label}</Label>
                </dt>
                <dd style={font(1.6, { fontWeight: 600, margin: 0 })}>{d.value}</dd>
              </div>
            ))}
          </dl>

          {/* ── Trainer (Professional only) · verification ──
              Founder, 2026-09-29: no signature and no signature line (the
              certificate is system-generated), and no separate issuer-name
              block (the logo carries the name). The Free certificate has no
              trainer, so its verification block stands alone, centred. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: data.kind === "completion" ? "1.1fr 1.2fr" : "auto",
              justifyContent: data.kind === "completion" ? "stretch" : "center",
              alignItems: "end",
              gap: cq(4),
            }}
          >
            {data.kind === "completion" && data.trainers.length > 0 ? (
              <div data-testid="certificate-trainers">
                <Label>{data.trainers.length === 1 ? "Authorized Trainer / Instructor" : "Authorized Trainers / Instructors"}</Label>
                <ul style={{ listStyle: "none", margin: `${cq(0.5)} 0 0`, padding: 0, display: "flex", flexDirection: "column", gap: cq(0.6) }}>
                  {data.trainers.map((t) => (
                    <li key={t.name} style={{ display: "flex", alignItems: "center", gap: cq(0.8) }}>
                      {t.hrdAccredited ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a fixed print asset
                        <img src="/hrd-corp/accredited-trainer-badge.png" alt="HRD Corp Accredited Trainer badge" style={{ width: cq(3.2), height: cq(3.2), borderRadius: "50%" }} />
                      ) : null}
                      <span>
                        <span style={font(1.35, { fontWeight: 700, display: "block" })}>
                          {t.profileUrl ? (
                            <a
                              href={t.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid="certificate-trainer-link"
                              style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "0.15em" }}
                            >
                              <span>{t.name}</span>
                              <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}> (opens external site)</span>
                            </a>
                          ) : (
                            t.name
                          )}
                        </span>
                        {t.hrdAccredited ? (
                          <span style={font(0.9, { color: MUTED, display: "block" })}>
                            HRD Corp Accredited Trainer{t.hrdTrainerId ? ` · ID ${t.hrdTrainerId}` : ""}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <span aria-hidden="true" />
            )}

            <div style={{ display: "flex", alignItems: "flex-end", gap: cq(1.6), justifySelf: data.kind === "completion" ? "end" : "center" }} data-testid="certificate-verify">
              <div
                role="img"
                aria-label={`QR code that opens ${data.verifyUrl}`}
                data-testid="certificate-qr"
                style={{ width: cq(10), height: cq(10), flex: "none" }}
                // The markup comes from `certificateQrSvg` (the `qrcode` library, from a
                // validated http(s) URL) and contains only <svg>/<path> — see qr.ts.
                dangerouslySetInnerHTML={{ __html: data.qrSvg }}
              />
              <div style={{ minWidth: 0, maxWidth: cq(30) }}>
                <Label>Verify this certificate</Label>
                <p style={font(0.95, { color: NAVY, overflowWrap: "anywhere", margin: `${cq(0.3)} 0 ${cq(0.8)}` })} data-testid="certificate-verify-url">
                  {data.verifyUrl}
                </p>
                <Label>Certificate ID</Label>
                <p data-testid="certificate-id" style={font(1.35, { fontFamily: "var(--font-mono), ui-monospace, monospace", fontWeight: 700, letterSpacing: "0.04em", marginTop: cq(0.3), overflowWrap: "anywhere" })}>
                  {data.certificateId}
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer: issuer details and the plain disclosures ── */}
          <footer style={{ textAlign: "center", borderTop: `${cq(0.1)} solid ${HAIRLINE}`, paddingTop: cq(0.8) }}>
            <p style={font(0.95, { color: MUTED })} data-testid="certificate-legal">
              {legalBits.join(" · ")}
            </p>
            <p style={font(0.88, { color: MUTED, marginTop: cq(0.3) })} data-testid="certificate-disclosure">
              {copy.disclosure} {CERTIFICATE_COPY.systemGenerated} {CERTIFICATE_COPY.validity}
            </p>
          </footer>
        </div>
      </article>
    </>
  );
}
