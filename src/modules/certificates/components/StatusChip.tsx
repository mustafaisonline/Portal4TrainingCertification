import { CERTIFICATE_STATUS_LABEL, type CertificateStatus } from "@/modules/certificates/constants";
import { Chip } from "@/shared/ui/Chip";

/*
 * Certificate status as a chip (M6 plan §5 "Status"; §6 criterion 13).
 * PORTED 2026-09-22 from project-artifacts/mockup/components/certificates/
 * StatusChip.tsx: the state is conveyed by an icon AND the label in words,
 * never colour alone. Changed: built on the shared Chip (two tones only —
 * the colour is decorative), the `revoked` state added (E8), labels read
 * from the module vocabulary so every screen prints the same words.
 * No "use client": no hooks, safe in server pages.
 */

const ICON: Record<CertificateStatus, string> = {
  active: "M5 12.5 10 17.5 19 7.5", // tick
  renewal_due: "M12 6v7m0 4h.01", // exclamation
  expired: "M7 7l10 10M17 7 7 17", // cross
  revoked: "M7 7l10 10M17 7 7 17", // cross
};

export function StatusChip({ status }: { status: CertificateStatus }) {
  return (
    <span className="inline-flex" data-testid="certificate-status" data-status={status}>
      <Chip tone={status === "active" ? "primary" : "neutral"}>
        <svg viewBox="0 0 24 24" className="mr-1.5 h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true" focusable="false">
          <path d={ICON[status]} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {CERTIFICATE_STATUS_LABEL[status]}
      </Chip>
    </span>
  );
}
