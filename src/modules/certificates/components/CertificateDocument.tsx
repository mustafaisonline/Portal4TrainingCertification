import { formatCalendarDate } from "@/modules/certificates/dates";
import { LogoMark } from "@/shared/chrome/LogoMark";

/*
 * The Certificate of Completion as a document (M6 plan §3 E1, E9, E11, E12).
 * PORTED 2026-09-22 from project-artifacts/mockup/components/certificates/
 * CertificateDocument.tsx. Kept: paper styling in fixed light colours so it
 * reads and prints the same in dark mode; `.print-area` (app/globals.css)
 * makes Print / "Save as PDF" output this element alone. Changed: the SAMPLE
 * watermark, the sample trainer signature block and the QR placeholder are
 * gone (E11 defers QR; E12 prints no signatory until the founder gives one);
 * the issuer line "Issued by Your Partner Technologies" is added (E12); the
 * expiry is printed as "Active until" with the verification URL as the
 * authority for the CURRENT status.
 *
 * Rendered ONLY where the reviews gate allows it (E9): the holder page after
 * `certificateDocumentAccess()` says unlocked. The public /verify/[id] page
 * shows a verification layout, never this component.
 */

export type CertificateDocumentFields = {
  certificateId: string;
  holderName: string;
  programmeTitle: string;
  formatName: string;
  completedOn: string;
  issuedOn: string;
  expiresOn: string;
};

export function CertificateDocument({ certificate, verifyUrl }: { certificate: CertificateDocumentFields; verifyUrl: string }) {
  const c = certificate;
  return (
    <article
      className="print-area relative overflow-hidden rounded-[var(--radius-panel)] border border-[#c9d3e6] bg-white text-[#0b1b3a] shadow-[0_10px_30px_rgba(16,24,40,0.10)]"
      data-testid="certificate-document"
      aria-label={`Certificate of Completion ${c.certificateId}`}
    >
      <div className="relative m-2.5 border-2 border-[#1e3a8a]/70 px-4 py-8 text-center sm:m-4 sm:px-12 sm:py-12">
        <div className="mb-6 flex items-center justify-center gap-3">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight">Data &amp; AI Academy</span>
        </div>
        <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[#1e3a8a]">Certificate of Completion</p>
        <p className="mb-2 text-sm text-[#4b5563]">This is to certify that</p>
        <p className="mb-3 text-3xl font-bold leading-tight break-words sm:text-5xl" data-testid="document-holder">
          {c.holderName}
        </p>
        <p className="mb-2 text-sm text-[#4b5563]">has completed the expert-led training programme</p>
        <p className="mb-1 text-lg font-semibold sm:text-xl">{c.programmeTitle}</p>
        <p className="mb-6 text-sm text-[#4b5563]">
          {c.formatName} · completed {formatCalendarDate(c.completedOn)}
        </p>

        <dl className="mx-auto mb-6 grid max-w-[520px] grid-cols-1 gap-x-8 gap-y-3 text-left text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[0.65rem] uppercase tracking-widest text-[#4b5563]">Issued</dt>
            <dd className="font-medium">{formatCalendarDate(c.issuedOn)}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-widest text-[#4b5563]">Active until</dt>
            <dd className="font-medium">{formatCalendarDate(c.expiresOn)}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-widest text-[#4b5563]">Issued by</dt>
            <dd className="font-medium">Your Partner Technologies</dd>
          </div>
        </dl>

        <p className="mb-1 text-xs tracking-widest text-[#4b5563] uppercase">Certificate ID</p>
        <p className="font-mono text-base font-semibold tracking-wider break-all">{c.certificateId}</p>
        <p className="mt-3 text-xs break-all text-[#4b5563]">
          Verify the current status of this certificate at <span className="font-medium text-[#0b1b3a]">{verifyUrl}</span>
        </p>
        <p className="mx-auto mt-3 max-w-[60ch] text-[0.7rem] leading-relaxed text-[#6b7280]">
          This certificate records completion of the programme. It is not the Academy&rsquo;s earned credential. Its validity changes
          over time and is confirmed only at the address above; a printed copy may be out of date.
        </p>
      </div>
    </article>
  );
}
