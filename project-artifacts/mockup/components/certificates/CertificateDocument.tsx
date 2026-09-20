import { LogoMark } from "@/components/PublicShell";
import { SAMPLE_TRAINER } from "@/data/demoParticipant";
import { formatDate, type Certificate } from "@/lib/certificates";

/**
 * The Certificate of Completion, as a document — added 2026-09-20.
 *
 * Deliberately styled as paper: fixed light colours (not theme tokens), so it
 * reads and prints the same in dark mode. `.print-area` (app/globals.css)
 * makes browser Print / "Save as PDF" output only this element — no PDF
 * library was added (new dependency = approval gate).
 *
 * WHAT THE DOCUMENT SAYS, AND DOES NOT:
 *  • It records that the holder COMPLETED the programme. It is not the
 *    Academy's earned credential (DR-02 §6, OQ-21) and says so in its own
 *    words.
 *  • It carries no "valid until" line. Validity changes (the holder renews);
 *    a date printed on paper would go stale. The document points to the
 *    verification URL, which is authoritative — and says a printed copy may be
 *    out of date.
 *  • The QR code is a dashed placeholder. Generating a real one needs an
 *    encoder library (a new dependency — RED gate) or server-side rendering;
 *    a fake QR would be deceptive.
 *  • Sample records carry a diagonal SAMPLE watermark that cannot be missed.
 */
export function CertificateDocument({
  cert,
  url,
}: {
  cert: Certificate;
  /** Absolute verification URL (client-computed). */
  url: string;
}) {
  return (
    <div className="print-area relative overflow-hidden rounded-[var(--radius-panel)] border border-[#c9d3e6] bg-white text-[#0b1b3a] shadow-[0_10px_30px_rgba(16,24,40,0.10)]">
      <div className="relative m-2.5 border-2 border-[#1e3a8a]/70 px-4 py-8 text-center sm:m-4 sm:px-12 sm:py-12">
        {cert.sample && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid select-none place-items-center text-[5rem] font-extrabold tracking-widest text-[#0b1b3a]/[0.06] [transform:rotate(-24deg)] sm:text-[9rem]"
          >
            SAMPLE
          </span>
        )}
        <div className="relative">
          <div className="mb-6 flex items-center justify-center gap-3">
            <LogoMark />
            <span className="text-lg font-bold tracking-tight">Data &amp; AI Academy</span>
          </div>
          <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[#1e3a8a]">
            Certificate of Completion
          </p>
          <p className="mb-2 text-sm text-[#4b5563]">This is to certify that</p>
          <p className="mb-3 break-words text-3xl font-bold leading-tight sm:text-5xl">
            {cert.holderName}
          </p>
          <p className="mb-2 text-sm text-[#4b5563]">has completed the expert-led training programme</p>
          <p className="mb-1 text-lg font-semibold sm:text-xl">{cert.programmeTitle}</p>
          <p className="mb-6 text-sm text-[#4b5563]">
            {cert.formatName} · completed {formatDate(cert.completedOn)}
          </p>

          <div className="mx-auto mb-6 grid max-w-[520px] grid-cols-1 items-end gap-6 text-left sm:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-1 h-px w-full bg-[#0b1b3a]/40" />
              <p className="text-sm font-semibold">{SAMPLE_TRAINER}</p>
              <p className="text-xs text-[#4b5563]">Trainer</p>
            </div>
            <div
              aria-hidden="true"
              className="mx-auto grid h-20 w-20 place-items-center border border-dashed border-[#0b1b3a]/40 px-1 text-center text-[0.6rem] leading-tight text-[#4b5563] sm:mx-0"
            >
              QR code — added with the backend
            </div>
          </div>

          <p className="mb-1 text-xs uppercase tracking-widest text-[#4b5563]">Certificate ID</p>
          <p className="break-all font-mono text-base font-semibold tracking-wider">{cert.id}</p>
          <p className="mt-3 break-all text-xs text-[#4b5563]">
            Verify the current status of this certificate at{" "}
            <span className="font-medium text-[#0b1b3a]">{url}</span>
          </p>
          <p className="mx-auto mt-3 max-w-[60ch] text-[0.7rem] leading-relaxed text-[#6b7280]">
            This certificate records completion of the programme. It is not
            the Academy&rsquo;s earned credential. Its validity changes over
            time and is confirmed only at the address above; a printed copy
            may be out of date.
          </p>
        </div>
      </div>
    </div>
  );
}
