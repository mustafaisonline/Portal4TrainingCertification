import Link from "next/link";
import { AdminScreen } from "@/components/admin/AdminTable";
import { participants } from "@/data/adminSamples";

export default function AdminParticipants() {
  return (
    <AdminScreen
      eyebrow="Participants"
      title="Accounts"
      columns={["Name", "Email", "Country", "Registrations", "Certificate", ""]}
      rows={participants.map((p) => [p.name, p.email, p.country, p.offeringId ? "1" : "0", p.certificateId ? "Yes" : "—", <Link key="l" href={`/admin/participants/${p.id}`} className="text-[var(--color-primary)] underline underline-offset-4">Open</Link>])}
      note="Sample accounts. Search, filters, and PDPA actions (export / delete on request, with retention rules for financial records) are required — decision B2, C20."
    />
  );
}
