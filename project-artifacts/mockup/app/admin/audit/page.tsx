import { AdminScreen } from "@/components/admin/AdminTable";
import { auditLog } from "@/data/adminSamples";

export default function AdminAudit() {
  return (
    <AdminScreen
      eyebrow="Audit log"
      title="Audit log"
      action="Export"
      columns={["When", "Who", "Action", "Target", "Detail"]}
      rows={auditLog.map((a) => [a.when, a.who, a.action, a.target, a.detail])}
      note="Sample. Insert-only; written in the same transaction as the change it records (ADR-022). Filters by actor, action and target are required."
    />
  );
}
