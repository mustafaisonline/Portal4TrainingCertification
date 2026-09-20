import type { CertificateStatus } from "@/lib/certificates";

/** Certificate status as a chip. State is conveyed by an icon AND words, never
 *  colour alone (accessibility). */
const styles: Record<CertificateStatus, { label: string; tone: string; icon: string }> = {
  active: {
    label: "Active",
    tone: "border-[var(--color-success)] text-[var(--color-success)]",
    icon: "M5 12.5 10 17.5 19 7.5",
  },
  "renewal-due": {
    label: "Active · renewal due",
    tone: "border-[var(--color-warning)] text-[var(--color-warning)]",
    icon: "M12 7v6m0 4h.01",
  },
  expired: {
    label: "Expired",
    tone: "border-[var(--color-danger)] text-[var(--color-danger)]",
    icon: "M7 7l10 10M17 7 7 17",
  },
};

export function StatusChip({
  status,
  large = false,
}: {
  status: CertificateStatus;
  large?: boolean;
}) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold ${s.tone} ${
        large ? "px-4 py-2 text-base" : "px-3 py-1 text-[0.8rem]"
      }`}
    >
      <svg viewBox="0 0 24 24" className={large ? "h-5 w-5" : "h-4 w-4"} fill="none" aria-hidden="true">
        <path d={s.icon} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {s.label}
    </span>
  );
}
