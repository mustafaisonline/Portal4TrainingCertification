import { CERTIFICATE_STATUS_LABEL, type CertificateStatus } from "@/modules/certificates/constants";
import { Chip } from "@/shared/ui/Chip";

/*
 * Admin-side status label for a Certificate of Completion (M6 plan §5
 * "Status": "in words and with an icon, never colour alone"). The shared
 * Chip carries the label text; a text glyph in front distinguishes the four
 * states for a sighted reader without relying on the chip's tone. The glyph
 * is decorative for assistive technology — the words are the meaning.
 */

const GLYPH: Record<CertificateStatus, string> = {
  active: "●",
  renewal_due: "◐",
  expired: "○",
  revoked: "✕",
};

export function CertificateStatusLabel({ status }: { status: CertificateStatus }) {
  return (
    <Chip tone={status === "active" ? "primary" : "neutral"}>
      <span aria-hidden="true" className="mr-1.5">
        {GLYPH[status]}
      </span>
      <span data-testid="certificate-status">{CERTIFICATE_STATUS_LABEL[status]}</span>
    </Chip>
  );
}
