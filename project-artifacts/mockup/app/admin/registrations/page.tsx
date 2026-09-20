import { AdminScreen, Disabled } from "@/components/admin/AdminTable";

const rows = [
  ["Demo Participant", "Bootcamp · 12–13 Nov", "Paid", "— / 2 days", "Not recorded"],
  ["Alex Sample", "Bootcamp · 12–13 Nov", "Paid", "— / 2 days", "Not recorded"],
  ["Priya Example", "Accelerator · 16–27 Nov", "Invoice pending", "— / 10 days", "Not recorded"],
];
export default function AdminRegistrations() {
  return (
    <AdminScreen
      eyebrow="Registrations & attendance"
      title="Participants"
      action="Export list"
      columns={["Participant", "Offering", "Payment", "Attendance", "Completion", ""]}
      rows={rows.map((r) => [...r, <span key="a" className="flex gap-3"><Disabled>Record attendance</Disabled><Disabled>Mark complete</Disabled></span>])}
      note="Sample rows. 'Mark complete' is the action that issues a Certificate of Completion in the real product — what counts as completion is decision D2. Attendance must be recorded per session by the trainer."
    />
  );
}
