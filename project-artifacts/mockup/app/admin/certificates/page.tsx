import { AdminScreen, Disabled } from "@/components/admin/AdminTable";
import { SAMPLE_IDS } from "@/data/certificates";

const rows = [
  [SAMPLE_IDS[0], "Alex Sample", "Active", "Listed"],
  [SAMPLE_IDS[1], "Priya Example", "Expired", "Listed"],
  [SAMPLE_IDS[2], "Chen Sample", "Renewal due", "Not listed"],
  [SAMPLE_IDS[3], "Sam Example", "Active", "Listed"],
];
export default function AdminCertificates() {
  return (
    <AdminScreen
      eyebrow="Certificates"
      title="Certificates of Completion"
      columns={["ID", "Holder", "Status", "Public listing", ""]}
      rows={rows.map((r) => [<span key="id" className="text-mono">{r[0]}</span>, r[1], r[2], r[3], <span key="a" className="flex gap-3"><Disabled>Correct name</Disabled><Disabled>Revoke</Disabled></span>])}
      note="Sample certificates (the same ones the public verification page shows). Revocation is a separate state from Expired with a recorded reason (decision D11); name corrections keep the same ID (D12). Every action is audited."
    />
  );
}
