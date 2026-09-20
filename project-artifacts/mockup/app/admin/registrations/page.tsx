import Link from "next/link";
import { AdminScreen, Disabled } from "@/components/admin/AdminTable";
import { participants } from "@/data/adminSamples";
import { getOffering } from "@/data/demoParticipant";

export default function AdminRegistrations() {
  const regs = participants.filter((p) => p.offeringId);
  return (
    <AdminScreen
      eyebrow="Registrations & attendance"
      title="Registrations"
      action="Export CSV"
      columns={["Participant", "Offering", "Payment", "Attendance", "Completion", ""]}
      rows={regs.map((p) => [<Link key="n" href={`/admin/participants/${p.id}`} className="text-[var(--color-primary)] underline underline-offset-4">{p.name}</Link>, getOffering(p.offeringId!)?.formatName ?? "", p.payment ?? "", p.attendance ?? "", p.completion ?? "", <span key="a" className="flex gap-3"><Disabled>Record attendance</Disabled><Disabled>Mark complete</Disabled><Disabled>Refund</Disabled></span>])}
      note="Sample rows. Filters (by offering, payment state, completion) and bulk attendance entry are implied but not drawn. A registration exists only after a webhook-confirmed payment or an approved invoice (C3)."
    />
  );
}
