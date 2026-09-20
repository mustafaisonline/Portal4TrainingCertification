import { AdminScreen, Disabled } from "@/components/admin/AdminTable";
import { staff } from "@/data/adminSamples";

export default function AdminUsers() {
  return (
    <AdminScreen
      eyebrow="Users & roles"
      title="Staff & roles"
      action="Invite user"
      columns={["Name", "Role", "Email", "Status", ""]}
      rows={staff.map((s) => [s.name, s.role, s.email, s.status, <span key="a" className="flex gap-3"><Disabled>Change role</Disabled><Disabled>Deactivate</Disabled></span>])}
      note="Roles are scoped RBAC (ADR-020): Administrator, Trainer, Assessor (future — the trainer who delivers a cohort must not assess it, DR-02 §7.1), Finance. Nothing here is enforced in the wireframe."
    />
  );
}
