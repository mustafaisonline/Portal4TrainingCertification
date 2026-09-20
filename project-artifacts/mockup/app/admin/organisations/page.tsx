import { AdminScreen, Disabled } from "@/components/admin/AdminTable";
import { organisations } from "@/data/adminSamples";

export default function AdminOrganisations() {
  return (
    <AdminScreen
      eyebrow="Organisations"
      title="Corporate clients"
      action="Add organisation"
      columns={["Organisation", "Contact", "Participants", "Engagement", "Invoice", "HRD Corp", ""]}
      rows={organisations.map((o) => [o.name, o.contact, String(o.participants), o.engagement, o.invoice, o.hrd, <span key="a" className="flex gap-3"><Disabled>Open</Disabled><Disabled>Evidence pack</Disabled></span>])}
      note="Sample organisations (fictional). The corporate model (DR-02 §8): private cohorts, invoicing, an org dashboard for the client (O01) and the HRD Corp evidence pack (O10). No programme is HRD Corp claimable today — the evidence pack cannot be produced until registration exists (OQ-8)."
    />
  );
}
