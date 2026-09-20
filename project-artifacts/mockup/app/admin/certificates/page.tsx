import Link from "next/link";
import { AdminScreen, Disabled, Stat } from "@/components/admin/AdminTable";
import { participants } from "@/data/adminSamples";

const status: Record<string, string> = { alex: "Active", priya: "Expired", chen: "Renewal due", sam: "Active" };
export default function AdminCertificates() {
  const holders = participants.filter((p) => p.certificateId);
  return (
    <AdminScreen
      eyebrow="Certificates"
      title="Certificates of Completion"
      action="Issue manually"
      columns={["ID", "Holder", "Status", "Public listing", ""]}
      rows={holders.map((p) => [<Link key="id" href={`/admin/certificates/${p.certificateId}`} className="text-mono text-[var(--color-primary)] underline underline-offset-4">{p.certificateId}</Link>, p.name, status[p.id], p.listed ? "Listed" : "Not listed", <span key="a" className="flex gap-3"><Disabled>Correct name</Disabled><Disabled>Revoke</Disabled></span>])}
      note="Sample certificates (the same ones the public verification page shows). Issuance normally happens from 'Mark complete' on a registration; 'Issue manually' needs a reason and an audit row. Revocation is a separate state from Expired (D11); corrections keep the ID (D12)."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
        <Stat label="Active" value="3" />
        <Stat label="Renewal due (30 days)" value="1" />
        <Stat label="Expired" value="1" />
      </div>
    </AdminScreen>
  );
}
